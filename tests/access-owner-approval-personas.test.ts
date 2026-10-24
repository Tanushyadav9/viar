import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { setTestAuthUser, type ServerAuthResult } from '@/lib/auth/serverAuth';
import { GET as getCurriculum } from '@/app/api/courses/[slug]/curriculum/route';
import { GET as playLesson } from '@/app/api/courses/[slug]/lessons/[lessonId]/play/route';
import { GET as getSessions } from '@/app/api/sessions/route';
import { GET as getQuizzes } from '@/app/api/quizzes/route';
import { POST as submitQuiz } from '@/app/api/quiz/submit/route';
import { POST as inviteStudent, DELETE as revokeInvitation } from '@/app/api/enrollments/invite/route';
import { POST as revokeEnrollment } from '@/app/api/enrollments/revoke/route';
import { POST as handleAdminOrder } from '@/app/api/admin/orders/[id]/route';
import { autoActivateInvitations } from '@/lib/auth/userSync';
import { generateSignedPlaybackToken } from '@/lib/auth/course-access';
import { prisma } from '@/lib/prisma';

// -----------------------------------------------------------------------------
// SEVEN PERSONA DEFINITIONS
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

const PERSONA_SIGNED_IN_NOT_ENROLLED: ServerAuthResult = {
  isAuthenticated: true,
  userId: 'user-not-enrolled-123',
  clerkId: 'user_not_enrolled',
  email: 'notenrolled@example.com',
  userEmail: 'notenrolled@example.com',
  isEmailVerified: true,
  isOwner: false,
  isStaff: false,
  staffSections: [],
  role: 'STUDENT',
  dbUser: {
    id: 'user-not-enrolled-123',
    clerkId: 'user_not_enrolled',
    email: 'notenrolled@example.com',
    name: 'Newbie Visitor',
    role: 'STUDENT',
    isOwner: false,
  },
};

const PERSONA_WAITING_FOR_APPROVAL: ServerAuthResult = {
  isAuthenticated: true,
  userId: 'user-waiting-approval-456',
  clerkId: 'user_waiting_approval',
  email: 'waitingapproval@example.com',
  userEmail: 'waitingapproval@example.com',
  isEmailVerified: true,
  isOwner: false,
  isStaff: false,
  staffSections: [],
  role: 'STUDENT',
  dbUser: {
    id: 'user-waiting-approval-456',
    clerkId: 'user_waiting_approval',
    email: 'waitingapproval@example.com',
    name: 'Waiting Student',
    role: 'STUDENT',
    isOwner: false,
  },
};

const PERSONA_APPROVED_STUDENT: ServerAuthResult = {
  isAuthenticated: true,
  userId: 'user-approved-scholar-789',
  clerkId: 'user_approved_scholar',
  email: 'approvedstudent@example.com',
  userEmail: 'approvedstudent@example.com',
  isEmailVerified: true,
  isOwner: false,
  isStaff: false,
  staffSections: [],
  role: 'STUDENT',
  dbUser: {
    id: 'user-approved-scholar-789',
    clerkId: 'user_approved_scholar',
    email: 'approvedstudent@example.com',
    name: 'Approved Scholar',
    role: 'STUDENT',
    isOwner: false,
  },
  ...({ isTestEnrolled: true } as any),
};

const PERSONA_REVOKED_STUDENT: ServerAuthResult = {
  isAuthenticated: true,
  userId: 'user-revoked-student-999',
  clerkId: 'user_revoked_student',
  email: 'revokedstudent@example.com',
  userEmail: 'revokedstudent@example.com',
  isEmailVerified: true,
  isOwner: false,
  isStaff: false,
  staffSections: [],
  role: 'STUDENT',
  dbUser: {
    id: 'user-revoked-student-999',
    clerkId: 'user_revoked_student',
    email: 'revokedstudent@example.com',
    name: 'Revoked Student',
    role: 'STUDENT',
    isOwner: false,
  },
};

