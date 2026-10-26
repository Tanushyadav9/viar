/**
 * Transactional Email Templates
 * Branded responsive HTML & plain-text email generators for Vihangam Institute of Astrology and Research (VIAR)
 */

import type {
  EnrollmentEmailData,
  PaymentReceiptEmailData,
  ClassReminderEmailData,
  RecordingAvailableEmailData,
  CertificateIssuedEmailData,
} from './types';

function emailWrapper(contentHtml: string, previewText: string = ''): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vihangam Institute of Astrology and Research</title>
  <style>
    body { margin: 0; padding: 0; background-color: #05070a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #0b0f17; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; overflow: hidden; }
    .header { padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.08); background: linear-gradient(180deg, rgba(245, 158, 11, 0.08) 0%, transparent 100%); }
    .logo { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff; text-decoration: none; }
    .logo-gold { color: #f59e0b; }
    .body { padding: 32px; font-size: 15px; line-height: 1.6; color: #cbd5e1; }
    .h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 16px; }
    .card { background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 20px; margin: 20px 0; }
    .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
    .row:last-child { border-bottom: none; }
    .label { color: #94a3b8; font-size: 13px; }
    .val { color: #ffffff; font-weight: 600; font-size: 14px; text-align: right; }
    .btn { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #d97706 0%, #b45309 100%); color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; text-align: center; margin: 24px 0 12px; box-shadow: 0 4px 14px rgba(217, 119, 6, 0.3); }
    .footer { padding: 24px 32px; background-color: #070a0f; border-top: 1px solid rgba(255, 255, 255, 0.08); text-align: center; font-size: 12px; color: #64748b; line-height: 1.5; }
    .footer a { color: #f59e0b; text-decoration: none; }
  </style>
</head>
<body>
  ${previewText ? `<div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${previewText}</div>` : ''}
  <div style="padding: 24px 12px;">
    <div class="container">
      <div class="header">
        <img src="https://viar.in/images/logo.png" alt="VIAR Logo" width="56" height="56" style="margin: 0 auto 10px; display: block; border-radius: 12px;" />
        <div class="logo">VIAR<span class="logo-gold">.IN</span></div>
        <div style="font-size: 11px; color: #94a3b8; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">Vihangam Institute of Astrology and Research</div>
      </div>
      <div class="body">
        ${contentHtml}
      </div>
      <div class="footer">
        <p style="margin: 0 0 8px 0;"><strong>Vihangam Institute of Astrology and Research (VIAR)</strong> • In Academic Lineage with <a href="https://aapkaastro.com" target="_blank">AapkaAstro.com</a></p>
        <p style="margin: 0 0 8px 0;">Founded &amp; Taught by Acharya Niraj Kumar</p>
        <p style="margin: 0;">Helpline: +91 93112 15564 (WhatsApp & Phone) | Vihangam Institute of Astrology and Research (VIAR)</p>
        <p style="margin: 8px 0 0 0; font-size: 11px; color: #475569;">© ${new Date().getFullYear()} Viar.in. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * 1. Enrollment Confirmation Email
 */
export function renderEnrollmentConfirmation(data: EnrollmentEmailData): { subject: string; html: string; text: string } {
  const subject = `Enrollment Confirmed: ${data.courseTitle} — Vihangam Institute (VIAR)`;
  const dashboardUrl = data.dashboardUrl || 'https://viar.in/dashboard';

  const html = emailWrapper(`
    <h1 class="h1">Welcome to Vihangam Institute, ${data.studentName}!</h1>
    <p>Your enrollment in <strong>${data.courseTitle}</strong> is successfully confirmed. We are thrilled to welcome you to our self-paced masterclass led by Acharya Niraj Kumar (Jyotish Acharya, BVB New Delhi).</p>
    
    <div class="card">
      <div style="font-weight: 700; color: #f59e0b; margin-bottom: 12px; font-size: 14px;">COURSE ENROLLMENT DETAILS</div>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Course:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: 600; font-size: 14px; text-align: right;">${data.courseTitle}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Format:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: 600; font-size: 14px; text-align: right;">23 Video Modules (Self-Paced)</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Start Date:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: 600; font-size: 14px; text-align: right;">${data.startDate}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Access:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: 600; font-size: 14px; text-align: right;">Instant Lifetime Access</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Tuition Paid:</td>
          <td style="padding: 6px 0; color: #10b981; font-weight: 700; font-size: 14px; text-align: right;">${data.currency} ${data.amountPaid.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Account Status:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: 600; font-size: 14px; text-align: right;">Active Scholar</td>
        </tr>
      </table>
    </div>

    <p>Your student dashboard is now live. From your dashboard, you can stream all 23 structured video modules, view lecture notes, track your progress, and prepare for the final certification exam.</p>

    <div style="text-align: center;">
      <a href="${dashboardUrl}" class="btn">Enter Student Dashboard &rarr;</a>
    </div>
  `, `Enrollment confirmed for ${data.courseTitle}. View your student dashboard.`);

  const text = `
Welcome to Vihangam Institute of Astrology and Research, ${data.studentName}!

Your enrollment in ${data.courseTitle} is successfully confirmed.

ENROLLMENT DETAILS:
• Course: ${data.courseTitle}
• Format: 23 Video Modules (Self-Paced)
• Access: Instant Lifetime Access
• Tuition Paid: ${data.currency} ${data.amountPaid}
• Dashboard URL: ${dashboardUrl}

You can access your classroom, video lessons, and study materials at ${dashboardUrl}.

Warm regards,
VIAR Admissions Desk
Helpline: +91 93112 15564 (WhatsApp)
  `.trim();

  return { subject, html, text };
}

/**
 * 2. Payment Receipt Email
 */
export function renderPaymentReceipt(data: PaymentReceiptEmailData): { subject: string; html: string; text: string } {
  const subject = `Payment Receipt #${data.receiptNumber} — Vihangam Institute (VIAR)`;
  const dashboardUrl = data.dashboardUrl || 'https://viar.in/dashboard/payments';

  const html = emailWrapper(`
    <h1 class="h1">Official Tuition Receipt</h1>
    <p>Dear ${data.studentName}, thank you for your payment. Please retain this email for your personal or tax accounting records.</p>
    
    <div class="card">
      <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 12px; margin-bottom: 12px;">
        <div>
          <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Receipt No.</div>
          <div style="font-family: monospace; font-size: 14px; font-weight: 700; color: #f59e0b;">${data.receiptNumber}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Status</div>
          <div style="font-size: 13px; font-weight: 700; color: #10b981;">PAID IN FULL</div>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Payment Date:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: 600; font-size: 14px; text-align: right;">${data.paymentDate}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Order / Txn ID:</td>
          <td style="padding: 6px 0; color: #ffffff; font-family: monospace; font-size: 13px; text-align: right;">${data.orderId}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Item:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: 600; font-size: 14px; text-align: right;">${data.courseTitle} (${data.cohortName})</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Payment Gateway:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: 600; font-size: 14px; text-align: right;">${data.paymentMethod}</td>
        </tr>
        <tr style="border-top: 1px solid rgba(255, 255, 255, 0.1);">
          <td style="padding: 10px 0 0; color: #ffffff; font-weight: 700; font-size: 15px;">Total Amount Paid:</td>
          <td style="padding: 10px 0 0; color: #f59e0b; font-weight: 800; font-size: 16px; text-align: right;">${data.currency} ${data.amount.toLocaleString()}</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 13px; color: #94a3b8;">
      This was an upfront one-time tuition payment with <strong>zero recurring subscriptions</strong>. For detailed purchase history and invoice downloads, visit your account portal:
    </p>

    <div style="text-align: center;">
      <a href="${dashboardUrl}" class="btn">View Payment Records &rarr;</a>
    </div>
  `, `Payment Receipt #${data.receiptNumber} for ${data.courseTitle}. Amount: ${data.currency} ${data.amount}.`);

  const text = `
Payment Receipt #${data.receiptNumber} — Vihangam Institute (VIAR)

Dear ${data.studentName},

Thank you for your payment. Here are your transaction details:

• Receipt Number: ${data.receiptNumber}
• Order ID: ${data.orderId}
• Payment Date: ${data.paymentDate}
• Item: ${data.courseTitle} (${data.cohortName})
• Amount Paid: ${data.currency} ${data.amount}
• Status: PAID IN FULL
• Payment Method: ${data.paymentMethod}

Purchase History: ${dashboardUrl}

VIAR Admissions Desk
Helpline: +91 93112 15564 (WhatsApp)
  `.trim();

  return { subject, html, text };
}

/**
 * 3. Upcoming Class Reminder Email
 */
export function renderClassReminder(data: ClassReminderEmailData): { subject: string; html: string; text: string } {
  const timeQualifier = data.reminderType === '24h' ? 'tomorrow (in 24 hours)' : 'in 1 hour';
  const subject = `Reminder: Class ${data.sessionNumber} starts ${timeQualifier} — ${data.courseTitle}`;

  // Timezone formatting
  const tz = data.studentTimezone || 'Asia/Kolkata';
  const scheduledDate = new Date(data.scheduledAtUtc);
  const timeFormatted = new Intl.DateTimeFormat('en-IN', {
    timeZone: tz,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(scheduledDate);

  const html = emailWrapper(`
    <h1 class="h1">Class Reminder: Starting ${data.reminderType === '24h' ? 'Tomorrow' : 'in 1 Hour'}</h1>
    <p>Dear ${data.studentName}, your live session with Acharya Niraj Kumar is approaching:</p>
    
    <div class="card">
      <div style="font-weight: 700; color: #f59e0b; margin-bottom: 12px; font-size: 14px;">SESSION SCHEDULE &amp; ACCESS</div>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Module Number:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: 600; font-size: 14px; text-align: right;">Module ${data.sessionNumber} of 23</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Topic / Title:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: 600; font-size: 14px; text-align: right;">${data.sessionTitle}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Scheduled Time:</td>
          <td style="padding: 6px 0; color: #f59e0b; font-weight: 700; font-size: 14px; text-align: right;">${timeFormatted} (${tz})</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center;">
      <a href="${data.joinLink}" class="btn">Click Here to Open Module &rarr;</a>
    </div>

    <div style="background-color: rgba(245, 158, 11, 0.05); border: 1px dashed rgba(245, 158, 11, 0.3); border-radius: 10px; padding: 14px; margin-top: 20px; font-size: 13px; color: #cbd5e1;">
      <strong>100% Self-Paced Video Module:</strong> Complete the video and lesson notes at your own convenience. Your progress is automatically recorded.
    </div>
  `, `Module ${data.sessionNumber} (${data.sessionTitle}) is scheduled for ${timeFormatted}.`);

  const text = `
Module ${data.sessionNumber} Reminder — Vihangam Institute (VIAR)

Dear ${data.studentName},

Your learning module is ready:
• Course: ${data.courseTitle}
• Module ${data.sessionNumber}: ${data.sessionTitle}
• Access Link: ${data.joinLink}

Warm regards,
Acharya Niraj Kumar & Vihangam Institute (VIAR)
  `.trim();

  return { subject, html, text };
}

/**
 * 4. Recording Available Notification Email
 */
export function renderRecordingAvailable(data: RecordingAvailableEmailData): { subject: string; html: string; text: string } {
  const subject = `Recording Published: Module ${data.sessionNumber} (${data.sessionTitle}) — Vihangam Institute (VIAR)`;

  const html = emailWrapper(`
    <h1 class="h1">Module ${data.sessionNumber} Recording is Ready!</h1>
    <p>Dear ${data.studentName}, the full 1080p high-definition video lesson and study notes for <strong>Module ${data.sessionNumber}: ${data.sessionTitle}</strong> are now available in your student portal.</p>
    
    <div class="card">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Course:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: 600; font-size: 14px; text-align: right;">${data.courseTitle}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Module:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: 600; font-size: 14px; text-align: right;">Module ${data.sessionNumber}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Topic:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: 600; font-size: 14px; text-align: right;">${data.sessionTitle}</td>
        </tr>
        ${data.durationMinutes ? `
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Duration:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: 600; font-size: 14px; text-align: right;">~${data.durationMinutes} minutes</td>
        </tr>` : ''}
      </table>
    </div>

    <p>Stream the video lesson at your own pace. Completing video modules and study notes counts 100% toward course completion and certification exam eligibility.</p>

    <div style="text-align: center;">
      <a href="${data.dashboardWatchUrl}" class="btn">Watch Video Module &rarr;</a>
    </div>
  `, `Video lesson for Module ${data.sessionNumber} (${data.sessionTitle}) is now available in your student portal.`);

  const text = `
Module ${data.sessionNumber} Video Published — Vihangam Institute (VIAR)

Dear ${data.studentName},

The video lesson and lecture notes for Module ${data.sessionNumber} (${data.sessionTitle}) in ${data.courseTitle} are now available.

Watch the module in your student portal:
${data.dashboardWatchUrl}

Warm regards,
VIAR Operations Desk
  `.trim();

  return { subject, html, text };
}

/**
 * 5. Certificate Issued Notification Email
 */
export function renderCertificateIssued(data: CertificateIssuedEmailData): { subject: string; html: string; text: string } {
  const subject = `Congratulations! Your Certificate of Completion Has Been Issued — Vihangam Institute (VIAR)`;

  const html = emailWrapper(`
    <h1 class="h1">Congratulations, ${data.studentName}!</h1>
    <p>We are delighted to announce that you have successfully completed the comprehensive final examination for <strong>${data.courseTitle}</strong> with a score of <strong>${data.scorePercentage}% (${data.grade})</strong>!</p>
    
    <div class="card" style="border: 2px solid rgba(245, 158, 11, 0.4); background: linear-gradient(180deg, rgba(245, 158, 11, 0.08) 0%, transparent 100%);">
      <div style="text-align: center; margin-bottom: 16px;">
        <div style="font-size: 11px; color: #f59e0b; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">OFFICIAL ACADEMIC CREDENTIAL</div>
        <div style="font-size: 20px; font-weight: 800; color: #ffffff; margin-top: 4px;">Certificate of Completion</div>
        <div style="font-family: monospace; font-size: 14px; color: #f59e0b; margin-top: 4px; font-weight: 700;">${data.certificateCode}</div>
      </div>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Graduate Name:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: 600; font-size: 14px; text-align: right;">${data.studentName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Honors / Grade:</td>
          <td style="padding: 6px 0; color: #10b981; font-weight: 700; font-size: 14px; text-align: right;">${data.grade} (${data.scorePercentage}%)</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Instructor:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: 600; font-size: 14px; text-align: right;">Acharya Niraj Kumar</td>
        </tr>
      </table>
    </div>

    <p>Your credential has been permanently signed and entered into our tamper-proof verification database. You can share your verification link with clients, employers, or on social channels (LinkedIn, Instagram).</p>

    <div style="text-align: center;">
      <a href="${data.certificateUrl}" class="btn">View &amp; Download PDF Certificate &rarr;</a>
    </div>

    <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 14px; margin-top: 20px; font-size: 12px; color: #94a3b8; text-align: center;">
      Public Verification Link: <a href="${data.verifyUrl}" style="color: #f59e0b; word-break: break-all;">${data.verifyUrl}</a>
    </div>
  `, `Congratulations! Your official Certificate of Completion (${data.certificateCode}) has been issued by Vihangam Institute of Astrology and Research (VIAR).`);

  const text = `
Congratulations, ${data.studentName}!

You have successfully completed the final examination for ${data.courseTitle} with a score of ${data.scorePercentage}% (${data.grade}).

CERTIFICATE DETAILS:
• Certificate Code: ${data.certificateCode}
• Grade: ${data.grade} (${data.scorePercentage}%)
• View / Download: ${data.certificateUrl}
• Public Verification URL: ${data.verifyUrl}

Acharya Niraj Kumar & Vihangam Institute (VIAR)
Helpline: +91 93112 15564
  `.trim();

  return { subject, html, text };
}

/**
 * 6. Payment Claimed Email (Sent to Owner)
 */
export function renderPaymentClaimed(data: import('./types').PaymentClaimedEmailData): { subject: string; html: string; text: string } {
  const subject = `🔔 ACTION REQUIRED: Payment Claimed for ${data.orderReference} (${data.studentName} — ₹${data.amount.toLocaleString('en-IN')})`;
  const queueUrl = data.adminQueueUrl || 'https://viar.in/admin';

  const html = emailWrapper(`
    <h1 class="h1">🔔 Student Submitted Payment Claim</h1>
    <p>A student has clicked "I Have Paid" and submitted payment details for verification:</p>
    
    <div class="card">
      <div style="font-weight: 700; color: #f59e0b; margin-bottom: 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">ORDER &amp; STUDENT DETAILS</div>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Order Reference:</td>
          <td style="padding: 6px 0; color: #38bdf8; font-weight: 700; font-family: monospace; font-size: 14px; text-align: right;">${data.orderReference}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Student Name:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: 600; font-size: 14px; text-align: right;">${data.studentName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Phone / WhatsApp:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: 600; font-size: 14px; text-align: right;">${data.studentPhone}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Email Address:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: 600; font-size: 14px; text-align: right;">${data.studentEmail || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Course:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: 600; font-size: 14px; text-align: right;">${data.courseTitle}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Locked Tuition Amount:</td>
          <td style="padding: 6px 0; color: #10b981; font-weight: 700; font-size: 14px; text-align: right;">₹${data.amount.toLocaleString('en-IN')}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Submitted UTR:</td>
          <td style="padding: 6px 0; color: ${data.utr ? '#10b981' : '#94a3b8'}; font-weight: 700; font-family: monospace; font-size: 14px; text-align: right;">
            ${data.utr || 'Check WhatsApp Screenshot'}
          </td>
        </tr>
      </table>
    </div>

    <p style="font-size: 13px; color: #94a3b8;">
      Please verify your bank or UPI statement credit before approving. Remember: digital screenshots can be altered, so the bank record is the true proof.
    </p>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${queueUrl}" class="btn">Open Owner Verification Queue &rarr;</a>
    </div>
  `, `New payment claim submitted for ${data.orderReference} by ${data.studentName} (₹${data.amount.toLocaleString('en-IN')}).`);

  const text = `
Action Required: Payment Claimed for ${data.orderReference}

Student Details:
• Name: ${data.studentName}
• Phone: ${data.studentPhone}
• Email: ${data.studentEmail || 'N/A'}
• Course: ${data.courseTitle}
• Amount: ₹${data.amount.toLocaleString('en-IN')}
• Order Ref: ${data.orderReference}
• UTR: ${data.utr || 'Not provided (check WhatsApp)'}

Open Owner Verification Queue: ${queueUrl}
  `.trim();

  return { subject, html, text };
}

/**
 * 7. Payment Approved Email (Sent to Student)
 */
export function renderPaymentApproved(data: import('./types').PaymentApprovedEmailData): { subject: string; html: string; text: string } {
  const subject = `✅ Course Access Unlocked: ${data.courseTitle} (Ref: ${data.orderReference})`;
  const dashboardUrl = data.dashboardUrl || 'https://viar.in/dashboard';

  const html = emailWrapper(`
    <h1 class="h1">🎉 Namaste ${data.studentName}! Your Enrollment is Active</h1>
    <p>Your payment for <strong>${data.courseTitle}</strong> has been verified and approved by Acharya Niraj Kumar. Your lifetime course access is now permanently activated!</p>
    
    <div class="card">
      <div style="font-weight: 700; color: #f59e0b; margin-bottom: 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">ENROLLMENT CONFIRMATION</div>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Course:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: 600; font-size: 14px; text-align: right;">${data.courseTitle}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Order Reference:</td>
          <td style="padding: 6px 0; color: #38bdf8; font-family: monospace; font-size: 14px; text-align: right;">${data.orderReference}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Amount Paid:</td>
          <td style="padding: 6px 0; color: #10b981; font-weight: 700; font-size: 14px; text-align: right;">₹${data.amountPaid.toLocaleString('en-IN')}</td>
        </tr>
        ${data.utr ? `
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Bank Reference (UTR):</td>
          <td style="padding: 6px 0; color: #ffffff; font-family: monospace; font-size: 13px; text-align: right;">${data.utr}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Access Type:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: 600; font-size: 14px; text-align: right;">Lifetime On-Demand</td>
        </tr>
      </table>
    </div>

    <div style="background-color: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px; color: #a7f3d0;">
      <strong>🔒 Zero-Password Access Notice:</strong> No separate login credentials or passwords are ever generated or sent. Your course is automatically unlocked on the account you used during signup. Simply log in with your existing email or Google account!
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${dashboardUrl}" class="btn">Enter Student Portal &amp; Start Learning &rarr;</a>
    </div>

    <p style="font-size: 12px; color: #94a3b8; text-align: center;">
      Need any assistance? Connect with our academic desk on WhatsApp at <a href="https://wa.me/919311215564" style="color: #f59e0b;">+91 93112 15564</a>.
    </p>
  `, `Your enrollment in ${data.courseTitle} is active. Log in at viar.in/dashboard to start learning.`);

  const text = `
Namaste ${data.studentName}!

Your payment of ₹${data.amountPaid.toLocaleString('en-IN')} for "${data.courseTitle}" (Ref: ${data.orderReference}) is confirmed.
Your course access is now ACTIVE on viar.in.

Access Portal: ${dashboardUrl}
Note: No passwords are sent over email/WhatsApp. Sign in with your existing account.

Acharya Niraj Kumar & Vihangam Institute (VIAR)
+91 93112 15564 (WhatsApp)
  `.trim();

  return { subject, html, text };
}

/**
 * 8. Payment Rejected Email (Sent to Student)
 */
export function renderPaymentRejected(data: import('./types').PaymentRejectedEmailData): { subject: string; html: string; text: string } {
  const subject = `⚠️ Payment Verification Update for Order ${data.orderReference}`;
  const supportPhone = data.supportWhatsApp || '+91 93112 15564';

  const html = emailWrapper(`
    <h1 class="h1">Payment Verification Update</h1>
    <p>Dear ${data.studentName},</p>
    <p>We reviewed the payment claim submitted for order <strong>${data.orderReference}</strong> (${data.courseTitle}), but could not confirm the bank credit at this time.</p>
    
    <div class="card" style="border-color: rgba(239, 68, 68, 0.3);">
      <div style="font-weight: 700; color: #ef4444; margin-bottom: 8px; font-size: 13px; text-transform: uppercase;">REASON FOR REJECTION</div>
      <p style="margin: 0; color: #fca5a5; font-size: 14px; font-weight: 500;">
        ${data.rejectionReason}
      </p>
    </div>

    <div style="margin: 20px 0; font-size: 13px; color: #cbd5e1; line-height: 1.6;">
      <strong>What should you do next?</strong>
      <ol style="margin-top: 8px; padding-left: 20px;">
        <li>Please check your UPI app or bank statement to verify that ₹${data.amount.toLocaleString('en-IN')} was actually debited.</li>
        <li>If the transaction was successful and you have an updated bank screenshot or corrected 12-digit UTR, message Acharya Niraj Kumar directly on WhatsApp at <a href="https://wa.me/919311215564" style="color: #f59e0b;">${supportPhone}</a> with your Order Reference: <code>${data.orderReference}</code>.</li>
        <li>If the funds were refunded to your bank account, you may initiate a fresh order anytime at <a href="https://viar.in/courses" style="color: #f59e0b;">https://viar.in/courses</a>.</li>
      </ol>
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="https://wa.me/919311215564" class="btn">Connect with Support on WhatsApp &rarr;</a>
    </div>
  `, `Payment verification update for order ${data.orderReference}. Please review the details.`);

  const text = `
Dear ${data.studentName},

We could not confirm the payment for order ${data.orderReference} (${data.courseTitle}).

Reason: ${data.rejectionReason}

If the amount was debited from your bank, please message Acharya Niraj Kumar on WhatsApp at ${supportPhone} with your Order Reference (${data.orderReference}) and bank statement screenshot.

VIAR Admissions Desk
Helpline: +91 93112 15564 (WhatsApp) | ${supportPhone}
  `.trim();

  return { subject, html, text };
}
