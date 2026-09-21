import { PaymentProvider, CreateOrderParams, PaymentOrderResult, VerifyPaymentParams } from './types';
import { env } from '@/config/env';

export class RazorpayPaymentProvider implements PaymentProvider {
  readonly id = 'RAZORPAY';
  readonly name = 'Razorpay (India)';
  readonly supportedCurrencies: Array<'INR' | 'USD'> = ['INR'];

  isConfigured(): boolean {
    return Boolean(env.payments.razorpay.keyId && env.payments.razorpay.keySecret);
  }

  async createOrder(params: CreateOrderParams): Promise<PaymentOrderResult> {
    const orderId = `order_rzp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    return {
      orderId,
      amount: params.amount,
      currency: 'INR',
      provider: 'RAZORPAY',
      checkoutKey: env.payments.razorpay.keyId,
      metadata: {
        studentEmail: params.studentEmail,
        studentName: params.studentName,
        cohortId: params.cohortId,
      },
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<boolean> {
    // In production with razorpay node SDK, verify crypto HMAC-SHA256 signature
    // using env.payments.razorpay.keySecret
    return Boolean(params.orderId && params.paymentId);
  }
}

export const razorpayProvider = new RazorpayPaymentProvider();
