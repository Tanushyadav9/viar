import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { POST as grantEnrollment } from '../src/app/api/enrollments/grant/route.ts';
import { POST as postSession } from '../src/app/api/sessions/route.ts';
import { GET as getTeam, POST as postTeam, DELETE as deleteTeam } from '../src/app/api/admin/team/route.ts';
import { ViarStore } from '../src/lib/store.ts';
import { setTestAuthUser, type ServerAuthResult } from '../src/lib/auth/serverAuth.ts';

// Persona Definitions matching serverAuth
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

const STAFF_CONTENT_ONLY_PERSONA: ServerAuthResult = {
  isAuthenticated: true,
  userId: 'db-staff-cuid-203',
  clerkId: 'user_clerk_staff_203',
  email: 'staff.content@viar.in',
  isEmailVerified: true,
  isOwner: false,
  isStaff: true,
  staffSections: ['content'],
  role: 'ADMIN',
  dbUser: {
    id: 'db-staff-cuid-203',
    clerkId: 'user_clerk_staff_203',
    email: 'staff.content@viar.in',
    name: 'Content Editor',
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

function createMockRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: Record<string, unknown>;
  } = {}
) {
  const { method = 'GET', headers = {}, body } = options;
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method,
    headers: new Headers({
      'content-type': 'application/json',
      ...headers,
    }),
    body: body ? JSON.stringify(body) : undefined,
  });
}

// Mock window and localStorage for thin preference cache test
if (typeof (globalThis as unknown as { window?: unknown }).window === 'undefined') {
  const memoryStore: Record<string, string> = {};
  (globalThis as unknown as { window: unknown }).window = {
    location: { origin: 'http://localhost:3000' },
  };
  (globalThis as unknown as { localStorage: unknown }).localStorage = {
    getItem: (key: string) => memoryStore[key] ?? null,
    setItem: (key: string, val: string) => {
      memoryStore[key] = String(val);
    },
    removeItem: (key: string) => {
      delete memoryStore[key];
    },
    clear: () => {
      for (const k of Object.keys(memoryStore)) delete memoryStore[k];
    },
  };
}

