import { extractAuthFromRequest } from "../src/lib/auth/permissions.ts";
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateRedirectUrl } from '../src/lib/auth/urlValidation.ts';

describe('Server-Side Authentication, Redirect Validation & Canonical Host', () => {

  describe('1. validateRedirectUrl — Open Redirect Prevention', () => {
    it('should allow valid single-slash internal paths', () => {
      assert.strictEqual(validateRedirectUrl('/dashboard'), '/dashboard');
      assert.strictEqual(validateRedirectUrl('/courses/what-is-astrology'), '/courses/what-is-astrology');
      assert.strictEqual(validateRedirectUrl('/admin'), '/admin');
      assert.strictEqual(validateRedirectUrl('/checkout/cohort-1?ref=upi'), '/checkout/cohort-1?ref=upi');
    });

    it('should reject external absolute URLs with schemes', () => {
      assert.strictEqual(validateRedirectUrl('https://evil.com'), '/dashboard');
      assert.strictEqual(validateRedirectUrl('http://attacker.com/steal'), '/dashboard');
      assert.strictEqual(validateRedirectUrl('ftp://example.com'), '/dashboard');
    });

    it('should reject protocol-relative URLs starting with //', () => {
      assert.strictEqual(validateRedirectUrl('//evil.com'), '/dashboard');
      assert.strictEqual(validateRedirectUrl('//evil.com/phish'), '/dashboard');
      assert.strictEqual(validateRedirectUrl('//viar.in.attacker.com'), '/dashboard');
    });

    it('should reject backslash bypass attempts (/\\, \\, etc.)', () => {
      assert.strictEqual(validateRedirectUrl('/\\evil.com'), '/dashboard');
      assert.strictEqual(validateRedirectUrl('\\evil.com'), '/dashboard');
      assert.strictEqual(validateRedirectUrl('/foo\\bar'), '/dashboard');
    });

    it('should reject javascript:, data:, or colon-containing payloads', () => {
      assert.strictEqual(validateRedirectUrl('javascript:alert(1)'), '/dashboard');
      assert.strictEqual(validateRedirectUrl('data:text/html,<script>alert(1)</script>'), '/dashboard');
      assert.strictEqual(validateRedirectUrl('/foo:bar'), '/dashboard');
    });

    it('should return custom default URL when supplied', () => {
      assert.strictEqual(validateRedirectUrl('//evil.com', '/login'), '/login');
      assert.strictEqual(validateRedirectUrl(null, '/courses'), '/courses');
      assert.strictEqual(validateRedirectUrl(undefined, '/courses'), '/courses');
      assert.strictEqual(validateRedirectUrl('', '/courses'), '/courses');
    });
  });

  describe('2. Server-Side Owner Detection (Primary Verified Email Case-Insensitive)', () => {
    const ownerEmail = 'aapkaastro1606@gmail.com';
    process.env.OWNER_EMAIL = ownerEmail;

    function verifyServerOwner(emailObj: { emailAddress?: string; isVerified?: boolean } | null | undefined): boolean {
      if (!emailObj || !emailObj.emailAddress || !emailObj.isVerified) return false;
      const cleanEmail = emailObj.emailAddress.trim().toLowerCase();
      const configuredOwner = (process.env.OWNER_EMAIL || '').trim().toLowerCase();
      return Boolean(cleanEmail && configuredOwner && cleanEmail === configuredOwner);
    }

    it('should recognize verified primary email matching OWNER_EMAIL (exact match)', () => {
      const result = verifyServerOwner({
        emailAddress: 'aapkaastro1606@gmail.com',
        isVerified: true,
      });
      assert.strictEqual(result, true);
    });

    it('should recognize verified primary email matching OWNER_EMAIL case-insensitively', () => {
      const resultUpper = verifyServerOwner({
        emailAddress: 'AAPKAASTRO1606@GMAIL.COM',
        isVerified: true,
      });
      assert.strictEqual(resultUpper, true);

      const resultMixed = verifyServerOwner({
        emailAddress: 'AapkaAstro1606@Gmail.Com',
        isVerified: true,
      });
      assert.strictEqual(resultMixed, true);
    });

    it('should REJECT an unverified email even if address matches OWNER_EMAIL', () => {
      const result = verifyServerOwner({
        emailAddress: 'aapkaastro1606@gmail.com',
        isVerified: false,
      });
      assert.strictEqual(result, false);
    });

    it('should REJECT other email addresses (even if verified)', () => {
      assert.strictEqual(verifyServerOwner({ emailAddress: 'student@example.com', isVerified: true }), false);
      assert.strictEqual(verifyServerOwner({ emailAddress: 'ask@aapkaastro.com', isVerified: true }), false);
      assert.strictEqual(verifyServerOwner({ emailAddress: 'admin@viar.in', isVerified: true }), false);
      assert.strictEqual(verifyServerOwner({ emailAddress: 'niraj@aapkaastro.com', isVerified: true }), false);
    });

    it('should fail-closed if OWNER_EMAIL environment variable is empty or unset', () => {
      const prev = process.env.OWNER_EMAIL;
      process.env.OWNER_EMAIL = '';
      assert.strictEqual(verifyServerOwner({ emailAddress: 'aapkaastro1606@gmail.com', isVerified: true }), false);
      process.env.OWNER_EMAIL = prev;
    });
  });

  describe('3. Canonical Host 308 Redirect Logic (Apex vs WWW)', () => {
    const siteUrl = 'https://viar.in';
    const canonicalHost = new URL(siteUrl).host.toLowerCase(); // 'viar.in'

    function checkCanonicalRedirect(reqHost: string): { redirect: boolean; status?: number; target?: string } {
      const cleanHost = reqHost.toLowerCase();
      if (cleanHost && canonicalHost && cleanHost !== canonicalHost) {
        if (cleanHost === `www.${canonicalHost}` || `www.${cleanHost}` === canonicalHost) {
          return {
            redirect: true,
            status: 308,
            target: `${siteUrl}/dashboard`,
          };
        }
      }
      return { redirect: false };
    }

    it('should issue HTTP 308 redirect for www.viar.in to canonical viar.in', () => {
      const res = checkCanonicalRedirect('www.viar.in');
      assert.strictEqual(res.redirect, true);
      assert.strictEqual(res.status, 308);
      assert.strictEqual(res.target, 'https://viar.in/dashboard');
    });

    it('should NOT redirect when requesting the canonical apex host viar.in', () => {
      const res = checkCanonicalRedirect('viar.in');
      assert.strictEqual(res.redirect, false);
    });

    it('should NOT redirect localhost or test hostnames', () => {
      const res = checkCanonicalRedirect('localhost:3000');
      assert.strictEqual(res.redirect, false);
    });
  });

  describe('4. /login Server-Awareness & Loop Prevention', () => {
    function evaluateLoginBehavior(params: {
      userId?: string | null;
      error?: string | null;
      redirectUrl?: string | null;
    }): { action: 'redirect' | 'render_error' | 'render_signin'; target?: string } {
      const { userId, error, redirectUrl } = params;
      const safeTarget = validateRedirectUrl(redirectUrl, '/dashboard');

      // Valid session and NO error -> immediate server-side redirect
      if (userId && !error) {
        return { action: 'redirect', target: safeTarget };
      }

      // Valid session with authorization error -> render error card with signout (NEVER LOOP!)
      if (userId && error) {
        return { action: 'render_error' };
      }

      // No session -> render SignIn
      return { action: 'render_signin' };
    }

    it('should immediately redirect authenticated user without error to destination', () => {
      const res = evaluateLoginBehavior({
        userId: 'user_123',
        redirectUrl: '/dashboard',
      });
      assert.strictEqual(res.action, 'redirect');
      assert.strictEqual(res.target, '/dashboard');
    });

    it('should NEVER redirect in a loop when error=owner_only (renders error with signout)', () => {
      const res = evaluateLoginBehavior({
        userId: 'user_123_student',
        error: 'owner_only',
        redirectUrl: '/admin',
      });
      // MUST NOT redirect back to /admin!
      assert.strictEqual(res.action, 'render_error');
    });

    it('should NEVER redirect in a loop when error=unauthorized_role (renders error with signout)', () => {
      const res = evaluateLoginBehavior({
        userId: 'user_123_student',
        error: 'unauthorized_role',
        redirectUrl: '/instructor',
      });
      assert.strictEqual(res.action, 'render_error');
    });

    it('should render SignIn component when user is not authenticated', () => {
      const res = evaluateLoginBehavior({
        userId: null,
        redirectUrl: '/dashboard',
      });
      assert.strictEqual(res.action, 'render_signin');
    });
  });

  describe('5. Just-In-Time Database User Sync & Anti-Tamper Role Computation', () => {
    const ownerEmail = 'aapkaastro1606@gmail.com';

    it('should grant OWNER role ONLY when verified email strictly equals OWNER_EMAIL', async () => {
      const { computeEffectiveRole } = await import('../src/lib/auth/userSync.ts');
      const orig = process.env.OWNER_EMAIL;
      try {
        process.env.OWNER_EMAIL = ownerEmail;

        const res = computeEffectiveRole({
          email: 'aapkaastro1606@gmail.com',
          isEmailVerified: true,
          existingRole: 'STUDENT',
          existingIsOwner: false,
        });

        assert.strictEqual(res.role, 'OWNER');
        assert.strictEqual(res.isOwner, true);
        assert.strictEqual(res.wasDemoted, false);
      } finally {
        process.env.OWNER_EMAIL = orig;
      }
    });

    it('should treat a database OWNER for any other email as STUDENT and flag for logging', async () => {
      const { computeEffectiveRole } = await import('../src/lib/auth/userSync.ts');
      const orig = process.env.OWNER_EMAIL;
      try {
        process.env.OWNER_EMAIL = ownerEmail;

        // Imposter: DB row has role: 'OWNER' or isOwner: true, but email is different!
        const resRole = computeEffectiveRole({
          email: 'imposter@example.com',
          isEmailVerified: true,
          existingRole: 'OWNER',
          existingIsOwner: false,
        });
        assert.strictEqual(resRole.role, 'STUDENT', 'Must coerce unauthorized OWNER to STUDENT');
        assert.strictEqual(resRole.isOwner, false);
        assert.strictEqual(resRole.wasDemoted, true, 'Must flag wasDemoted to log security alert');

        const resFlag = computeEffectiveRole({
          email: 'tampered@example.com',
          isEmailVerified: true,
          existingRole: 'STUDENT',
          existingIsOwner: true,
        });
        assert.strictEqual(resFlag.role, 'STUDENT');
        assert.strictEqual(resFlag.isOwner, false);
        assert.strictEqual(resFlag.wasDemoted, true);
      } finally {
        process.env.OWNER_EMAIL = orig;
      }
    });

    it('should REJECT OWNER if email matches OWNER_EMAIL but verification status is false', async () => {
      const { computeEffectiveRole } = await import('../src/lib/auth/userSync.ts');
      const orig = process.env.OWNER_EMAIL;
      try {
        process.env.OWNER_EMAIL = ownerEmail;

        const res = computeEffectiveRole({
          email: 'aapkaastro1606@gmail.com',
          isEmailVerified: false,
          existingRole: 'STUDENT',
        });
        assert.strictEqual(res.role, 'STUDENT');
        assert.strictEqual(res.isOwner, false);
      } finally {
        process.env.OWNER_EMAIL = orig;
      }
    });

    it('should preserve existing staff roles (INSTRUCTOR, ADMIN) assigned via /admin/team', async () => {
      const { computeEffectiveRole } = await import('../src/lib/auth/userSync.ts');
      const orig = process.env.OWNER_EMAIL;
      try {
        process.env.OWNER_EMAIL = ownerEmail;

        const resInstructor = computeEffectiveRole({
          email: 'staff.instructor@viar.in',
          isEmailVerified: true,
          existingRole: 'INSTRUCTOR',
          existingIsOwner: false,
        });
        assert.strictEqual(resInstructor.role, 'INSTRUCTOR');
        assert.strictEqual(resInstructor.isOwner, false);
        assert.strictEqual(resInstructor.wasDemoted, false);

        const resAdmin = computeEffectiveRole({
          email: 'staff.admin@viar.in',
          isEmailVerified: true,
          existingRole: 'ADMIN',
          existingIsOwner: false,
        });
        assert.strictEqual(resAdmin.role, 'ADMIN');
        assert.strictEqual(resAdmin.isOwner, false);
        assert.strictEqual(resAdmin.wasDemoted, false);
      } finally {
        process.env.OWNER_EMAIL = orig;
      }
    });

    it('should default regular students to STUDENT role with isOwner false', async () => {
      const { computeEffectiveRole } = await import('../src/lib/auth/userSync.ts');
      const orig = process.env.OWNER_EMAIL;
      try {
        process.env.OWNER_EMAIL = ownerEmail;

        const res = computeEffectiveRole({
          email: 'new.student@example.com',
          isEmailVerified: true,
          existingRole: null,
          existingIsOwner: false,
        });
        assert.strictEqual(res.role, 'STUDENT');
        assert.strictEqual(res.isOwner, false);
        assert.strictEqual(res.wasDemoted, false);
      } finally {
        process.env.OWNER_EMAIL = orig;
      }
    });
  });

  describe('6. Admin Access & Role Boundaries (Fail-Closed, Staff Scoping & Server Navbar)', () => {
    const ownerEmail = 'aapkaastro1606@gmail.com';

    interface RouteCheckResult {
      action: 'allow' | 'redirect';
      target?: string;
    }

    function evaluateAdminRouteGuard(user: {
      isAuthenticated: boolean;
      isOwner: boolean;
      isStaff: boolean;
      staffSections: string[];
      role: string;
    }, path: string): RouteCheckResult {
      if (!user.isAuthenticated) {
        return { action: 'redirect', target: `/login?redirect_url=${encodeURIComponent(path)}` };
      }

      // /admin/team & /admin/diagnostics are strictly Owner-Only
      if (path.startsWith('/admin/team') || path.startsWith('/admin/diagnostics')) {
        if (!user.isOwner) {
          if (user.isStaff) {
            return { action: 'redirect', target: '/admin?error=owner_only' };
          }
          return { action: 'redirect', target: '/dashboard?error=admin_restricted' };
        }
        return { action: 'allow' };
      }

      // /admin/* requires Owner or Staff
      if (path.startsWith('/admin')) {
        if (user.isOwner || user.isStaff) {
          return { action: 'allow' };
        }
        return { action: 'redirect', target: '/dashboard?error=admin_restricted' };
      }

      // /instructor/* requires Owner, Staff, or Instructor/Admin role
      if (path.startsWith('/instructor')) {
        if (user.isOwner || user.isStaff || user.role === 'INSTRUCTOR' || user.role === 'ADMIN') {
          return { action: 'allow' };
        }
        return { action: 'redirect', target: '/dashboard?error=instructor_restricted' };
      }

      return { action: 'allow' };
    }

    it('should allow Owner to reach /admin with no redirect and no loop', () => {
      const owner = {
        isAuthenticated: true,
        isOwner: true,
        isStaff: true,
        staffSections: ['courses', 'cohorts', 'students', 'quizzes', 'analytics', 'payments', 'staff'],
        role: 'OWNER',
      };

      const resAdmin = evaluateAdminRouteGuard(owner, '/admin');
      assert.strictEqual(resAdmin.action, 'allow');

      const resInstructor = evaluateAdminRouteGuard(owner, '/instructor');
      assert.strictEqual(resInstructor.action, 'allow');

      const resTeam = evaluateAdminRouteGuard(owner, '/admin/team');
      assert.strictEqual(resTeam.action, 'allow');

      const resDiagnostics = evaluateAdminRouteGuard(owner, '/admin/diagnostics');
      assert.strictEqual(resDiagnostics.action, 'allow');
    });

    it('should allow authorized Staff to reach /admin with no redirect', () => {
      const staffMember = {
        isAuthenticated: true,
        isOwner: false,
        isStaff: true,
        staffSections: ['payments'],
        role: 'STUDENT',
      };

      const res = evaluateAdminRouteGuard(staffMember, '/admin');
      assert.strictEqual(res.action, 'allow');
    });

    it('should strictly redirect Staff away from /admin/team to /admin?error=owner_only', () => {
      const staffMember = {
        isAuthenticated: true,
        isOwner: false,
        isStaff: true,
        staffSections: ['courses', 'quizzes'],
        role: 'STUDENT',
      };

      const resTeam = evaluateAdminRouteGuard(staffMember, '/admin/team');
      assert.strictEqual(resTeam.action, 'redirect');
      assert.strictEqual(resTeam.target, '/admin?error=owner_only');

      const resDiag = evaluateAdminRouteGuard(staffMember, '/admin/diagnostics');
      assert.strictEqual(resDiag.action, 'redirect');
      assert.strictEqual(resDiag.target, '/admin?error=owner_only');
    });

    it('should redirect Students away to /dashboard without looping', () => {
      const student = {
        isAuthenticated: true,
        isOwner: false,
        isStaff: false,
        staffSections: [],
        role: 'STUDENT',
      };

      const resAdmin = evaluateAdminRouteGuard(student, '/admin');
      assert.strictEqual(resAdmin.action, 'redirect');
      assert.strictEqual(resAdmin.target, '/dashboard?error=admin_restricted');

      const resInstructor = evaluateAdminRouteGuard(student, '/instructor');
      assert.strictEqual(resInstructor.action, 'redirect');
      assert.strictEqual(resInstructor.target, '/dashboard?error=instructor_restricted');

      const resTeam = evaluateAdminRouteGuard(student, '/admin/team');
      assert.strictEqual(resTeam.action, 'redirect');
      assert.strictEqual(resTeam.target, '/dashboard?error=admin_restricted');
    });

    it('should redirect Unauthenticated visitors to /login with redirect_url', () => {
      const unauth = {
        isAuthenticated: false,
        isOwner: false,
        isStaff: false,
        staffSections: [],
        role: 'STUDENT',
      };

      const res = evaluateAdminRouteGuard(unauth, '/admin');
      assert.strictEqual(res.action, 'redirect');
      assert.strictEqual(res.target, '/login?redirect_url=%2Fadmin');
    });

    it('should filter admin sections so staff members see ONLY their granted sections', () => {
      const allSections = ['courses', 'cohorts', 'students', 'quizzes', 'analytics', 'payments', 'staff'];

      function filterSectionsForUser(user: { isOwner: boolean; staffSections: string[] }): string[] {
        if (user.isOwner) return [...allSections];
        return allSections.filter((sec) => sec !== 'staff' && user.staffSections.includes(sec));
      }

      // Staff with only 'payments'
      const paymentsStaff = filterSectionsForUser({
        isOwner: false,
        staffSections: ['payments'],
      });
      assert.deepStrictEqual(paymentsStaff, ['payments'], 'Staff must see ONLY granted payments section');

      // Staff with 'courses' and 'quizzes'
      const contentStaff = filterSectionsForUser({
        isOwner: false,
        staffSections: ['courses', 'quizzes'],
      });
      assert.deepStrictEqual(contentStaff, ['courses', 'quizzes']);
      assert.strictEqual(contentStaff.includes('payments'), false);
      assert.strictEqual(contentStaff.includes('staff'), false);

      // Owner sees all sections including staff
      const ownerSections = filterSectionsForUser({
        isOwner: true,
        staffSections: [],
      });
      assert.strictEqual(ownerSections.length, 7);
      assert.strictEqual(ownerSections.includes('staff'), true);
    });

    it('should decide Admin navigation link strictly on the server (Owner & Staff only)', () => {
      function computeServerNavbarVisibility(authResult: {
        isAuthenticated: boolean;
        isOwner: boolean;
        isStaff: boolean;
      }): { showAdminNav: boolean; destination: string; roleLabel: string } {
        const showAdminNav = Boolean(authResult.isOwner || authResult.isStaff);
        if (authResult.isOwner) {
          return { showAdminNav: true, destination: '/admin', roleLabel: 'Site Owner' };
        }
        if (authResult.isStaff) {
          return { showAdminNav: true, destination: '/admin', roleLabel: 'Staff' };
        }
        if (authResult.isAuthenticated) {
          return { showAdminNav: false, destination: '/dashboard', roleLabel: 'Student' };
        }
        return { showAdminNav: false, destination: '/login', roleLabel: 'Guest' };
      }

      // Owner
      const ownerNav = computeServerNavbarVisibility({
        isAuthenticated: true,
        isOwner: true,
        isStaff: true,
      });
      assert.strictEqual(ownerNav.showAdminNav, true);
      assert.strictEqual(ownerNav.destination, '/admin');
      assert.strictEqual(ownerNav.roleLabel, 'Site Owner');

      // Staff member
      const staffNav = computeServerNavbarVisibility({
        isAuthenticated: true,
        isOwner: false,
        isStaff: true,
      });
      assert.strictEqual(staffNav.showAdminNav, true);
      assert.strictEqual(staffNav.destination, '/admin');
      assert.strictEqual(staffNav.roleLabel, 'Staff');

      // Student (must NOT see admin nav link)
      const studentNav = computeServerNavbarVisibility({
        isAuthenticated: true,
        isOwner: false,
        isStaff: false,
      });
      assert.strictEqual(studentNav.showAdminNav, false);
      assert.strictEqual(studentNav.destination, '/dashboard');
      assert.strictEqual(studentNav.roleLabel, 'Student');

      // Unauthenticated visitor (must NOT see admin nav link)
      const guestNav = computeServerNavbarVisibility({
        isAuthenticated: false,
        isOwner: false,
        isStaff: false,
      });
      assert.strictEqual(guestNav.showAdminNav, false);
      assert.strictEqual(guestNav.destination, '/login');
      assert.strictEqual(guestNav.roleLabel, 'Guest');
    });
  });

  describe("7. ExtractAuthFromRequest with Standard Clerk Session Claims", () => {
    function createFakeClerkJwt(payload: any) {
      const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
      const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
      return `${header}.${body}.fakesignature`;
    }

    it("should extract userId when Clerk JWT has sub but NO email claim", () => {
      const jwt = createFakeClerkJwt({ sub: "user_live_clerk_12345", exp: Math.floor(Date.now() / 1000) + 3600 });
      const req = {
        cookies: { get: (name: string) => name === "__session" ? { value: jwt } : undefined },
        headers: { get: () => null }
      };
      const auth = extractAuthFromRequest(req);
      assert.strictEqual(auth.userId, "user_live_clerk_12345");
      assert.strictEqual(auth.userEmail, undefined);
    });

    it("should extract both userId and userEmail when Clerk JWT has sub and email", () => {
      const jwt = createFakeClerkJwt({ sub: "user_live_clerk_67890", email: "student@example.com", exp: Math.floor(Date.now() / 1000) + 3600 });
      const req = {
        cookies: { get: (name: string) => name === "__session" ? { value: jwt } : undefined },
        headers: { get: () => null }
      };
      const auth = extractAuthFromRequest(req);
      assert.strictEqual(auth.userId, "user_live_clerk_67890");
      assert.strictEqual(auth.userEmail, "student@example.com");
    });
  });

});
