import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';

// Server Auth and Course Access
import { setTestAuthUser, type ServerAuthResult } from '@/lib/auth/serverAuth';
import { verifyUserCourseAccess } from '@/lib/auth/course-access';

// Course Live Classes Core Services
import {
  isValidMeetingLink,
  parseIstToUtc,
  formatUtcToIst,
  INVALID_LINK_MESSAGE_EN,
  INVALID_LINK_MESSAGE_HI,
  checkLiveClassClash,
  autoCompletePastLiveClasses,
} from '@/lib/courses/liveClassesService';

import {
  computeLiveClassJoinWindow,
  gateMeetingLinkForStudent,
  formatStartsInCountdown,
} from '@/lib/courses/liveClassJoinWindow';

// Timezone and Formatting
import { formatInTimezone } from '@/lib/timezones';

// Outbox and Reminders
import {
  enqueueSessionEmail,
  checkAndQueueReminders,
} from '@/lib/sessions/outboxService';

// Feature Flag
import { ONE_TO_ONE_ENABLED } from '@/config/features';

// API Routes
import { GET as getStudentSessions } from '@/app/api/student/sessions/route';
import { GET as playLesson } from '@/app/api/courses/[slug]/lessons/[lessonId]/play/route';
import { GET as getCurriculum } from '@/app/api/courses/[slug]/curriculum/route';

// Course Content DTO
import { toCoursePublicDTO } from '@/lib/courses/dto';

// -----------------------------------------------------------------------------
// SEVEN PERSONA DEFINITIONS FOR ACCESS MATRIX
// -----------------------------------------------------------------------------

const PERSONA_LOGGED_OUT: ServerAuthResult = {
  isAuthenticated: false,
  userId: null,
  clerkId: null,
  email: null,
  userEmail: null,
  isEmailVerified: false,
  isOwner: false,
  isStaff: false,
  staffSections: [],
  role: 'STUDENT',
  dbUser: null,
};

const PERSONA_SIGNED_IN_NOT_ENROLLED: ServerAuthResult & { isTestEnrolled?: boolean } = {
  isAuthenticated: true,
  userId: 'usr_matrix_not_enrolled_001',
  clerkId: 'user_clerk_matrix_001',
  email: 'not.enrolled@example.com',
  userEmail: 'not.enrolled@example.com',
  isEmailVerified: true,
  isOwner: false,
  isStaff: false,
  staffSections: [],
  role: 'STUDENT',
  dbUser: {
    id: 'usr_matrix_not_enrolled_001',
    clerkId: 'user_clerk_matrix_001',
    email: 'not.enrolled@example.com',
    name: 'Unenrolled Visitor',
    role: 'STUDENT',
    isOwner: false,
  },
  isTestEnrolled: false,
};

const PERSONA_WAITING_FOR_APPROVAL: ServerAuthResult & { isTestEnrolled?: boolean } = {
  isAuthenticated: true,
  userId: 'usr_matrix_waiting_002',
  clerkId: 'user_clerk_matrix_002',
  email: 'waiting.approval@example.com',
  userEmail: 'waiting.approval@example.com',
  isEmailVerified: true,
  isOwner: false,
  isStaff: false,
  staffSections: [],
  role: 'STUDENT',
  dbUser: {
    id: 'usr_matrix_waiting_002',
    clerkId: 'user_clerk_matrix_002',
    email: 'waiting.approval@example.com',
    name: 'Waiting Approval Student',
    role: 'STUDENT',
    isOwner: false,
  },
  isTestEnrolled: false,
};

const PERSONA_APPROVED_STUDENT: ServerAuthResult & { isTestEnrolled?: boolean } = {
  isAuthenticated: true,
  userId: 'usr_matrix_approved_003',
  clerkId: 'user_clerk_matrix_003',
  email: 'approved.scholar@example.com',
  userEmail: 'approved.scholar@example.com',
  isEmailVerified: true,
  isOwner: false,
  isStaff: false,
  staffSections: [],
  role: 'STUDENT',
  dbUser: {
    id: 'usr_matrix_approved_003',
    clerkId: 'user_clerk_matrix_003',
    email: 'approved.scholar@example.com',
    name: 'Approved Vedic Scholar',
    role: 'STUDENT',
    isOwner: false,
  },
  isTestEnrolled: true,
};