describe('THE ADMIN CONSOLE ON THE DATABASE — Comprehensive Specification', () => {
  beforeEach(() => {
    setTestAuthUser(undefined);
  });

  afterEach(() => {
    setTestAuthUser(undefined);
  });

  describe('1. Manual Enrollment Grant (POST /api/enrollments/grant)', () => {
    it('strictly enforces Owner-only access (rejects unauthenticated caller with 403)', async () => {
      setTestAuthUser(LOGGED_OUT_PERSONA);
      const req = createMockRequest('http://localhost:3000/api/enrollments/grant', {
        method: 'POST',
        body: {
          studentName: 'Test Student',
          studentEmail: 'student@example.com',
          reason: 'Scholarship grant',
        },
      });

      const res = await grantEnrollment(req);
      assert.strictEqual(res.status, 403, 'Unauthenticated caller must receive 403 Forbidden');
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.error.includes('Site Owner only'), true);
    });

    it('rejects student persona with 403 Forbidden', async () => {
      setTestAuthUser(STUDENT_PERSONA);
      const req = createMockRequest('http://localhost:3000/api/enrollments/grant', {
        method: 'POST',
        body: {
          studentName: 'Student Self',
          studentEmail: 'student@example.com',
          reason: 'Self Grant Attempt',
        },
      });

      const res = await grantEnrollment(req);
      assert.strictEqual(res.status, 403);
    });

    it('rejects staff persona (even with courses section) with 403 Forbidden', async () => {
      setTestAuthUser(STAFF_COURSES_PERSONA);
      const req = createMockRequest('http://localhost:3000/api/enrollments/grant', {
        method: 'POST',
        body: {
          studentName: 'Staff Friend',
          studentEmail: 'friend@example.com',
          reason: 'Staff Attempt',
        },
      });

      const res = await grantEnrollment(req);
      assert.strictEqual(res.status, 403);
    });

    it('strictly requires a specific non-empty reason for manual grant (rejects empty/whitespace with 400)', async () => {
      setTestAuthUser(OWNER_PERSONA);
      const req = createMockRequest('http://localhost:3000/api/enrollments/grant', {
        method: 'POST',
        body: {
          studentName: 'Rohan Sharma',
          studentEmail: 'rohan@example.com',
          courseId: 'what-is-astrology',
          reason: '   ', // whitespace only
        },
      });

      const res = await grantEnrollment(req);
      assert.strictEqual(res.status, 400, 'Must return 400 when reason is whitespace or omitted');
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.error.includes('strictly required'), true);
    });

    it('rejects missing studentName or studentEmail with 400', async () => {
      setTestAuthUser(OWNER_PERSONA);
      const req = createMockRequest('http://localhost:3000/api/enrollments/grant', {
        method: 'POST',
        body: {
          studentName: '',
          studentEmail: 'rohan@example.com',
          reason: 'Offline ashram registration',
        },
      });

      const res = await grantEnrollment(req);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.error.includes('required'), true);
    });
  });

  describe('2. Class and Session Edits (POST /api/sessions)', () => {
    it('rejects unauthenticated caller with 403 Forbidden', async () => {
      setTestAuthUser(LOGGED_OUT_PERSONA);
      const req = createMockRequest('http://localhost:3000/api/sessions', {
        method: 'POST',
        body: {
          sessionId: 'cls-wia-01',
          joinUrl: 'https://zoom.us/j/1234567890',
        },
      });

      const res = await postSession(req);
      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.error.includes('Courses or cohorts permission required'), true);
    });

    it('rejects student persona with 403 Forbidden', async () => {
      setTestAuthUser(STUDENT_PERSONA);
      const req = createMockRequest('http://localhost:3000/api/sessions', {
        method: 'POST',
        body: {
          sessionId: 'cls-wia-01',
          joinUrl: 'https://zoom.us/j/1234567890',
        },
      });

      const res = await postSession(req);
      assert.strictEqual(res.status, 403);
    });

    it('rejects staff without courses/cohorts permission with 403', async () => {
      setTestAuthUser(STAFF_CONTENT_ONLY_PERSONA);
      const req = createMockRequest('http://localhost:3000/api/sessions', {
        method: 'POST',
        body: {
          sessionId: 'cls-wia-01',
          joinUrl: 'https://zoom.us/j/1234567890',
        },
      });

      const res = await postSession(req);
      assert.strictEqual(res.status, 403);
    });

    it('requires sessionId or cohortId in POST body', async () => {
      setTestAuthUser(OWNER_PERSONA);
      const req = createMockRequest('http://localhost:3000/api/sessions', {
        method: 'POST',
        body: {
          title: 'Orphan Session',
        },
      });

      const res = await postSession(req);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.error.includes('sessionId or cohortId is required'), true);
    });

    it('allows Owner to update session details and returns updated session', async () => {
      setTestAuthUser(OWNER_PERSONA);
      const req = createMockRequest('http://localhost:3000/api/sessions', {
        method: 'POST',
        body: {
          sessionId: 'cls-wia-02',
          cohortId: 'cohort-wia-batch-1',
          sessionNumber: 2,
          title: 'Class 2: The 12 Bhavas Explained',
          joinUrl: 'https://meet.google.com/abc-defg-hij',
          meetingPlatform: 'GOOGLE_MEET',
          status: 'LIVE',
          recordingUrl: 'https://www.youtube.com/watch?v=sample2',
          notesMarkdown: 'Class 2 notes and homework assignment.',
        },
      });

      const res = await postSession(req);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.session);
    });

    it('allows Staff with courses permission to edit session', async () => {
      setTestAuthUser(STAFF_COURSES_PERSONA);
      const req = createMockRequest('http://localhost:3000/api/sessions', {
        method: 'POST',
        body: {
          sessionId: 'cls-wia-03',
          cohortId: 'cohort-wia-batch-1',
          sessionNumber: 3,
          title: 'Class 3: Navamsha Dynamics',
          status: 'UPCOMING',
          joinUrl: 'https://zoom.us/j/9876543210',
        },
      });

      const res = await postSession(req);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
    });
  });

  describe('3. Team & Staff Management (API & Verified Helper)', () => {
    it('/api/admin/team GET rejects unauthenticated callers with 403', async () => {
      setTestAuthUser(LOGGED_OUT_PERSONA);
      const res = await getTeam();
      assert.strictEqual(res.status, 403);
    });

    it('/api/admin/team GET rejects students with 403', async () => {
      setTestAuthUser(STUDENT_PERSONA);
      const res = await getTeam();
      assert.strictEqual(res.status, 403);
    });

    it('/api/admin/team GET rejects non-owner staff with 403', async () => {
      setTestAuthUser(STAFF_COURSES_PERSONA);
      const res = await getTeam();
      assert.strictEqual(res.status, 403);
    });

    it('/api/admin/team GET allows Owner with 200', async () => {
      setTestAuthUser(OWNER_PERSONA);
      const res = await getTeam();
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(Array.isArray(data.staff), true);
      assert.strictEqual(Array.isArray(data.permissions), true);
    });

    it('DELETE /api/admin/team requires permissionId or userId', async () => {
      setTestAuthUser(OWNER_PERSONA);
      const req = createMockRequest('http://localhost:3000/api/admin/team', {
        method: 'DELETE',
      });

      const res = await deleteTeam(req);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
    });
  });

  describe('4. ViarStore Retirement as Source of Truth', () => {
    it('store fallback returns empty array for certificates (zero demo certificates)', () => {
      const certs = ViarStore.getCertificates();
      assert.strictEqual(Array.isArray(certs), true);
      assert.strictEqual(certs.length, 0, 'Must not return seeded demo certificates');
    });

    it('store fallback returns empty array for enrollments (zero demo enrollments)', () => {
      const enrollments = ViarStore.getEnrollments();
      assert.strictEqual(Array.isArray(enrollments), true);
      assert.strictEqual(enrollments.length, 0, 'Must not return seeded demo enrollments');
    });

    it('store fallback returns empty array for staff users (zero demo staff users)', () => {
      const staff = ViarStore.getStaffUsers();
      assert.strictEqual(Array.isArray(staff), true);
      assert.strictEqual(staff.length, 0, 'Must not return seeded demo staff users');
    });

    it('store fallback returns empty array for staff permissions (zero demo permissions)', () => {
      const perms = ViarStore.getStaffPermissions();
      assert.strictEqual(Array.isArray(perms), true);
      assert.strictEqual(perms.length, 0, 'Must not return seeded demo permissions');
    });

    it('timezone preference persists in thin client cache without violating server truth', () => {
      ViarStore.setTimezone('America/New_York');
      assert.strictEqual(ViarStore.getTimezone(), 'America/New_York');
      ViarStore.setTimezone('Asia/Kolkata');
      assert.strictEqual(ViarStore.getTimezone(), 'Asia/Kolkata');
    });
  });
});
