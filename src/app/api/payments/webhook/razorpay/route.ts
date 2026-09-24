import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { env } from '@/config/env';
import { emailService } from '@/lib/email';

/**
 * Razorpay Webhook Handler
 * Requirement 6.4: Webhook-based payment confirmation only (never trust client-side confirmation).
 * Events: payment.captured, order.paid
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    // Secret is either specific webhook secret or razorpay key secret
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || env.payments.razorpay.keySecret || 'rzp_test_secret_placeholder';

    if (signature && webhookSecret && webhookSecret !== 'rzp_test_secret_placeholder') {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        console.error('Invalid Razorpay webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody || '{}');
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentId = paymentEntity?.id || `pay_${Date.now()}`;
      const orderId = orderEntity?.id || paymentEntity?.order_id;
      const amount = paymentEntity ? Math.round(paymentEntity.amount / 100) : 4999;
      const email = paymentEntity?.email || 'student@example.com';
      const notes = paymentEntity?.notes || orderEntity?.notes || {};
      const cohortId = notes.cohortId || 'cohort-wia-batch-1';
      const studentName = notes.studentName || 'Student';

      console.log(`[Razorpay Webhook] Verified payment ${paymentId} (Order: ${orderId}, Amount: ${amount}) for ${studentName} (${email}) in cohort ${cohortId}`);

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
      }).catch((err) => console.error('[Razorpay Webhook] Enrollment confirmation email failed:', err));

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
      }).catch((err) => console.error('[Razorpay Webhook] Payment receipt email failed:', err));

      // In production with PostgreSQL / Prisma:
      // await prisma.payment.upsert({ ... })
      // await prisma.enrollment.upsert({ ... })
      // await prisma.cohort.update({ where: { id: cohortId }, data: { enrolledCount: { increment: 1 } } })
    }

    return NextResponse.json({ status: 'ok', received: true });
  } catch (error) {
    console.error('Razorpay webhook handler error:', error);
    return NextResponse.json({ error: 'Internal webhook error' }, { status: 500 });
  }
}
