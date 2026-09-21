export interface CreateOrderParams {
  cohortId: string;
  courseId: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  amount: number;
  currency: 'INR' | 'USD';
}

export interface PaymentOrderResult {
  orderId: string;
  amount: number;
  currency: 'INR' | 'USD';
  provider: 'RAZORPAY' | 'STRIPE';
  checkoutKey: string;
  clientSecret?: string; // For Stripe payment intent
  metadata?: Record<string, unknown>;
}

export interface VerifyPaymentParams {
  orderId: string;
  paymentId: string;
  signature?: string;
}

export interface PaymentProvider {
  readonly id: 'RAZORPAY' | 'STRIPE';
  readonly name: string;
  readonly supportedCurrencies: Array<'INR' | 'USD'>;
  
  isConfigured(): boolean;
  createOrder(params: CreateOrderParams): Promise<PaymentOrderResult>;
  verifyPayment(params: VerifyPaymentParams): Promise<boolean>;
}
