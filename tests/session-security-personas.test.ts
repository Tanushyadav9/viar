import { test, describe, before, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';

import { setTestAuthUser, type ServerAuthResult } from '../src/lib/auth/serverAuth.ts';
import {
  createStudentSession,
  createSessionRequest,
  getCourseSessionSettings,
} from '../src/lib/sessions/oneOnOneService.ts';
import { getCalendarFeedToken } from '../src/lib/sessions/calendarFeed.ts';

// Route Handlers
import { GET as getStudentSessions } from '../src/app/api/student/sessions/route.ts';
import { GET as getStudentSessionByIdRoute } from '../src/app/api/student/sessions/[id]/route.ts';
import { GET as getStudentSessionIcs } from '../src/app/api/student/sessions/[id]/calendar.ics/route.ts';
import { POST as postStudentSessionRequest } from '../src/app/api/student/sessions/request/route.ts';

import {
  GET as getAdminSessions,
  POST as postAdminSessions,
  PATCH as patchAdminSessions,
  DELETE as deleteAdminSessions,
} from '../src/app/api/admin/sessions/route.ts';
import { GET as getAdminRequests } from '../src/app/api/admin/sessions/requests/route.ts';
import { POST as postAdminRequestAction } from '../src/app/api/admin/sessions/requests/[id]/action/route.ts';
import {
  GET as getAdminSettings,
  POST as postAdminSettings,
} from '../src/app/api/admin/sessions/settings/route.ts';
import {
  GET as getAdminCalendarFeed,
  POST as postAdminCalendarFeed,
} from '../src/app/api/admin/sessions/calendar-feed/route.ts';
import { GET as getAdminCalendarIcs } from '../src/app/api/admin/sessions/calendar.ics/route.ts';
import { GET as getAdminOutboxFailures } from '../src/app/api/admin/sessions/outbox/failures/route.ts';
import { POST as postAdminOutboxRetry } from '../src/app/api/admin/sessions/outbox/failures/retry/route.ts';

// ----------------------------------------------------------------------------
// PERSONA DEFINITIONS
// ----------------------------------------------------------------------------

const PERSONA_VISITOR: ServerAuthResult = {
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

const PERSONA_UNENROLLED_STUDENT: ServerAuthResult & { isTestEnrolled?: boolean } = {
  isAuthenticated: true,
  userId: 'usr_stud_unenrolled_999',
  clerkId: 'user_clerk_unenrolled',
  email: 'unenrolled.visitor@example.com',
  userEmail: 'unenrolled.visitor@example.com',
  isEmailVerified: true,
  isOwner: false,
  isStaff: false,
  staffSections: [],
  role: 'STUDENT',
  dbUser: {
    id: 'usr_stud_unenrolled_999',
    clerkId: 'user_clerk_unenrolled',
    email: 'unenrolled.visitor@example.com',
    name: 'Unenrolled Scholar',
    role: 'STUDENT',
    isOwner: false,
  },
  isTestEnrolled: false,
};

const PERSONA_STUDENT_A: ServerAuthResult & { isTestEnrolled?: boolean } = {
  isAuthenticated: true,
  userId: 'usr_stud_a_alice',
  clerkId: 'user_clerk_alice',
  email: 'alice.sharma@example.com',
  userEmail: 'alice.sharma@example.com',
  isEmailVerified: true,
  isOwner: false,
  isStaff: false,
  staffSections: [],
  role: 'STUDENT',
  dbUser: {
    id: 'usr_stud_a_alice',
    clerkId: 'user_clerk_alice',
    email: 'alice.sharma@example.com',
    name: 'Alice Sharma',
    role: 'STUDENT',
    isOwner: false,
  },
  isTestEnrolled: true,
};

const PERSONA_STUDENT_B: ServerAuthResult & { isTestEnrolled?: boolean } = {
  isAuthenticated: true,
  userId: 'usr_stud_b_bob',
  clerkId: 'user_clerk_bob',
  email: 'bob.verma@example.com',
  userEmail: 'bob.verma@example.com',
  isEmailVerified: true,
  isOwner: false,
  isStaff: false,
  staffSections: [],
  role: 'STUDENT',
  dbUser: {
    id: 'usr_stud_b_bob',
    clerkId: 'user_clerk_bob',
    email: 'bob.verma@example.com',
    name: 'Bob Verma',
    role: 'STUDENT',
    isOwner: false,
  },
  isTestEnrolled: true,
};

const PERSONA_STAFF_NO_SESSIONS: ServerAuthResult = {
  isAuthenticated: true,
  userId: 'usr_staff_generic',
  clerkId: 'user_clerk_staff_generic',
  email: 'staff.generic@example.com',
  userEmail: 'staff.generic@example.com',
  isEmailVerified: true,
  isOwner: false,
  isStaff: true,
  staffSections: ['courses', 'students'], // NO 'sessions' permission
  role: 'ADMIN',
  dbUser: {
    id: 'usr_staff_generic',
    clerkId: 'user_clerk_staff_generic',
    email: 'staff.generic@example.com',
    name: 'Staff Generic',
    role: 'ADMIN',
    isOwner: false,
  },
};

const PERSONA_STAFF_WITH_SESSIONS: ServerAuthResult = {
  isAuthenticated: true,
  userId: 'usr_staff_sessions_lead',
  clerkId: 'user_clerk_staff_sessions_lead',
  email: 'staff.sessions@example.com',
  userEmail: 'staff.sessions@example.com',
  isEmailVerified: true,
  isOwner: false,
  isStaff: true,
  staffSections: ['sessions', 'courses'], // Explicit 'sessions' permission granted
  role: 'ADMIN',
  dbUser: {
    id: 'usr_staff_sessions_lead',
    clerkId: 'user_clerk_staff_sessions_lead',
    email: 'staff.sessions@example.com',
    name: 'Staff Sessions Lead',
    role: 'ADMIN',
    isOwner: false,
  },
};

const PERSONA_OWNER: ServerAuthResult = {
  isAuthenticated: true,
  userId: 'usr_owner_001',
  clerkId: 'user_clerk_owner',
  email: 'aapkaastro1606@gmail.com',
  userEmail: 'aapkaastro1606@gmail.com',
  isEmailVerified: true,
  isOwner: true,
  isStaff: true,
  staffSections: [
    'content',
    'media',
    'courses',
    'cohorts',
    'sessions',
    'students',
    'quizzes',
    'analytics',
    'payments',
    'staff',
  ],
  role: 'OWNER',
  dbUser: {
    id: 'usr_owner_001',
    clerkId: 'user_clerk_owner',
    email: 'aapkaastro1606@gmail.com',
    name: 'Acharya Niraj Kumar',
    role: 'OWNER',
    isOwner: true,
  },
};

describe('SAFETY: Session Endpoints Server Authorization & ID Isolation', () => {
  const courseId = 'course-what-is-astrology';
  const meetingLinkAlice = 'https://meet.google.com/ali-ce1-live-secret';
  const meetingLinkBob = 'https://meet.google.com/bob-222-live-secret';

  let sessionAliceId: string;
  let sessionBobId: string;
  let sampleRequestId: string;

  before(async () => {
    // Seed Alice's session
    const aliceSess = await createStudentSession({
      enrollmentId: 'enr_alice_sec_001',
      studentId: PERSONA_STUDENT_A.userId!,
      studentName: 'Alice Sharma',
      studentEmail: PERSONA_STUDENT_A.email!,
      courseId,
      title: 'Alice 1-on-1 Horoscope Breakdown',
      startTime: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(), // 48h from now
      duration: 60,
      meetingLink: meetingLinkAlice,
      meetingPlatform: 'GOOGLE_MEET',
      privateNotes: 'CONFIDENTIAL OWNER NOTE: Alice has debilitated Saturn in 10th.',
      sharedNotes: 'Read Chapter 3 on Saturn remedial mantras.',
      homework: 'Prepare D1 planetary degrees table.',
      createdByUserId: PERSONA_OWNER.userId!,
    });
    sessionAliceId = aliceSess.id;

    // Seed Bob's session
    const bobSess = await createStudentSession({
      enrollmentId: 'enr_bob_sec_002',
      studentId: PERSONA_STUDENT_B.userId!,
      studentName: 'Bob Verma',
      studentEmail: PERSONA_STUDENT_B.email!,
      courseId,
      title: 'Bob 1-on-1 Kundli Match',
      startTime: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(), // 72h from now
      duration: 60,
      meetingLink: meetingLinkBob,
      meetingPlatform: 'GOOGLE_MEET',
      privateNotes: 'CONFIDENTIAL OWNER NOTE: Bob needs guidance on 7th house.',
      sharedNotes: 'Review Navamsha marriage parameters.',
      createdByUserId: PERSONA_OWNER.userId!,
    });
    sessionBobId = bobSess.id;

    // Seed a sample request
    const req = await createSessionRequest({
      enrollmentId: 'enr_alice_sec_001',
      studentId: PERSONA_STUDENT_A.userId!,
      courseId,
      requestType: 'INITIAL',
      message: 'Requesting weekend consultation',
      preferredWindows: [
        {
          startUtc: new Date(Date.now() + 1000 * 60 * 60 * 96).toISOString(),
          endUtc: new Date(Date.now() + 1000 * 60 * 60 * 97).toISOString(),
        },
      ],
    });
    sampleRequestId = req.id;
  });

  afterEach(() => {
    setTestAuthUser(null);
  });

  // ==========================================================================
  // SUITE 1: STUDENT SESSIONS ACCESS & ID ISOLATION
  // ==========================================================================
  describe('1. Student Sessions Access & Strict ID Isolation', () => {
    test('1.1 GET /api/student/sessions: Visitor rejected with 401 Unauthorized', async () => {
      setTestAuthUser(PERSONA_VISITOR);
      const req = new NextRequest('https://viar.in/api/student/sessions');
      const res = await getStudentSessions(req);
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.enrolled, false);
    });

    test('1.2 GET /api/student/sessions: Unenrolled student rejected with 403 Forbidden', async () => {
      setTestAuthUser(PERSONA_UNENROLLED_STUDENT);
      const req = new NextRequest('https://viar.in/api/student/sessions');
      const res = await getStudentSessions(req);
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.enrolled, false);
    });

    test('1.3 GET /api/student/sessions: Student A sees ONLY their own session; Bob session is never included; privateNotes stripped', async () => {
      setTestAuthUser(PERSONA_STUDENT_A);
      const req = new NextRequest('https://viar.in/api/student/sessions');
      const res = await getStudentSessions(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.enrolled, true);

      // Verify Alice session is present
      const aliceFound = json.allSessions.find((s: { id: string }) => s.id === sessionAliceId);
      assert.ok(aliceFound, "Alice's session must be returned to Alice");
      assert.equal(aliceFound.meetingLink, meetingLinkAlice);

      // Verify private notes are strictly absent
      assert.equal((aliceFound as Record<string, unknown>).privateNotes, undefined);
      const rawText = JSON.stringify(json);
      assert.ok(!rawText.includes('CONFIDENTIAL OWNER NOTE'), 'Zero private notes leaked in student response');

      // Verify Bob's session is strictly ABSENT
      const bobFound = json.allSessions.find((s: { id: string }) => s.id === sessionBobId);
      assert.equal(bobFound, undefined, "Bob's session must NEVER be in Alice's response");
      assert.ok(!rawText.includes(meetingLinkBob), "Bob's meeting link is never returned to Alice");
    });

    test('1.4 GET /api/student/sessions/[id]: Student A reads own session successfully with meeting link', async () => {
      setTestAuthUser(PERSONA_STUDENT_A);
      const req = new NextRequest(`https://viar.in/api/student/sessions/${sessionAliceId}`);
      const res = await getStudentSessionByIdRoute(req, { params: { id: sessionAliceId } });
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.session.id, sessionAliceId);
      assert.equal(json.session.meetingLink, meetingLinkAlice);
      assert.equal(json.session.privateNotes, undefined);
    });

    test('1.5 GET /api/student/sessions/[id]: ATTEMPT TO READ ANOTHER STUDENT SESSION BY ID returns 403 Forbidden and NEVER leaks meeting link', async () => {
      // Bob attempts to fetch Alice's session by ID
      setTestAuthUser(PERSONA_STUDENT_B);
      const req = new NextRequest(`https://viar.in/api/student/sessions/${sessionAliceId}`);
      const res = await getStudentSessionByIdRoute(req, { params: { id: sessionAliceId } });

      assert.equal(res.status, 403, "Reading another student's session by ID must be 403 Forbidden");
      const text = await res.text();
      assert.ok(!text.includes(meetingLinkAlice), "Alice's meeting link must NEVER be returned to Bob");
      assert.ok(!text.includes('CONFIDENTIAL OWNER NOTE'), 'Notes must never be leaked');
    });

    test('1.6 GET /api/student/sessions/[id]: Non-existent session returns 404', async () => {
      setTestAuthUser(PERSONA_STUDENT_A);
      const req = new NextRequest('https://viar.in/api/student/sessions/non_existent_session_id_404');
      const res = await getStudentSessionByIdRoute(req, { params: { id: 'non_existent_session_id_404' } });
      assert.equal(res.status, 404);
    });

    test('1.7 GET /api/student/sessions/[id]/calendar.ics: Student A downloads own iCal event', async () => {
      setTestAuthUser(PERSONA_STUDENT_A);
      const req = new NextRequest(`https://viar.in/api/student/sessions/${sessionAliceId}/calendar.ics`);
      const res = await getStudentSessionIcs(req, { params: { id: sessionAliceId } });
      assert.equal(res.status, 200);
      assert.ok(res.headers.get('content-type')?.includes('text/calendar'));
      const ics = await res.text();
      assert.ok(ics.includes('BEGIN:VCALENDAR'));
      assert.ok(ics.includes(meetingLinkAlice));
    });

    test('1.8 GET /api/student/sessions/[id]/calendar.ics: ATTEMPT TO DOWNLOAD ANOTHER STUDENT CALENDAR returns 403 Forbidden', async () => {
      // Bob attempts to download Alice's calendar event
      setTestAuthUser(PERSONA_STUDENT_B);
      const req = new NextRequest(`https://viar.in/api/student/sessions/${sessionAliceId}/calendar.ics`);
      const res = await getStudentSessionIcs(req, { params: { id: sessionAliceId } });

      assert.equal(res.status, 403, "Downloading another student's calendar must be 403 Forbidden");
      const text = await res.text();
      assert.ok(!text.includes(meetingLinkAlice), "Alice's meeting link must NEVER be returned to Bob");
    });

    test('1.9 POST /api/student/sessions/request: Reschedule attempts for another student session are rejected with 403 Forbidden', async () => {
      // Bob attempts to reschedule Alice's session
      setTestAuthUser(PERSONA_STUDENT_B);
      const req = new NextRequest('https://viar.in/api/student/sessions/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'RESCHEDULE',
          studentSessionId: sessionAliceId, // Belongs to Alice!
          preferredWindows: [
            {
              startUtc: new Date(Date.now() + 1000 * 60 * 60 * 120).toISOString(),
              endUtc: new Date(Date.now() + 1000 * 60 * 60 * 121).toISOString(),
            },
          ],
        }),
      });

      const res = await postStudentSessionRequest(req);
      assert.equal(res.status, 403, "Rescheduling another student's session must be 403 Forbidden");
      const json = await res.json();
      assert.ok(json.error?.includes('cannot reschedule another student'), 'Explicit security error message');
    });
  });

  // ==========================================================================
  // SUITE 2: ADMIN SESSIONS READ & EXPLICIT "SESSIONS" PERMISSION
  // ==========================================================================
  describe('2. Admin Sessions Read: Staff requires explicit "sessions" permission', () => {
    test('2.1 GET /api/admin/sessions: Visitor rejected with 401', async () => {
      setTestAuthUser(PERSONA_VISITOR);
      const req = new NextRequest('https://viar.in/api/admin/sessions');
      const res = await getAdminSessions(req);
      assert.equal(res.status, 401);
    });

    test('2.2 GET /api/admin/sessions: Student A rejected with 403 Forbidden', async () => {
      setTestAuthUser(PERSONA_STUDENT_A);
      const req = new NextRequest('https://viar.in/api/admin/sessions');
      const res = await getAdminSessions(req);
      assert.equal(res.status, 403);
    });

    test('2.3 GET /api/admin/sessions: Staff WITHOUT explicit "sessions" permission rejected with 403 Forbidden', async () => {
      setTestAuthUser(PERSONA_STAFF_NO_SESSIONS);
      const req = new NextRequest('https://viar.in/api/admin/sessions');
      const res = await getAdminSessions(req);
      assert.equal(res.status, 403, 'Staff without explicit sessions section must be rejected');
    });

    test('2.4 GET /api/admin/sessions: Staff WITH explicit "sessions" permission succeeds with 200 OK', async () => {
      setTestAuthUser(PERSONA_STAFF_WITH_SESSIONS);
      const req = new NextRequest('https://viar.in/api/admin/sessions');
      const res = await getAdminSessions(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.isOwner, false, 'isOwner flag indicates non-owner staff');
      assert.ok(Array.isArray(json.sessions));
    });

    test('2.5 GET /api/admin/sessions: Owner succeeds with 200 OK and isOwner=true', async () => {
      setTestAuthUser(PERSONA_OWNER);
      const req = new NextRequest('https://viar.in/api/admin/sessions');
      const res = await getAdminSessions(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.isOwner, true);
    });

    test('2.6 GET /api/admin/sessions/requests: Staff without "sessions" gets 403; staff with "sessions" gets 200', async () => {
      setTestAuthUser(PERSONA_STAFF_NO_SESSIONS);
      const reqNo = new NextRequest('https://viar.in/api/admin/sessions/requests');
      const resNo = await getAdminRequests(reqNo);
      assert.equal(resNo.status, 403);

      setTestAuthUser(PERSONA_STAFF_WITH_SESSIONS);
      const reqYes = new NextRequest('https://viar.in/api/admin/sessions/requests');
      const resYes = await getAdminRequests(reqYes);
      assert.equal(resYes.status, 200);
    });

    test('2.7 GET /api/admin/sessions/settings: Staff without "sessions" gets 403; staff with "sessions" gets 200', async () => {
      setTestAuthUser(PERSONA_STAFF_NO_SESSIONS);
      const resNo = await getAdminSettings();
      assert.equal(resNo.status, 403);

      setTestAuthUser(PERSONA_STAFF_WITH_SESSIONS);
      const resYes = await getAdminSettings();
      assert.equal(resYes.status, 200);
    });

    test('2.8 GET /api/admin/sessions/outbox/failures: Staff without "sessions" gets 403; staff with "sessions" gets 200', async () => {
      setTestAuthUser(PERSONA_STAFF_NO_SESSIONS);
      const resNo = await getAdminOutboxFailures();
      assert.equal(resNo.status, 403);

      setTestAuthUser(PERSONA_STAFF_WITH_SESSIONS);
      const resYes = await getAdminOutboxFailures();
      assert.equal(resYes.status, 200);
    });

    test('2.9 GET /api/admin/sessions/calendar-feed: Private feed is strictly Owner-only (Staff gets 403 Forbidden)', async () => {
      // Staff with sessions permission attempts to access Owner private feed link
      setTestAuthUser(PERSONA_STAFF_WITH_SESSIONS);
      const reqStaff = new NextRequest('https://viar.in/api/admin/sessions/calendar-feed');
      const resStaff = await getAdminCalendarFeed(reqStaff);
      assert.equal(resStaff.status, 403, 'Owner secret calendar feed is strictly Owner only');

      // Owner succeeds
      setTestAuthUser(PERSONA_OWNER);
      const reqOwner = new NextRequest('https://viar.in/api/admin/sessions/calendar-feed');
      const resOwner = await getAdminCalendarFeed(reqOwner);
      assert.equal(resOwner.status, 200);
      const jsonOwner = await resOwner.json();
      assert.ok(jsonOwner.feedUrl);
      assert.ok(jsonOwner.token);
    });

    test('2.10 GET /api/admin/sessions/calendar.ics: Requires secret token; wrong/missing token is rejected with 401', async () => {
      const reqNoToken = new NextRequest('https://viar.in/api/admin/sessions/calendar.ics');
      const resNoToken = await getAdminCalendarIcs(reqNoToken);
      assert.equal(resNoToken.status, 401);

      const reqBadToken = new NextRequest('https://viar.in/api/admin/sessions/calendar.ics?token=wrong_invalid_secret_token');
      const resBadToken = await getAdminCalendarIcs(reqBadToken);
      assert.equal(resBadToken.status, 401);

      const validToken = getCalendarFeedToken();
      const reqValid = new NextRequest(`https://viar.in/api/admin/sessions/calendar.ics?token=${validToken}`);
      const resValid = await getAdminCalendarIcs(reqValid);
      assert.equal(resValid.status, 200);
      assert.ok(resValid.headers.get('content-type')?.includes('text/calendar'));
    });
  });

  // ==========================================================================
  // SUITE 3: ONLY THE OWNER CREATES, CHANGES OR CANCELS
  // ==========================================================================
  describe('3. Owner-Only Mutations: Only the Owner creates, changes or cancels', () => {
    test('3.1 POST /api/admin/sessions (Create Session): Staff with "sessions" permission is rejected with 403 Forbidden', async () => {
      setTestAuthUser(PERSONA_STAFF_WITH_SESSIONS);
      const req = new NextRequest('https://viar.in/api/admin/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: PERSONA_STUDENT_A.userId,
          title: 'Staff Attempt Session',
          scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 200).toISOString(),
          durationMinutes: 60,
        }),
      });

      const res = await postAdminSessions(req);
      assert.equal(res.status, 403, 'Staff must NEVER be allowed to create sessions');
      const json = await res.json();
      assert.ok(json.error?.includes('only the Owner can create sessions'));
    });

    test('3.2 POST /api/admin/sessions (Create Session): Owner succeeds', async () => {
      setTestAuthUser(PERSONA_OWNER);
      const req = new NextRequest('https://viar.in/api/admin/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: PERSONA_STUDENT_A.userId,
          title: 'Owner Scheduled Session',
          scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 240).toISOString(),
          durationMinutes: 60,
          allowOutsideWorkingHours: true,
        }),
      });

      const res = await postAdminSessions(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
    });

    test('3.3 PATCH /api/admin/sessions (Change Session): Staff with "sessions" permission is rejected with 403 Forbidden', async () => {
      setTestAuthUser(PERSONA_STAFF_WITH_SESSIONS);
      const req = new NextRequest('https://viar.in/api/admin/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sessionAliceId,
          title: 'Staff Modified Title',
        }),
      });

      const res = await patchAdminSessions(req);
      assert.equal(res.status, 403, 'Staff must NEVER be allowed to update/change sessions');
      const json = await res.json();
      assert.ok(json.error?.includes('only the Owner can update or change sessions'));
    });

    test('3.4 PATCH /api/admin/sessions (Change Session): Owner succeeds', async () => {
      setTestAuthUser(PERSONA_OWNER);
      const req = new NextRequest('https://viar.in/api/admin/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sessionAliceId,
          sharedNotes: 'Updated shared notes by Acharya ji',
        }),
      });

      const res = await patchAdminSessions(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.session.sharedNotes, 'Updated shared notes by Acharya ji');
    });

    test('3.5 DELETE /api/admin/sessions (Cancel/Delete): Staff with "sessions" permission is rejected with 403 Forbidden', async () => {
      setTestAuthUser(PERSONA_STAFF_WITH_SESSIONS);
      const req = new NextRequest(`https://viar.in/api/admin/sessions?id=${sessionAliceId}`, {
        method: 'DELETE',
      });

      const res = await deleteAdminSessions(req);
      assert.equal(res.status, 403, 'Staff must NEVER be allowed to cancel/delete sessions');
      const json = await res.json();
      assert.ok(json.error?.includes('only the Owner can cancel or delete sessions'));
    });

    test('3.6 POST /api/admin/sessions/requests/[id]/action: Staff is rejected with 403; Owner succeeds', async () => {
      // Staff attempt
      setTestAuthUser(PERSONA_STAFF_WITH_SESSIONS);
      const reqStaff = new NextRequest(`https://viar.in/api/admin/sessions/requests/${sampleRequestId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DECLINE',
          note: 'Staff attempt to decline',
        }),
      });
      const resStaff = await postAdminRequestAction(reqStaff, { params: { id: sampleRequestId } });
      assert.equal(resStaff.status, 403, 'Staff cannot action requests');

      // Owner attempt
      setTestAuthUser(PERSONA_OWNER);
      const reqOwner = new NextRequest(`https://viar.in/api/admin/sessions/requests/${sampleRequestId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DECLINE',
          note: 'Owner legitimate decline',
        }),
      });
      const resOwner = await postAdminRequestAction(reqOwner, { params: { id: sampleRequestId } });
      assert.equal(resOwner.status, 200);
    });

    test('3.7 POST /api/admin/sessions/settings: Staff is rejected with 403; Owner succeeds', async () => {
      // Staff attempt
      setTestAuthUser(PERSONA_STAFF_WITH_SESSIONS);
      const reqStaff = new NextRequest('https://viar.in/api/admin/sessions/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minimumRescheduleNoticeHours: 48 }),
      });
      const resStaff = await postAdminSettings(reqStaff);
      assert.equal(resStaff.status, 403, 'Staff cannot modify settings');

      // Owner attempt
      setTestAuthUser(PERSONA_OWNER);
      const reqOwner = new NextRequest('https://viar.in/api/admin/sessions/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minimumRescheduleNoticeHours: 36 }),
      });
      const resOwner = await postAdminSettings(reqOwner);
      assert.equal(resOwner.status, 200);
      const settings = await getCourseSessionSettings(courseId);
      assert.equal(settings.minimumRescheduleNoticeHours, 36);
    });

    test('3.8 POST /api/admin/sessions/calendar-feed: Staff cannot regenerate token; Owner succeeds', async () => {
      setTestAuthUser(PERSONA_STAFF_WITH_SESSIONS);
      const reqStaff = new NextRequest('https://viar.in/api/admin/sessions/calendar-feed', { method: 'POST' });
      const resStaff = await postAdminCalendarFeed(reqStaff);
      assert.equal(resStaff.status, 403);

      setTestAuthUser(PERSONA_OWNER);
      const reqOwner = new NextRequest('https://viar.in/api/admin/sessions/calendar-feed', { method: 'POST' });
      const resOwner = await postAdminCalendarFeed(reqOwner);
      assert.equal(resOwner.status, 200);
    });

    test('3.9 POST /api/admin/sessions/outbox/failures/retry: Staff cannot retry emails; Owner succeeds', async () => {
      setTestAuthUser(PERSONA_STAFF_WITH_SESSIONS);
      const reqStaff = new NextRequest('https://viar.in/api/admin/sessions/outbox/failures/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId: 'fake_email_id' }),
      });
      const resStaff = await postAdminOutboxRetry(reqStaff);
      assert.equal(resStaff.status, 403);

      setTestAuthUser(PERSONA_OWNER);
      const reqOwner = new NextRequest('https://viar.in/api/admin/sessions/outbox/failures/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId: 'non_existent_id' }),
      });
      const resOwner = await postAdminOutboxRetry(reqOwner);
      // Non-existent ID returns 400 (bad request), NOT 403 (forbidden)
      assert.equal(resOwner.status, 400);
    });
  });

  // ==========================================================================
  // SUITE 4: MEETING LINK LEAKAGE PROTECTION
  // ==========================================================================
  describe('4. Leakage Protection: The meeting link is never returned to anyone else', () => {
    test('4.1 Visitor receives 0 meeting links across student and admin endpoints', async () => {
      setTestAuthUser(PERSONA_VISITOR);

      const resStudent = await getStudentSessions(new NextRequest('https://viar.in/api/student/sessions'));
      const textStudent = await resStudent.text();
      assert.ok(!textStudent.includes(meetingLinkAlice));
      assert.ok(!textStudent.includes(meetingLinkBob));

      const resAdmin = await getAdminSessions(new NextRequest('https://viar.in/api/admin/sessions'));
      const textAdmin = await resAdmin.text();
      assert.ok(!textAdmin.includes(meetingLinkAlice));
      assert.ok(!textAdmin.includes(meetingLinkBob));
    });

    test('4.2 Student B querying their own sessions receives only their link, never Alice link', async () => {
      setTestAuthUser(PERSONA_STUDENT_B);
      const res = await getStudentSessions(new NextRequest('https://viar.in/api/student/sessions'));
      const text = await res.text();
      assert.ok(text.includes(meetingLinkBob), "Bob's meeting link is present for Bob");
      assert.ok(!text.includes(meetingLinkAlice), "Alice's meeting link is NEVER returned to Bob");
    });

    test('4.3 Staff without "sessions" permission receives 0 meeting links', async () => {
      setTestAuthUser(PERSONA_STAFF_NO_SESSIONS);
      const res = await getAdminSessions(new NextRequest('https://viar.in/api/admin/sessions'));
      const text = await res.text();
      assert.ok(!text.includes(meetingLinkAlice));
      assert.ok(!text.includes(meetingLinkBob));
    });
  });
});