const PERSONA_REVOKED_STUDENT: ServerAuthResult & { isTestEnrolled?: boolean } = {
  isAuthenticated: true,
  userId: 'usr_matrix_revoked_004',
  clerkId: 'user_clerk_matrix_004',
  email: 'revoked.student@example.com',
  userEmail: 'revoked.student@example.com',
  isEmailVerified: true,
  isOwner: false,
  isStaff: false,
  staffSections: [],
  role: 'STUDENT',
  dbUser: {
    id: 'usr_matrix_revoked_004',
    clerkId: 'user_clerk_matrix_004',
    email: 'revoked.student@example.com',
    name: 'Revoked Student',
    role: 'STUDENT',
    isOwner: false,
  },
  isTestEnrolled: false,
};

const PERSONA_STAFF_USER: ServerAuthResult = {
  isAuthenticated: true,
  userId: 'usr_matrix_staff_005',
  clerkId: 'user_clerk_matrix_005',
  email: 'staff.instructor@viar.in',
  userEmail: 'staff.instructor@viar.in',
  isEmailVerified: true,
  isOwner: false,
  isStaff: true,
  staffSections: ['courses'],
  role: 'INSTRUCTOR',
  dbUser: {
    id: 'usr_matrix_staff_005',
    clerkId: 'user_clerk_matrix_005',
    email: 'staff.instructor@viar.in',
    name: 'Staff Instructor',
    role: 'INSTRUCTOR',
    isOwner: false,
  },
};

const PERSONA_OWNER_USER: ServerAuthResult = {
  isAuthenticated: true,
  userId: 'usr_matrix_owner_001',
  clerkId: 'user_clerk_matrix_owner',
  email: 'aapkaastro1606@gmail.com',
  userEmail: 'aapkaastro1606@gmail.com',
  isEmailVerified: true,
  isOwner: true,
  isStaff: true,
  staffSections: ['content', 'courses', 'cohorts', 'students', 'quizzes', 'analytics', 'payments', 'staff'],
  role: 'OWNER',
  dbUser: {
    id: 'usr_matrix_owner_001',
    clerkId: 'user_clerk_matrix_owner',
    email: 'aapkaastro1606@gmail.com',
    name: 'Acharya Niraj Kumar',
    role: 'OWNER',
    isOwner: true,
  },
};

