/**
 * Transactional Email Module Entry Point & Provider Factory
 * Vedic Institute of Astrological Research (Viar.in)
 */

import type { EmailService } from './types.ts';
import { ResendEmailService } from './resend.ts';
import { MockEmailService } from './mock.ts';

export * from './types.ts';
export * from './templates.ts';
export * from './resend.ts';
export * from './mock.ts';

export function getEmailService(): EmailService {
  const apiKey = process.env.RESEND_API_KEY || '';
  const isTest = process.env.NODE_ENV === 'test';
  const provider = (process.env.EMAIL_PROVIDER || 'resend').toLowerCase();
  // PLACEHOLDER: replace with client-approved sender details
  const fromAddress = process.env.EMAIL_FROM || 'Viar Academy <admissions@viar.in>';
  const replyTo = process.env.EMAIL_REPLY_TO || 'ask@aapkaastro.com';

  if (isTest || provider === 'mock' || !apiKey) {
    return new MockEmailService(fromAddress, replyTo);
  }

  return new ResendEmailService(apiKey, fromAddress, replyTo);
}

export const emailService: EmailService = getEmailService();
