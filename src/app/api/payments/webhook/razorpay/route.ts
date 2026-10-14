import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { env } from '@/config/env';
import { emailService } from '@/lib/email';
import { logger } from '@/lib/logger';

/**
 * Razorpay Webhook Handler
 * Requirement 6.4: Webhook-based payment confirmation only (never trust client-side confirmation).
 * Events: payment.captured, order.paid
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || env.payments.razorpay.keySecret;

    if (!webhookSecret) {
      logger.error('Razorpay webhook secret is not configured on server', new Error('Missing RAZORPAY_WEBHOOK_SECRET'), {
        service: 'payments',
        endpoint: '/api/payments/webhook/razorpay',
      });
      return NextResponse.json({ error: 'Webhook secret not configured on server' }, { status: 500 });
    }

    if (!signature) {
      logger.securityAlert('Missing Razorpay webhook signature header', {
        event: 'invalid_signature',
        endpoint: '/api/payments/webhook/razorpay',
      });
      return NextResponse.json({ error: 'Missing signature header' }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      logger.securityAlert('Invalid Razorpay webhook signature', {
        event: 'invalid_signature',
        endpoint: '/api/payments/webhook/razorpay',
      });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody || '{}');
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentId = paymentEntity?.id || `pay_${Date.now()}`;
      const orderId = orderEntity?.id || paymentEntity?.order_id;
      const amount = paymentEntity ? Math.round(paymentEntity.amount / 100) : 5100;
      const email = paymentEntity?.email || 'student@example.com';
      const notes = paymentEntity?.notes || orderEntity?.notes || {};
      const cohortId = notes.cohortId || 'cohort-wia-batch-1';
      const studentName = notes.studentName || 'Student';

      logger.info('Verified Razorpay payment successfully', {
        service: 'payments',
        provider: 'razorpay',
        paymentId: String(paymentId),
        orderId: String(orderId),
        amount,
        studentEmail: email,
        cohortId,
      });

      // Synchronize with database
      try {
        let user = await prisma.user.findFirst({ where: { email } });
        if (!user) {
          user = await prisma.user.create({
            data: { name: studentName, email, role: 'STUDENT' },
          });
        }
        const cohort = await prisma.cohort.findUnique({ where: { id: cohortId } });
        if (cohort) {
          const payment = await prisma.payment.create({
            data: {
              userId: user.id,
              cohortId,
              provider: 'RAZORPAY',
              providerReference: String(paymentId),
              amount,
              currency: 'INR',
              status: 'COMPLETED',
            },
          });
          await prisma.enrollment.upsert({
            where: { userId_cohortId: { userId: user.id, cohortId } },
            update: { amountPaid: amount, status: 'ACTIVE', paymentId: payment.id },
            create: { userId: user.id, cohortId, amountPaid: amount, currency: 'INR', status: 'ACTIVE', paymentId: payment.id },
          });
          await prisma.cohort.update({
            where: { id: cohortId },
            data: { enrolledCount: { increment: 1 } },
          });
        }
      } catch (dbErr) {
        logger.error('Razorpay webhook DB enrollment sync non-fatal error', dbErr, { service: 'payments' });
      }

      // Dispatch Transactional Emails
      const courseTitle = 'What is Astrology — Foundations of Vedic Astrology';
      const cohortName = cohortId === 'cohort-wia-batch-1' ? 'Batch 1 (Starting October 2026)' : cohortId;

      await emailService.sendEnrollmentConfirmation({
        studentName,
        studentEmail: email,
        courseTitle,
        cohortName,
        startDate: 'October 15, 2026',
        amountPaid: amount,
        currency: '₹',
        dashboardUrl: `${env.appUrl}/dashboard`,
      }).catch((err) => {
        logger.error('Failed to send enrollment confirmation email after Razorpay payment', err, {
          service: 'payments',
          provider: 'razorpay',
          paymentId: String(paymentId),
          orderId: String(orderId),
          studentEmail: email,
        });
      });

      await emailService.sendPaymentReceipt({
        receiptNumber: `REC-RZP-${Date.now().toString().slice(-6)}`,
        orderId: String(orderId || paymentId),
        paymentDate: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }),
        studentName,
        studentEmail: email,
        courseTitle,
        cohortName,
        amount,
        currency: '₹',
        paymentMethod: 'Razorpay (UPI / Cards / NetBanking)',
        status: 'PAID',
        dashboardUrl: `${env.appUrl}/dashboard/payments`,
      }).catch((err) => {
        logger.error('Failed to send payment receipt email after Razorpay payment', err, {
          service: 'payments',
          provider: 'razorpay',
          paymentId: String(paymentId),
          orderId: String(orderId),
          studentEmail: email,
        });
      });
    }

    return NextResponse.json({ status: 'ok', received: true });
  } catch (error) {
    logger.paymentError('Razorpay webhook handler critical error', {
      provider: 'razorpay',
    }, error);
    return NextResponse.json({ error: 'Internal webhook error' }, { status: 500 });
  }
}
