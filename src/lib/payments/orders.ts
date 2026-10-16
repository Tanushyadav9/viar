/**
 * Manual UPI Order & Access Management Module
 * Vihangam Institute of Astrology and Research (Viar.in)
 * 
 * Implements the complete manual UPI payment lifecycle:
 * - Order creation with server-side price lock
 * - Dynamic UPI QR payload generation carrying order reference
 * - "I have paid" claiming, student WhatsApp submission link, and Owner email notification
 * - Owner verification queue with required bank confirmation checklist and duplicate UTR blocking
 * - Automatic enrollment activation upon approval (zero passwords sent over WhatsApp)
 * - Refund and access revocation audit trail
 */

import { prisma } from '../prisma.ts';
import { emailService } from '../email/index.ts';
import { logger } from '../logger.ts';
import { getPaymentSettings } from './settings.ts';
import { generateWhatsAppActivationUrl } from './upi.ts';
import type { OrderStatus } from '@prisma/client';

export interface OrderData {
  id: string;
  orderReference: string;
  userId: string;
  courseId: string;
  cohortId?: string | null;
  amount: number;
  currency: string;
  status: OrderStatus;
  studentName?: string | null;
  studentEmail?: string | null;
  studentPhone: string;
  utr?: string | null;
  claimedAt?: Date | string | null;
  notes?: string | null;
  expiresAt: Date | string;
  reviewedBy?: string | null;
  reviewedAt?: Date | string | null;
  rejectionReason?: string | null;
  bankConfirmed: boolean;
  refundedAt?: Date | string | null;
  refundReason?: string | null;
  enrollmentId?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  course?: {
    id: string;
    title: string;
    slug: string;
  } | null;
  cohort?: {
    id: string;
    batchName: string;
  } | null;
  user?: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
  } | null;
}

/**
 * Generate a unique, human-readable order reference: e.g. VIAR-ORD-KX8J2-9B7C
 */
export function generateOrderReference(): string {
  const timePart = Date.now().toString(36).toUpperCase().slice(-5);
  const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `VIAR-ORD-${timePart}-${randPart}`;
}

/**
 * Generate standard UPI payment link that pre-fills amount and carries order reference in transaction note (tn)
 */
export function buildUpiPaymentUri(params: {
  upiId: string;
  payeeName: string;
  amount: number;
  orderReference: string;
}): string {
  const payee = encodeURIComponent(params.payeeName);
  const note = encodeURIComponent(`VIAR Tuition ${params.orderReference}`);
  return `upi://pay?pa=${params.upiId}&pn=${payee}&am=${params.amount}&cu=INR&tn=${note}`;
}

/**
 * Generate pre-filled WhatsApp link for student to submit payment proof to Owner
 */
export function buildStudentWhatsAppClaimUrl(params: {
  ownerPhone: string;
  studentName: string;
  studentPhone: string;
  courseTitle: string;
  amount: number;
  orderReference: string;
  utr?: string | null;
}): string {
  const lines = [
    `*VIAR Astrology Course Payment Proof*`,
    ``,
    `*Student Name:* ${params.studentName}`,
    `*Phone:* ${params.studentPhone}`,
    `*Course:* ${params.courseTitle}`,
    `*Amount Paid:* ₹${params.amount.toLocaleString('en-IN')}`,
    `*Order Reference:* ${params.orderReference}`,
    params.utr ? `*UPI Transaction ID (UTR):* ${params.utr}` : null,
    ``,
    `I have completed the UPI payment. Please find the payment screenshot attached. Kindly verify my transaction in bank records and activate my course access.`,
  ].filter(Boolean);

  return `https://wa.me/${params.ownerPhone}?text=${encodeURIComponent(lines.join('\n'))}`;
}

/**
 * Create a new Order with server-side price lock, or return existing valid open order
 * Rules:
 * - Must be logged in (userId required).
 * - Phone number is required.
 * - One open order per user per course.
 * - Expired unpaid orders are automatically marked EXPIRED.
 */
