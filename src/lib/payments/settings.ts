/**
 * Payment Settings Management Module
 * Vihangam Institute of Astrology and Research (Viar.in)
 * 
 * Stores owner-editable payment settings in Neon PostgreSQL (PaymentSettings table).
 * Any changes are audit-logged in ActivityLog and emailed to the Owner immediately,
 * because altering these settings would redirect tuition payments.
 */

import { prisma } from '../prisma.ts';
import { emailService } from '../email/index.ts';
import { logger } from '../logger.ts';

export interface PaymentSettingsData {
  id: string;
  upiId: string;
  payeeName: string;
  qrImageUrl: string | null;
  whatsappNumber: string;
  orderExpiryDays: number;
  updatedAt: Date | string;
  updatedBy: string | null;
}

export const DEFAULT_PAYMENT_SETTINGS: Omit<PaymentSettingsData, 'updatedAt'> = {
  id: 'default',
  upiId: '9310709233m@pnb',
  payeeName: 'Vihangam Institute of Astrology and Research',
  qrImageUrl: '/images/upi-qr.jpg',
  whatsappNumber: '919311215564', // +91 93112 15564 (Flagged for client confirmation)
  orderExpiryDays: 3,
  updatedBy: 'system',
};

/**
 * Fetch current payment settings from PostgreSQL, seeding defaults if missing
 */
