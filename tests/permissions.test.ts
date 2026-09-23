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
} from '../src/lib/auth/permissions.ts';
import type { User, AdminSection } from '../src/lib/types.ts';

describe('Site Owner Recognition & Per-Section Staff Permissions (RBAC)', () => {
  const ownerEmail = 'ask@aapkaastro.com';

  const ownerUser: User = {
    id: 'user-owner',
    name: 'Acharya Niraj Kumar',
    email: ownerEmail,
    role: 'ADMIN',
    isOwner: true,
    enrolledCohortIds: [],
  };

  const staffUser: User = {
    id: 'user-staff-1',
    name: 'Priya Verma',
    email: 'priya.staff@viar.in',
    role: 'ADMIN',
    isOwner: false,
    staffSections: ['CONTENT', 'RECORDINGS'],
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

    it('should be case-insensitive and trim whitespaces', () => {
      assert.strictEqual(isSiteOwner('  ASK@AAPKAASTRO.COM  '), true);
      assert.strictEqual(isSiteOwner('Admin@Viar.IN'), true);
    });

    it('should recognize owner user object with isOwner=true', () => {
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

  describe('2. Per-Section Staff Permissions (Zero-cost RBAC)', () => {
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
      // Priya has CONTENT and RECORDINGS
      assert.strictEqual(hasSectionPermission(staffUser, 'CONTENT'), true);
      assert.strictEqual(hasSectionPermission(staffUser, 'RECORDINGS'), true);

      // Priya does NOT have SCHEDULE, COURSES, STUDENTS, REVENUE, CERTIFICATES
      assert.strictEqual(hasSectionPermission(staffUser, 'SCHEDULE'), false);
      assert.strictEqual(hasSectionPermission(staffUser, 'COURSES'), false);
      assert.strictEqual(hasSectionPermission(staffUser, 'STUDENTS'), false);
      assert.strictEqual(hasSectionPermission(staffUser, 'REVENUE'), false);
      assert.strictEqual(hasSectionPermission(staffUser, 'CERTIFICATES'), false);
    });

    it('should strictly reserve STAFF management section to Site Owner only', () => {
      // Owner can access STAFF
      assert.strictEqual(hasSectionPermission(ownerUser, 'STAFF'), true);

      // Staff member CANNOT access STAFF even if explicitly attempted
      assert.strictEqual(hasSectionPermission(staffUser, 'STAFF'), false);

      // Even if staff user object maliciously contained 'STAFF' in staffSections
      const maliciousStaff: User = {
        ...staffUser,
        staffSections: ['STAFF', 'CONTENT'] as AdminSection[],
      };
      assert.strictEqual(
        hasSectionPermission(maliciousStaff, 'STAFF'),
        false,
        'STAFF section management must be strictly forbidden to non-owners'
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

  describe('3. getUserAllowedSections helper', () => {
    it('should return all 8 sections for Site Owner', () => {
      const allowed = getUserAllowedSections(ownerUser);
      assert.strictEqual(allowed.length, ADMIN_SECTIONS.length);
      assert.deepStrictEqual(new Set(allowed), new Set(ADMIN_SECTIONS));
    });

    it('should return only granted sections for staff member and filter out STAFF', () => {
      const allowed = getUserAllowedSections(staffUser);
      assert.deepStrictEqual(allowed, ['CONTENT', 'RECORDINGS']);
      assert.strictEqual(allowed.includes('STAFF'), false);
    });

    it('should return empty list for regular students or null', () => {
      assert.deepStrictEqual(getUserAllowedSections(studentUser), []);
      assert.deepStrictEqual(getUserAllowedSections(null), []);
    });
  });

  describe('4. Metadata and Section Definitions', () => {
    it('should have complete metadata for all admin sections', () => {
      for (const sec of ADMIN_SECTIONS) {
        const meta = ADMIN_SECTIONS_META[sec];
        assert.ok(meta, `Metadata missing for section ${sec}`);
        assert.ok(meta.title.length > 0);
        assert.ok(meta.description.length > 0);
      }
      assert.strictEqual(ADMIN_SECTIONS_META.STAFF.ownerOnly, true);
    });
  });
});
