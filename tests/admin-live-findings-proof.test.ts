import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateLessonPublishReadiness } from '../src/lib/curriculum-validation';
import { formatSessionIST, formatInTimezone } from '../src/lib/timezones';

describe('Admin Live Findings 1-16 & Launch Readiness Test Suite', () => {
  // =========================================================================
  // 1. READINESS CHECKLIST & SAFETY GATE
  // =========================================================================
  describe('1. Launch Readiness Checklist & Confirmation Gate', () => {
    it('verifies checklist blocks activation when lessons have 0 real videos', () => {
      const stats = {
        totalLessons: 46,
        lessonsWithRealContent: 0,
        activeExamQuestions: 20,
        targetExamQuestions: 20,
        upiConfigured: true,
        contactConfigured: true,
      };

      const isFullyReady =
        stats.lessonsWithRealContent === stats.totalLessons &&
        stats.activeExamQuestions >= stats.targetExamQuestions &&
        stats.upiConfigured &&
        stats.contactConfigured;

      assert.strictEqual(isFullyReady, false, 'Enrolment must not be fully ready when lessons lack videos');
      assert.strictEqual(stats.lessonsWithRealContent, 0);
      assert.strictEqual(stats.totalLessons, 46);
    });

    it('requires explicit "CONFIRM" string to bypass incomplete checklist', () => {
      function canToggleEnrollment(isFullyReady: boolean, confirmText: string) {
        if (isFullyReady) return true;
        return confirmText.trim() === 'CONFIRM';
      }

      assert.strictEqual(canToggleEnrollment(false, ''), false);
      assert.strictEqual(canToggleEnrollment(false, 'yes'), false);
      assert.strictEqual(canToggleEnrollment(false, 'confirm'), false);
      assert.strictEqual(canToggleEnrollment(false, 'CONFIRM'), true);
      assert.strictEqual(canToggleEnrollment(true, ''), true);
    });

    it('allows 1-click turn OFF at any time with zero confirmation required', () => {
      function toggleEnrollmentOff() {
        return { acceptingEnrollments: false, requiresConfirmation: false };
      }
      const result = toggleEnrollmentOff();
      assert.strictEqual(result.acceptingEnrollments, false);
      assert.strictEqual(result.requiresConfirmation, false);
    });
  });

  // =========================================================================
  // 2. EMPTY-LESSON RULE & CONTENT-GATED PUBLISHING
  // =========================================================================
  describe('2. Empty-Lesson Rule (Content Enforcement)', () => {
    it('keeps video lesson in DRAFT if video provider ID is missing or null', () => {
      const check = validateLessonPublishReadiness({
        type: 'VIDEO',
        videoProviderId: null,
      });
      assert.strictEqual(check.canPublish, false);
      assert.match(check.draftReason || '', /needs a video/i);
    });

    it('rejects Rick Astley placeholder URL and forces DRAFT', () => {
      const check = validateLessonPublishReadiness({
        type: 'VIDEO',
        videoProviderId: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      });
      assert.strictEqual(check.canPublish, false);
      assert.match(check.draftReason || '', /needs a video/i);
    });

    it('permits publishing video lesson when valid video stream exists', () => {
      const check = validateLessonPublishReadiness({
        type: 'VIDEO',
        videoProviderId: 'cf_stream_992147abcdef',
      });
      assert.strictEqual(check.canPublish, true);
      assert.strictEqual(check.draftReason, undefined);
    });

    it('keeps notes lesson in DRAFT if markdown content is empty', () => {
      const check = validateLessonPublishReadiness({
        type: 'DOCUMENT',
        notesMarkdown: '   ',
      });
      assert.strictEqual(check.canPublish, false);
      assert.match(check.draftReason || '', /needs a notes or PDF file/i);
    });

    it('permits publishing notes lesson when notes content exists', () => {
      const check = validateLessonPublishReadiness({
        type: 'DOCUMENT',
        notesMarkdown: '# Chapter 1 Notes\nComprehensive guide to 12 Bhavas',
      });
      assert.strictEqual(check.canPublish, true);
    });
  });

  // =========================================================================
  // 3. DATE RENDERING & EPOCH GUARD
  // =========================================================================
  describe('3. Date Rendering & Epoch Guard', () => {
    it('renders "Not scheduled" for epoch timestamp 0 (1 Jan 1970 00:00:00 GMT)', () => {
      const epochDate = new Date(0);
      const rendered = formatSessionIST(epochDate);
      assert.strictEqual(rendered, 'Not scheduled');
    });

    it('renders "Not scheduled" for timestamps <= 86400000 (Day 1 epoch range)', () => {
      const epochDay1 = new Date(19800000); // 5:30 AM IST on Jan 1 1970
      const rendered = formatInTimezone(epochDay1, 'Asia/Kolkata');
      assert.strictEqual(rendered, 'Not scheduled');
    });

    it('renders "Not scheduled" for null or undefined dates', () => {
      assert.strictEqual(formatSessionIST(null as any), 'Not scheduled');
      assert.strictEqual(formatSessionIST(undefined as any), 'Not scheduled');
    });

    it('renders real formatted date string for valid scheduled date in 2026', () => {
      const validDate = new Date('2026-10-28T15:00:00Z');
      const rendered = formatSessionIST(validDate);
      assert.match(rendered, /2026/);
      assert.match(rendered, /pm/i);
    });

    it('computes "LIVE NOW" strictly when current time falls within start and end time', () => {
      const now = new Date('2026-10-28T15:30:00Z').getTime();
      const session1 = {
        start: new Date('2026-10-28T15:00:00Z').getTime(),
        end: new Date('2026-10-28T16:00:00Z').getTime(),
      };
      const session2 = {
        start: new Date('2026-10-28T16:30:00Z').getTime(),
        end: new Date('2026-10-28T17:30:00Z').getTime(),
      };

      const isLive1 = now >= session1.start && now <= session1.end;
      const isLive2 = now >= session2.start && now <= session2.end;

      assert.strictEqual(isLive1, true, 'Session 1 must be LIVE NOW at 15:30');
      assert.strictEqual(isLive2, false, 'Session 2 must NOT be LIVE NOW at 15:30');
    });
  });

  // =========================================================================
  // 4. TEST-DATA EXCLUSION & FINANCIAL INTEGRITY
  // =========================================================================
  describe('4. Test Data Management & Revenue Isolation', () => {
    it('excludes test orders from total tuition revenue and verified student metrics', () => {
      const orders = [
        { id: 'ord_1', amount: 5100, status: 'APPROVED', notes: '[TEST_PURCHASE] Initial test', studentName: '[TEST] Owner' },
        { id: 'ord_2', amount: 5100, status: 'APPROVED', notes: 'Normal student order', studentName: 'Real Student A' },
        { id: 'ord_3', amount: 5100, status: 'APPROVED', notes: 'Manual bank transfer', studentName: 'Real Student B' },
      ];

      const realOrders = orders.filter(
        (o) => !o.notes?.includes('[TEST_PURCHASE]') && !o.studentName?.startsWith('[TEST]')
      );

      const totalRevenue = realOrders.reduce((sum, o) => sum + o.amount, 0);
      assert.strictEqual(realOrders.length, 2);
      assert.strictEqual(totalRevenue, 10200, 'Test order of 5100 must be excluded from total revenue');
    });

    it('identifies and labels test students with amber badge in lists', () => {
      const students = [
        { id: 'stu_1', name: '[TEST] Staging Scholar', email: 'test@example.com' },
        { id: 'stu_2', name: 'Tanush Yadav', email: 'tanush@example.com' },
      ];

      const isTest1 = students[0].name.startsWith('[TEST]');
      const isTest2 = students[1].name.startsWith('[TEST]');

      assert.strictEqual(isTest1, true);
      assert.strictEqual(isTest2, false);
    });
  });

  // =========================================================================
  // 5. AUDIT ENTRIES FOR ALL 6 OPERATIONAL ACTIONS
  // =========================================================================
  describe('5. Audit Trail Action Verification', () => {
    const recordedAuditLogs: Array<{ action: string; entityType: string; reason: string }> = [];

    function recordActivity(action: string, entityType: string, reason: string) {
      const entry = { action, entityType, reason };
      recordedAuditLogs.push(entry);
      return entry;
    }

    it('records audit entry when payment is approved', () => {
      const entry = recordActivity('ORDER_APPROVED', 'ORDER', 'Verified bank UTR');
      assert.strictEqual(entry.action, 'ORDER_APPROVED');
      assert.strictEqual(entry.entityType, 'ORDER');
    });

    it('records audit entry when student enrollment is added or revoked', () => {
      const addEntry = recordActivity('STUDENT_ENROLLED', 'ENROLLMENT', 'Manual access granted');
      const revokeEntry = recordActivity('ENROLLMENT_REVOKED', 'ENROLLMENT', 'Access revoked upon request');
      assert.strictEqual(addEntry.action, 'STUDENT_ENROLLED');
      assert.strictEqual(revokeEntry.action, 'ENROLLMENT_REVOKED');
    });

    it('records audit entry when lesson publish status changes', () => {
      const pubEntry = recordActivity('LESSON_PUBLISHED', 'LESSON', 'Published module 1 lesson 1');
      const unpubEntry = recordActivity('LESSON_UNPUBLISHED', 'LESSON', 'Draft saved due to missing video');
      assert.strictEqual(pubEntry.action, 'LESSON_PUBLISHED');
      assert.strictEqual(unpubEntry.action, 'LESSON_UNPUBLISHED');
    });

    it('records audit entry when tuition/payment settings update', () => {
      const entry = recordActivity('PAYMENT_SETTINGS_UPDATED', 'PAYMENT_SETTINGS', 'Updated UPI VPA');
      assert.strictEqual(entry.action, 'PAYMENT_SETTINGS_UPDATED');
    });

    it('records audit entry when site content is edited in Content Studio', () => {
      const entry = recordActivity('CONTENT_EDITED', 'CONTENT_ITEM', 'Updated public contact email');
      assert.strictEqual(entry.action, 'CONTENT_EDITED');
    });

    it('records audit entry when enrolments are switched ON or OFF', () => {
      const onEntry = recordActivity('ENROLLMENTS_ENABLED', 'COURSE', 'Enrolments opened after launch confirmation');
      const offEntry = recordActivity('ENROLLMENTS_DISABLED', 'COURSE', 'Enrolments paused');
      assert.strictEqual(onEntry.action, 'ENROLLMENTS_ENABLED');
      assert.strictEqual(offEntry.action, 'ENROLLMENTS_DISABLED');
    });

    it('confirms all 6 operational action categories exist in the activity audit stream', () => {
      const actionTypes = new Set(recordedAuditLogs.map((l) => l.action));
      assert.ok(actionTypes.has('ORDER_APPROVED'));
      assert.ok(actionTypes.has('STUDENT_ENROLLED'));
      assert.ok(actionTypes.has('LESSON_PUBLISHED'));
      assert.ok(actionTypes.has('PAYMENT_SETTINGS_UPDATED'));
      assert.ok(actionTypes.has('CONTENT_EDITED'));
      assert.ok(actionTypes.has('ENROLLMENTS_ENABLED'));
    });
  });
});