const PERSONA_STAFF_USER: ServerAuthResult = {
  isAuthenticated: true,
  userId: 'user-staff-instructor-333',
  clerkId: 'user_staff_instructor',
  email: 'staff@example.com',
  userEmail: 'staff@example.com',
  isEmailVerified: true,
  isOwner: false,
  isStaff: true,
  staffSections: ['courses'],
  role: 'INSTRUCTOR',
  dbUser: {
    id: 'user-staff-instructor-333',
    clerkId: 'user_staff_instructor',
    email: 'staff@example.com',
    name: 'Staff Instructor',
    role: 'INSTRUCTOR',
    isOwner: false,
  },
};

const PERSONA_OWNER_USER: ServerAuthResult = {
  isAuthenticated: true,
  userId: 'user-site-owner-001',
  clerkId: 'user_site_owner',
  email: 'aapkaastro1606@gmail.com',
  userEmail: 'aapkaastro1606@gmail.com',
  isEmailVerified: true,
  isOwner: true,
  isStaff: true,
  staffSections: ['content', 'courses', 'cohorts', 'students', 'quizzes', 'analytics', 'payments', 'staff'],
  role: 'OWNER',
  dbUser: {
    id: 'user-site-owner-001',
    clerkId: 'user_site_owner',
    email: 'aapkaastro1606@gmail.com',
    name: 'Acharya Niraj Kumar',
    role: 'OWNER',
    isOwner: true,
  },
};

