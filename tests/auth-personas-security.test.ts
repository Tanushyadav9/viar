import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { NextRequest } from 'next/server.js';
import {
  getServerAuthUser,
  setTestAuthUser,
  isAuthorizedForSection,
  canAccessArea,
  canAccessSection,
  getAllowedAdminSections,
  isOwnerOnlyArea,
} from '../src/lib/auth/serverAuth.ts';
import type { ServerAuthResult } from '../src/lib/auth/serverAuth.ts';

// Import Route Handlers
import { GET as getTeam, POST as postTeam, DELETE as deleteTeam } from '../src/app/api/admin/team/route.ts';
import { GET as getAdminOrders } from '../src/app/api/admin/orders/route.ts';
import { POST as postAdminOrderAction } from '../src/app/api/admin/orders/[id]/route.ts';
import { GET as getAdminPayments, POST as postAdminPayment } from '../src/app/api/admin/payments/route.ts';
import { GET as getPaymentSettings, POST as postPaymentSettings } from '../src/app/api/admin/settings/payment/route.ts';
import { GET as getAdminContent, POST as postAdminContent, DELETE as deleteAdminContent } from '../src/app/api/admin/content/route.ts';
import { GET as getAdminRevisions, POST as postAdminRevisions } from '../src/app/api/admin/content/revisions/route.ts';
import { GET as getAdminMedia, POST as postAdminMedia, DELETE as deleteAdminMedia } from '../src/app/api/admin/media/route.ts';
import { GET as getAdminKnowledge, POST as postAdminKnowledge } from '../src/app/api/admin/knowledge/route.ts';
import { GET as getProgress, POST as postProgress } from '../src/app/api/progress/route.ts';
import { GET as getOrders, POST as postOrder } from '../src/app/api/orders/route.ts';
import { GET as getEnrollments, POST as postEnrollment } from '../src/app/api/enrollments/route.ts';
import { POST as grantEnrollment } from '../src/app/api/enrollments/grant/route.ts';
import { POST as revokeEnrollment } from '../src/app/api/enrollments/revoke/route.ts';
import { GET as exportEnrollments } from '../src/app/api/enrollments/export/route.ts';
import { POST as postCourses } from '../src/app/api/courses/route.ts';
import { PATCH as patchCourseSlug, DELETE as deleteCourseSlug } from '../src/app/api/courses/[slug]/route.ts';
import { POST as postCohort } from '../src/app/api/cohorts/route.ts';
import { POST as postQuiz } from '../src/app/api/quizzes/route.ts';
import { PATCH as patchSession } from '../src/app/api/sessions/route.ts';
import { POST as postPresignedUpload } from '../src/app/api/uploads/presigned/route.ts';

// Four Personas Definitions
const LOGGED_OUT_PERSONA: ServerAuthResult = {
  isAuthenticated: false,
  userId: null,
  clerkId: null,
  email: null,
  isEmailVerified: false,
  isOwner: false,
  isStaff: false,
  staffSections: [],
  role: 'STUDENT',
  dbUser: null,
};

const STUDENT_PERSONA: ServerAuthResult = {
  isAuthenticated: true,
  userId: 'db-student-cuid-101',
  clerkId: 'user_clerk_student_101',
  email: 'student@example.com',
  isEmailVerified: true,
  isOwner: false,
  isStaff: false,
  staffSections: [],
  role: 'STUDENT',
  dbUser: {
    id: 'db-student-cuid-101',
    clerkId: 'user_clerk_student_101',
    email: 'student@example.com',
    name: 'Devotee Student',
    role: 'STUDENT',
    isOwner: false,
  },
};

const STAFF_COURSES_PERSONA: ServerAuthResult = {
  isAuthenticated: true,
  userId: 'db-staff-cuid-202',
  clerkId: 'user_clerk_staff_202',
  email: 'staff.courses@viar.in',
  isEmailVerified: true,
  isOwner: false,
  isStaff: true,
  staffSections: ['courses'],
  role: 'ADMIN',
  dbUser: {
    id: 'db-staff-cuid-202',
    clerkId: 'user_clerk_staff_202',
    email: 'staff.courses@viar.in',
    name: 'Curriculum Staff',
    role: 'ADMIN',
    isOwner: false,
  },
};