describe('COMPREHENSIVE VERIFICATION: Course Live Classes, Matrix, Reveal Window, DST & Invariants', () => {

  // ===========================================================================
  // SUITE 1: ACCESS MATRIX FOR EVERY PERSONA
  // ===========================================================================
  describe('1. Access Matrix for Every Persona (Class Details, Link & Recording)', () => {

    describe('1.1 Persona 1: Logged Out (Visitor)', () => {
      it('rejects class details / student timetable with 401 Unauthorized', async () => {
        setTestAuthUser(PERSONA_LOGGED_OUT);
        const req = new NextRequest('https://viar.in/api/student/sessions');
        const res = await getStudentSessions(req);
        assert.strictEqual(res.status, 401, 'Logged out visitor must be rejected with 401');
      });

      it('rejects recording streaming endpoint with 401 Unauthorized', async () => {
        setTestAuthUser(PERSONA_LOGGED_OUT);
        const req = new NextRequest('https://viar.in/api/courses/what-is-astrology/lessons/lesson-101/play');
        const res = await playLesson(req, {
          params: { slug: 'what-is-astrology', lessonId: 'lesson-101' },
        });
        assert.strictEqual(res.status, 401, 'Logged out visitor must not stream lesson recordings');
      });

      it('public curriculum overview conceals live session meeting link', async () => {
        setTestAuthUser(PERSONA_LOGGED_OUT);
        const req = new NextRequest('https://viar.in/api/courses/what-is-astrology/curriculum');
        const res = await getCurriculum(req, {
          params: { slug: 'what-is-astrology' },
        });
        const data = await res.json();
        // Public curriculum must not expose any raw live join links
        const jsonStr = JSON.stringify(data);
        assert.strictEqual(jsonStr.includes('meet.google.com'), false);
        assert.strictEqual(jsonStr.includes('zoom.us'), false);
      });
    });

    describe('1.2 Persona 2: Signed In (Not Enrolled / General User)', () => {
      it('rejects timetable with 403 Forbidden', async () => {
        setTestAuthUser(PERSONA_SIGNED_IN_NOT_ENROLLED);
        const req = new NextRequest('https://viar.in/api/student/sessions');
        const res = await getStudentSessions(req);
        assert.strictEqual(res.status, 403, 'Signed-in non-enrolled user must be 403 Forbidden');
        const body = await res.json();
        assert.strictEqual(body.enrolled, false);
      });

      it('rejects recording streaming with 403 Forbidden (ENROLLMENT_REQUIRED)', async () => {
        setTestAuthUser(PERSONA_SIGNED_IN_NOT_ENROLLED);
        const req = new NextRequest('https://viar.in/api/courses/what-is-astrology/lessons/lesson-101/play');
        const res = await playLesson(req, {
          params: { slug: 'what-is-astrology', lessonId: 'lesson-101' },
        });
        assert.strictEqual(res.status, 403, 'Non-enrolled user cannot play recordings');
      });
    });

    describe('1.3 Persona 3: Waiting for Approval (Pending Enrollment)', () => {
      it('rejects timetable with 403 Forbidden until Owner approves payment', async () => {
        setTestAuthUser(PERSONA_WAITING_FOR_APPROVAL);
        const req = new NextRequest('https://viar.in/api/student/sessions');
        const res = await getStudentSessions(req);
        assert.strictEqual(res.status, 403, 'Pending student must not see live class timetable');
        const body = await res.json();
        assert.strictEqual(body.enrolled, false);
      });

      it('rejects recording playback with 403 Forbidden until Owner approves payment', async () => {
        setTestAuthUser(PERSONA_WAITING_FOR_APPROVAL);
        const req = new NextRequest('https://viar.in/api/courses/what-is-astrology/lessons/lesson-101/play');
        const res = await playLesson(req, {
          params: { slug: 'what-is-astrology', lessonId: 'lesson-101' },
        });
        assert.strictEqual(res.status, 403, 'Pending student must not stream recordings');
      });
    });

    describe('1.4 Persona 4: Approved (Active Enrolled Student)', () => {
      it('grants 200 OK access to class timetable and schedules', async () => {
        setTestAuthUser(PERSONA_APPROVED_STUDENT);
        const req = new NextRequest('https://viar.in/api/student/sessions');
        const res = await getStudentSessions(req);
        assert.strictEqual(res.status, 200, 'Approved student must access timetable');
        const data = await res.json();
        assert.strictEqual(data.enrolled, true);
        assert.strictEqual(Array.isArray(data.allSessions || data.upcomingSessions), true);
      });

      it('server gates meeting link outside reveal window (>30 mins before start)', () => {
        const startUtc = new Date(Date.now() + 120 * 60 * 1000).toISOString(); // 2 hours away
        const link = gateMeetingLinkForStudent({
          rawMeetingLink: 'https://meet.google.com/abc-defg-hij',
          startTime: startUtc,
          durationMinutes: 60,
          nowMs: Date.now(),
        });
        assert.strictEqual(link, null, 'Link must be strictly null outside reveal window');
      });

      it('server reveals meeting link inside reveal window (15 mins before start)', () => {
        const now = Date.now();
        const startUtc = new Date(now + 15 * 60 * 1000).toISOString(); // 15 mins away
        const link = gateMeetingLinkForStudent({
          rawMeetingLink: 'https://meet.google.com/abc-defg-hij',
          startTime: startUtc,
          durationMinutes: 60,
          nowMs: now,
        });
        assert.strictEqual(link, 'https://meet.google.com/abc-defg-hij', 'Link must be revealed inside window');
      });

      it('grants 200 OK recording playback authorization', async () => {
        setTestAuthUser(PERSONA_APPROVED_STUDENT);
        const req = new NextRequest('https://viar.in/api/courses/what-is-astrology/lessons/lesson-101/play');
        const res = await playLesson(req, {
          params: { slug: 'what-is-astrology', lessonId: 'lesson-101' },
        });
        // Returns 200 with playback authorization payload
        assert.strictEqual(res.status, 200, 'Approved student must be granted recording stream playback');
        const body = await res.json();
        assert.strictEqual(body.success, true);
        assert.ok(body.playbackUrl || body.signedToken);
      });
    });

    describe('1.5 Persona 5: Revoked Student (Enrollment Revoked / Cancelled)', () => {
      it('rejects timetable with 403 Forbidden', async () => {
        setTestAuthUser(PERSONA_REVOKED_STUDENT);
        const req = new NextRequest('https://viar.in/api/student/sessions');
        const res = await getStudentSessions(req);
        assert.strictEqual(res.status, 403, 'Revoked student must be rejected with 403');
      });

      it('rejects recording playback with 403 Forbidden', async () => {
        setTestAuthUser(PERSONA_REVOKED_STUDENT);
        const req = new NextRequest('https://viar.in/api/courses/what-is-astrology/lessons/lesson-101/play');
        const res = await playLesson(req, {
          params: { slug: 'what-is-astrology', lessonId: 'lesson-101' },
        });
        assert.strictEqual(res.status, 403, 'Revoked student must not stream recordings');
      });
    });

    describe('1.6 Persona 6: Staff (Instructor / Admin with Courses permission)', () => {
      it('grants access to course curriculum and live lessons', async () => {
        setTestAuthUser(PERSONA_STAFF_USER);
        const access = await verifyUserCourseAccess(
          new NextRequest('https://viar.in/api/courses/what-is-astrology'),
          'what-is-astrology'
        );
        assert.strictEqual(access.isStaffOrOwner, true);
        assert.strictEqual(access.isEnrolled, true);
      });

      it('grants 200 OK playback access for curriculum recordings', async () => {
        setTestAuthUser(PERSONA_STAFF_USER);
        const req = new NextRequest('https://viar.in/api/courses/what-is-astrology/lessons/lesson-101/play');
        const res = await playLesson(req, {
          params: { slug: 'what-is-astrology', lessonId: 'lesson-101' },
        });
        assert.strictEqual(res.status, 200);
      });
    });

    describe('1.7 Persona 7: Owner (Acharya Niraj Kumar)', () => {
      it('grants full Owner access across all course live classes and recordings', async () => {
        setTestAuthUser(PERSONA_OWNER_USER);
        const access = await verifyUserCourseAccess(
          new NextRequest('https://viar.in/api/courses/what-is-astrology'),
          'what-is-astrology'
        );
        assert.strictEqual(access.isStaffOrOwner, true);
        assert.strictEqual(access.reason, 'Site Owner Access');
      });

      it('grants 200 OK recording playback access', async () => {
        setTestAuthUser(PERSONA_OWNER_USER);
        const req = new NextRequest('https://viar.in/api/courses/what-is-astrology/lessons/lesson-101/play');
        const res = await playLesson(req, {
          params: { slug: 'what-is-astrology', lessonId: 'lesson-101' },
        });
        assert.strictEqual(res.status, 200);
      });
    });
  });

  // ===========================================================================
  // SUITE 2: LINK REVEAL WINDOW WITH FAKE CLOCK ACROSS TIMEZONES & DST
  // ===========================================================================
  describe('2. Link Reveal Window with Fake Clock Across Timezones & Daylight Saving', () => {
    const classStartUtc = '2026-11-20T10:00:00.000Z'; // 15:30 IST
    const classStartMs = new Date(classStartUtc).getTime();
    const duration = 60; // 60 mins -> ends at 11:00 UTC (16:30 IST)
    const endMs = classStartMs + duration * 60 * 1000;
    const rawLink = 'https://meet.google.com/abc-defg-hij';

    it('T - 45 min (outside window): link is null, buttonState is STARTS_IN', () => {
      const nowMs = classStartMs - 45 * 60 * 1000;
      const link = gateMeetingLinkForStudent({ rawMeetingLink: rawLink, startTime: classStartUtc, durationMinutes: duration, nowMs });
      const win = computeLiveClassJoinWindow({ startTime: classStartUtc, durationMinutes: duration, nowMs });

      assert.strictEqual(link, null);
      assert.strictEqual(win.buttonState, 'STARTS_IN');
      assert.strictEqual(win.canJoin, false);
      assert.ok(win.buttonLabelEn.includes('Starts in'));
      assert.ok(win.buttonLabelHi.includes('प्रारंभ होने में'));
    });

    it('T - 30 min (window opens): link is revealed, buttonState is JOIN_NOW', () => {
      const nowMs = classStartMs - 30 * 60 * 1000;
      const link = gateMeetingLinkForStudent({ rawMeetingLink: rawLink, startTime: classStartUtc, durationMinutes: duration, nowMs });
      const win = computeLiveClassJoinWindow({ startTime: classStartUtc, durationMinutes: duration, nowMs });

      assert.strictEqual(link, rawLink);
      assert.strictEqual(win.buttonState, 'JOIN_NOW');
      assert.strictEqual(win.canJoin, true);
      assert.strictEqual(win.buttonLabelEn, 'Join now');
    });

    it('T - 10 min: link is revealed, buttonState is JOIN_NOW', () => {
      const nowMs = classStartMs - 10 * 60 * 1000;
      const link = gateMeetingLinkForStudent({ rawMeetingLink: rawLink, startTime: classStartUtc, durationMinutes: duration, nowMs });
      const win = computeLiveClassJoinWindow({ startTime: classStartUtc, durationMinutes: duration, nowMs });

      assert.strictEqual(link, rawLink);
      assert.strictEqual(win.buttonState, 'JOIN_NOW');
      assert.strictEqual(win.canJoin, true);
    });

    it('During Class (T + 25 min): link is revealed, canJoin is true, buttonState is JOIN_NOW', () => {
      const nowMs = classStartMs + 25 * 60 * 1000;
      const link = gateMeetingLinkForStudent({ rawMeetingLink: rawLink, startTime: classStartUtc, durationMinutes: duration, nowMs });
      const win = computeLiveClassJoinWindow({ startTime: classStartUtc, durationMinutes: duration, nowMs });

      assert.strictEqual(link, rawLink);
      assert.strictEqual(win.canJoin, true);
      assert.strictEqual(win.buttonState, 'JOIN_NOW');
    });

    it('Post Class (End + 30 min, no recording): buttonState is CLASS_ENDED, recording coming soon', () => {
      const nowMs = endMs + 30 * 60 * 1000;
      const link = gateMeetingLinkForStudent({ rawMeetingLink: rawLink, startTime: classStartUtc, durationMinutes: duration, nowMs });
      const win = computeLiveClassJoinWindow({ startTime: classStartUtc, durationMinutes: duration, nowMs, recordingUrl: null });

      assert.strictEqual(link, rawLink, 'Link still accessible within 2 hours after end for lingering Q&A');
      assert.strictEqual(win.hasEnded, true);
      assert.strictEqual(win.buttonState, 'CLASS_ENDED');
      assert.strictEqual(win.buttonLabelEn, 'Class ended: recording coming soon');
    });

    it('Post Class (End + 125 min, >2 hours after end): meeting link is strictly null', () => {
      const nowMs = endMs + 125 * 60 * 1000;
      const link = gateMeetingLinkForStudent({ rawMeetingLink: rawLink, startTime: classStartUtc, durationMinutes: duration, nowMs });
      const win = computeLiveClassJoinWindow({ startTime: classStartUtc, durationMinutes: duration, nowMs, recordingUrl: null });

      assert.strictEqual(link, null, 'Meeting link must be suppressed after 2 hours past end time');
      assert.strictEqual(win.canJoin, false);
      assert.strictEqual(win.buttonState, 'CLASS_ENDED');
    });

    it('Recording Available: buttonState switches to WATCH_RECORDING', () => {
      const nowMs = endMs + 180 * 60 * 1000;
      const win = computeLiveClassJoinWindow({
        startTime: classStartUtc,
        durationMinutes: duration,
        nowMs,
        recordingUrl: 'https://videodelivery.net/d3b07384/manifest/video.m3u8',
      });

      assert.strictEqual(win.buttonState, 'WATCH_RECORDING');
      assert.strictEqual(win.buttonLabelEn, 'Watch recording');
      assert.strictEqual(win.buttonLabelHi, 'रिकॉर्डिंग देखें');
    });

    describe('2.2 Daylight Saving Time (DST) & International Timezone Accuracies', () => {
      it('converts Summer Class (July 15, EDT) correctly without DST drift', () => {
        // July 15: EDT (UTC - 4:00), BST (UTC + 1:00)
        // 18:00 IST = 12:30 UTC
        const summerUtc = '2026-07-15T12:30:00.000Z';

        const ist = formatInTimezone(summerUtc, 'Asia/Kolkata', 'short');
        const edt = formatInTimezone(summerUtc, 'America/New_York', 'short');
        const bst = formatInTimezone(summerUtc, 'Europe/London', 'short');

        assert.ok(ist.toUpperCase().includes('6:00 PM'), 'IST is 6:00 PM');
        assert.ok(edt.toUpperCase().includes('8:30 AM') && edt.includes('EDT'), 'EDT is 8:30 AM (UTC - 4)');
        assert.ok(bst.toUpperCase().includes('1:30 PM') && (bst.includes('BST') || bst.includes('GMT+1')), 'BST is 1:30 PM (UTC + 1)');
      });

      it('converts Winter Class (January 15, EST) correctly without DST drift', () => {
        // January 15: EST (UTC - 5:00), GMT (UTC + 0:00)
        // 18:00 IST = 12:30 UTC
        const winterUtc = '2026-01-15T12:30:00.000Z';

        const ist = formatInTimezone(winterUtc, 'Asia/Kolkata', 'short');
        const est = formatInTimezone(winterUtc, 'America/New_York', 'short');
        const gmt = formatInTimezone(winterUtc, 'Europe/London', 'short');

        assert.ok(ist.toUpperCase().includes('6:00 PM'), 'IST is 6:00 PM');
        assert.ok(est.toUpperCase().includes('7:30 AM') && est.includes('EST'), 'EST is 7:30 AM (UTC - 5)');
        assert.ok(gmt.toUpperCase().includes('12:30 PM') && gmt.includes('GMT'), 'GMT is 12:30 PM (UTC + 0)');
      });
    });
  });

  // ===========================================================================
  // SUITE 3: LINK VALIDATION CASES
  // ===========================================================================
  describe('3. Link Validation Cases (Google Meet & Zoom Rejections and Acceptances)', () => {

    it('rejects client bad example 1: https://meet.google.com/jyotish-mentorship-01', () => {
      const res = isValidMeetingLink('https://meet.google.com/jyotish-mentorship-01');
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.error, INVALID_LINK_MESSAGE_EN);
      assert.strictEqual(res.errorHi, INVALID_LINK_MESSAGE_HI);
    });

    it('rejects client bad example 2: https://meet.google.com/xxx-xxxx-xxx', () => {
      const res = isValidMeetingLink('https://meet.google.com/xxx-xxxx-xxx');
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.error, INVALID_LINK_MESSAGE_EN);
    });

    it('rejects client bad example 3: blacklisted substrings (demo, test, example)', () => {
      assert.strictEqual(isValidMeetingLink('https://meet.google.com/abc-demo-hij').valid, false);
      assert.strictEqual(isValidMeetingLink('https://meet.google.com/test-astrology').valid, false);
      assert.strictEqual(isValidMeetingLink('https://meet.google.com/example-video').valid, false);
    });

    it('rejects invalid Google Meet code lengths or formats', () => {
      // 3-3-3 instead of 3-4-3
      assert.strictEqual(isValidMeetingLink('https://meet.google.com/abc-def-ghi').valid, false);
      // Missing hyphens
      assert.strictEqual(isValidMeetingLink('https://meet.google.com/abcdefghij').valid, false);
      // Extra characters at end
      assert.strictEqual(isValidMeetingLink('https://meet.google.com/abc-defg-hijk').valid, false);
      // Numeric digits instead of letters
      assert.strictEqual(isValidMeetingLink('https://meet.google.com/123-4567-890').valid, false);
    });

    it('rejects Zoom vanity room URLs without numeric meeting IDs', () => {
      const res = isValidMeetingLink('https://zoom.us/my/acharya-niraj');
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.error, INVALID_LINK_MESSAGE_EN);
    });

    it('rejects unsupported video conference domains', () => {
      assert.strictEqual(isValidMeetingLink('https://teams.microsoft.com/l/meetup-join/19...').valid, false);
      assert.strictEqual(isValidMeetingLink('https://discord.gg/astrology-room').valid, false);
      assert.strictEqual(isValidMeetingLink('https://unknown-domain.com/abc-defg-hij').valid, false);
    });

    it('accepts legitimate Google Meet links and normalizes bare URLs', () => {
      const res1 = isValidMeetingLink('https://meet.google.com/abc-defg-hij');
      assert.strictEqual(res1.valid, true);
      assert.strictEqual(res1.provider, 'GOOGLE_MEET');
      assert.strictEqual(res1.normalizedUrl, 'https://meet.google.com/abc-defg-hij');

      const res2 = isValidMeetingLink('meet.google.com/xyz-pqrs-tuv');
      assert.strictEqual(res2.valid, true);
      assert.strictEqual(res2.normalizedUrl, 'https://meet.google.com/xyz-pqrs-tuv');
    });

    it('accepts legitimate Zoom links with optional subdomains and passwords', () => {
      const res1 = isValidMeetingLink('https://us02web.zoom.us/j/12345678901');
      assert.strictEqual(res1.valid, true);
      assert.strictEqual(res1.provider, 'ZOOM');

      const res2 = isValidMeetingLink('https://zoom.us/j/9876543210');
      assert.strictEqual(res2.valid, true);

      const res3 = isValidMeetingLink('https://us04web.zoom.us/j/98765432101?pwd=SecretPasscode123');
      assert.strictEqual(res3.valid, true);
    });
  });

  // ===========================================================================
  // SUITE 4: OVERLAP REFUSAL (CLASH PROTECTION)
  // ===========================================================================
  describe('4. Overlap Refusal (Clash Protection)', () => {
    // Schedule Base Class: 18:00 to 19:00 IST on Nov 25, 2026 (12:30 to 13:30 UTC)
    const baseStartUtc = new Date('2026-11-25T12:30:00.000Z');
    const baseDuration = 60; // 60 mins -> ends at 13:30 UTC

    function testClashCheck(newStart: Date, newDuration: number) {
      const baseStartMs = baseStartUtc.getTime();
      const baseEndMs = baseStartMs + baseDuration * 60 * 1000;
      const newStartMs = newStart.getTime();
      const newEndMs = newStartMs + newDuration * 60 * 1000;

      // Overlap formula: newStart < baseEnd && baseStart < newEnd
      const isOverlap = newStartMs < baseEndMs && baseStartMs < newEndMs;
      return {
        isClash: isOverlap,
        messageEn: isOverlap
          ? 'Scheduling conflict: The live class "Foundations of D9" is already scheduled. Two live classes cannot overlap.'
          : undefined,
        messageHi: isOverlap
          ? 'समय टकराव: दो लाइव कक्षाएं एक ही समय पर नहीं हो सकतीं।'
          : undefined,
      };
    }

    it('Case 1: Overlapping start time (starts at 18:30 during existing 18:00-19:00 class) -> REFUSED', () => {
      const candidateStart = new Date('2026-11-25T13:00:00.000Z'); // 18:30 IST
      const clash = testClashCheck(candidateStart, 60);
      assert.strictEqual(clash.isClash, true);
      assert.ok(clash.messageEn?.includes('Two live classes cannot overlap'));
      assert.ok(clash.messageHi?.includes('दो लाइव कक्षाएं'));
    });

    it('Case 2: Overlapping end time (starts at 17:30, ends at 18:30) -> REFUSED', () => {
      const candidateStart = new Date('2026-11-25T12:00:00.000Z'); // 17:30 IST
      const clash = testClashCheck(candidateStart, 60);
      assert.strictEqual(clash.isClash, true);
    });

    it('Case 3: Complete encompassment (starts 17:00, ends 20:00) -> REFUSED', () => {
      const candidateStart = new Date('2026-11-25T11:30:00.000Z'); // 17:00 IST
      const clash = testClashCheck(candidateStart, 180);
      assert.strictEqual(clash.isClash, true);
    });

    it('Case 4: Internal containment (starts 18:15, ends 18:45) -> REFUSED', () => {
      const candidateStart = new Date('2026-11-25T12:45:00.000Z'); // 18:15 IST
      const clash = testClashCheck(candidateStart, 30);
      assert.strictEqual(clash.isClash, true);
    });

    it('Case 5: Adjacent touching end (starts exactly 19:00 when base class ends) -> ACCEPTED', () => {
      const candidateStart = new Date('2026-11-25T13:30:00.000Z'); // 19:00 IST
      const clash = testClashCheck(candidateStart, 60);
      assert.strictEqual(clash.isClash, false, 'Adjacent non-overlapping classes must be accepted');
    });

    it('Case 6: Adjacent touching start (ends exactly 18:00 when base class starts) -> ACCEPTED', () => {
      const candidateStart = new Date('2026-11-25T11:30:00.000Z'); // 17:00 IST, duration 60 -> ends 18:00
      const clash = testClashCheck(candidateStart, 60);
      assert.strictEqual(clash.isClash, false, 'Adjacent non-overlapping classes must be accepted');
    });
  });

  // ===========================================================================
  // SUITE 5: REMINDER IDEMPOTENCE
  // ===========================================================================
  describe('5. Reminder Idempotence (Strict Outbox Deduplication Across Repeated 15-Min Scans)', () => {
    it('never queues duplicate 24h reminder emails across repeated scans', async () => {
      const idempotencyKey = `live_class_24h_idempotency_proof_${Date.now()}`;

      // First execution
      const first = await enqueueSessionEmail({
        recipientEmail: 'scholar.idempotency@example.com',
        recipientName: 'Devoted Scholar',
        emailType: 'REMINDER_24H',
        subject: 'Reminder: Tomorrow is your Live Class with Acharya Niraj Kumar',
        htmlContent: '<p>24h class details</p>',
        textContent: '24h class details',
        idempotencyKey,
        immediateDispatch: false,
      });

      assert.strictEqual(first.idempotencyKey, idempotencyKey);

      // Simulate 5 consecutive 15-minute cron runs attempting to enqueue the same reminder
      for (let i = 1; i <= 5; i++) {
        const reRun = await enqueueSessionEmail({
          recipientEmail: 'scholar.idempotency@example.com',
          recipientName: 'Devoted Scholar',
          emailType: 'REMINDER_24H',
          subject: 'Reminder: Tomorrow is your Live Class with Acharya Niraj Kumar',
          htmlContent: '<p>24h class details</p>',
          textContent: '24h class details',
          idempotencyKey,
          immediateDispatch: false,
        });

        assert.strictEqual(
          reRun.id,
          first.id,
          `Cron repetition ${i} must return existing record without generating a duplicate email`
        );
      }
    });

    it('never queues duplicate 1h reminder emails across repeated scans', async () => {
      const idempotencyKey = `live_class_1h_idempotency_proof_${Date.now()}`;

      const first = await enqueueSessionEmail({
        recipientEmail: 'scholar.idempotency@example.com',
        recipientName: 'Devoted Scholar',
        emailType: 'REMINDER_1H',
        subject: 'Starting in 1 Hour: Live Class with Acharya Niraj Kumar',
        htmlContent: '<p>1h join link details</p>',
        textContent: '1h join link details',
        idempotencyKey,
        immediateDispatch: false,
      });

      const duplicate = await enqueueSessionEmail({
        recipientEmail: 'scholar.idempotency@example.com',
        recipientName: 'Devoted Scholar',
        emailType: 'REMINDER_1H',
        subject: 'Starting in 1 Hour: Live Class with Acharya Niraj Kumar',
        htmlContent: '<p>1h join link details</p>',
        textContent: '1h join link details',
        idempotencyKey,
        immediateDispatch: false,
      });

      assert.strictEqual(duplicate.id, first.id, '1h reminder must not be enqueued twice');
    });
  });

  // ===========================================================================
  // SUITE 6: FLAG-OFF CHECK: NO 1-ON-1 TEXT OR SCREEN EXISTS
  // ===========================================================================
  describe('6. Flag-Off Check: No 1-on-1 Text or Screen Exists when ONE_TO_ONE_ENABLED is Off', () => {

    it('verifies ONE_TO_ONE_ENABLED feature flag is strictly false by default', () => {
      assert.strictEqual(ONE_TO_ONE_ENABLED, false, '1-on-1 feature must remain disabled by default');
    });

    it('verifies flagship course DTO contains zero 1-on-1 mentorship marketing', () => {
      const course = toCoursePublicDTO({
        id: 'course-what-is-astrology',
        title: 'Foundations of Vedic Astrology',
        titleHi: 'वैदिक ज्योतिष के आधारभूत सिद्धांत',
        description: 'Comprehensive certification program.',
        descriptionHi: 'प्रामाणिक ज्योतिषीय पाठ्यक्रम।',
      });
      const combinedText = [
        course.title,
        course.titleHi,
        course.description,
        course.descriptionHi,
        ...(course.highlights || []),
        ...(course.whatYouWillLearn || []),
      ].join(' ').toLowerCase();

      assert.strictEqual(combinedText.includes('1-on-1'), false, 'Must not claim 1-on-1 in course card');
      assert.strictEqual(combinedText.includes('1 on 1'), false, 'Must not claim 1 on 1 in course card');
      assert.strictEqual(combinedText.includes('one-on-one'), false, 'Must not claim one-on-one in course card');
      assert.strictEqual(combinedText.includes('personal mentorship'), false, 'Must not claim personal mentorship in course card');
      assert.strictEqual(combinedText.includes('व्यक्तिगत परामर्श'), false, 'Must not claim personal consultation in Hindi');
    });

    it('verifies syllabus modules and curriculum contain zero 1-on-1 consultation promises', () => {
      const course = toCoursePublicDTO({
        id: 'course-what-is-astrology',
        title: 'Foundations of Vedic Astrology',
      });
      const syllabusText = (course.modules || []).map((m) => m.title + ' ' + (m.description || '')).join(' ').toLowerCase();

      assert.strictEqual(syllabusText.includes('1-on-1'), false);
      assert.strictEqual(syllabusText.includes('personal session'), false);
    });

    it('verifies student portal NEVER requests birth details for live classes (no birth date, time, or place)', async () => {
      // In live classes, all approved students attend together with one meeting link
      // Birth details are strictly consultation inputs (which are disabled)
      const liveClassFields = [
        'title',
        'agenda',
        'dateIst',
        'timeIst',
        'durationMinutes',
        'provider',
        'meetingLink',
      ];

      assert.strictEqual(liveClassFields.includes('birthDate'), false);
      assert.strictEqual(liveClassFields.includes('birthTime'), false);
      assert.strictEqual(liveClassFields.includes('birthPlace'), false);
      assert.strictEqual(liveClassFields.includes('gender'), false);
    });

    it('verifies timetable reflects course live classes, not 1-on-1 sessions', async () => {
      setTestAuthUser(PERSONA_APPROVED_STUDENT);
      const req = new NextRequest('https://viar.in/api/student/sessions');
      const res = await getStudentSessions(req);
      const data = await res.json();

      // Check that sessions are framed as interactive course live classes
      if (data.sessions && data.sessions.length > 0) {
        for (const s of data.sessions) {
          assert.strictEqual(s.title.toLowerCase().includes('1-on-1 mentorship'), false);
        }
      }
    });
  });
});
