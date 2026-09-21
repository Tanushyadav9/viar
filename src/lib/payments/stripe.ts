import { PaymentProvider, CreateOrderParams, PaymentOrderResult, VerifyPaymentParams } from './types';
import { env } from '@/config/env';

export class StripePaymentProvider implements PaymentProvider {
  readonly id = 'STRIPE';
  readonly name = 'Stripe (International)';
  readonly supportedCurrencies: Array<'INR' | 'USD'> = ['USD'];

  isConfigured(): boolean {
    return Boolean(
      env.payments.enableStripe &&
      env.payments.stripe.publishableKey &&
      env.payments.stripe.secretKey
    );
  }

  async createOrder(params: CreateOrderParams): Promise<PaymentOrderResult> {
    const orderId = `cs_stripe_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    return {
      orderId,
      amount: params.amount,
      currency: 'USD',
      provider: 'STRIPE',
      checkoutKey: env.payments.stripe.publishableKey,
      clientSecret: `pi_${Date.now()}_secret_${Math.floor(Math.random() * 10000)}`,
      metadata: {
        studentEmail: params.studentEmail,
        studentName: params.studentName,
        cohortId: params.cohortId,
      },
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<boolean> {
    return Boolean(params.orderId && params.paymentId);
  }
}

export const stripeProvider = new StripePaymentProvider();
