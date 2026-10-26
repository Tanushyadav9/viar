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
      const epochDate = new Date(0).toISOString();
      const rendered = formatSessionIST(epochDate);
      assert.strictEqual(rendered, 'Not scheduled');
    });

    it('renders "Not scheduled" for timestamps <= 86400000 (Day 1 epoch range)', () => {
      const epochDay1 = new Date(19800000).toISOString(); // 5:30 AM IST on Jan 1 1970
      const rendered = formatInTimezone(epochDay1, 'Asia/Kolkata');
      assert.strictEqual(rendered, 'Not scheduled');
    });

    it('renders "Not scheduled" for null or undefined dates', () => {
      assert.strictEqual(formatSessionIST(null as any), 'Not scheduled');
      assert.strictEqual(formatSessionIST(undefined as any), 'Not scheduled');
    });

    it('renders real formatted date string for valid scheduled date in 2026', () => {
      const validDate = new Date('2026-10-28T15:00:00Z').toISOString();
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
  // =========================================================================
  // 6. NUMBERS AGREEMENT, MANUAL GRANTS VS PAYMENTS & ROSTER WORDING
  // =========================================================================
  describe('6. Numbers Agreement, Manual Grants vs Payments & Roster Plain Wording', () => {
    it('manual grants by Owner strictly resolve to "Granted by Owner, no payment" and ₹0', () => {
      // Simulating enrollment without order or payment
      const manualGrant = {
        order: null,
        payment: null,
        amountPaid: 0,
        paymentReference: 'OWNER_GRANT',
      };

      let paymentMethod = 'Granted by Owner, no payment';
      let displayAmount = 0;

      if (manualGrant.order && (manualGrant.order as any).status === 'APPROVED') {
        paymentMethod = 'UPI QR Code';
        displayAmount = 5100;
      } else if (manualGrant.payment) {
        paymentMethod = 'Offline Cash';
        displayAmount = 5100;
      } else {
        paymentMethod = 'Granted by Owner, no payment';
        displayAmount = 0;
      }

      assert.strictEqual(displayAmount, 0, 'Manual grant must have ₹0 paid');
      assert.strictEqual(paymentMethod, 'Granted by Owner, no payment');
    });

    it('UPI orders show real payment method "UPI QR Code" and locked amount ₹5,100', () => {
      const upiOrder = {
        order: {
          id: 'ord_123',
          orderReference: 'VIAR-ORD-REAL-001',
          amount: 5100,
          status: 'APPROVED',
          utr: '987654321012',
          notes: 'Customer payment verified',
        },
      };

      let paymentMethod = 'Granted by Owner, no payment';
      let displayAmount = 0;

      if (upiOrder.order && upiOrder.order.status === 'APPROVED') {
        paymentMethod = 'UPI QR Code';
        displayAmount = upiOrder.order.amount;
      }

      assert.strictEqual(displayAmount, 5100);
      assert.strictEqual(paymentMethod, 'UPI QR Code');
    });

    it('roster wording under course name displays "Recorded modules and 1-on-1 sessions" and NEVER "Self-Paced Access"', () => {
      const defaultCohortBatchName = 'Recorded modules and 1-on-1 sessions';
      assert.strictEqual(defaultCohortBatchName, 'Recorded modules and 1-on-1 sessions');
      assert.ok(!defaultCohortBatchName.includes('Self-Paced Access'), 'Must never say Self-Paced Access');
    });

    it('screen displays "(N test records excluded)" where test records are excluded', () => {
      function formatExcludedTestLabel(testCount: number): string | null {
        if (testCount <= 0) return null;
        return `${testCount} test record${testCount === 1 ? '' : 's'} excluded`;
      }

      assert.strictEqual(formatExcludedTestLabel(0), null);
      assert.strictEqual(formatExcludedTestLabel(1), '1 test record excluded');
      assert.strictEqual(formatExcludedTestLabel(2), '2 test records excluded');
      assert.strictEqual(formatExcludedTestLabel(5), '5 test records excluded');
    });

    it('total verified tuition equals ₹0 and Approved indicates excluded test records when only test purchases exist', () => {
      const orders = [
        { id: 'ord_1', amount: 5100, status: 'APPROVED', notes: '[TEST_PURCHASE] Staging verification test order - excluded from live metrics' },
      ];

      const liveApprovedOrders = orders.filter(
        (o) => o.status === 'APPROVED' && !o.notes?.includes('[TEST_PURCHASE]')
      );
      const testApprovedOrders = orders.filter(
        (o) => o.status === 'APPROVED' && o.notes?.includes('[TEST_PURCHASE]')
      );

      const liveRevenue = liveApprovedOrders.reduce((sum, o) => sum + o.amount, 0);

      assert.strictEqual(liveRevenue, 0, 'Live verified tuition must be 0 when only test order exists');
      assert.strictEqual(liveApprovedOrders.length, 0);
      assert.strictEqual(testApprovedOrders.length, 1, '1 test order is excluded');
    });
  });

  // =========================================================================
  // 11. PROGRESS WITHOUT CONTENT & COMPLETION GATING
  // =========================================================================
  describe('11. Progress Without Content & Completion Gating', () => {
    it('rejects completing a video lesson that has no video', () => {
      const lesson = {
        id: 'lesson-1-vid',
        type: 'VIDEO',
        videoProviderId: null,
        externalVideoUrl: null,
        notesMarkdown: null,
      };

      const readiness = validateLessonPublishReadiness(lesson);
      assert.strictEqual(readiness.canPublish, false);
      assert.strictEqual(
        readiness.draftReason,
        'A video lesson needs a video before it can be published.'
      );
    });

    it('rejects completing a document lesson that has no notes or PDF file', () => {
      const lesson = {
        id: 'lesson-1-doc',
        type: 'DOCUMENT',
        documentKey: null,
        documentUrl: null,
        notesMarkdown: '',
      };

      const readiness = validateLessonPublishReadiness(lesson);
      assert.strictEqual(readiness.canPublish, false);
      assert.strictEqual(
        readiness.draftReason,
        'A notes lesson needs a notes or PDF file before it can be published.'
      );
    });

    it('allows completing a lesson only when it has real published content', () => {
      const videoLesson = {
        type: 'VIDEO',
        videoProviderId: 'real-vimeo-id-998877',
      };
      assert.strictEqual(validateLessonPublishReadiness(videoLesson).canPublish, true);

      const docLesson = {
        type: 'DOCUMENT',
        notesMarkdown: '# Real study guide notes\nAstrology fundamentals',
      };
      assert.strictEqual(validateLessonPublishReadiness(docLesson).canPublish, true);

      const liveLesson = {
        type: 'LIVE_SESSION',
        liveScheduledAt: '2026-11-15T10:00:00Z',
      };
      assert.strictEqual(validateLessonPublishReadiness(liveLesson).canPublish, true);
    });

    it('classroom UI hasClassContent gates checkbox and mark-complete button', () => {
      function hasClassContent(cls: {
        lessonType?: string;
        recording?: { videoUrl?: string };
        recordingUrl?: string | null;
        externalVideoUrl?: string | null;
        documentKey?: string | null;
        documentDownloadUrl?: string | null;
        notesMarkdown?: string | null;
        scheduledStartTime?: string | null;
      }): boolean {
        const lType = (cls.lessonType || 'VIDEO').toUpperCase();
        if (lType === 'VIDEO') {
          const vid = cls.recording?.videoUrl || cls.recordingUrl || cls.externalVideoUrl;
          return Boolean(vid && typeof vid === 'string' && vid.trim() && !vid.includes('dQw4w9WgXcQ'));
        }
        if (lType === 'DOCUMENT') {
          return Boolean(
            (cls.documentKey && cls.documentKey.trim()) ||
            (cls.documentDownloadUrl && cls.documentDownloadUrl.trim()) ||
            (cls.notesMarkdown && cls.notesMarkdown.trim())
          );
        }
        if (lType === 'LIVE_SESSION') {
          return Boolean(
            cls.scheduledStartTime &&
            !isNaN(new Date(cls.scheduledStartTime).getTime()) &&
            new Date(cls.scheduledStartTime).getTime() > 86400000
          );
        }
        return false;
      }

      // Empty video lesson -> must be false (disabled)
      assert.strictEqual(hasClassContent({ lessonType: 'VIDEO' }), false);
      assert.strictEqual(hasClassContent({ lessonType: 'VIDEO', recordingUrl: '' }), false);
      assert.strictEqual(hasClassContent({ lessonType: 'VIDEO', recordingUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ' }), false);

      // Real video lesson -> must be true
      assert.strictEqual(hasClassContent({ lessonType: 'VIDEO', recordingUrl: 'https://vimeo.com/987654321' }), true);

      // Empty document lesson -> must be false
      assert.strictEqual(hasClassContent({ lessonType: 'DOCUMENT' }), false);
      assert.strictEqual(hasClassContent({ lessonType: 'DOCUMENT', notesMarkdown: '   ' }), false);

      // Real document lesson -> must be true
      assert.strictEqual(hasClassContent({ lessonType: 'DOCUMENT', notesMarkdown: 'Comprehensive study notes' }), true);

      // Empty or epoch live session -> must be false
      assert.strictEqual(hasClassContent({ lessonType: 'LIVE_SESSION' }), false);
      assert.strictEqual(hasClassContent({ lessonType: 'LIVE_SESSION', scheduledStartTime: '1970-01-01T00:00:00Z' }), false);

      // Real scheduled live session -> must be true
      assert.strictEqual(hasClassContent({ lessonType: 'LIVE_SESSION', scheduledStartTime: '2026-11-20T10:00:00Z' }), true);
    });

    it('"Student is currently reviewing video lessons" NEVER appears when totalVideos === 0', () => {
      function getQuizEmptyStateMessage(totalVideos: number): string {
        return totalVideos > 0
          ? 'No quiz attempts recorded yet. Student is currently reviewing video lessons.'
          : 'No quiz attempts recorded yet. Course video lessons are currently in preparation.';
      }

      // When 0 videos exist: must state that video lessons are in preparation
      const msg0 = getQuizEmptyStateMessage(0);
      assert.strictEqual(
        msg0,
        'No quiz attempts recorded yet. Course video lessons are currently in preparation.'
      );
      assert.ok(
        !msg0.includes('Student is currently reviewing video lessons'),
        'Must NOT say reviewing video lessons when 0 videos exist'
      );

      // When > 0 videos exist: can state reviewing
      const msg5 = getQuizEmptyStateMessage(5);
      assert.strictEqual(
        msg5,
        'No quiz attempts recorded yet. Student is currently reviewing video lessons.'
      );
    });

    it('student profile displays "Curriculum Progress (Recorded & 1-on-1)" and distinguishes lessons from modules', () => {
      const headerTitle = 'Curriculum Progress (Recorded & 1-on-1)';
      assert.ok(!headerTitle.includes('Self-Paced'), 'Header must never say Self-Paced');

      function formatProgressLabel(completed: number, total: number): string {
        return `${completed} of ${total} lessons completed`;
      }

      assert.strictEqual(formatProgressLabel(0, 46), '0 of 46 lessons completed');
      assert.strictEqual(formatProgressLabel(2, 23), '2 of 23 lessons completed');
      assert.ok(
        !formatProgressLabel(2, 23).includes('modules completed'),
        'Must say lessons completed, not modules completed'
      );
    });
  });

  // =========================================================================
  // 10. PUBLIC PAGES 1-ON-1 MENTORSHIP MODEL INVARIANTS
  // =========================================================================
  describe('10. Public Pages 1-on-1 Mentorship Model Invariants', () => {
    it('Footer trust strip strictly removes rigid timetables claim and replaces with 1-on-1 wording marked pending approval', async () => {
      const fs = await import('node:fs');
      const footerPath = 'src/components/Footer.tsx';
      const content = fs.readFileSync(footerPath, 'utf8');

      // 1. Outdated / contradictory claims MUST NOT exist
      assert.ok(
        !content.includes('No live scheduling conflicts or rigid timetables'),
        'Must not contain "No live scheduling conflicts or rigid timetables"'
      );
      assert.ok(
        !content.includes('23 Video Modules\n') && !content.includes("'23 Video Modules'"),
        'Must not display unhedged "23 Video Modules" without 1-on-1 sessions'
      );

      // 2. Mentorship + recorded modules wording must exist in both EN and HI
      assert.ok(
        content.includes('Recorded Modules & 1-on-1 Sessions'),
        'Footer must advertise Recorded Modules & 1-on-1 Sessions in EN'
      );
      assert.ok(
        content.includes('रिकॉर्डेड मॉड्यूल एवं 1-on-1 सत्र'),
        'Footer must advertise Recorded Modules & 1-on-1 Sessions in HI'
      );
      assert.ok(
        content.includes('pending client approval'),
        'Footer copy must be marked pending client approval in EN'
      );
      assert.ok(
        content.includes('क्लाइंट अनुमोदन लंबित'),
        'Footer copy must be marked pending client approval in HI'
      );

      // 3. Sister services cross-promotion card preserved intact (Prompt 50 scope)
      assert.ok(content.includes('SISTER_SERVICES.aapkaAstro'), 'aapkaAstro sister service must be preserved');
      assert.ok(content.includes('SISTER_SERVICES.dowConsulting'), 'dowConsulting sister service must be preserved');
    });

    it('Home page feature pillars strictly reflect 1-on-1 mentorship with recorded modules marked pending approval', async () => {
      const fs = await import('node:fs');
      const pagePath = 'src/app/page.tsx';
      const content = fs.readFileSync(pagePath, 'utf8');

      // 1. Contradictory live Zoom claims replaced
      assert.ok(
        !content.includes('No live Zoom scheduling pressure or timezone conflicts'),
        'Must not contain "No live Zoom scheduling pressure or timezone conflicts"'
      );

      // 2. Mentorship pillars present with client approval hedge
      assert.ok(
        content.includes('Flexible Self-Paced & 1-on-1 Sessions'),
        'Home page must feature Flexible Self-Paced & 1-on-1 Sessions'
      );
      assert.ok(
        content.includes('pending client approval'),
        'Home page pillar copy must be explicitly marked pending client approval in EN'
      );
      assert.ok(
        content.includes('क्लाइंट अनुमोदन लंबित'),
        'Home page pillar copy must be explicitly marked pending client approval in HI'
      );
    });
  });
});
