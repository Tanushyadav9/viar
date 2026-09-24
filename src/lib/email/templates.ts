/**
 * Transactional Email Templates
 * Branded responsive HTML & plain-text email generators for Viar Academy
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
  <title>Viar Academy</title>
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
        <div class="logo">VIAR<span class="logo-gold">.IN</span></div>
        <div style="font-size: 12px; color: #94a3b8; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">Vedic Institute of Astrological Research</div>
      </div>
      <div class="body">
        ${contentHtml}
      </div>
      <div class="footer">
        <p style="margin: 0 0 8px 0;"><strong>Viar Academy</strong> • In Academic Lineage with <a href="https://aapkaastro.com" target="_blank">AapkaAstro.com</a></p>
        <p style="margin: 0 0 8px 0;">Founded &amp; Taught by Acharya Niraj Kumar</p>
        <p style="margin: 0;">Helpline: +91 93112 15564 | Email: <a href="mailto:ask@aapkaastro.com">ask@aapkaastro.com</a></p>
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
  const subject = `Enrollment Confirmed: ${data.courseTitle} — Viar Academy`;
  const dashboardUrl = data.dashboardUrl || 'https://viar.in/dashboard';

  const html = emailWrapper(`
    <h1 class="h1">Welcome to Viar Academy, ${data.studentName}!</h1>
    <p>Your enrollment in <strong>${data.courseTitle}</strong> is successfully confirmed. We are thrilled to welcome you to our upcoming cohort led by Acharya Niraj Kumar.</p>
    
    <div class="card">
      <div style="font-weight: 700; color: #f59e0b; margin-bottom: 12px; font-size: 14px;">COHORT ENROLLMENT DETAILS</div>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Course:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: 600; font-size: 14px; text-align: right;">${data.courseTitle}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Batch / Cohort:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: 600; font-size: 14px; text-align: right;">${data.cohortName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Cohort Start Date:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: 600; font-size: 14px; text-align: right;">${data.startDate}</td>
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

    <p>Your student dashboard is now live. From your dashboard, you can view the upcoming 18-class schedule, sync live session times to your local timezone, and prepare for Class 1.</p>

    <div style="text-align: center;">
      <a href="${dashboardUrl}" class="btn">Enter Student Dashboard &rarr;</a>
    </div>

    <p style="font-size: 13px; color: #94a3b8; margin-top: 24px;">
      <strong>Note on Class Reminders:</strong> You will receive calendar reminders with your live Zoom / Google Meet classroom links 24 hours and 1 hour before each scheduled session.
    </p>
  `, `Enrollment confirmed for ${data.courseTitle}. View your student dashboard.`);

  const text = `
Welcome to Viar Academy, ${data.studentName}!

Your enrollment in ${data.courseTitle} is successfully confirmed.

COHORT DETAILS:
• Course: ${data.courseTitle}
• Batch: ${data.cohortName}
• Start Date: ${data.startDate}
• Tuition Paid: ${data.currency} ${data.amountPaid}
• Dashboard URL: ${dashboardUrl}

You can access your classroom, schedule, and study materials at ${dashboardUrl}.

Warm regards,
Viar Academy Admissions Desk
ask@aapkaastro.com
  `.trim();

  return { subject, html, text };
}

/**
 * 2. Payment Receipt Email
 */
export function renderPaymentReceipt(data: PaymentReceiptEmailData): { subject: string; html: string; text: string } {
  const subject = `Payment Receipt #${data.receiptNumber} — Viar Academy`;
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
Payment Receipt #${data.receiptNumber} — Viar Academy

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

Viar Academy Admissions Desk
ask@aapkaastro.com
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
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Class Number:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: 600; font-size: 14px; text-align: right;">Class ${data.sessionNumber} of 18</td>
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
      <a href="${data.joinLink}" class="btn">Click Here to Join Live Class &rarr;</a>
    </div>

    <div style="background-color: rgba(245, 158, 11, 0.05); border: 1px dashed rgba(245, 158, 11, 0.3); border-radius: 10px; padding: 14px; margin-top: 20px; font-size: 13px; color: #cbd5e1;">
      <strong>Can't make it live?</strong> Zero penalty! The 1080p HD recording and complete lecture notes will be uploaded to your student portal within 24 hours of session conclusion.
    </div>
  `, `Class ${data.sessionNumber} (${data.sessionTitle}) starts ${timeQualifier} at ${timeFormatted}.`);

  const text = `
Class ${data.sessionNumber} Reminder — Viar Academy

Dear ${data.studentName},

Your live class starts ${timeQualifier}:
• Course: ${data.courseTitle}
• Class ${data.sessionNumber}: ${data.sessionTitle}
• Scheduled Time: ${timeFormatted} (${tz})
• Join URL: ${data.joinLink}

If you cannot attend live, the HD recording will be posted to your dashboard within 24 hours.

Warm regards,
Acharya Niraj Kumar & Viar Academy
  `.trim();

  return { subject, html, text };
}

/**
 * 4. Recording Available Notification Email
 */
export function renderRecordingAvailable(data: RecordingAvailableEmailData): { subject: string; html: string; text: string } {
  const subject = `Recording Published: Class ${data.sessionNumber} (${data.sessionTitle}) — Viar Academy`;

  const html = emailWrapper(`
    <h1 class="h1">Class ${data.sessionNumber} Recording is Ready!</h1>
    <p>Dear ${data.studentName}, the full 1080p high-definition recording and study notes for <strong>Class ${data.sessionNumber}: ${data.sessionTitle}</strong> are now available in your student portal.</p>
    
    <div class="card">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Course:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: 600; font-size: 14px; text-align: right;">${data.courseTitle}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Class:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: 600; font-size: 14px; text-align: right;">Class ${data.sessionNumber}</td>
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

    <p>Whether you missed the live broadcast or wish to review key chart calculation examples, you can stream the replay at your own pace. Watching replays counts 100% toward course completion.</p>

    <div style="text-align: center;">
      <a href="${data.dashboardWatchUrl}" class="btn">Watch Class Recording &rarr;</a>
    </div>
  `, `Recording for Class ${data.sessionNumber} (${data.sessionTitle}) is now available in your student portal.`);

  const text = `
Class ${data.sessionNumber} Recording Published — Viar Academy

Dear ${data.studentName},

The recording and lecture slides for Class ${data.sessionNumber} (${data.sessionTitle}) in ${data.courseTitle} are now available.

Watch the recording in your student portal:
${data.dashboardWatchUrl}

Warm regards,
Viar Academy Operations Desk
  `.trim();

  return { subject, html, text };
}

/**
 * 5. Certificate Issued Notification Email
 */
export function renderCertificateIssued(data: CertificateIssuedEmailData): { subject: string; html: string; text: string } {
  const subject = `Congratulations! Your Certificate of Completion Has Been Issued — Viar Academy`;

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
  `, `Congratulations! Your official Certificate of Completion (${data.certificateCode}) has been issued by Viar Academy.`);

  const text = `
Congratulations, ${data.studentName}!

You have successfully completed the final examination for ${data.courseTitle} with a score of ${data.scorePercentage}% (${data.grade}).

CERTIFICATE DETAILS:
• Certificate Code: ${data.certificateCode}
• Grade: ${data.grade} (${data.scorePercentage}%)
• View / Download: ${data.certificateUrl}
• Public Verification URL: ${data.verifyUrl}

Acharya Niraj Kumar & Viar Academy
ask@aapkaastro.com
  `.trim();

  return { subject, html, text };
}
