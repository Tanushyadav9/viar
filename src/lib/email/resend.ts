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
  PaymentClaimedEmailData,
  PaymentApprovedEmailData,
  PaymentRejectedEmailData,
} from './types';
import {
  renderEnrollmentConfirmation,
  renderPaymentReceipt,
  renderClassReminder,
  renderRecordingAvailable,
  renderCertificateIssued,
  renderPaymentClaimed,
  renderPaymentApproved,
  renderPaymentRejected,
} from './templates.ts';

export class ResendEmailService implements EmailService {
  readonly providerName = 'RESEND';
  private apiKey: string;
  private defaultFrom: string;
  private defaultReplyTo: string;

  constructor(apiKey: string, fromAddress?: string, replyTo?: string) {
    this.apiKey = apiKey;
    // PLACEHOLDER: replace with client-approved sender details
    this.defaultFrom = fromAddress || 'Vihangam Institute of Astrology and Research <admissions@viar.in>';
    this.defaultReplyTo = replyTo || 'aapkaastro1606@gmail.com';
  }

  async sendEmail(payload: EmailPayload): Promise<EmailSendResult> {
    const dispatchedAt = new Date().toISOString();
    const toRecipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    const fromSender = payload.from || this.defaultFrom;
    const replyTo = payload.replyTo || this.defaultReplyTo;

    if (!this.apiKey) {
      if (process.env.NODE_ENV === 'production') {
        console.error('🚨 [CRITICAL CONFIG ERROR] RESEND_API_KEY is missing in production environment! Emails cannot be delivered.');
      } else {
        console.warn('[ResendEmailService] Missing RESEND_API_KEY. Simulating delivery.');
      }
      return {
        success: process.env.NODE_ENV !== 'production',
        messageId: `sim-resend-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        provider: 'RESEND_SIMULATED',
        error: process.env.NODE_ENV === 'production' ? 'RESEND_API_KEY is missing in production environment' : undefined,
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

  async sendPaymentClaimed(data: PaymentClaimedEmailData): Promise<EmailSendResult> {
    const { subject, html, text } = renderPaymentClaimed(data);
    return this.sendEmail({
      to: data.ownerEmail,
      subject,
      html,
      text,
    });
  }

  async sendPaymentApproved(data: PaymentApprovedEmailData): Promise<EmailSendResult> {
    const { subject, html, text } = renderPaymentApproved(data);
    return this.sendEmail({
      to: data.studentEmail,
      subject,
      html,
      text,
    });
  }

  async sendPaymentRejected(data: PaymentRejectedEmailData): Promise<EmailSendResult> {
    const { subject, html, text } = renderPaymentRejected(data);
    return this.sendEmail({
      to: data.studentEmail,
      subject,
      html,
      text,
    });
  }
}
