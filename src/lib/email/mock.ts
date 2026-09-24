/**
 * Mock Email Service Implementation
 * Used in local development, automated testing, and offline staging environments.
 */

import type {
  EmailService,
  EmailPayload,
  EmailSendResult,
  EnrollmentEmailData,
  PaymentReceiptEmailData,
  ClassReminderEmailData,
  RecordingAvailableEmailData,
  CertificateIssuedEmailData,
} from './types';
import {
  renderEnrollmentConfirmation,
  renderPaymentReceipt,
  renderClassReminder,
  renderRecordingAvailable,
  renderCertificateIssued,
} from './templates.ts';

export class MockEmailService implements EmailService {
  readonly providerName = 'MOCK';
  private defaultFrom: string;
  private defaultReplyTo: string;
  public sentEmails: Array<EmailPayload & { messageId: string; dispatchedAt: string }> = [];

  constructor(fromAddress?: string, replyTo?: string) {
    // PLACEHOLDER: replace with client-approved sender details
    this.defaultFrom = fromAddress || 'Viar Academy <admissions@viar.in>';
    this.defaultReplyTo = replyTo || 'ask@aapkaastro.com';
  }

  clearHistory() {
    this.sentEmails = [];
  }

  getSentEmails() {
    return [...this.sentEmails];
  }

  async sendEmail(payload: EmailPayload): Promise<EmailSendResult> {
    const dispatchedAt = new Date().toISOString();
    const messageId = `mock_email_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const from = payload.from || this.defaultFrom;
    const replyTo = payload.replyTo || this.defaultReplyTo;

    const record = {
      ...payload,
      from,
      replyTo,
      messageId,
      dispatchedAt,
    };

    this.sentEmails.push(record);
    console.log(`[MockEmailService] Dispatched "${payload.subject}" to ${Array.isArray(payload.to) ? payload.to.join(', ') : payload.to} (ID: ${messageId})`);

    return {
      success: true,
      messageId,
      provider: 'MOCK',
      dispatchedAt,
    };
  }

  async sendEnrollmentConfirmation(data: EnrollmentEmailData): Promise<EmailSendResult> {
    const { subject, html, text } = renderEnrollmentConfirmation(data);
    return this.sendEmail({
      to: data.studentEmail,
      subject,
      html,
      text,
    });
  }

  async sendPaymentReceipt(data: PaymentReceiptEmailData): Promise<EmailSendResult> {
    const { subject, html, text } = renderPaymentReceipt(data);
    return this.sendEmail({
      to: data.studentEmail,
      subject,
      html,
      text,
    });
  }

  async sendClassReminder(data: ClassReminderEmailData): Promise<EmailSendResult> {
    const { subject, html, text } = renderClassReminder(data);
    return this.sendEmail({
      to: data.studentEmail,
      subject,
      html,
      text,
    });
  }

  async sendRecordingAvailable(data: RecordingAvailableEmailData): Promise<EmailSendResult> {
    const { subject, html, text } = renderRecordingAvailable(data);
    return this.sendEmail({
      to: data.studentEmail,
      subject,
      html,
      text,
    });
  }

  async sendCertificateIssued(data: CertificateIssuedEmailData): Promise<EmailSendResult> {
    const { subject, html, text } = renderCertificateIssued(data);
    return this.sendEmail({
      to: data.studentEmail,
      subject,
      html,
      text,
    });
  }
}
