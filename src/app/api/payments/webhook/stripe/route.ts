import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { env } from '@/config/env';
import { emailService } from '@/lib/email';
import { logger } from '@/lib/logger';

/**
 * Stripe Webhook Handler
 * Requirement 6.4: Webhook-based payment confirmation only (never trust client-side confirmation).
 * Events: payment_intent.succeeded, checkout.session.completed
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signatureHeader = req.headers.get('stripe-signature');
    const webhookSecret = env.payments.stripe.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      logger.error('Stripe webhook secret is not configured on server', new Error('Missing STRIPE_WEBHOOK_SECRET'), {
        service: 'payments',
        endpoint: '/api/payments/webhook/stripe',
      });
      return NextResponse.json({ error: 'Webhook secret not configured on server' }, { status: 500 });
    }

    if (!signatureHeader) {
      logger.securityAlert('Missing Stripe signature header', {
        event: 'invalid_signature',
        endpoint: '/api/payments/webhook/stripe',
      });
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    const parts = signatureHeader.split(',').reduce((acc, part) => {
      const [k, v] = part.split('=');
      acc[k.trim()] = v?.trim();
      return acc;
    }, {} as Record<string, string>);

    const timestamp = parts['t'];
    const signature = parts['v1'];

    if (!timestamp || !signature) {
      logger.securityAlert('Malformed Stripe signature header', {
        event: 'invalid_signature',
        endpoint: '/api/payments/webhook/stripe',
      });
      return NextResponse.json({ error: 'Malformed stripe-signature header' }, { status: 400 });
    }

    const signedPayload = `${timestamp}.${rawBody}`;
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(signedPayload)
      .digest('hex');

    if (expectedSignature !== signature) {
      logger.securityAlert('Invalid Stripe webhook signature', {
        event: 'invalid_signature',
        endpoint: '/api/payments/webhook/stripe',
      });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody || '{}');
    const eventType = payload.type;
    const dataObject = payload.data?.object;

    if (eventType === 'payment_intent.succeeded' || eventType === 'checkout.session.completed') {
      const paymentIntentId = dataObject?.id || `pi_${Date.now()}`;
      const amount = dataObject ? Math.round(dataObject.amount / 100) : 69;
      const email = dataObject?.customer_details?.email || dataObject?.receipt_email || 'student@example.com';
      const metadata = dataObject?.metadata || {};
      const cohortId = metadata.cohortId || 'cohort-wia-batch-1';
      const studentName = metadata.studentName || 'Student';

      logger.info('Verified Stripe payment successfully', {
        service: 'payments',
        provider: 'stripe',
        paymentId: String(paymentIntentId),
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
              provider: 'STRIPE',
              providerReference: String(paymentIntentId),
              amount,
              currency: 'USD',
              status: 'COMPLETED',
            },
          });
          await prisma.enrollment.upsert({
            where: { userId_cohortId: { userId: user.id, cohortId } },
            update: { amountPaid: amount, currency: 'USD', status: 'ACTIVE', paymentId: payment.id },
            create: { userId: user.id, cohortId, amountPaid: amount, currency: 'USD', status: 'ACTIVE', paymentId: payment.id },
          });
          await prisma.cohort.update({
            where: { id: cohortId },
            data: { enrolledCount: { increment: 1 } },
          });
        }
      } catch (dbErr) {
        logger.error('Stripe webhook DB enrollment sync non-fatal error', dbErr, { service: 'payments' });
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
        currency: '$',
        dashboardUrl: `${env.appUrl}/dashboard`,
      }).catch((err) => {
        logger.error('Failed to send enrollment confirmation email after Stripe payment', err, {
          service: 'payments',
          provider: 'stripe',
          paymentId: String(paymentIntentId),
          studentEmail: email,
        });
      });

      await emailService.sendPaymentReceipt({
        receiptNumber: `REC-STP-${Date.now().toString().slice(-6)}`,
        orderId: String(paymentIntentId),
        paymentDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        studentName,
        studentEmail: email,
        courseTitle,
        cohortName,
        amount,
        currency: '$',
        paymentMethod: 'Stripe (Cards / Apple Pay / Google Pay)',
        status: 'PAID',
        dashboardUrl: `${env.appUrl}/dashboard/payments`,
      }).catch((err) => {
        logger.error('Failed to send payment receipt email after Stripe payment', err, {
          service: 'payments',
          provider: 'stripe',
          paymentId: String(paymentIntentId),
          studentEmail: email,
        });
      });
    }

    return NextResponse.json({ status: 'ok', received: true });
  } catch (error) {
    logger.paymentError('Stripe webhook handler critical error', {
      provider: 'stripe',
    }, error);
    return NextResponse.json({ error: 'Internal webhook error' }, { status: 500 });
  }
}
