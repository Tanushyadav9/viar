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
});
