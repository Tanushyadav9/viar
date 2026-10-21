import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerAuthUser, isAuthorizedForSection } from '@/lib/auth/serverAuth';
import { generateWhatsAppActivationUrl } from '@/lib/payments/upi';
import { logger } from '@/lib/logger';

/**
 * GET /api/admin/payments
 * 
 * Lists all UPI and direct payments in PostgreSQL for administrative review.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!isAuthorizedForSection(auth, 'payments', 'VIEW')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: VIEW permission on payments required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (statusFilter && statusFilter !== 'ALL') {
      where.status = statusFilter;
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            priceInr: true,
          },
        },
        cohort: {
          select: {
            id: true,
            batchName: true,
          },
        },
        enrollments: {
          select: {
            id: true,
            status: true,
            enrolledAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      payments,
    });
  } catch (error) {
    logger.error('Failed to retrieve payments list', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve payments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/payments
 * 
 * Verifies or rejects a pending UPI payment.
 * When verified, activates course enrollment in PostgreSQL.
 * Design Decision: No separate credentials created. Student's own login unlocks access.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!isAuthorizedForSection(auth, 'payments', 'MANAGE')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: MANAGE permission on payments required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { paymentId, action, notes } = body;

    if (!paymentId || !['VERIFY', 'REJECT'].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Valid paymentId and action ('VERIFY' or 'REJECT') are required." },
        { status: 400 }
      );
    }

    const existingPayment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: true,
        course: true,
        cohort: true,
      },
    });

    if (!existingPayment) {
      return NextResponse.json(
        { success: false, error: 'Payment record not found.' },
        { status: 404 }
      );
    }

    const operatorIdentifier = auth.email || auth.userId || 'site_owner';

    if (action === 'VERIFY') {
      const result = await prisma.$transaction(async (tx) => {
        // 1. Mark payment COMPLETED
        const updatedPayment = await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: 'COMPLETED',
            verifiedBy: operatorIdentifier,
            verifiedAt: new Date(),
            notes: notes ? `${existingPayment.notes ? existingPayment.notes + ' | ' : ''}${notes}` : existingPayment.notes,
          },
        });

        // 2. Ensure Enrollment exists and is ACTIVE
        const courseId = existingPayment.courseId || existingPayment.cohort?.courseId || 'cmugp9kmx000010o1wzvybmh5';
        const cohortId = existingPayment.cohortId || 'cohort-wia-batch-1';

        const enrollment = await tx.enrollment.upsert({
          where: {
            userId_cohortId: {
              userId: existingPayment.userId,
              cohortId,
            },
          },
          update: {
            status: 'ACTIVE',
            paymentId: updatedPayment.id,
            amountPaid: updatedPayment.amount,
            currency: 'INR',
          },
          create: {
            userId: existingPayment.userId,
            courseId,
            cohortId,
            paymentId: updatedPayment.id,
            amountPaid: updatedPayment.amount,
            currency: 'INR',
            status: 'ACTIVE',
          },
        });

        // 3. Increment cohort enrolled count
        await tx.cohort.update({
          where: { id: cohortId },
          data: { enrolledCount: { increment: 1 } },
        }).catch(() => {});

        // 4. Log in ActivityLog
        await tx.activityLog.create({
          data: {
            userId: existingPayment.userId,
            userEmail: existingPayment.studentEmail || existingPayment.user.email,
            userName: existingPayment.studentName || existingPayment.user.name,
            action: 'PAYMENT_VERIFIED_ACCESS_ACTIVATED',
            entityType: 'PAYMENT',
            entityId: paymentId,
            reason: `Payment verified by ${operatorIdentifier}. Course access unlocked.`,
            details: {
              paymentId,
              amount: updatedPayment.amount,
              enrollmentId: enrollment.id,
              courseId,
              cohortId,
            },
          },
        });

        return { updatedPayment, enrollment };
      });

      // Generate WhatsApp confirmation URL for Owner to click
      const studentPhone = existingPayment.studentPhone || existingPayment.user.phone || '';
      const studentName = existingPayment.studentName || existingPayment.user.name || 'Student';
      const courseTitle = existingPayment.course?.title || 'The Ultimate Astrology Masterclass';

      let whatsappConfirmationUrl: string | null = null;
      if (studentPhone) {
        whatsappConfirmationUrl = generateWhatsAppActivationUrl({
          studentPhone,
          studentName,
          courseTitle,
        });
      }

      logger.info('UPI Payment verified & enrollment unlocked', {
        service: 'payments',
        paymentId,
        studentEmail: existingPayment.studentEmail || undefined,
        enrollmentId: result.enrollment.id,
      });

      return NextResponse.json({
        success: true,
        action: 'VERIFIED',
        payment: result.updatedPayment,
        enrollment: result.enrollment,
        whatsappConfirmationUrl,
        message: 'Payment verified and course access successfully activated in PostgreSQL.',
      });
    }

    if (action === 'REJECT') {
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'FAILED',
          verifiedBy: operatorIdentifier,
          verifiedAt: new Date(),
          notes: notes ? `${existingPayment.notes ? existingPayment.notes + ' | ' : ''}REJECTED: ${notes}` : 'Payment rejected during verification',
        },
      });

      await prisma.activityLog.create({
        data: {
          userId: existingPayment.userId,
          userEmail: existingPayment.studentEmail,
          userName: existingPayment.studentName,
          action: 'PAYMENT_REJECTED',
          entityType: 'PAYMENT',
          entityId: paymentId,
          reason: notes || 'Rejected by administrator',
        },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        action: 'REJECTED',
        payment: updatedPayment,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    logger.error('Failed to process payment verification', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: 'Failed to process payment action' },
      { status: 500 }
    );
  }
}
