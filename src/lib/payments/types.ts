export type PaymentProviderType = 'UPI_QR' | 'MANUAL_VERIFICATION' | 'BANK_TRANSFER';

export interface CreateUpiOrderParams {
  cohortId: string;
  courseId: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  amount: number;
  utr?: string;
  screenshotUrl?: string;
  notes?: string;
}

export interface UpiOrderResult {
  orderId: string;
  amount: number;
  currency: 'INR';
  provider: 'UPI_QR';
  vpa: string;
  payeeName: string;
  upiUrl: string;
  whatsAppSubmissionUrl: string;
}