const STAFF_PAYMENTS_PERSONA: ServerAuthResult = {
  isAuthenticated: true,
  userId: 'db-staff-payments-303',
  clerkId: 'user_clerk_staff_303',
  email: 'staff.payments@viar.in',
  isEmailVerified: true,
  isOwner: false,
  isStaff: true,
  staffSections: ['payments'],
  role: 'ADMIN',
  dbUser: {
    id: 'db-staff-payments-303',
    clerkId: 'user_clerk_staff_303',
    email: 'staff.payments@viar.in',
    name: 'Payments Staff',
    role: 'ADMIN',
    isOwner: false,
  },
};

const OWNER_PERSONA: ServerAuthResult = {
  isAuthenticated: true,
  userId: 'db-owner-cuid-001',
  clerkId: 'user_clerk_owner_001',
  email: 'aapkaastro1606@gmail.com',
  isEmailVerified: true,
  isOwner: true,
  isStaff: true,
  staffSections: [
    'content',
    'media',
    'courses',
    'cohorts',
    'students',
    'quizzes',
    'analytics',
    'payments',
    'staff',
  ],
  role: 'OWNER',
  dbUser: {
    id: 'db-owner-cuid-001',
    clerkId: 'user_clerk_owner_001',
    email: 'aapkaastro1606@gmail.com',
    name: 'Acharya Niraj Kumar',
    role: 'OWNER',
    isOwner: true,
  },
};

function createMockRequest(url: string, options: { method?: string; body?: any; headers?: Record<string, string>; cookies?: Record<string, string> } = {}): NextRequest {
  const reqHeaders = new Headers(options.headers || {});
  if (options.cookies) {
    const cookieHeader = Object.entries(options.cookies)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('; ');
    reqHeaders.set('cookie', cookieHeader);
  }
  const init: RequestInit = {
    method: options.method || 'GET',
    headers: reqHeaders,
  };
  if (options.body && options.method !== 'GET') {
    init.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    if (!reqHeaders.has('content-type')) {
      reqHeaders.set('content-type', 'application/json');
    }
  }
  return new NextRequest(new URL(url, 'http://localhost:3000'), init as any);
}

