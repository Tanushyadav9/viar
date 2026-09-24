import { NextRequest, NextResponse } from 'next/server';
import { getPaymentProvider } from '@/lib/payments';
import { RateLimiters } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || '127.0.0.1';

  // Enforce rate limiting: 20 checkout attempts per hour per IP
  const rateLimitResult = await RateLimiters.checkout(ip);
  if (!rateLimitResult.success) {
    logger.securityAlert('Checkout rate limit exceeded', {
      event: 'rate_limit_exceeded',
      ip,
      endpoint: '/api/payments/create-order',
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Too many checkout attempts. Please try again later.',
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimitResult.resetSeconds),
        },
      }
    );
  }

  let body: {
    cohortId?: string;
    courseId?: string;
    studentName?: string;
    studentEmail?: string;
    studentPhone?: string;
    amount?: number;
    currency?: string;
  } = {};

  try {
    body = await req.json();
    const { cohortId, courseId, studentName, studentEmail, studentPhone, amount, currency } = body;

    if (!cohortId || !studentEmail || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required checkout fields.' },
        { status: 400 }
      );
    }

    const targetCurrency = (currency === 'USD' ? 'USD' : 'INR') as 'INR' | 'USD';
    const provider = getPaymentProvider(targetCurrency);

    const orderResult = await provider.createOrder({
      cohortId,
      courseId: courseId || 'course-what-is-astrology',
      studentName: studentName || 'Student',
      studentEmail,
      studentPhone,
      amount,
      currency: targetCurrency,
    });

    logger.info('Checkout order created successfully', {
      service: 'payments',
      orderId: orderResult.orderId,
      studentEmail,
      cohortId,
      amount,
      currency: targetCurrency,
    });

    return NextResponse.json({
      success: true,
      order: orderResult,
    });
  } catch (error) {
    logger.paymentError('Failed to create payment order', {
      cohortId: body.cohortId,
      studentEmail: body.studentEmail,
      amount: body.amount,
    }, error);

    return NextResponse.json(
      { success: false, error: 'Failed to create payment order.' },
      { status: 500 }
    );
  }
}
