/**
 * Resend Email Service Implementation
 * Official Resend API: https://resend.com/docs/api-reference/emails/send-email
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

export class ResendEmailService implements EmailService {
  readonly providerName = 'RESEND';
  private apiKey: string;
  private defaultFrom: string;
  private defaultReplyTo: string;

  constructor(apiKey: string, fromAddress?: string, replyTo?: string) {
    this.apiKey = apiKey;
    // PLACEHOLDER: replace with client-approved sender details
    this.defaultFrom = fromAddress || 'Viar Academy <admissions@viar.in>';
    this.defaultReplyTo = replyTo || 'ask@aapkaastro.com';
  }

  async sendEmail(payload: EmailPayload): Promise<EmailSendResult> {
    const dispatchedAt = new Date().toISOString();
    const toRecipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    const fromSender = payload.from || this.defaultFrom;
    const replyTo = payload.replyTo || this.defaultReplyTo;

    if (!this.apiKey) {
      console.warn('[ResendEmailService] Missing RESEND_API_KEY. Simulating delivery.');
      return {
        success: true,
        messageId: `sim-resend-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        provider: 'RESEND_SIMULATED',
        dispatchedAt,
      };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromSender,
          to: toRecipients,
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
          reply_to: replyTo,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = data?.message || `HTTP ${response.status} ${response.statusText}`;
        console.error(`[ResendEmailService] Dispatch failed to ${toRecipients.join(', ')}:`, errorMsg);
        return {
          success: false,
          error: errorMsg,
          provider: 'RESEND',
          dispatchedAt,
        };
      }

      return {
        success: true,
        messageId: data?.id || `resend_${Date.now()}`,
        provider: 'RESEND',
        dispatchedAt,
      };
    } catch (err) {
      const errorMsg = (err as Error).message;
      console.error(`[ResendEmailService] Network exception:`, errorMsg);
      return {
        success: false,
        error: errorMsg,
        provider: 'RESEND',
        dispatchedAt,
      };
    }
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