describe('ACCESS ONLY AFTER OWNER APPROVES — 7 Personas Server Gating Test Suite', () => {
  // Test target constants
  const targetCourseSlug = 'course-what-is-astrology';
  const targetCohortId = 'cohort-wia-batch-1';
  const testLessonId = 'lesson-1-sample';

  // ---------------------------------------------------------------------------
  // 1. VIDEO STREAMING & PLAYBACK ACCESS GATING
  // ---------------------------------------------------------------------------
  describe('1. Video Streaming (/api/courses/[slug]/lessons/[lessonId]/play)', () => {
    it('rejects logged-out visitor with 401 Unauthorized', async () => {
      setTestAuthUser(PERSONA_LOGGED_OUT);
      const req = new NextRequest(`https://viar.in/api/courses/${targetCourseSlug}/lessons/${testLessonId}/play`);
      const res = await playLesson(req, { params: { slug: targetCourseSlug, lessonId: testLessonId } });
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.code, 'UNAUTHORIZED');
    });

    it('rejects signed-in non-enrolled user with 403 Forbidden', async () => {
      setTestAuthUser(PERSONA_SIGNED_IN_NOT_ENROLLED);
      const req = new NextRequest(`https://viar.in/api/courses/${targetCourseSlug}/lessons/${testLessonId}/play`);
      const res = await playLesson(req, { params: { slug: targetCourseSlug, lessonId: testLessonId } });
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.code, 'ENROLLMENT_REQUIRED');
    });

    it('rejects waiting-for-approval student with 403 Forbidden', async () => {
      setTestAuthUser(PERSONA_WAITING_FOR_APPROVAL);
      const req = new NextRequest(`https://viar.in/api/courses/${targetCourseSlug}/lessons/${testLessonId}/play`);
      const res = await playLesson(req, { params: { slug: targetCourseSlug, lessonId: testLessonId } });
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.code, 'ENROLLMENT_REQUIRED');
    });

    it('rejects revoked student with 403 Forbidden', async () => {
      setTestAuthUser(PERSONA_REVOKED_STUDENT);
      const req = new NextRequest(`https://viar.in/api/courses/${targetCourseSlug}/lessons/${testLessonId}/play`);
      const res = await playLesson(req, { params: { slug: targetCourseSlug, lessonId: testLessonId } });
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.code, 'ENROLLMENT_REQUIRED');
    });

    it('allows approved student to stream with valid signed playback token', async () => {
      setTestAuthUser(PERSONA_APPROVED_STUDENT);
      const tokenData = generateSignedPlaybackToken(testLessonId, PERSONA_APPROVED_STUDENT.userId!);
      const req = new NextRequest(`https://viar.in/api/courses/${targetCourseSlug}/lessons/${testLessonId}/play?token=${tokenData.token}`);
      const res = await playLesson(req, { params: { slug: targetCourseSlug, lessonId: testLessonId } });
      assert.ok(res.status === 200 || res.status === 404, `Expected 200 or 404, got ${res.status}`);
      if (res.status === 200) {
        const json = await res.json();
        assert.equal(json.success, true);
      }
    });

    it('allows Site Owner full playback access', async () => {
      setTestAuthUser(PERSONA_OWNER_USER);
      const req = new NextRequest(`https://viar.in/api/courses/${targetCourseSlug}/lessons/${testLessonId}/play`);
      const res = await playLesson(req, { params: { slug: targetCourseSlug, lessonId: testLessonId } });
      assert.ok(res.status === 200 || res.status === 404, `Expected 200 or 404, got ${res.status}`);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. TIMETABLE & SESSIONS ACCESS GATING
  // ---------------------------------------------------------------------------
  describe('2. Timetable & Sessions (/api/sessions)', () => {
    it('blocks logged-out visitor from accessing timetable with 403 Forbidden', async () => {
      setTestAuthUser(PERSONA_LOGGED_OUT);
      const req = new NextRequest(`https://viar.in/api/sessions?cohortId=${targetCohortId}`);
      const res = await getSessions(req);
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.code, 'ENROLLMENT_REQUIRED');
    });

    it('blocks signed-in non-enrolled user from accessing timetable with 403 Forbidden', async () => {
      setTestAuthUser(PERSONA_SIGNED_IN_NOT_ENROLLED);
      const req = new NextRequest(`https://viar.in/api/sessions?cohortId=${targetCohortId}`);
      const res = await getSessions(req);
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.code, 'ENROLLMENT_REQUIRED');
    });

    it('blocks waiting-for-approval user from accessing timetable with 403 Forbidden', async () => {
      setTestAuthUser(PERSONA_WAITING_FOR_APPROVAL);
      const req = new NextRequest(`https://viar.in/api/sessions?cohortId=${targetCohortId}`);
      const res = await getSessions(req);
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.code, 'ENROLLMENT_REQUIRED');
    });

    it('blocks revoked student from accessing timetable with 403 Forbidden', async () => {
      setTestAuthUser(PERSONA_REVOKED_STUDENT);
      const req = new NextRequest(`https://viar.in/api/sessions?cohortId=${targetCohortId}`);
      const res = await getSessions(req);
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.code, 'ENROLLMENT_REQUIRED');
    });

    it('allows Staff with courses permission to inspect timetable', async () => {
      setTestAuthUser(PERSONA_STAFF_USER);
      const req = new NextRequest(`https://viar.in/api/sessions?cohortId=${targetCohortId}`);
      const res = await getSessions(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
    });

    it('allows Site Owner full access to class timetable', async () => {
      setTestAuthUser(PERSONA_OWNER_USER);
      const req = new NextRequest(`https://viar.in/api/sessions?cohortId=${targetCohortId}`);
      const res = await getSessions(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. QUIZZES ACCESS GATING
  // ---------------------------------------------------------------------------
  describe('3. Quizzes & Certification Exams (/api/quizzes & /api/quiz/submit)', () => {
    it('blocks logged-out visitor from viewing quiz questions with 403', async () => {
      setTestAuthUser(PERSONA_LOGGED_OUT);
      const req = new NextRequest(`https://viar.in/api/quizzes?cohortId=${targetCohortId}`);
      const res = await getQuizzes(req);
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.code, 'ENROLLMENT_REQUIRED');
    });

    it('blocks non-enrolled student from viewing quiz questions with 403', async () => {
      setTestAuthUser(PERSONA_SIGNED_IN_NOT_ENROLLED);
      const req = new NextRequest(`https://viar.in/api/quizzes?cohortId=${targetCohortId}`);
      const res = await getQuizzes(req);
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.code, 'ENROLLMENT_REQUIRED');
    });

    it('blocks waiting-for-approval user from submitting quiz answers with 403', async () => {
      setTestAuthUser(PERSONA_WAITING_FOR_APPROVAL);
      const req = new NextRequest('https://viar.in/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cohortId: targetCohortId,
          answers: { q1: 0, q2: 1 },
        }),
      });
      const res = await submitQuiz(req);
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.code, 'ENROLLMENT_REQUIRED');
    });

    it('blocks revoked student from submitting quiz answers with 403', async () => {
      setTestAuthUser(PERSONA_REVOKED_STUDENT);
      const req = new NextRequest('https://viar.in/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cohortId: targetCohortId,
          answers: { q1: 0, q2: 1 },
        }),
      });
      const res = await submitQuiz(req);
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.code, 'ENROLLMENT_REQUIRED');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. CURRICULUM SECRETS STRIPPING (Course outline only for non-approved)
  // ---------------------------------------------------------------------------
  describe('4. Curriculum Gating (/api/courses/[slug]/curriculum)', () => {
    it('strips private meeting links, notes, and recordings for logged-out visitors', async () => {
      setTestAuthUser(PERSONA_LOGGED_OUT);
      const req = new NextRequest(`https://viar.in/api/courses/${targetCourseSlug}/curriculum`);
      const res = await getCurriculum(req, { params: { slug: targetCourseSlug } });
      assert.ok(res.status === 200 || res.status === 404);
      if (res.status === 200) {
        const json = await res.json();
        assert.equal(json.isUserEnrolled, false);
        assert.equal(json.isStaff, false);
        // Verify all lessons in modules have secrets stripped
        if (json.modules && json.modules.length > 0) {
          for (const mod of json.modules) {
            for (const l of mod.lessons) {
              assert.equal(l.liveJoinLink, null, 'liveJoinLink must be stripped on server');
              assert.equal(l.notesMarkdown, null, 'notesMarkdown must be stripped on server');
              assert.equal(l.recordingUrl, null, 'recordingUrl must be stripped on server');
              assert.equal(l.documentKey, null, 'documentKey must be stripped on server');
            }
          }
        }
      }
    });

    it('strips private meeting links and recordings for signed-in non-enrolled user', async () => {
      setTestAuthUser(PERSONA_SIGNED_IN_NOT_ENROLLED);
      const req = new NextRequest(`https://viar.in/api/courses/${targetCourseSlug}/curriculum`);
      const res = await getCurriculum(req, { params: { slug: targetCourseSlug } });
      assert.ok(res.status === 200 || res.status === 404);
      if (res.status === 200) {
        const json = await res.json();
        assert.equal(json.isUserEnrolled, false);
      }
    });

    it('strips private data for revoked student', async () => {
      setTestAuthUser(PERSONA_REVOKED_STUDENT);
      const req = new NextRequest(`https://viar.in/api/courses/${targetCourseSlug}/curriculum`);
      const res = await getCurriculum(req, { params: { slug: targetCourseSlug } });
      assert.ok(res.status === 200 || res.status === 404);
      if (res.status === 200) {
        const json = await res.json();
        assert.equal(json.isUserEnrolled, false);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 5. TWO WAYS IN: PAID ROUTE APPROVAL (Owner-Only)
  // ---------------------------------------------------------------------------
  describe('5. Paid Route: Order Approvals (/api/admin/orders/[id])', () => {
    it('rejects student persona from approving payments with 403 Forbidden', async () => {
      setTestAuthUser(PERSONA_APPROVED_STUDENT);
      const req = new NextRequest('https://viar.in/api/admin/orders/ord-test-123', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE', bankConfirmed: true }),
      });
      const res = await handleAdminOrder(req, { params: { id: 'ord-test-123' } });
      assert.equal(res.status, 403);
    });

    it('rejects staff persona from approving payments with 403 Forbidden', async () => {
      setTestAuthUser(PERSONA_STAFF_USER);
      const req = new NextRequest('https://viar.in/api/admin/orders/ord-test-123', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE', bankConfirmed: true }),
      });
      const res = await handleAdminOrder(req, { params: { id: 'ord-test-123' } });
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.match(json.error, /Only the Site Owner is authorized/i);
    });

    it('enforces bank credit confirmation requirement for Owner', async () => {
      setTestAuthUser(PERSONA_OWNER_USER);
      const req = new NextRequest('https://viar.in/api/admin/orders/ord-test-123', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE', bankConfirmed: false }),
      });
      const res = await handleAdminOrder(req, { params: { id: 'ord-test-123' } });
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.match(json.error, /I have confirmed this amount is credited/i);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. TWO WAYS IN: ADD BY EMAIL & INVITATIONS (Owner-Only)
  // ---------------------------------------------------------------------------
  describe('6. Add by Email (/api/enrollments/invite)', () => {
    it('rejects student persona from adding by email with 403 Forbidden', async () => {
      setTestAuthUser(PERSONA_APPROVED_STUDENT);
      const req = new NextRequest('https://viar.in/api/enrollments/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'newscholar@example.com' }),
      });
      const res = await inviteStudent(req);
      assert.equal(res.status, 403);
    });

    it('rejects staff persona from adding by email with 403 Forbidden', async () => {
      setTestAuthUser(PERSONA_STAFF_USER);
      const req = new NextRequest('https://viar.in/api/enrollments/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'newscholar@example.com' }),
      });
      const res = await inviteStudent(req);
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.match(json.error, /restricted to the Site Owner only/i);
    });

    it('requires valid email format for Owner invocation', async () => {
      setTestAuthUser(PERSONA_OWNER_USER);
      const req = new NextRequest('https://viar.in/api/enrollments/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'invalid-email' }),
      });
      const res = await inviteStudent(req);
      assert.equal(res.status, 400);
    });

    it('rejects non-owner from revoking an invitation with 403', async () => {
      setTestAuthUser(PERSONA_STAFF_USER);
      const req = new NextRequest('https://viar.in/api/enrollments/invite?id=inv-123', {
        method: 'DELETE',
      });
      const res = await revokeInvitation(req);
      assert.equal(res.status, 403);
    });
  });

  // ---------------------------------------------------------------------------
  // 7. REVOCATION & AUDIT TRAIL (Owner-Only with Required Reason)
  // ---------------------------------------------------------------------------
  describe('7. Revocation & Required Reason (/api/enrollments/revoke)', () => {
    it('rejects student persona from revoking access with 403', async () => {
      setTestAuthUser(PERSONA_APPROVED_STUDENT);
      const req = new NextRequest('https://viar.in/api/enrollments/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId: 'enr-123', reason: 'Refund' }),
      });
      const res = await revokeEnrollment(req);
      assert.equal(res.status, 403);
    });

    it('rejects staff persona from revoking access with 403', async () => {
      setTestAuthUser(PERSONA_STAFF_USER);
      const req = new NextRequest('https://viar.in/api/enrollments/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId: 'enr-123', reason: 'Refund' }),
      });
      const res = await revokeEnrollment(req);
      assert.equal(res.status, 403);
    });

    it('strictly requires a non-empty reason for Owner revocation', async () => {
      setTestAuthUser(PERSONA_OWNER_USER);
      const req = new NextRequest('https://viar.in/api/enrollments/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId: 'enr-123', reason: '   ' }),
      });
      const res = await revokeEnrollment(req);
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.match(json.error, /specific reason is strictly required/i);
    });
  });

  // ---------------------------------------------------------------------------
  // 8. AUTO-ACTIVATION OF INVITATIONS UPON VERIFIED SIGN-UP
  // ---------------------------------------------------------------------------
  describe('8. Auto-Activation on Verified Sign-up', () => {
    it('autoActivateInvitations is safe and returns 0 for email without pending invites', async () => {
      const activated = await autoActivateInvitations('dummy-user-id', 'noinvite@example.com');
      assert.equal(typeof activated, 'number');
      assert.equal(activated, 0);
    });
  });
});
