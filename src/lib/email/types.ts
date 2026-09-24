/**
 * Transactional Email Service Types & Contracts
 * Vedic Institute of Astrological Research (Viar.in)
 */

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  provider: string;
  error?: string;
  dispatchedAt: string;
}

export interface EnrollmentEmailData {
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  cohortName: string;
  startDate: string;
  amountPaid: number;
  currency: string;
  dashboardUrl?: string;
}

export interface PaymentReceiptEmailData {
  receiptNumber: string;
  orderId: string;
  paymentDate: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  cohortName: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: 'PAID';
  dashboardUrl?: string;
}

export interface ClassReminderEmailData {
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  sessionNumber: number;
  sessionTitle: string;
  scheduledAtUtc: string;
  studentTimezone?: string;
  joinLink: string;
  reminderType: '24h' | '1h';
}

export interface RecordingAvailableEmailData {
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  sessionNumber: number;
  sessionTitle: string;
  durationMinutes?: number;
  dashboardWatchUrl: string;
}

export interface CertificateIssuedEmailData {
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  grade: 'Distinction' | 'Merit' | 'Pass';
  scorePercentage: number;
  certificateCode: string;
  certificateUrl: string;
  verifyUrl: string;
}

export interface EmailService {
  readonly providerName: string;

  /**
   * Send a raw custom transactional email
   */
  sendEmail(payload: EmailPayload): Promise<EmailSendResult>;

  /**
   * 1. Send enrollment confirmation immediately following verified checkout
   */
  sendEnrollmentConfirmation(data: EnrollmentEmailData): Promise<EmailSendResult>;

  /**
   * 2. Send clean, itemized payment receipt for student records
   */
  sendPaymentReceipt(data: PaymentReceiptEmailData): Promise<EmailSendResult>;

  /**
   * 3. Send upcoming class reminder (24h or 1h before live class) with local timezone conversion
   */
  sendClassReminder(data: ClassReminderEmailData): Promise<EmailSendResult>;

  /**
   * 4. Send notification when instructor publishes a class recording
   */
  sendRecordingAvailable(data: RecordingAvailableEmailData): Promise<EmailSendResult>;

  /**
   * 5. Send certificate issuance notification with verification link upon passing exam
   */
  sendCertificateIssued(data: CertificateIssuedEmailData): Promise<EmailSendResult>;
}