export async function createOrGetActiveOrder(params: {
  userId: string;
  courseId: string;
  cohortId?: string;
  studentName?: string;
  studentEmail?: string;
  studentPhone: string;
  notes?: string;
}): Promise<{
  order: OrderData;
  upiUri: string;
  qrCodeUrl: string;
  staticQrUrl: string | null;
  settings: {
    upiId: string;
    payeeName: string;
    whatsappNumber: string;
    orderExpiryDays: number;
  };
}> {
  const cleanPhone = params.studentPhone.trim().replace(/[^0-9+]/g, '');
  if (!cleanPhone || cleanPhone.replace(/[^0-9]/g, '').length < 10) {
    throw new Error('A valid mobile phone number is required at checkout for enrollment verification.');
  }

  // 1. Fetch course details to lock price server-side
  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
  });

  if (!course) {
    throw new Error('Course not found.');
  }

  const lockedAmount = course.priceInr || 5100;

  // 2. Load payment settings
  const settings = await getPaymentSettings();

  // 3. Update student phone on User record if missing
  try {
    await prisma.user.update({
      where: { id: params.userId },
      data: {
        phone: cleanPhone,
        name: params.studentName || undefined,
      },
    });
  } catch {}

  // 4. Check for existing orders for this user and course
  const existingOrders = await prisma.order.findMany({
    where: {
      userId: params.userId,
      courseId: params.courseId,
    },
    include: {
      course: { select: { id: true, title: true, slug: true } },
      cohort: { select: { id: true, batchName: true } },
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Check if student already has an approved order / active enrollment
  const approvedOrder = existingOrders.find((o) => o.status === 'APPROVED');
  if (approvedOrder) {
    throw new Error('You already have an active enrollment in this course. Please visit your Student Dashboard.');
  }

  const now = new Date();

  // Check for active open orders (PENDING_PAYMENT or PAYMENT_CLAIMED)
  for (const ord of existingOrders) {
    if (ord.status === 'PENDING_PAYMENT') {
      if (new Date(ord.expiresAt) <= now) {
        // Mark expired
        await prisma.order.update({
          where: { id: ord.id },
          data: { status: 'EXPIRED' },
        });
      } else {
        // Return existing open pending order (One open order per user per course)
        const upiUri = buildUpiPaymentUri({
          upiId: settings.upiId,
          payeeName: settings.payeeName,
          amount: ord.amount,
          orderReference: ord.orderReference,
        });

        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=12&data=${encodeURIComponent(upiUri)}`;

        return {
          order: ord as unknown as OrderData,
          upiUri,
          qrCodeUrl,
          staticQrUrl: settings.qrImageUrl,
          settings: {
            upiId: settings.upiId,
            payeeName: settings.payeeName,
            whatsappNumber: settings.whatsappNumber,
            orderExpiryDays: settings.orderExpiryDays,
          },
        };
      }
    } else if (ord.status === 'PAYMENT_CLAIMED') {
      // Order is already claimed and awaiting Owner verification
      const upiUri = buildUpiPaymentUri({
        upiId: settings.upiId,
        payeeName: settings.payeeName,
        amount: ord.amount,
        orderReference: ord.orderReference,
      });

      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=12&data=${encodeURIComponent(upiUri)}`;

      return {
        order: ord as unknown as OrderData,
        upiUri,
        qrCodeUrl,
        staticQrUrl: settings.qrImageUrl,
        settings: {
          upiId: settings.upiId,
          payeeName: settings.payeeName,
          whatsappNumber: settings.whatsappNumber,
          orderExpiryDays: settings.orderExpiryDays,
        },
      };
    }
  }

  // 5. Create new order
  const orderReference = generateOrderReference();
  const expiresAt = new Date(Date.now() + settings.orderExpiryDays * 24 * 60 * 60 * 1000);

  const newOrder = await prisma.order.create({
    data: {
      orderReference,
      userId: params.userId,
      courseId: params.courseId,
      cohortId: params.cohortId || null,
      amount: lockedAmount,
      currency: 'INR',
      status: 'PENDING_PAYMENT',
      studentName: params.studentName || null,
      studentEmail: params.studentEmail || null,
      studentPhone: cleanPhone,
      notes: params.notes || null,
      expiresAt,
    },
    include: {
      course: { select: { id: true, title: true, slug: true } },
      cohort: { select: { id: true, batchName: true } },
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  });

  const upiUri = buildUpiPaymentUri({
    upiId: settings.upiId,
    payeeName: settings.payeeName,
    amount: newOrder.amount,
    orderReference: newOrder.orderReference,
  });

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=12&data=${encodeURIComponent(upiUri)}`;

  return {
    order: newOrder as unknown as OrderData,
    upiUri,
    qrCodeUrl,
    staticQrUrl: settings.qrImageUrl,
    settings: {
      upiId: settings.upiId,
      payeeName: settings.payeeName,
      whatsappNumber: settings.whatsappNumber,
      orderExpiryDays: settings.orderExpiryDays,
    },
  };
}

/**
 * Student clicks "I have paid":
 * - Sets order status to PAYMENT_CLAIMED.
 * - Records claimedAt timestamp.
 * - Saves optional UTR.
 * - Emails the Owner to notify of payment proof submission.
 * - Returns pre-filled WhatsApp claim link.
 */
export async function claimOrderPayment(params: {
  orderIdOrReference: string;
  utr?: string;
  notes?: string;
}): Promise<{
  order: OrderData;
  whatsappUrl: string;
  message: string;
}> {
  const cleanUtr = params.utr ? params.utr.trim().replace(/[^0-9A-Za-z]/g, '') : null;

  const order = await prisma.order.findFirst({
    where: {
      OR: [
        { id: params.orderIdOrReference },
        { orderReference: params.orderIdOrReference },
      ],
    },
    include: {
      course: { select: { id: true, title: true, slug: true } },
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  });

  if (!order) {
    throw new Error('Order not found.');
  }

  if (order.status === 'APPROVED') {
    throw new Error('This order has already been verified and approved.');
  }

  const claimedAt = new Date();
  const settings = await getPaymentSettings();

  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'PAYMENT_CLAIMED',
      claimedAt,
      utr: cleanUtr || order.utr,
      notes: params.notes ? `${order.notes ? order.notes + ' | ' : ''}${params.notes.trim()}` : order.notes,
    },
    include: {
      course: { select: { id: true, title: true, slug: true } },
      cohort: { select: { id: true, batchName: true } },
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  });

  // 1. Audit log
  try {
    await prisma.activityLog.create({
      data: {
        userId: order.userId,
        userEmail: order.studentEmail || order.user.email,
        userName: order.studentName || order.user.name,
        action: 'PAYMENT_CLAIMED',
        entityType: 'ORDER',
        entityId: order.id,
        reason: 'Student clicked "I have paid" and submitted payment reference',
        details: {
          orderReference: order.orderReference,
          amount: order.amount,
          utr: cleanUtr,
          claimedAt: claimedAt.toISOString(),
        },
      },
    });
  } catch {}

  // 2. Email the Owner when student clicks "I have paid"
  const ownerEmail = process.env.OWNER_EMAIL || 'aapkaastro1606@gmail.com';
  try {
    await emailService.sendPaymentClaimed({
      ownerEmail,
      orderReference: order.orderReference,
      studentName: order.studentName || order.user.name,
      studentPhone: order.studentPhone,
      studentEmail: order.studentEmail || order.user.email || undefined,
      courseTitle: order.course.title,
      amount: order.amount,
      utr: cleanUtr || undefined,
      adminQueueUrl: 'https://viar.in/admin',
    });
  } catch (emailErr) {
    logger.paymentError('Failed to send payment claim notification email to Owner', {
      orderId: order.id,
      orderReference: order.orderReference,
      studentEmail: ownerEmail,
      amount: order.amount,
      provider: 'UPI_QR',
    }, emailErr instanceof Error ? emailErr : undefined);
  }

  // 3. Build WhatsApp URL
  const studentName = order.studentName || order.user.name || 'Student';
  const whatsappUrl = buildStudentWhatsAppClaimUrl({
    ownerPhone: settings.whatsappNumber,
    studentName,
    studentPhone: order.studentPhone,
    courseTitle: order.course.title,
    amount: order.amount,
    orderReference: order.orderReference,
    utr: cleanUtr,
  });

  return {
    order: updatedOrder as unknown as OrderData,
    whatsappUrl,
    message: 'Payment received for verification. You will get access once it is confirmed.',
  };
}

/**
 * Owner Approval:
 * - Requires ticking checklist item: "I have confirmed this amount is credited in my bank or UPI app and the reference matches."
 * - Detects duplicate UTR across approved orders and blocks approving the same reference twice.
 * - Creates an active Enrollment in PostgreSQL.
 * - Emails student confirmation via Resend / emailService.
 * - Returns ready-made WhatsApp confirmation link (zero passwords).
 */
export async function approveOrder(params: {
  orderId: string;
  reviewedByEmail: string;
  bankConfirmed: boolean;
}): Promise<{
  order: OrderData;
  enrollmentId: string;
  whatsappConfirmationUrl: string;
  message: string;
}> {
  // 1. Mandatory bank credit confirmation check
  if (!params.bankConfirmed) {
    throw new Error('Approval requires checking: "I have confirmed this amount is credited in my bank or UPI app and the reference matches." Screenshots alone cannot be used as proof.');
  }

  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: {
      course: true,
      cohort: true,
      user: true,
    },
  });

  if (!order) {
    throw new Error('Order not found.');
  }

  if (order.status === 'APPROVED') {
    throw new Error('This order is already approved.');
  }

  // 2. Duplicate UTR Protection
  if (order.utr && order.utr.trim().length > 0) {
    const duplicate = await prisma.order.findFirst({
      where: {
        status: 'APPROVED',
        utr: order.utr.trim(),
        id: { not: order.id },
      },
    });

    if (duplicate) {
      throw new Error(`Duplicate UTR blocked: Reference "${order.utr}" has already been approved for order ${duplicate.orderReference}. Cannot approve the same transaction reference twice.`);
    }
  }

  const reviewedAt = new Date();

  // 3. Execute in transaction: create active Enrollment and approve Order
  const result = await prisma.$transaction(async (tx) => {
    // Check if enrollment already exists for this user and cohort
    let enrollment = await tx.enrollment.findFirst({
      where: {
        userId: order.userId,
        courseId: order.courseId,
      },
    });

    if (enrollment) {
      enrollment = await tx.enrollment.update({
        where: { id: enrollment.id },
        data: {
          status: 'ACTIVE',
          amountPaid: order.amount,
          currency: 'INR',
          paymentReference: order.utr || order.orderReference,
          enrolledAt: reviewedAt,
        },
      });
    } else {
      enrollment = await tx.enrollment.create({
        data: {
          userId: order.userId,
          courseId: order.courseId,
          cohortId: order.cohortId || null,
          amountPaid: order.amount,
          currency: 'INR',
          paymentReference: order.utr || order.orderReference,
          status: 'ACTIVE',
          enrolledAt: reviewedAt,
        },
      });
    }

    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'APPROVED',
        bankConfirmed: true,
        reviewedBy: params.reviewedByEmail,
        reviewedAt,
        enrollmentId: enrollment.id,
      },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        cohort: { select: { id: true, batchName: true } },
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    return { enrollment, updatedOrder };
  });

  // 4. Audit Log
  try {
    await prisma.activityLog.create({
      data: {
        userId: order.userId,
        userEmail: params.reviewedByEmail,
        action: 'ORDER_APPROVED',
        entityType: 'ORDER',
        entityId: order.id,
        reason: 'Bank credit verified and student enrollment activated',
        details: {
          orderReference: order.orderReference,
          amountPaid: order.amount,
          utr: order.utr,
          enrollmentId: result.enrollment.id,
          reviewedBy: params.reviewedByEmail,
        },
      },
    });
  } catch {}

  // 5. Email student via emailService (Resend)
  const studentEmail = order.studentEmail || order.user.email;
  const studentName = order.studentName || order.user.name || 'Student';
  if (studentEmail) {
    try {
      await emailService.sendPaymentApproved({
        studentName,
        studentEmail,
        courseTitle: order.course.title,
        amountPaid: order.amount,
        orderReference: order.orderReference,
        utr: order.utr || undefined,
        dashboardUrl: 'https://viar.in/dashboard',
      });
    } catch (emailErr) {
      logger.paymentError('Failed to send payment approval email to student', {
        orderId: order.id,
        orderReference: order.orderReference,
        studentEmail,
        amount: order.amount,
        provider: 'UPI_QR',
      }, emailErr instanceof Error ? emailErr : undefined);
    }
  }

  // 6. Generate WhatsApp confirmation URL with ready-made text (no passwords)
  const whatsappConfirmationUrl = generateWhatsAppActivationUrl({
    studentPhone: order.studentPhone,
    studentName,
    courseTitle: order.course.title,
  });

  return {
    order: result.updatedOrder as unknown as OrderData,
    enrollmentId: result.enrollment.id,
    whatsappConfirmationUrl,
    message: 'Order verified & approved. Student enrollment is now active in PostgreSQL.',
  };
}

/**
 * Owner Rejection:
 * - Reject with mandatory reason.
 * - Audit logged.
 */
export async function rejectOrder(params: {
  orderId: string;
  reviewedByEmail: string;
  rejectionReason: string;
}): Promise<OrderData> {
  const cleanReason = params.rejectionReason.trim();
  if (!cleanReason) {
    throw new Error('A rejection reason is required (e.g. "Amount not received in bank", "Invalid reference number").');
  }

  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
  });

  if (!order) {
    throw new Error('Order not found.');
  }

  if (order.status === 'APPROVED') {
    throw new Error('Cannot reject an order that is already approved. Use Refund instead.');
  }

  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'REJECTED',
      rejectionReason: cleanReason,
      reviewedBy: params.reviewedByEmail,
      reviewedAt: new Date(),
    },
    include: {
      course: { select: { id: true, title: true, slug: true } },
      cohort: { select: { id: true, batchName: true } },
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  });

  try {
    await prisma.activityLog.create({
      data: {
        userId: order.userId,
        userEmail: params.reviewedByEmail,
        action: 'ORDER_REJECTED',
        entityType: 'ORDER',
        entityId: order.id,
        reason: cleanReason,
        details: {
          orderReference: order.orderReference,
          rejectionReason: cleanReason,
          reviewedBy: params.reviewedByEmail,
        },
      },
    });
  } catch {}

  // Send email to student regarding rejection with reason and support WhatsApp link
  const studentEmail = updatedOrder.studentEmail || updatedOrder.user?.email;
  const studentName = updatedOrder.studentName || updatedOrder.user?.name || 'Student';
  if (studentEmail) {
    try {
      await emailService.sendPaymentRejected({
        studentName,
        studentEmail,
        courseTitle: updatedOrder.course?.title || 'Astrology Course',
        orderReference: updatedOrder.orderReference,
        amount: updatedOrder.amount,
        rejectionReason: cleanReason,
        supportWhatsApp: '+91 93112 15564',
      });
    } catch (emailErr) {
      logger.paymentError('Failed to send payment rejection email to student', {
        orderId: updatedOrder.id,
        orderReference: updatedOrder.orderReference,
        studentEmail,
        amount: updatedOrder.amount,
        provider: 'UPI_QR',
      }, emailErr instanceof Error ? emailErr : undefined);
    }
  }

  return updatedOrder as unknown as OrderData;
}

/**
 * Mark Refunded & Revoke Student Access:
 * - Marks order as REFUNDED.
 * - Records refund reason and timestamp.
 * - Revokes associated Enrollment.
 * - Audit logged.
 */
export async function refundOrder(params: {
  orderId: string;
  reviewedByEmail: string;
  refundReason: string;
}): Promise<OrderData> {
  const cleanReason = params.refundReason.trim();
  if (!cleanReason) {
    throw new Error('A reason for the refund is required for the audit record.');
  }

  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
  });

  if (!order) {
    throw new Error('Order not found.');
  }

  const refundedAt = new Date();

  const updatedOrder = await prisma.$transaction(async (tx) => {
    if (order.enrollmentId) {
      await tx.enrollment.update({
        where: { id: order.enrollmentId },
        data: {
          status: 'REVOKED',
        },
      });
    }

    return await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'REFUNDED',
        refundedAt,
        refundReason: cleanReason,
        reviewedBy: params.reviewedByEmail,
      },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        cohort: { select: { id: true, batchName: true } },
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
  });

  try {
    await prisma.activityLog.create({
      data: {
        userId: order.userId,
        userEmail: params.reviewedByEmail,
        action: 'ORDER_REFUNDED',
        entityType: 'ORDER',
        entityId: order.id,
        reason: cleanReason,
        details: {
          orderReference: order.orderReference,
          refundReason: cleanReason,
          refundedAt: refundedAt.toISOString(),
          enrollmentRevoked: Boolean(order.enrollmentId),
        },
      },
    });
  } catch {}

  return updatedOrder as unknown as OrderData;
}
