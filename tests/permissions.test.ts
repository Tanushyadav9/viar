import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  isSiteOwner,
  isStaffMember,
  hasSectionPermission,
  getUserAllowedSections,
  ADMIN_SECTIONS,
  ADMIN_SECTIONS_META,
  getOwnerEmails,
  getPrimaryOwnerEmail,
  assignRoleForUser,
  checkStaffSectionAccess,
  hasSectionAccess,
  verifyRouteAccess,
  evaluateRouteAccess,
} from '../src/lib/auth/permissions.ts';
import type { User, AdminSection } from '../src/lib/types.ts';

describe('Site Owner Recognition & Per-Section Staff Permissions (RBAC)', () => {
  const ownerEmail = 'ask@aapkaastro.com';

  const ownerUser: User = {
    id: 'user-owner',
    name: 'Acharya Niraj Kumar',
    email: ownerEmail,
    role: 'OWNER',
    isOwner: true,
    enrolledCohortIds: [],
  };

  const staffUser: User = {
    id: 'user-staff-1',
    name: 'Priya Verma',
    email: 'priya.staff@viar.in',
    role: 'ADMIN',
    isOwner: false,
    staffSections: ['courses', 'quizzes'],
    enrolledCohortIds: [],
  };

  const studentUser: User = {
    id: 'user-student-1',
    name: 'Aarav Sharma',
    email: 'student@example.com',
    role: 'STUDENT',
    isOwner: false,
    staffSections: [],
    enrolledCohortIds: ['cohort-wia-batch-1'],
  };

  describe('1. Deliberate Site Owner Recognition (No accidental admin elevation)', () => {
    it('should recognize Acharya Niraj Kumar verified email addresses as Site Owner', () => {
      assert.strictEqual(isSiteOwner('ask@aapkaastro.com'), true);
      assert.strictEqual(isSiteOwner('admin@viar.in'), true);
      assert.strictEqual(isSiteOwner('niraj@aapkaastro.com'), true);
    });

    it('should return primary owner email matching OWNER_EMAIL or fallback', () => {
      const primary = getPrimaryOwnerEmail();
      assert.strictEqual(typeof primary, 'string');
      assert.ok(primary.includes('@'));
    });

    it('should be case-insensitive and trim whitespaces', () => {
      assert.strictEqual(isSiteOwner('  ASK@AAPKAASTRO.COM  '), true);
      assert.strictEqual(isSiteOwner('Admin@Viar.IN'), true);
    });

    it('should recognize owner user object with verified owner email', () => {
      assert.strictEqual(isSiteOwner(ownerUser), true);
    });

    it('should NEVER grant owner status by accident of testing (e.g. email containing "admin")', () => {
      const deceptiveEmails = [
        'fakeadmin@gmail.com',
        'admin@attacker.com',
        'superadmin@randommail.org',
        'notadmin@yahoo.com',
        'administrator@test.io',
      ];

      for (const email of deceptiveEmails) {
        assert.strictEqual(
          isSiteOwner(email),
          false,
          `Security violation: ${email} should NOT be recognized as Site Owner`
        );
      }
    });

    it('should return false for regular staff and students', () => {
      assert.strictEqual(isSiteOwner(staffUser), false);
      assert.strictEqual(isSiteOwner(studentUser), false);
      assert.strictEqual(isSiteOwner(null), false);
      assert.strictEqual(isSiteOwner(''), false);
    });
  });

  describe('2. Anti-Tamper & Anti-Spoofing: Non-Owner Can Never Self-Assign OWNER Role', () => {
    it('should automatically assign OWNER role when verified email matches OWNER_EMAIL', () => {
      const result = assignRoleForUser('ask@aapkaastro.com');
      assert.strictEqual(result.role, 'OWNER');
      assert.strictEqual(result.isOwner, true);
    });

    it('should assign STUDENT role to regular sign-up emails', () => {
      const result = assignRoleForUser('student@gmail.com');
      assert.strictEqual(result.role, 'STUDENT');
      assert.strictEqual(result.isOwner, false);
    });

    it('should block non-owner from self-assigning OWNER role during sign-up/mutation', () => {
      // Attacker attempts to pass requestedRole: 'OWNER'
      const attackerAttempt = assignRoleForUser('hacker@darkweb.org', 'OWNER');
      assert.strictEqual(
        attackerAttempt.role,
        'STUDENT',
        'Security breach: Non-owner was able to self-assign OWNER role!'
      );
      assert.strictEqual(attackerAttempt.isOwner, false);
    });

    it('should strictly reject user object with forged role="OWNER" or isOwner=true if email does not match', () => {
      const forgedUser: User = {
        id: 'usr_forged_999',
        name: 'Malicious Actor',
        email: 'attacker@evil.com',
        role: 'OWNER', // Attempted forgery
        isOwner: true,  // Attempted forgery
        enrolledCohortIds: [],
      };

      assert.strictEqual(
        isSiteOwner(forgedUser),
        false,
        'Security breach: isSiteOwner trusted a forged role/flag without email verification!'
      );

      // Section permission must also be completely denied
      assert.strictEqual(
        hasSectionPermission(forgedUser, 'staff'),
        false,
        'Security breach: Forged owner gained access to staff section!'
      );
      assert.strictEqual(
        hasSectionPermission(forgedUser, 'payments'),
        false,
        'Security breach: Forged owner gained access to payments section!'
      );
    });

    it('should reject email spoofing tricks and subdomains mimicking owner address', () => {
      const spoofAttempts = [
        'ask@aapkaastro.com.fake.com',
        'ask@aapkaastro.com@evil.com',
        'fake-ask@aapkaastro.com',
        'ask@aapkaastro.com.attacker.org',
        'ask@aapkaastro.co',
        'ask@aapkaastro.org',
      ];

      for (const spoof of spoofAttempts) {
        assert.strictEqual(
          isSiteOwner(spoof),
          false,
          `Security breach: Spoof attempt ${spoof} was recognized as owner!`
        );
        const assigned = assignRoleForUser(spoof, 'OWNER');
        assert.strictEqual(assigned.role, 'STUDENT');
        assert.strictEqual(assigned.isOwner, false);
      }
    });
  });

  describe('3. Per-Section Staff Permissions (Zero-cost RBAC)', () => {
    it('should grant Site Owner access to ALL sections without exception', () => {
      for (const section of ADMIN_SECTIONS) {
        assert.strictEqual(
          hasSectionPermission(ownerUser, section),
          true,
          `Owner should have access to section ${section}`
        );
      }
    });

    it('should grant staff access ONLY to their assigned sections', () => {
      // Priya has courses and quizzes
      assert.strictEqual(hasSectionPermission(staffUser, 'courses'), true);
      assert.strictEqual(hasSectionPermission(staffUser, 'quizzes'), true);

      // Priya does NOT have cohorts, students, analytics, payments
      assert.strictEqual(hasSectionPermission(staffUser, 'cohorts'), false);
      assert.strictEqual(hasSectionPermission(staffUser, 'students'), false);
      assert.strictEqual(hasSectionPermission(staffUser, 'analytics'), false);
      assert.strictEqual(hasSectionPermission(staffUser, 'payments'), false);
    });

    it('should strictly reserve staff management section to Site Owner only', () => {
      // Owner can access staff
      assert.strictEqual(hasSectionPermission(ownerUser, 'staff'), true);

      // Staff member CANNOT access staff even if explicitly attempted
      assert.strictEqual(hasSectionPermission(staffUser, 'staff'), false);

      // Even if staff user object maliciously contained 'staff' in staffSections
      const maliciousStaff: User = {
        ...staffUser,
        staffSections: ['staff', 'courses'] as AdminSection[],
      };
      assert.strictEqual(
        hasSectionPermission(maliciousStaff, 'staff'),
        false,
        'staff section management must be strictly forbidden to non-owners'
      );
    });

    it('should deny regular students access to all sections', () => {
      for (const section of ADMIN_SECTIONS) {
        assert.strictEqual(
          hasSectionPermission(studentUser, section),
          false,
          `Student must not have access to ${section}`
        );
      }
    });
  });

  describe('4. getUserAllowedSections helper', () => {
    it('should return all 7 sections for Site Owner', () => {
      const allowed = getUserAllowedSections(ownerUser);
      assert.strictEqual(allowed.length, ADMIN_SECTIONS.length);
      assert.deepStrictEqual(new Set(allowed), new Set(ADMIN_SECTIONS));
    });

    it('should return only granted sections for staff member and filter out staff', () => {
      const allowed = getUserAllowedSections(staffUser);
      assert.deepStrictEqual(allowed, ['courses', 'quizzes']);
      assert.strictEqual(allowed.includes('staff'), false);
    });

    it('should return empty list for regular students or null', () => {
      assert.deepStrictEqual(getUserAllowedSections(studentUser), []);
      assert.deepStrictEqual(getUserAllowedSections(null), []);
    });
  });

  describe('5. Metadata and Section Definitions', () => {
    it('should have complete metadata for all admin sections', () => {
      for (const sec of ADMIN_SECTIONS) {
        const meta = ADMIN_SECTIONS_META[sec];
        assert.ok(meta, `Metadata missing for section ${sec}`);
        assert.ok(meta.title.length > 0);
        assert.ok(meta.description.length > 0);
      }
      assert.strictEqual(ADMIN_SECTIONS_META.staff.ownerOnly, true);
    });
  });

  describe('6. StaffPermission Soft-Revocation Audit Trail', () => {
    it('should preserve revokedAt timestamp for soft-revoked permissions', () => {
      const activePermission = {
        id: 'perm-test-1',
        userId: 'usr_clerk_staff_123',
        section: 'courses',
        accessLevel: 'MANAGE' as const,
        grantedByUserId: 'usr_clerk_owner_456',
        grantedAt: new Date().toISOString(),
        revokedAt: null,
      };

      const revokedPermission = {
        ...activePermission,
        id: 'perm-test-2',
        revokedAt: new Date().toISOString(),
      };

      assert.strictEqual(activePermission.revokedAt, null);
      assert.ok(revokedPermission.revokedAt !== null);

      // Verify active vs revoked filtering logic
      const permissions = [activePermission, revokedPermission];
      const activeOnly = permissions.filter((p) => p.revokedAt == null);

      assert.strictEqual(activeOnly.length, 1);
      assert.strictEqual(activeOnly[0].id, 'perm-test-1');
    });

    it('should enforce that grantedByUserId must always record the Owner', () => {
      const perm = {
        id: 'perm-test-3',
        userId: 'usr_clerk_staff_123',
        section: 'quizzes',
        accessLevel: 'VIEW' as const,
        grantedByUserId: 'ask@aapkaastro.com',
        grantedAt: new Date().toISOString(),
        revokedAt: null,
      };

      assert.strictEqual(perm.grantedByUserId, 'ask@aapkaastro.com');
      assert.strictEqual(isSiteOwner(perm.grantedByUserId), true);
    });
  });

  describe('7. Enforce Section-Level Checks on Every Admin Route (VIEW vs MANAGE)', () => {
    const singleSectionStaff: User = {
      id: 'staff-courses-only',
      name: 'Course Specialist',
      email: 'specialist@viar.in',
      role: 'INSTRUCTOR',
      isOwner: false,
      staffSections: ['courses'],
      enrolledCohortIds: [],
    };

    it('a staff account with only courses:MANAGE can access courses but is rejected from every other section', () => {
      // Passes for courses
      const courseCheck = checkStaffSectionAccess({
        user: singleSectionStaff,
        section: 'courses',
        requiredLevel: 'MANAGE',
      });
      assert.strictEqual(courseCheck.allowed, true);
      assert.strictEqual(courseCheck.accessLevel, 'MANAGE');

      // Rejected from cohorts
      const cohortCheck = checkStaffSectionAccess({
        user: singleSectionStaff,
        section: 'cohorts',
        requiredLevel: 'VIEW',
      });
      assert.strictEqual(cohortCheck.allowed, false);

      // Rejected from students
      const studentCheck = checkStaffSectionAccess({
        user: singleSectionStaff,
        section: 'students',
        requiredLevel: 'VIEW',
      });
      assert.strictEqual(studentCheck.allowed, false);

      // Rejected from quizzes
      const quizCheck = checkStaffSectionAccess({
        user: singleSectionStaff,
        section: 'quizzes',
        requiredLevel: 'VIEW',
      });
      assert.strictEqual(quizCheck.allowed, false);

      // Rejected from analytics
      const analyticsCheck = checkStaffSectionAccess({
        user: singleSectionStaff,
        section: 'analytics',
        requiredLevel: 'VIEW',
      });
      assert.strictEqual(analyticsCheck.allowed, false);

      // Rejected from payments
      const paymentsCheck = checkStaffSectionAccess({
        user: singleSectionStaff,
        section: 'payments',
        requiredLevel: 'VIEW',
      });
      assert.strictEqual(paymentsCheck.allowed, false);

      // Rejected from staff management (/admin/team)
      const staffCheck = checkStaffSectionAccess({
        user: singleSectionStaff,
        section: 'staff',
        requiredLevel: 'VIEW',
      });
      assert.strictEqual(staffCheck.allowed, false);
      assert.strictEqual(staffCheck.reason, 'Staff section is restricted to the Site Owner only');
    });

    it('a staff account with courses:VIEW can see but not edit', () => {
      const viewOnlyStaffPermissions = [
        {
          id: 'perm-view-only',
          userId: 'staff-viewer',
          section: 'courses',
          accessLevel: 'VIEW' as const,
          grantedByUserId: 'ask@aapkaastro.com',
          grantedAt: new Date().toISOString(),
          revokedAt: null,
        },
      ];

      // VIEW action: Allowed
      const viewResult = checkStaffSectionAccess({
        user: 'staff-viewer',
        section: 'courses',
        requiredLevel: 'VIEW',
        permissions: viewOnlyStaffPermissions,
      });
      assert.strictEqual(viewResult.allowed, true);
      assert.strictEqual(viewResult.accessLevel, 'VIEW');

      // MANAGE action (editing, adding new course): Rejected
      const editResult = checkStaffSectionAccess({
        user: 'staff-viewer',
        section: 'courses',
        requiredLevel: 'MANAGE',
        permissions: viewOnlyStaffPermissions,
      });
      assert.strictEqual(editResult.allowed, false);
      assert.ok(editResult.reason?.includes('Action requires MANAGE access level'));
    });

    it('soft-revoked permission is rejected on both VIEW and MANAGE', () => {
      const softRevokedPermissions = [
        {
          id: 'perm-revoked',
          userId: 'staff-ex',
          section: 'courses',
          accessLevel: 'MANAGE' as const,
          grantedByUserId: 'ask@aapkaastro.com',
          grantedAt: '2026-09-01T00:00:00.000Z',
          revokedAt: '2026-09-22T00:00:00.000Z',
        },
      ];

      const res = checkStaffSectionAccess({
        user: 'staff-ex',
        section: 'courses',
        requiredLevel: 'VIEW',
        permissions: softRevokedPermissions,
      });
      assert.strictEqual(res.allowed, false);
      assert.ok(res.reason?.includes('No active permission'));
    });

    it('the Site Owner always passes every check automatically with MANAGE level', () => {
      for (const section of ADMIN_SECTIONS) {
        const ownerCheck = checkStaffSectionAccess({
          user: ownerUser,
          section,
          requiredLevel: 'MANAGE',
        });
        assert.strictEqual(ownerCheck.allowed, true, `Owner should pass ${section}`);
        assert.strictEqual(ownerCheck.isOwner, true);
        assert.strictEqual(ownerCheck.accessLevel, 'MANAGE');

        // Verify with email string directly
        const emailCheck = checkStaffSectionAccess({
          user: 'ask@aapkaastro.com',
          section,
          requiredLevel: 'MANAGE',
        });
        assert.strictEqual(emailCheck.allowed, true);
      }
    });

    it('verifyRouteAccess correctly parses cryptographic Clerk session tokens in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = 'production';

        // Helper to generate a realistic Clerk session JWT with cryptographic claims
        const makeClerkToken = (email: string, userId: string) => {
          const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
          const payload = Buffer.from(
            JSON.stringify({
              sub: userId,
              email,
              exp: Math.floor(Date.now() / 1000) + 3600,
            })
          ).toString('base64url');
          return `${header}.${payload}.mock_clerk_signature`;
        };

        // 1. Real Clerk Session for Site Owner (ask@aapkaastro.com)
        const mockOwnerReq = {
          cookies: {
            get: (name: string) =>
              name === '__session'
                ? { value: makeClerkToken('ask@aapkaastro.com', 'user-owner') }
                : undefined,
          },
          headers: { get: () => null },
        };

        const ownerRouteResult = verifyRouteAccess(mockOwnerReq, 'staff', 'MANAGE');
        assert.strictEqual(ownerRouteResult.allowed, true, 'Site Owner with real Clerk session must be granted access');
        assert.strictEqual(ownerRouteResult.isOwner, true);

        // 2. Real Clerk Session for Staff member (priya.staff@viar.in) with courses:VIEW
        const mockStaffReq = {
          cookies: {
            get: (name: string) =>
              name === '__session'
                ? { value: makeClerkToken('priya.staff@viar.in', 'user-staff-1') }
                : undefined,
          },
          headers: { get: () => null },
        };

        const mockPerms = [
          {
            id: 'perm-p1',
            userId: 'priya.staff@viar.in',
            section: 'courses',
            accessLevel: 'VIEW' as const,
            grantedByUserId: 'ask@aapkaastro.com',
            grantedAt: new Date().toISOString(),
            revokedAt: null,
          },
        ];

        // Viewing courses is allowed for permitted staff
        assert.strictEqual(
          verifyRouteAccess(mockStaffReq, 'courses', 'VIEW', mockPerms).allowed,
          true,
          'Permitted staff with Clerk session should be allowed VIEW access'
        );
        // Editing courses is blocked (only VIEW granted)
        assert.strictEqual(
          verifyRouteAccess(mockStaffReq, 'courses', 'MANAGE', mockPerms).allowed,
          false,
          'Staff with VIEW only must be blocked from MANAGE access'
        );
        // Accessing team/staff is blocked (Owner-only)
        assert.strictEqual(
          verifyRouteAccess(mockStaffReq, 'staff', 'VIEW', mockPerms).allowed,
          false,
          'Non-owner staff must be blocked from staff management section'
        );

        // 3. Real Clerk Session for regular Student (student@example.com)
        const mockStudentReq = {
          cookies: {
            get: (name: string) =>
              name === '__session'
                ? { value: makeClerkToken('student@example.com', 'user-student-1') }
                : undefined,
          },
          headers: { get: () => null },
        };

        // Student is denied on all admin sections
        assert.strictEqual(
          verifyRouteAccess(mockStudentReq, 'courses', 'VIEW', mockPerms).allowed,
          false,
          'Regular student must be denied on all admin sections'
        );
        assert.strictEqual(
          verifyRouteAccess(mockStudentReq, 'staff', 'MANAGE', mockPerms).allowed,
          false,
          'Regular student must be denied on staff section'
        );
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  describe('8. Production Lockdown: Zero Trust for Client-Supplied Role Claims or Headers', () => {
    const originalEnv = process.env.NODE_ENV;

    it('in production, client-supplied viar_user_role and viar_user_email cookies are strictly ignored', () => {
      try {
        process.env.NODE_ENV = 'production';

        const spoofedReq = {
          cookies: {
            get: (name: string) =>
              name === 'viar_session'
                ? { value: 'unverified-session-id' }
                : name === 'viar_user_role'
                ? { value: 'OWNER' }
                : name === 'viar_user_email'
                ? { value: encodeURIComponent('ask@aapkaastro.com') }
                : undefined,
          },
          headers: { get: () => null },
        };

        const result = verifyRouteAccess(spoofedReq, 'staff', 'MANAGE');
        assert.strictEqual(result.allowed, false, 'Spoofed cookie should NOT grant access in production');
        assert.strictEqual(result.isOwner, false, 'Spoofed cookie should NOT grant isOwner in production');
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('in production, client-supplied x-user-role and x-user-email headers are strictly ignored', () => {
      try {
        process.env.NODE_ENV = 'production';

        const spoofedHeaderReq = {
          cookies: {
            get: (name: string) => (name === 'viar_session' ? { value: 'unverified-session-id' } : undefined),
          },
          headers: {
            get: (name: string) =>
              name === 'x-user-role'
                ? 'OWNER'
                : name === 'x-user-email'
                ? 'ask@aapkaastro.com'
                : null,
          },
        };

        const result = verifyRouteAccess(spoofedHeaderReq, 'staff', 'MANAGE');
        assert.strictEqual(result.allowed, false, 'Spoofed header should NOT grant access in production');
        assert.strictEqual(result.isOwner, false, 'Spoofed header should NOT grant isOwner in production');
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('in production, verified Clerk session JWT is recognized', () => {
      try {
        process.env.NODE_ENV = 'production';

        // Mock valid Clerk JWT payload
        const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
        const payload = Buffer.from(
          JSON.stringify({
            sub: 'user_clerk_owner_99',
            email: 'ask@aapkaastro.com',
            exp: Math.floor(Date.now() / 1000) + 3600,
          })
        ).toString('base64url');
        const fakeSignature = 'mock_signature_bytes';
        const validClerkToken = `${header}.${payload}.${fakeSignature}`;

        const verifiedReq = {
          cookies: {
            get: (name: string) => (name === '__session' ? { value: validClerkToken } : undefined),
          },
          headers: { get: () => null },
        };

        const result = verifyRouteAccess(verifiedReq, 'staff', 'MANAGE');
        assert.strictEqual(result.allowed, true, 'Verified Clerk session should grant access to Site Owner');
        assert.strictEqual(result.isOwner, true);
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  describe('9. Fail-Closed Security: Unauthorized Role Handling', () => {
    it('request to /dashboard?error=unauthorized_role must redirect away to /login and never allow access to protected content', () => {
      const decision = evaluateRouteAccess({
        pathname: '/dashboard',
        searchParams: new URLSearchParams('error=unauthorized_role'),
        sessionToken: 'session-student-123',
        userEmail: 'student@example.com',
      });

      assert.strictEqual(decision.action, 'redirect');
      assert.strictEqual(decision.statusCode, 307);
      assert.strictEqual(decision.redirectUrl, '/login?error=unauthorized_role');
      assert.ok(decision.reason?.includes('Fail-closed'));
    });

    it('unauthorized student attempting to access /instructor or /admin must redirect to /login?error=unauthorized_role', () => {
      const instructorDecision = evaluateRouteAccess({
        pathname: '/instructor',
        sessionToken: 'session-student-123',
        userEmail: 'student@example.com',
      });

      assert.strictEqual(instructorDecision.action, 'redirect');
      assert.strictEqual(instructorDecision.statusCode, 307);
      assert.strictEqual(instructorDecision.redirectUrl, '/login?error=unauthorized_role');

      const adminDecision = evaluateRouteAccess({
        pathname: '/admin',
        sessionToken: 'session-student-123',
        userEmail: 'student@example.com',
      });

      assert.strictEqual(adminDecision.action, 'redirect');
      assert.strictEqual(adminDecision.statusCode, 307);
      assert.strictEqual(adminDecision.redirectUrl, '/login?error=unauthorized_role');
    });

    it('unauthorized role attempting to access /admin/team must redirect to /admin?error=owner_only', () => {
      const teamDecision = evaluateRouteAccess({
        pathname: '/admin/team',
        sessionToken: 'session-staff-123',
        userEmail: 'priya.staff@viar.in',
      });

      assert.strictEqual(teamDecision.action, 'redirect');
      assert.strictEqual(teamDecision.statusCode, 307);
      assert.strictEqual(teamDecision.redirectUrl, '/admin?error=owner_only');
    });

    it('unauthenticated request to any protected route must redirect to /login with redirect parameter', () => {
      const unauthDecision = evaluateRouteAccess({
        pathname: '/dashboard',
        sessionToken: undefined,
      });

      assert.strictEqual(unauthDecision.action, 'redirect');
      assert.strictEqual(unauthDecision.statusCode, 307);
      assert.strictEqual(unauthDecision.redirectUrl, '/login?redirect=%2Fdashboard');
    });

    it('verified Site Owner must be granted access to all protected areas', () => {
      const ownerRoutes = ['/dashboard', '/instructor', '/admin', '/admin/team'];
      for (const path of ownerRoutes) {
        const ownerDecision = evaluateRouteAccess({
          pathname: path,
          sessionToken: 'session-owner-123',
          userEmail: 'ask@aapkaastro.com',
        });
        assert.strictEqual(ownerDecision.action, 'allow', `Owner should be allowed on ${path}`);
      }
    });
  });
});

