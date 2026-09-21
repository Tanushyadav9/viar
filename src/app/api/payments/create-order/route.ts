import { NextRequest, NextResponse } from 'next/server';
import { getPaymentProvider } from '@/lib/payments';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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

    return NextResponse.json({
      success: true,
      order: orderResult,
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create payment order.' },
      { status: 500 }
    );
  }
}
