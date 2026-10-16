import test from 'node:test';
import assert from 'node:assert';
import {
  renderEnrollmentConfirmation,
  renderPaymentReceipt,
  renderClassReminder,
  renderRecordingAvailable,
  renderCertificateIssued,
} from '../src/lib/email/templates.ts';
import { MockEmailService } from '../src/lib/email/mock.ts';
import { ResendEmailService } from '../src/lib/email/resend.ts';
import { getEmailService } from '../src/lib/email/index.ts';

test('Transactional Email System', async (t) => {
  const mockService = new MockEmailService('Vihangam Institute of Astrology and Research <admissions@viar.in>', 'aapkaastro1606@gmail.com');

  await t.test('1. Enrollment Confirmation Email', async () => {
    mockService.clearHistory();

    const enrollmentData = {
      studentName: 'Aarav Sharma',
      studentEmail: 'aarav@example.com',
      courseTitle: 'What is Astrology — Foundations of Vedic Astrology',
      cohortName: 'Batch 1 (October 2026)',
      startDate: 'October 15, 2026',
      amountPaid: 5100,
      currency: '₹',
      dashboardUrl: 'https://viar.in/dashboard',
    };

    const template = renderEnrollmentConfirmation(enrollmentData);
    assert.match(template.subject, /Enrollment Confirmed: What is Astrology/);
    assert.match(template.html, /Aarav Sharma/);
    assert.match(template.html, /₹ 5,100/);
    assert.match(template.html, /October 15, 2026/);
    assert.match(template.html, /https:\/\/viar\.in\/dashboard/);

    const result = await mockService.sendEnrollmentConfirmation(enrollmentData);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.provider, 'MOCK');

    const sent = mockService.getSentEmails();
    assert.strictEqual(sent.length, 1);
    assert.strictEqual(sent[0].to, 'aarav@example.com');
    assert.strictEqual(sent[0].from, 'Vihangam Institute of Astrology and Research <admissions@viar.in>');
    assert.strictEqual(sent[0].replyTo, 'aapkaastro1606@gmail.com');
  });

  await t.test('2. Payment Receipt Email', async () => {
    mockService.clearHistory();

    const receiptData = {
      receiptNumber: 'REC-UPI-984210',
      orderId: 'pay_test_9842',
      paymentDate: 'Oct 1, 2026',
      studentName: 'Priya Verma',
      studentEmail: 'priya@example.com',
      courseTitle: 'What is Astrology — Foundations of Vedic Astrology',
      cohortName: 'Batch 1',
      amount: 5100,
      currency: '₹',
      paymentMethod: 'Direct UPI (aapkaastro@okaxis)',
      status: 'PAID' as const,
      dashboardUrl: 'https://viar.in/dashboard/payments',
    };

    const template = renderPaymentReceipt(receiptData);
    assert.match(template.subject, /Payment Receipt #REC-UPI-984210/);
    assert.match(template.html, /REC-UPI-984210/);
    assert.match(template.html, /pay_test_9842/);
    assert.match(template.html, /PAID IN FULL/);
    assert.match(template.html, /₹ 5,100/);

    const result = await mockService.sendPaymentReceipt(receiptData);
    assert.strictEqual(result.success, true);
    assert.strictEqual(mockService.getSentEmails().length, 1);
  });

  await t.test('3. Upcoming Class Reminder Email (24h and 1h intervals)', async () => {
    mockService.clearHistory();

    // 24h reminder
    const reminder24h = {
      studentName: 'Aarav Sharma',
      studentEmail: 'aarav@example.com',
      courseTitle: 'What is Astrology',
      sessionNumber: 3,
      sessionTitle: 'Planetary Dignities & Avashthas',
      scheduledAtUtc: '2026-10-20T14:00:00.000Z',
      studentTimezone: 'Asia/Kolkata',
      joinLink: 'https://zoom.us/j/viar-class-3',
      reminderType: '24h' as const,
    };

    const template24h = renderClassReminder(reminder24h);
    assert.match(template24h.subject, /starts tomorrow \(in 24 hours\)/);
    assert.match(template24h.html, /Planetary Dignities/);
    assert.match(template24h.html, /https:\/\/zoom\.us\/j\/viar-class-3/);

    // 1h reminder
    const reminder1h = {
      ...reminder24h,
      reminderType: '1h' as const,
    };
    const template1h = renderClassReminder(reminder1h);
    assert.match(template1h.subject, /starts in 1 hour/);

    await mockService.sendClassReminder(reminder24h);
    await mockService.sendClassReminder(reminder1h);

    assert.strictEqual(mockService.getSentEmails().length, 2);
  });

  await t.test('4. Recording Available Notification Email', async () => {
    mockService.clearHistory();

    const recordingData = {
      studentName: 'Rohan Mehta',
      studentEmail: 'rohan@example.com',
      courseTitle: 'What is Astrology',
      sessionNumber: 5,
      sessionTitle: 'Houses 1 to 6 — Tangible Realities of Life',
      durationMinutes: 105,
      dashboardWatchUrl: 'https://viar.in/dashboard/courses/cohort-wia-batch-1?tab=recordings',
    };

    const template = renderRecordingAvailable(recordingData);
    assert.match(template.subject, /Recording Published: (Class|Module) 5/);
    assert.match(template.html, /(Class|Module) 5 Recording is Ready/);
    assert.match(template.html, /~105 minutes/);
    assert.match(template.html, /tab=recordings/);

    const result = await mockService.sendRecordingAvailable(recordingData);
    assert.strictEqual(result.success, true);
    assert.strictEqual(mockService.getSentEmails()[0].to, 'rohan@example.com');
  });

  await t.test('5. Certificate Issued Notification Email', async () => {
    mockService.clearHistory();

    const certData = {
      studentName: 'Aarav Sharma',
      studentEmail: 'aarav@example.com',
      courseTitle: 'What is Astrology — Foundations of Vedic Astrology',
      grade: 'Distinction' as const,
      scorePercentage: 95,
      certificateCode: 'VIAR-2026-WIA-9842',
      certificateUrl: 'https://viar.in/dashboard/certificates',
      verifyUrl: 'https://viar.in/verify/VIAR-2026-WIA-9842',
    };

    const template = renderCertificateIssued(certData);
    assert.match(template.subject, /Your Certificate of Completion Has Been Issued/);
    assert.match(template.html, /VIAR-2026-WIA-9842/);
    assert.match(template.html, /Distinction \(95%\)/);
    assert.match(template.html, /https:\/\/viar\.in\/verify\/VIAR-2026-WIA-9842/);

    const result = await mockService.sendCertificateIssued(certData);
    assert.strictEqual(result.success, true);
    assert.strictEqual(mockService.getSentEmails()[0].to, 'aarav@example.com');
  });

  await t.test('6. ResendEmailService Simulation & Fallback Mode', async () => {
    // When no API key is provided, Resend service gracefully simulates delivery without throwing
    const resendNoKey = new ResendEmailService('', 'Vihangam Institute of Astrology and Research <admissions@viar.in>', 'aapkaastro1606@gmail.com');
    const result = await resendNoKey.sendEmail({
      to: 'student@example.com',
      subject: 'Test Subject',
      html: '<p>Test</p>',
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.provider, 'RESEND_SIMULATED');
    assert.match(result.messageId || '', /sim-resend-/);
  });

  await t.test('7. Service Factory getEmailService() Contract', () => {
    const service = getEmailService();
    assert.ok(service.providerName);
    assert.strictEqual(typeof service.sendEnrollmentConfirmation, 'function');
    assert.strictEqual(typeof service.sendPaymentReceipt, 'function');
    assert.strictEqual(typeof service.sendClassReminder, 'function');
    assert.strictEqual(typeof service.sendRecordingAvailable, 'function');
    assert.strictEqual(typeof service.sendCertificateIssued, 'function');
    assert.strictEqual(typeof service.sendPaymentClaimed, 'function');
    assert.strictEqual(typeof service.sendPaymentApproved, 'function');
    assert.strictEqual(typeof service.sendPaymentRejected, 'function');
  });

  await t.test('8. Payment Claimed Email to Owner', async () => {
    mockService.clearHistory();
    const result = await mockService.sendPaymentClaimed({
      ownerEmail: 'aapkaastro1606@gmail.com',
      orderReference: 'VIAR-ORD-TEST-01',
      studentName: 'Rahul Sharma',
      studentPhone: '+91 98765 43210',
      studentEmail: 'rahul@example.com',
      courseTitle: 'Foundations of Vedic Astrology',
      amount: 4999,
      utr: '123456789012',
      adminQueueUrl: 'https://viar.in/admin',
    });
    assert.strictEqual(result.success, true);
    const sent = mockService.getSentEmails();
    assert.strictEqual(sent.length, 1);
    assert.strictEqual(sent[0].to, 'aapkaastro1606@gmail.com');
    assert.match(sent[0].subject, /VIAR-ORD-TEST-01/);
    assert.match(sent[0].html, /Rahul Sharma/);
    assert.match(sent[0].html, /123456789012/);
  });

  await t.test('9. Payment Approved Email to Student (Zero Passwords)', async () => {
    mockService.clearHistory();
    const result = await mockService.sendPaymentApproved({
      studentName: 'Rahul Sharma',
      studentEmail: 'rahul@example.com',
      courseTitle: 'Foundations of Vedic Astrology',
      amountPaid: 4999,
      orderReference: 'VIAR-ORD-TEST-01',
      utr: '123456789012',
      dashboardUrl: 'https://viar.in/dashboard',
    });
    assert.strictEqual(result.success, true);
    const sent = mockService.getSentEmails();
    assert.strictEqual(sent.length, 1);
    assert.strictEqual(sent[0].to, 'rahul@example.com');
    assert.match(sent[0].subject, /Course Access Unlocked/);
    assert.match(sent[0].html, /Zero-Password Access Notice/);
    assert.match(sent[0].text || '', /No passwords are sent/);
  });

  await t.test('10. Payment Rejected Email to Student', async () => {
    mockService.clearHistory();
    const result = await mockService.sendPaymentRejected({
      studentName: 'Rahul Sharma',
      studentEmail: 'rahul@example.com',
      courseTitle: 'Foundations of Vedic Astrology',
      orderReference: 'VIAR-ORD-TEST-01',
      amount: 4999,
      rejectionReason: 'Amount not received in bank account. Please check with your bank.',
      supportWhatsApp: '+91 93112 15564',
    });
    assert.strictEqual(result.success, true);
    const sent = mockService.getSentEmails();
    assert.strictEqual(sent.length, 1);
    assert.strictEqual(sent[0].to, 'rahul@example.com');
    assert.match(sent[0].subject, /Payment Verification Update/);
    assert.match(sent[0].html, /Amount not received in bank account/);
    assert.match(sent[0].html, /\+91 93112 15564/);
  });
});