export async function getPaymentSettings(): Promise<PaymentSettingsData> {
  try {
    const settings = await prisma.paymentSettings.findUnique({
      where: { id: 'default' },
    });

    if (settings) {
      const activeUpiId = (!settings.upiId || settings.upiId === 'aapkaastro@okaxis')
        ? DEFAULT_PAYMENT_SETTINGS.upiId
        : settings.upiId;
      const activeQrUrl = (!settings.qrImageUrl)
        ? DEFAULT_PAYMENT_SETTINGS.qrImageUrl
        : settings.qrImageUrl;

      if (activeUpiId !== settings.upiId || activeQrUrl !== settings.qrImageUrl) {
        prisma.paymentSettings.update({
          where: { id: 'default' },
          data: { upiId: activeUpiId, qrImageUrl: activeQrUrl },
        }).catch((err) => {
          logger.warn('Non-fatal: failed to auto-migrate payment settings row', {
            error: err instanceof Error ? err.message : String(err),
          });
        });
      }

      return {
        id: settings.id,
        upiId: activeUpiId,
        payeeName: settings.payeeName,
        qrImageUrl: activeQrUrl,
        whatsappNumber: settings.whatsappNumber,
        orderExpiryDays: settings.orderExpiryDays,
        updatedAt: settings.updatedAt,
        updatedBy: settings.updatedBy,
      };
    }

    // Seed default settings row
    const seeded = await prisma.paymentSettings.create({
      data: {
        id: 'default',
        upiId: DEFAULT_PAYMENT_SETTINGS.upiId,
        payeeName: DEFAULT_PAYMENT_SETTINGS.payeeName,
        qrImageUrl: DEFAULT_PAYMENT_SETTINGS.qrImageUrl,
        whatsappNumber: DEFAULT_PAYMENT_SETTINGS.whatsappNumber,
        orderExpiryDays: DEFAULT_PAYMENT_SETTINGS.orderExpiryDays,
        updatedBy: 'system_init',
      },
    });

    return {
      id: seeded.id,
      upiId: seeded.upiId,
      payeeName: seeded.payeeName,
      qrImageUrl: seeded.qrImageUrl,
      whatsappNumber: seeded.whatsappNumber,
      orderExpiryDays: seeded.orderExpiryDays,
      updatedAt: seeded.updatedAt,
      updatedBy: seeded.updatedBy,
    };
  } catch (err) {
    logger.error(
      'Failed to read payment settings from database, using in-memory defaults',
      err instanceof Error ? err : new Error(String(err)),
      { service: 'payments' }
    );

    return {
      ...DEFAULT_PAYMENT_SETTINGS,
      updatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Update payment settings (Owner only)
 * Audit-logs the change and dispatches an immediate security alert email to the Owner.
 */
export async function updatePaymentSettings(params: {
  upiId: string;
  payeeName: string;
  qrImageUrl?: string | null;
  whatsappNumber: string;
  orderExpiryDays: number;
  updatedByEmail: string;
}): Promise<PaymentSettingsData> {
  const cleanUpiId = params.upiId.trim();
  const cleanPayee = params.payeeName.trim();
  const cleanPhone = params.whatsappNumber.replace(/[^0-9]/g, '');
  const expiryDays = Math.max(1, Math.min(30, Number(params.orderExpiryDays) || 3));

  if (!cleanUpiId || !cleanUpiId.includes('@')) {
    throw new Error('Invalid UPI ID. Must contain a valid VPA handle (e.g. name@bank).');
  }

  if (!cleanPayee) {
    throw new Error('Payee name cannot be empty.');
  }

  if (!cleanPhone || cleanPhone.length < 10) {
    throw new Error('Invalid WhatsApp phone number. Please provide a full country-code number.');
  }

  // 1. Read existing settings for audit diff
  const oldSettings = await getPaymentSettings();

  // 2. Persist update in database
  const updated = await prisma.paymentSettings.upsert({
    where: { id: 'default' },
    update: {
      upiId: cleanUpiId,
      payeeName: cleanPayee,
      qrImageUrl: params.qrImageUrl?.trim() || null,
      whatsappNumber: cleanPhone,
      orderExpiryDays: expiryDays,
      updatedBy: params.updatedByEmail,
    },
    create: {
      id: 'default',
      upiId: cleanUpiId,
      payeeName: cleanPayee,
      qrImageUrl: params.qrImageUrl?.trim() || null,
      whatsappNumber: cleanPhone,
      orderExpiryDays: expiryDays,
      updatedBy: params.updatedByEmail,
    },
  });

  // 3. Record Audit Log in ActivityLog table
  try {
    await prisma.activityLog.create({
      data: {
        userEmail: params.updatedByEmail,
        action: 'PAYMENT_SETTINGS_UPDATED',
        entityType: 'PAYMENT_SETTINGS',
        entityId: 'default',
        reason: 'Payment destination and expiry settings updated by Owner',
        details: {
          previous: {
            upiId: oldSettings.upiId,
            payeeName: oldSettings.payeeName,
            qrImageUrl: oldSettings.qrImageUrl,
            whatsappNumber: oldSettings.whatsappNumber,
            orderExpiryDays: oldSettings.orderExpiryDays,
          },
          updated: {
            upiId: updated.upiId,
            payeeName: updated.payeeName,
            qrImageUrl: updated.qrImageUrl,
            whatsappNumber: updated.whatsappNumber,
            orderExpiryDays: updated.orderExpiryDays,
          },
        },
      },
    });
  } catch (auditErr) {
    logger.error(
      'Failed to write payment settings change to ActivityLog',
      auditErr instanceof Error ? auditErr : undefined,
      { service: 'payments' }
    );
  }

  // 4. Dispatch High-Priority Security Alert Email to Owner
  // Altering payment settings alters where visitor funds are directed.
  const ownerEmail = process.env.OWNER_EMAIL || 'aapkaastro1606@gmail.com';
  try {
    await emailService.sendEmail({
      to: ownerEmail,
      subject: '⚠️ SECURITY ALERT: VIAR Academy Payment Settings Modified',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #b91c1c; margin-top: 0;">⚠️ Security Notice: Payment Settings Modified</h2>
          <p style="color: #334155; font-size: 14px; line-height: 1.5;">
            The tuition payment settings for <strong>Vihangam Institute of Astrology and Research (viar.in)</strong> were modified.
            Because altering these settings redirects where student tuition is deposited, please verify these changes immediately.
          </p>
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px;">
            <p style="margin: 0 0 8px 0;"><strong>Updated By:</strong> ${params.updatedByEmail}</p>
            <p style="margin: 0 0 8px 0;"><strong>Timestamp:</strong> ${new Date().toUTCString()}</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 12px 0;" />
            <p style="margin: 0 0 6px 0;"><strong>New UPI ID:</strong> <code style="color: #0369a1;">${updated.upiId}</code> (Previous: ${oldSettings.upiId})</p>
            <p style="margin: 0 0 6px 0;"><strong>New Payee Name:</strong> ${updated.payeeName} (Previous: ${oldSettings.payeeName})</p>
            <p style="margin: 0 0 6px 0;"><strong>New WhatsApp Number:</strong> +${updated.whatsappNumber} (Previous: +${oldSettings.whatsappNumber})</p>
            <p style="margin: 0 0 6px 0;"><strong>Order Expiry Days:</strong> ${updated.orderExpiryDays} days (Previous: ${oldSettings.orderExpiryDays} days)</p>
            <p style="margin: 0;"><strong>Static QR Image URL:</strong> ${updated.qrImageUrl || 'None (Using dynamic QR)'}</p>
          </div>
          <p style="color: #64748b; font-size: 12px; line-height: 1.4;">
            If you did not authorize this change, please sign in to Admin Console immediately at <a href="https://viar.in/admin" style="color: #d97706;">https://viar.in/admin</a> to restore your authorized UPI credentials.
          </p>
        </div>
      `,
    });
  } catch (emailErr) {
    logger.paymentError('Failed to send payment settings security alert email to Owner', {
      studentEmail: ownerEmail,
      provider: 'UPI_QR',
      ownerEmail,
      updatedBy: params.updatedByEmail,
    }, emailErr instanceof Error ? emailErr : undefined);
  }

  return {
    id: updated.id,
    upiId: updated.upiId,
    payeeName: updated.payeeName,
    qrImageUrl: updated.qrImageUrl,
    whatsappNumber: updated.whatsappNumber,
    orderExpiryDays: updated.orderExpiryDays,
    updatedAt: updated.updatedAt,
    updatedBy: updated.updatedBy,
  };
}
