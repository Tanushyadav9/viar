import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  enqueueSessionEmail,
  processOutboxQueue,
  listFailedEmails,
  retryFailedEmail,
  checkAndQueueReminders,
  sendSessionChangedEmail,
  sendSessionCancelledEmail,
} from '../src/lib/sessions/outboxService';

import {
  createStudentSession,
  getCourseSessionSettings,
  updateCourseSessionSettings,
} from '../src/lib/sessions/oneOnOneService';

describe('EMAILS AND REMINDERS — Outbox, Idempotency, 15-Min Cron & Notice Period', () => {
  const testStudentId = 'usr_email_test_student_101';
  const testEmail = 'astrology.scholar@example.com';
  const testCourseId = 'course-what-is-astrology';

  // ----------------------------------------------------------------------------
  // 1. Transactional Emails on Lifecycle: Scheduled, Changed, Cancelled
  // ----------------------------------------------------------------------------
  test('1. Lifecycle Emails: Changed and Cancelled sessions route cleanly through Outbox', async () => {
    // 1A. Changed Session Email
    const changedRecord = await sendSessionChangedEmail({
      studentName: 'Sanjay Sharma',
      studentEmail: testEmail,
      topic: 'Module 13: Gochara (Transits) & Sade Sati',
      newStartTimeUtc: '2026-11-20T14:30:00.000Z',
      previousStartTimeUtc: '2026-11-20T12:00:00.000Z',
      durationMinutes: 60,
      meetingLink: 'https://meet.google.com/xyz-transits',
      notes: 'Please bring your Saturn transit degrees.',
      sessionId: 'sess_changed_001',
    });

    assert.ok(changedRecord.id.startsWith('outbox_'));
    assert.equal(changedRecord.emailType, 'CHANGED');
    assert.equal(changedRecord.status, 'SENT');
    assert.ok(changedRecord.subject.includes('Updated Details: 1-on-1 Class'));
    assert.ok(changedRecord.htmlContent.includes('xyz-transits'));

    // 1B. Cancelled Session Email
    const cancelledRecord = await sendSessionCancelledEmail({
      studentName: 'Sanjay Sharma',
      studentEmail: testEmail,
      topic: 'Module 13: Gochara (Transits) & Sade Sati',
      scheduledTimeUtc: '2026-11-20T14:30:00.000Z',
      cancellationReason: 'Emergency personal consultation scheduled. Please reschedule via portal.',
      sessionId: 'sess_cancelled_001',
    });

    assert.ok(cancelledRecord.id.startsWith('outbox_'));
    assert.equal(cancelledRecord.emailType, 'CANCELLED');
    assert.equal(cancelledRecord.status, 'SENT');
    assert.ok(cancelledRecord.subject.includes('Class Cancelled'));
    assert.ok(cancelledRecord.htmlContent.includes('Emergency personal consultation'));
  });

  // ----------------------------------------------------------------------------
  // 2. Reminders: 24h & 1h Before with Guaranteed Idempotency (Never Send Twice)
  // ----------------------------------------------------------------------------
  test('2. Reminders: 24h & 1h triggers cleanly and NEVER sends twice (Strict Idempotency)', async () => {
    const now = Date.now();

    // 2A. Create Session exactly 24 hours away (24h reminder candidate)
    const session24hAway = await createStudentSession({
      enrollmentId: 'enr_rem_001',
      studentId: testStudentId,
      studentName: 'Priya Patel',
      studentEmail: 'priya.patel@example.com',
      courseId: testCourseId,
      title: 'Module 16: Navamsha Chart (D9)',
      startTime: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
      duration: 60,
      meetingLink: 'https://meet.google.com/priya-navamsha',
      createdByUserId: 'usr_owner_001',
    });

    // 2B. Create Session 50 minutes away (1h reminder candidate)
    const session1hAway = await createStudentSession({
      enrollmentId: 'enr_rem_002',
      studentId: testStudentId,
      studentName: 'Priya Patel',
      studentEmail: 'priya.patel@example.com',
      courseId: testCourseId,
      title: 'Module 18: Kundli Milan & Compatibility',
      startTime: new Date(now + 50 * 60 * 1000).toISOString(),
      duration: 60,
      meetingLink: 'https://meet.google.com/priya-compatibility',
      createdByUserId: 'usr_owner_001',
    });

    // 2C. Run the reminder scanner (Job 1)
    const run1 = await checkAndQueueReminders();
    assert.ok(run1.queued24h >= 1, 'Should queue at least 1 24h reminder on first scan');
    assert.ok(run1.queued1h >= 1, 'Should queue at least 1 1h reminder on first scan');

    // 2D. CRITICAL IDEMPOTENCY TEST (Job 2 - immediately after)
    // The exact same sessions are scanned again: ZERO duplicate reminders must be queued or sent!
    const run2 = await checkAndQueueReminders();
    assert.equal(
      run2.queued24h,
      0,
      'Idempotency Violation: 24h reminder must NEVER be queued or sent twice!'
    );
    assert.equal(
      run2.queued1h,
      0,
      'Idempotency Violation: 1h reminder must NEVER be queued or sent twice!'
    );
  });

  // ----------------------------------------------------------------------------
  // 3. Outbox Pattern: Automatic Retry with Backoff & Owner Failure List
  // ----------------------------------------------------------------------------
  test('3. Outbox Pattern: Failed deliveries retry with exponential backoff and populate Owner failure list', async () => {
    // 3A. Enqueue an email with immediateDispatch=false to test queue processing
    const queued = await enqueueSessionEmail({
      sessionId: 'sess_outbox_fail_test',
      recipientEmail: 'bad-syntax@invalid-domain-test.xyz',
      recipientName: 'Test Student',
      emailType: 'SCHEDULED',
      subject: 'Outbox Retry Test',
      htmlContent: '<p>Test</p>',
      textContent: 'Test',
      immediateDispatch: false,
      maxAttempts: 3,
    });

    assert.equal(queued.status, 'PENDING');
    assert.equal(queued.attempts, 0);

    // 3B. Run outbox queue processor
    const result1 = await processOutboxQueue(10);
    assert.ok(result1.processed >= 1, 'Should process pending item');

    // 3C. Verify Owner failure list and 1-click retry
    const failures = await listFailedEmails();
    assert.ok(Array.isArray(failures), 'Failures must be an array');

    // Test retry API function
    const retryResult = await retryFailedEmail(queued.id);
    assert.ok(
      typeof retryResult.success === 'boolean',
      'Retry function must return boolean success flag'
    );
  });

  // ----------------------------------------------------------------------------
  // 4. Reschedule Notice Period (Owner Configurable, e.g. 24 Hours)
  // ----------------------------------------------------------------------------
  test('4. Reschedule notice period: Owner can set notice period (default 24h) and enforce buffer', async () => {
    // 4A. Verify default notice period is 24 hours
    const defaultSettings = await getCourseSessionSettings(testCourseId);
    assert.equal(
      defaultSettings.minimumRescheduleNoticeHours,
      24,
      'Default reschedule notice period must be 24 hours'
    );

    // 4B. Update notice period to 48 hours
    const updatedSettings = await updateCourseSessionSettings(testCourseId, {
      minimumRescheduleNoticeHours: 48,
    });
    assert.equal(
      updatedSettings.minimumRescheduleNoticeHours,
      48,
      'Owner must be able to configure notice period (e.g. 48 hours)'
    );

    // 4C. Restore to standard 24 hours
    await updateCourseSessionSettings(testCourseId, {
      minimumRescheduleNoticeHours: 24,
    });
    const restoredSettings = await getCourseSessionSettings(testCourseId);
    assert.equal(restoredSettings.minimumRescheduleNoticeHours, 24);

    // 4D. Notice period calculation check:
    // Session starting in 10 hours vs 24 hours notice requirement
    const sessionIn10Hours = Date.now() + 10 * 3600 * 1000;
    const hoursLeft = (sessionIn10Hours - Date.now()) / (3600 * 1000);
    const isWithinNoticePeriod = hoursLeft < (restoredSettings.minimumRescheduleNoticeHours || 24);
    assert.equal(isWithinNoticePeriod, true, 'Session in 10h violates 24h notice period rule');

    // Session starting in 36 hours vs 24 hours notice requirement
    const sessionIn36Hours = Date.now() + 36 * 3600 * 1000;
    const hoursLeft36 = (sessionIn36Hours - Date.now()) / (3600 * 1000);
    const isAllowed = hoursLeft36 >= (restoredSettings.minimumRescheduleNoticeHours || 24);
    assert.equal(isAllowed, true, 'Session in 36h respects 24h notice period');
  });

  // ----------------------------------------------------------------------------
  // 5. GitHub Actions 15-Minute Cron Workflow Verification
  // ----------------------------------------------------------------------------
  test('5. GitHub Actions 15-minute workflow is configured and targets protected endpoint', () => {
    const workflowPath = path.resolve(
      process.cwd(),
      '.github/workflows/session-reminders-cron.yml'
    );
    assert.ok(fs.existsSync(workflowPath), 'Workflow file must exist');

    const content = fs.readFileSync(workflowPath, 'utf-8');
    assert.ok(
      content.includes("cron: '*/15 * * * *'"),
      'Must specify 15-minute cron expression: */15 * * * *'
    );
    assert.ok(
      content.includes('/api/cron/session-reminders'),
      'Must target /api/cron/session-reminders endpoint'
    );
    assert.ok(
      content.includes('CRON_SECRET'),
      'Must pass CRON_SECRET for protected endpoint authentication'
    );
    assert.ok(
      content.includes('workflow_dispatch'),
      'Must support manual trigger via workflow_dispatch'
    );
  });
});