describe('Identity & Authorization — One Way Only Security Suite', () => {
  beforeEach(() => {
    setTestAuthUser(undefined);
  });

  afterEach(() => {
    setTestAuthUser(undefined);
  });

  // =========================================================================
  // 1. REJECTION OF FORGED COOKIES & HAND-MADE TOKENS
  // =========================================================================
  describe('1. Forged Cookies & Hand-Made Token Rejection', () => {
    it('should reject forged viar_owner_key cookie and return unauthenticated', async () => {
      setTestAuthUser(null); // No valid verified Clerk session
      const auth = await getServerAuthUser();
      assert.strictEqual(auth.isAuthenticated, false);
      assert.strictEqual(auth.isOwner, false);
      assert.strictEqual(auth.role, 'STUDENT');
    });

    it('should reject forged viar_user_email and viar_user_role cookies on /api/admin/team', async () => {
      setTestAuthUser(LOGGED_OUT_PERSONA);
      const req = createMockRequest('http://localhost:3000/api/admin/team', {
        cookies: {
          viar_user_email: 'aapkaastro1606@gmail.com',
          viar_user_role: 'OWNER',
          viar_owner_key: 'viar-owner-diagnostics-2026',
        },
      });
      const res = await getTeam(req);
      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.strictEqual(data.success, false);
    });

    it('should reject forged staff simulation cookie viar_staff_sim on /api/admin/payments', async () => {
      setTestAuthUser(LOGGED_OUT_PERSONA);
      const req = createMockRequest('http://localhost:3000/api/admin/payments', {
        cookies: { viar_staff_sim: 'payments,staff,courses' },
      });
      const res = await getAdminPayments(req);
      assert.strictEqual(res.status, 403);
    });

    it('should reject hand-made unverified JWT token on /api/progress', async () => {
      setTestAuthUser(LOGGED_OUT_PERSONA);
      const h = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const p = Buffer.from(JSON.stringify({ sub: 'user_attacker', email: 'attacker@evil.com' })).toString('base64url');
      const fakeJwt = `${h}.${p}.fakesignature123`;

      const req = createMockRequest('http://localhost:3000/api/progress', {
        cookies: { __session: fakeJwt },
      });
      const res = await getProgress(req);
      assert.strictEqual(res.status, 401);
    });
  });

  // =========================================================================
  // 2. PERSONA 1: LOGGED OUT (UNAUTHENTICATED)
  // =========================================================================
  describe('2. Logged Out Persona: Protected Routes Reject With 401 or 403', () => {
    beforeEach(() => {
      setTestAuthUser(LOGGED_OUT_PERSONA);
    });

    it('should reject /api/progress with 401', async () => {
      const res = await getProgress(createMockRequest('http://localhost:3000/api/progress'));
      assert.strictEqual(res.status, 401);

      const postRes = await postProgress(createMockRequest('http://localhost:3000/api/progress', {
        method: 'POST',
        body: { lessonId: 'lesson-1', completed: true },
      }));
      assert.strictEqual(postRes.status, 401);
    });

    it('should reject /api/orders with 401', async () => {
      const res = await getOrders(createMockRequest('http://localhost:3000/api/orders'));
      assert.strictEqual(res.status, 401);

      const postRes = await postOrder(createMockRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: { courseId: 'what-is-astrology', studentPhone: '9876543210' },
      }));
      assert.strictEqual(postRes.status, 401);
    });

    it('should reject /api/admin/team with 403', async () => {
      const res = await getTeam(createMockRequest('http://localhost:3000/api/admin/team'));
      assert.strictEqual(res.status, 403);
    });

    it('should reject /api/admin/settings/payment with 403', async () => {
      const res = await getPaymentSettings(createMockRequest('http://localhost:3000/api/admin/settings/payment'));
      assert.strictEqual(res.status, 403);
    });

    it('should reject /api/admin/orders with 403', async () => {
      const res = await getAdminOrders(createMockRequest('http://localhost:3000/api/admin/orders'));
      assert.strictEqual(res.status, 403);
    });

    it('should reject /api/admin/payments with 403', async () => {
      const res = await getAdminPayments(createMockRequest('http://localhost:3000/api/admin/payments'));
      assert.strictEqual(res.status, 403);
    });

    it('should reject /api/admin/content with 401', async () => {
      const res = await getAdminContent(createMockRequest('http://localhost:3000/api/admin/content'));
      assert.strictEqual(res.status, 401);
    });

    it('should reject /api/courses creation with 403', async () => {
      const res = await postCourses(createMockRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: { title: 'New Course' },
      }));
      assert.strictEqual(res.status, 403);
    });

    it('should reject /api/cohorts creation with 403', async () => {
      const res = await postCohort(createMockRequest('http://localhost:3000/api/cohorts', {
        method: 'POST',
        body: { batchName: 'Batch A' },
      }));
      assert.strictEqual(res.status, 403);
    });

    it('should reject /api/quizzes creation with 403', async () => {
      const res = await postQuiz(createMockRequest('http://localhost:3000/api/quizzes', {
        method: 'POST',
        body: { courseId: 'what-is-astrology', title: 'Quiz 1' },
      }));
      assert.strictEqual(res.status, 403);
    });

    it('should reject /api/enrollments/grant with 403', async () => {
      const res = await grantEnrollment(createMockRequest('http://localhost:3000/api/enrollments/grant', {
        method: 'POST',
        body: { studentEmail: 'test@example.com', studentName: 'Test' },
      }));
      assert.strictEqual(res.status, 403);
    });
  });

  // =========================================================================
  // 3. PERSONA 2: STUDENT (AUTHENTICATED STUDENT)
  // =========================================================================
  describe('3. Student Persona: Self Queries Allowed, Admin Access Strictly Denied', () => {
    beforeEach(() => {
      setTestAuthUser(STUDENT_PERSONA);
    });

    it('should allow student to query own progress and receive 200', async () => {
      const res = await getProgress(createMockRequest('http://localhost:3000/api/progress'));
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
    });

    it('should allow student to query own orders and not be rejected with 401 or 403', async () => {
      const res = await getOrders(createMockRequest('http://localhost:3000/api/orders'));
      assert.notStrictEqual(res.status, 401, 'Student must not be rejected with 401');
      assert.notStrictEqual(res.status, 403, 'Student must not be rejected with 403');
    });

    it('should allow student to query own enrollments with or without userId (defaults to own courses, never 403)', async () => {
      // 1. Without userId parameter (e.g. from student dashboard)
      const resWithoutParam = await getEnrollments(createMockRequest('http://localhost:3000/api/enrollments'));
      assert.strictEqual(resWithoutParam.status, 200, 'Student querying /api/enrollments must receive 200 with own courses, never 403');
      const dataWithout = await resWithoutParam.json();
      assert.strictEqual(dataWithout.success, true);

      // 2. With self parameter
      const resSelf = await getEnrollments(createMockRequest('http://localhost:3000/api/enrollments?userId=self'));
      assert.strictEqual(resSelf.status, 200);

      // 3. With explicit own userId
      const resOwnId = await getEnrollments(createMockRequest('http://localhost:3000/api/enrollments?userId=db-student-cuid-101'));
      assert.strictEqual(resOwnId.status, 200);
    });

    it('should REJECT student trying to view another student enrollments (403)', async () => {
      const res = await getEnrollments(createMockRequest('http://localhost:3000/api/enrollments?userId=db-victim-student-999'));
      assert.strictEqual(res.status, 403, 'Student querying another student id must receive 403 Forbidden');
    });

    it('should REJECT student attempting admin operations (team, settings, courses, cohorts, quizzes)', async () => {
      const teamRes = await getTeam(createMockRequest('http://localhost:3000/api/admin/team'));
      assert.strictEqual(teamRes.status, 403);

      const settingsRes = await getPaymentSettings(createMockRequest('http://localhost:3000/api/admin/settings/payment'));
      assert.strictEqual(settingsRes.status, 403);

      const ordersQueueRes = await getAdminOrders(createMockRequest('http://localhost:3000/api/admin/orders'));
      assert.strictEqual(ordersQueueRes.status, 403);

      const paymentsRes = await getAdminPayments(createMockRequest('http://localhost:3000/api/admin/payments'));
      assert.strictEqual(paymentsRes.status, 403);

      const contentRes = await getAdminContent(createMockRequest('http://localhost:3000/api/admin/content'));
      assert.strictEqual(contentRes.status, 403);

      const courseRes = await postCourses(createMockRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: { title: 'Unauthorized Course' },
      }));
      assert.strictEqual(courseRes.status, 403);

      const quizRes = await postQuiz(createMockRequest('http://localhost:3000/api/quizzes', {
        method: 'POST',
        body: { courseId: 'what-is-astrology', title: 'Unauthorized Quiz' },
      }));
      assert.strictEqual(quizRes.status, 403);

      const exportRes = await exportEnrollments(createMockRequest('http://localhost:3000/api/enrollments/export'));
      assert.strictEqual(exportRes.status, 403);
    });
  });

  // =========================================================================
  // 4. PERSONA 3: STAFF WITH ONE SECTION ('courses')
  // =========================================================================
  describe('4. Staff Persona (Section: courses): Granular Section Boundaries', () => {
    beforeEach(() => {
      setTestAuthUser(STAFF_COURSES_PERSONA);
    });

    it('should authorize staff for courses section', () => {
      assert.strictEqual(isAuthorizedForSection(STAFF_COURSES_PERSONA, 'courses'), true);
      assert.strictEqual(isAuthorizedForSection(STAFF_COURSES_PERSONA, 'payments'), false);
      assert.strictEqual(isAuthorizedForSection(STAFF_COURSES_PERSONA, 'staff'), false);
    });

    it('should REJECT staff on Owner-only /api/admin/team (403)', async () => {
      const res = await getTeam(createMockRequest('http://localhost:3000/api/admin/team'));
      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.ok(data.error.includes('strictly reserved for the Site Owner'));
    });

    it('should REJECT staff on /api/admin/settings/payment (403)', async () => {
      const res = await getPaymentSettings(createMockRequest('http://localhost:3000/api/admin/settings/payment'));
      assert.strictEqual(res.status, 403);
    });

    it('should REJECT staff on sections they do NOT possess (payments, quizzes, cohorts)', async () => {
      const payRes = await getAdminPayments(createMockRequest('http://localhost:3000/api/admin/payments'));
      assert.strictEqual(payRes.status, 403);

      const quizRes = await postQuiz(createMockRequest('http://localhost:3000/api/quizzes', {
        method: 'POST',
        body: { courseId: 'what-is-astrology', title: 'Staff Quiz' },
      }));
      assert.strictEqual(quizRes.status, 403);

      const cohortRes = await postCohort(createMockRequest('http://localhost:3000/api/cohorts', {
        method: 'POST',
        body: { batchName: 'Staff Cohort' },
      }));
      assert.strictEqual(cohortRes.status, 403);
    });

    it('should REJECT staff attempting to delete courses (Owner-only)', async () => {
      const delRes = await deleteCourseSlug(createMockRequest('http://localhost:3000/api/courses/what-is-astrology', {
        method: 'DELETE',
      }), { params: { slug: 'what-is-astrology' } });
      assert.strictEqual(delRes.status, 403);
    });
  });

  // =========================================================================
  // 5. PERSONA 4: SITE OWNER
  // =========================================================================
  describe('5. Owner Persona: Full Access Across All Sections', () => {
    beforeEach(() => {
      setTestAuthUser(OWNER_PERSONA);
    });

    it('should authorize Owner across all admin sections', () => {
      assert.strictEqual(isAuthorizedForSection(OWNER_PERSONA, 'courses'), true);
      assert.strictEqual(isAuthorizedForSection(OWNER_PERSONA, 'payments'), true);
      assert.strictEqual(isAuthorizedForSection(OWNER_PERSONA, 'students'), true);
      assert.strictEqual(isAuthorizedForSection(OWNER_PERSONA, 'content'), true);
      assert.strictEqual(isAuthorizedForSection(OWNER_PERSONA, 'staff'), true);
    });

    it('should allow Owner on /api/admin/team with 200', async () => {
      const res = await getTeam(createMockRequest('http://localhost:3000/api/admin/team'));
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
    });

    it('should allow Owner on /api/admin/settings/payment with 200', async () => {
      const res = await getPaymentSettings(createMockRequest('http://localhost:3000/api/admin/settings/payment'));
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
    });

    it('should allow Owner on /api/admin/payments without 401 or 403', async () => {
      const res = await getAdminPayments(createMockRequest('http://localhost:3000/api/admin/payments'));
      assert.notStrictEqual(res.status, 401, 'Owner must not be rejected with 401');
      assert.notStrictEqual(res.status, 403, 'Owner must not be rejected with 403');
    });

    it('should allow Owner on /api/admin/orders queue without 401 or 403', async () => {
      const res = await getAdminOrders(createMockRequest('http://localhost:3000/api/admin/orders'));
      assert.notStrictEqual(res.status, 401, 'Owner must not be rejected with 401');
      assert.notStrictEqual(res.status, 403, 'Owner must not be rejected with 403');
    });

    it('should allow Owner on /api/admin/content with 200', async () => {
      const res = await getAdminContent(createMockRequest('http://localhost:3000/api/admin/content'));
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
    });

    it('should allow Owner on /api/admin/knowledge without 401 or 403', async () => {
      const res = await getAdminKnowledge(createMockRequest('http://localhost:3000/api/admin/knowledge'));
      assert.notStrictEqual(res.status, 401, 'Owner must not be rejected with 401');
      assert.notStrictEqual(res.status, 403, 'Owner must not be rejected with 403');
    });
  });

  // =========================================================================
  // 6. DATABASE USER ID AS FOREIGN KEY SOURCE OF TRUTH
  // =========================================================================
  describe('6. Foreign-Key Integrity: Database User ID vs Clerk ID', () => {
    it('getServerAuthUser returns dbUser.id as userId and clerkId separately', async () => {
      setTestAuthUser(STUDENT_PERSONA);
      const auth = await getServerAuthUser();
      assert.strictEqual(auth.userId, 'db-student-cuid-101');
      assert.strictEqual(auth.clerkId, 'user_clerk_student_101');
      assert.notStrictEqual(auth.userId, auth.clerkId);
    });

    it('Owner account returns database ID for foreign-key relations', async () => {
      setTestAuthUser(OWNER_PERSONA);
      const auth = await getServerAuthUser();
      assert.strictEqual(auth.userId, 'db-owner-cuid-001');
      assert.strictEqual(auth.clerkId, 'user_clerk_owner_001');
    });
  });

  // =========================================================================
  // 7. UNIFIED PERMISSION POLICY MATRIX (policy.ts)
  // =========================================================================
  describe('7. Unified Permission Policy Matrix Verification', () => {
    // 1. Payment approvals, payment settings, grant or revoke enrolment, team, diagnostics, legal text
    it('Owner-Only Areas: Owner: Yes | Staff: No | Student: No', () => {
      const ownerOnlyAreas = [
        'payment_approvals',
        'payment_settings',
        'enrollment_mutation',
        'team',
        'diagnostics',
        'legal_text',
      ] as const;

      for (const area of ownerOnlyAreas) {
        // Owner: Yes
        assert.strictEqual(canAccessArea(OWNER_PERSONA, area), true, `Owner must have access to ${area}`);
        // Staff (even with payments or courses): No
        assert.strictEqual(canAccessArea(STAFF_PAYMENTS_PERSONA, area), false, `Staff must NOT have access to ${area}`);
        assert.strictEqual(canAccessArea(STAFF_COURSES_PERSONA, area), false, `Staff must NOT have access to ${area}`);
        // Student: No
        assert.strictEqual(canAccessArea(STUDENT_PERSONA, area), false, `Student must NOT have access to ${area}`);
        // Unauthenticated: No
        assert.strictEqual(canAccessArea(LOGGED_OUT_PERSONA, area), false, `Logged out visitor must NOT have access to ${area}`);
      }
    });

    // 2. Courses, lessons, quizzes, site content
    it('Courses, Lessons, Quizzes, Site Content: Owner: Yes | Staff (granted): Yes | Student: No', () => {
      // Courses
      assert.strictEqual(canAccessArea(OWNER_PERSONA, 'courses'), true);
      assert.strictEqual(canAccessArea(STAFF_COURSES_PERSONA, 'courses'), true);
      assert.strictEqual(canAccessArea(STAFF_PAYMENTS_PERSONA, 'courses'), false);
      assert.strictEqual(canAccessArea(STUDENT_PERSONA, 'courses'), false);

      // Quizzes
      assert.strictEqual(canAccessArea(OWNER_PERSONA, 'quizzes'), true);
      assert.strictEqual(canAccessArea(STAFF_COURSES_PERSONA, 'quizzes'), false); // Only has 'courses'
      assert.strictEqual(canAccessArea(STUDENT_PERSONA, 'quizzes'), false);

      // Site Content (general)
      assert.strictEqual(canAccessArea(OWNER_PERSONA, 'site_content', { collection: 'faqs' }), true);
      assert.strictEqual(canAccessArea(STAFF_COURSES_PERSONA, 'site_content', { collection: 'faqs' }), false);
      assert.strictEqual(canAccessArea(STUDENT_PERSONA, 'site_content', { collection: 'faqs' }), false);

      // Site Content with legal or pricing collection is strictly Owner-only
      assert.strictEqual(canAccessArea(OWNER_PERSONA, 'site_content', { collection: 'legal' }), true);
      assert.strictEqual(canAccessArea(STAFF_COURSES_PERSONA, 'site_content', { collection: 'legal' }), false);
    });

    // 3. Student roster (read only: Owner: Yes | Staff with students: Yes | Student: No)
    it('Student Roster: Owner: Yes | Staff (students section): Yes | Student: No', () => {
      const staffWithStudents: ServerAuthResult = {
        ...STAFF_COURSES_PERSONA,
        staffSections: ['students'],
      };

      assert.strictEqual(canAccessArea(OWNER_PERSONA, 'student_roster'), true);
      assert.strictEqual(canAccessArea(staffWithStudents, 'student_roster'), true);
      assert.strictEqual(canAccessArea(STAFF_COURSES_PERSONA, 'student_roster'), false);
      assert.strictEqual(canAccessArea(STUDENT_PERSONA, 'student_roster'), false);
    });

    // 4. Own enrolments, progress, orders, receipts, certificates
    it('Own Data: Owner: Yes | Staff: Yes | Student: Own data only', () => {
      // Student querying own data
      assert.strictEqual(
        canAccessArea(STUDENT_PERSONA, 'own_data', { targetUserId: 'db-student-cuid-101' }),
        true,
        'Student must access own data by DB user id'
      );
      assert.strictEqual(
        canAccessArea(STUDENT_PERSONA, 'own_data', { targetUserId: 'self' }),
        true,
        'Student must access own data by "self"'
      );
      assert.strictEqual(
        canAccessArea(STUDENT_PERSONA, 'own_data', { targetUserId: 'me' }),
        true,
        'Student must access own data by "me"'
      );
      assert.strictEqual(
        canAccessArea(STUDENT_PERSONA, 'own_data'),
        true,
        'Student must access own data when targetUserId is omitted'
      );

      // Student querying someone else's data -> REJECTED
      assert.strictEqual(
        canAccessArea(STUDENT_PERSONA, 'own_data', { targetUserId: 'db-other-student-999' }),
        false,
        'Student must NOT access other students data'
      );

      // Staff without students section querying other students -> REJECTED
      assert.strictEqual(
        canAccessArea(STAFF_COURSES_PERSONA, 'own_data', { targetUserId: 'db-other-student-999' }),
        false
      );

      // Staff WITH students section querying other students -> ALLOWED
      const staffWithStudents: ServerAuthResult = {
        ...STAFF_COURSES_PERSONA,
        staffSections: ['students'],
      };
      assert.strictEqual(
        canAccessArea(staffWithStudents, 'own_data', { targetUserId: 'db-other-student-999' }),
        true
      );

      // Owner querying other students -> ALLOWED
      assert.strictEqual(
        canAccessArea(OWNER_PERSONA, 'own_data', { targetUserId: 'db-other-student-999' }),
        true
      );
    });
  });

  // =========================================================================
  // 8. PAYMENT APPROVALS & ENROLLMENT MUTATION ROLE BOUNDARIES
  // =========================================================================
  describe('8. Payment Approvals & Enrollment Mutation Route Enforcement', () => {
    it('should REJECT staff with payments section on payment approvals (POST /api/admin/payments)', async () => {
      setTestAuthUser(STAFF_PAYMENTS_PERSONA);
      const res = await postAdminPayment(createMockRequest('http://localhost:3000/api/admin/payments', {
        method: 'POST',
        body: { paymentId: 'pay-test-1', action: 'VERIFY' },
      }));
      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.ok(data.error.includes('Site Owner only'));
    });

    it('should REJECT staff with payments section on order approvals (POST /api/admin/orders/[id])', async () => {
      setTestAuthUser(STAFF_PAYMENTS_PERSONA);
      const res = await postAdminOrderAction(createMockRequest('http://localhost:3000/api/admin/orders/ord-test-1', {
        method: 'POST',
        body: { action: 'APPROVE', bankConfirmed: true },
      }), { params: { id: 'ord-test-1' } });
      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.ok(data.error.includes('Site Owner'));
    });

    it('should REJECT staff with students section on manual enrollment granting (/api/enrollments/grant)', async () => {
      const staffWithStudents: ServerAuthResult = {
        ...STAFF_COURSES_PERSONA,
        staffSections: ['students'],
      };
      setTestAuthUser(staffWithStudents);
      const res = await grantEnrollment(createMockRequest('http://localhost:3000/api/enrollments/grant', {
        method: 'POST',
        body: { studentName: 'Test Student', studentEmail: 'test@example.com', reason: 'Manual scholarship grant' },
      }));
      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.ok(data.error.includes('Site Owner only'));
    });

    it('should REJECT staff with students section on enrollment revocation (/api/enrollments/revoke)', async () => {
      const staffWithStudents: ServerAuthResult = {
        ...STAFF_COURSES_PERSONA,
        staffSections: ['students'],
      };
      setTestAuthUser(staffWithStudents);
      const res = await revokeEnrollment(createMockRequest('http://localhost:3000/api/enrollments/revoke', {
        method: 'POST',
        body: { enrollmentId: 'enr-test-1', reason: 'Student refund requested' },
      }));
      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.ok(data.error.includes('Site Owner only'));
    });
  });
});
