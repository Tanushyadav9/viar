/**
 * Session Notification Emails
 * Vihangam Institute of Astrology and Research (VIAR)
 */

import { emailService } from '@/lib/email';
import { formatSessionIST } from './oneOnOneService';
import { formatInTimezone } from '@/lib/timezones';
import {
  enqueueSessionEmail,
  sendSessionChangedEmail,
  sendSessionCancelledEmail,
} from './outboxService';

export { sendSessionChangedEmail, sendSessionCancelledEmail };

export async function sendSessionScheduledEmail(data: {
  studentName: string;
  studentEmail: string;
  topic: string;
  startTimeUtc: string;
  durationMinutes: number;
  meetingLink?: string | null;
  notes?: string | null;
  studentTimezone?: string;
  sessionId?: string;
}): Promise<boolean> {
  const timeIst = formatSessionIST(data.startTimeUtc);
  const tz = data.studentTimezone || 'Asia/Kolkata';
  const timeLocal = tz !== 'Asia/Kolkata' ? formatInTimezone(data.startTimeUtc, tz, 'full') : null;

  const subject = `Confirmed: 1-on-1 Class with Acharya Niraj Kumar — ${data.topic}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0b0f17; color: #cbd5e1; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; overflow: hidden; padding: 28px;">
      <div style="text-align: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 20px; margin-bottom: 24px;">
        <h2 style="color: #f59e0b; margin: 0 0 6px 0; font-size: 20px;">Vihangam Institute of Astrology & Research</h2>
        <p style="color: #94a3b8; font-size: 13px; margin: 0;">Personal Mentorship & Live Jyotish Class</p>
      </div>

      <p style="font-size: 15px; color: #ffffff;">Namaste <strong>${data.studentName} ji</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6;">Your 1-on-1 personal teaching session with <strong>Acharya Niraj Kumar</strong> has been confirmed. Below are your class details:</p>

      <div style="background-color: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 18px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #94a3b8; width: 35%;">Topic / Subject:</td>
            <td style="padding: 6px 0; color: #ffffff; font-weight: 600;">${data.topic}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Time (IST):</td>
            <td style="padding: 6px 0; color: #f59e0b; font-weight: 700;">${timeIst} IST</td>
          </tr>
          ${
            timeLocal
              ? `<tr>
            <td style="padding: 6px 0; color: #94a3b8;">Your Time (${tz}):</td>
            <td style="padding: 6px 0; color: #38bdf8; font-weight: 600;">${timeLocal}</td>
          </tr>`
              : ''
          }
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Duration:</td>
            <td style="padding: 6px 0; color: #ffffff;">${data.durationMinutes} Minutes</td>
          </tr>
          ${
            data.meetingLink
              ? `<tr>
            <td style="padding: 6px 0; color: #94a3b8;">Meeting Link:</td>
            <td style="padding: 6px 0;"><a href="${data.meetingLink}" style="color: #f59e0b; text-decoration: underline; font-weight: 600;">Click to Join Class</a></td>
          </tr>`
              : ''
          }
        </table>
      </div>

      ${
        data.notes
          ? `<div style="background-color: rgba(245, 158, 11, 0.08); border-left: 3px solid #f59e0b; padding: 12px 16px; margin: 18px 0; font-size: 13px; color: #e2e8f0;">
        <strong style="color: #f59e0b;">Pre-Class Preparation Notes from Acharya ji:</strong><br />
        ${data.notes}
      </div>`
          : ''
      }

      <div style="text-align: center; margin: 28px 0 16px;">
        ${
          data.meetingLink
            ? `<a href="${data.meetingLink}" style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #d97706, #b45309); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">Open Live Class Link</a>`
            : ''
        }
      </div>

      <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; margin-top: 24px; font-size: 12px; color: #64748b; line-height: 1.5; text-align: center;">
        <p style="margin: 0 0 4px 0;">Need to reschedule or have questions? Contact Acharya Niraj Kumar directly on WhatsApp: <a href="https://wa.me/919311215564" style="color: #f59e0b;">+91 93112 15564</a></p>
        <p style="margin: 0;">© ${new Date().getFullYear()} Vihangam Institute of Astrology and Research (VIAR)</p>
      </div>
    </div>
  `;

  const text = `Namaste ${data.studentName} ji,\n\nYour 1-on-1 personal class with Acharya Niraj Kumar is scheduled for:\nTopic: ${data.topic}\nDate & Time: ${timeIst} IST\nDuration: ${data.durationMinutes} mins\nMeeting Link: ${data.meetingLink || 'Shared via WhatsApp'}\n\nPre-class notes: ${data.notes || 'Please have your birth chart ready.'}\n\nHelpline: +91 93112 15564\nViar.in`;

  try {
    const record = await enqueueSessionEmail({
      sessionId: data.sessionId,
      recipientEmail: data.studentEmail,
      recipientName: data.studentName,
      emailType: 'SCHEDULED',
      subject,
      htmlContent: html,
      textContent: text,
      idempotencyKey: data.sessionId ? `scheduled_${data.sessionId}` : undefined,
      immediateDispatch: true,
    });
    return record.status === 'SENT';
  } catch {
    return false;
  }
}

export async function sendSessionRequestStatusEmail(data: {
  studentName: string;
  studentEmail: string;
  status: 'ACCEPTED' | 'DECLINED' | 'PROPOSAL';
  reason?: string;
  proposedTime?: string;
  scheduledTime?: string;
  meetingLink?: string;
}): Promise<boolean> {
  let subject = `Update on your 1-on-1 Class Request — Vihangam Institute (VIAR)`;
  let messageContent = '';

  if (data.status === 'ACCEPTED') {
    subject = `Accepted: Your 1-on-1 Class Request with Acharya Niraj Kumar`;
    messageContent = `
      <p>Your request for a personal live class has been accepted and scheduled for <strong>${data.scheduledTime || 'the requested time'}</strong>.</p>
      ${data.meetingLink ? `<p>Join link: <a href="${data.meetingLink}" style="color: #f59e0b;">${data.meetingLink}</a></p>` : ''}
    `;
  } else if (data.status === 'PROPOSAL') {
    subject = `Alternate Time Proposed for your 1-on-1 Class with Acharya Niraj Kumar`;
    messageContent = `
      <p>Acharya Niraj Kumar has reviewed your session request. Due to prior commitments, an alternate time has been proposed:</p>
      <div style="background-color: rgba(56, 189, 248, 0.1); border-left: 3px solid #38bdf8; padding: 12px 16px; margin: 16px 0; font-size: 14px; color: #ffffff;">
        <strong>Proposed Time:</strong> ${data.proposedTime}<br />
        ${data.reason ? `<strong>Notes:</strong> ${data.reason}` : ''}
      </div>
      <p>Please message us on WhatsApp (<a href="https://wa.me/919311215564" style="color: #f59e0b;">+91 93112 15564</a>) to confirm this slot.</p>
    `;
  } else {
    subject = `Regarding your 1-on-1 Session Request`;
    messageContent = `
      <p>Acharya Niraj Kumar has reviewed your session request. Unfortunately, this slot cannot be accommodated at this moment.</p>
      <div style="background-color: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444; padding: 12px 16px; margin: 16px 0; font-size: 14px; color: #ffffff;">
        <strong>Reason:</strong> ${data.reason || 'Schedule booked for personal consultations. Please pick another day.'}
      </div>
      <p>You can submit a new request with alternative time windows or message Acharya ji directly on WhatsApp (<a href="https://wa.me/919311215564" style="color: #f59e0b;">+91 93112 15564</a>).</p>
    `;
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0b0f17; color: #cbd5e1; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 28px;">
      <div style="border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 16px; margin-bottom: 20px;">
        <h2 style="color: #f59e0b; margin: 0; font-size: 18px;">Vihangam Institute of Astrology and Research</h2>
      </div>
      <p style="color: #ffffff;">Namaste <strong>${data.studentName} ji</strong>,</p>
      ${messageContent}
      <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; margin-top: 24px; font-size: 12px; color: #64748b; text-align: center;">
        <p>Helpline: +91 93112 15564 | Email: aapkaastro1606@gmail.com</p>
      </div>
    </div>
  `;

  try {
    const res = await emailService.sendEmail({
      to: data.studentEmail,
      subject,
      html,
      text: `Namaste ${data.studentName} ji,\n\nUpdate on your session request.\nHelpline: +91 93112 15564`,
    });
    return res.success;
  } catch {
    return false;
  }
}
