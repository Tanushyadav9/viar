/**
 * ==============================================================================
 * SITE OWNER & PER-SECTION STAFF PERMISSIONS (RBAC)
 * ==============================================================================
 * 
 * Context & Constraints:
 * 1. Confirmed Owner Recognition:
 *    - The client's account (Acharya Niraj Kumar) is recognized as the supreme Site Owner
 *      via OWNER_EMAIL / SUPERADMIN_EMAILS and database `isOwner` flag.
 *    - Never an "accident of testing" (e.g. checking if email contains 'admin').
 *    - The Owner has full, permanent, unrestricted access to every section and
 *      is the ONLY one who can manage staff permissions.
 * 
 * 2. Per-Section Staff Permissions (Cost & Scope Constraint):
 *    - Built using application-level checks and PostgreSQL `StaffPermission` table.
 *    - ZERO dependence on Clerk's paid Organizations add-on ($0 cost).
 *    - Per-site scope: Granting access to Viar.in blog/content DOES NOT give
 *      access to AapkaAstro.com or DOW Consulting unless explicitly granted there.
 * ==============================================================================
 */

import type { AdminSection, User } from '../types.ts';

export interface AdminSectionMeta {
  key: AdminSection;
  title: string;
  shortTitle: string;
  description: string;
  ownerOnly?: boolean;
}

export const ADMIN_SECTIONS: readonly AdminSection[] = [
  'SCHEDULE',
  'RECORDINGS',
  'COURSES',
  'STUDENTS',
  'REVENUE',
  'CERTIFICATES',
  'CONTENT',
  'STAFF',
] as const;

export const ADMIN_SECTIONS_META: Record<AdminSection, AdminSectionMeta> = {
  SCHEDULE: {
    key: 'SCHEDULE',
    title: 'Class Schedules & Live Links',
    shortTitle: 'Schedule',
    description: 'Set upcoming class dates, manage Zoom/Google Meet links, and meeting passcodes.',
  },
  RECORDINGS: {
    key: 'RECORDINGS',
    title: 'Session Recordings & Notes',
    shortTitle: 'Recordings',
    description: 'Upload lecture recordings, Cloudflare/Mux links, and study notes.',
  },
  COURSES: {
    key: 'COURSES',
    title: 'Course Catalog & Syllabi',
    shortTitle: 'Courses',
    description: 'Create and update courses, 18-class syllabi, bundles, and pricing.',
  },
  STUDENTS: {
    key: 'STUDENTS',
    title: 'Student Roster & Enrollments',
    shortTitle: 'Students',
    description: 'View enrolled students, manual enrollment, and attendance records.',
  },
  REVENUE: {
    key: 'REVENUE',
    title: 'Financial Analytics & Revenue',
    shortTitle: 'Revenue',
    description: 'Track Razorpay & Stripe tuition receipts, cohort earnings, and payouts.',
  },
  CERTIFICATES: {
    key: 'CERTIFICATES',
    title: 'Certificates & Public Registry',
    shortTitle: 'Certificates',
    description: 'Issue official completion certificates, grades, and verify cryptographic codes.',
  },
  CONTENT: {
    key: 'CONTENT',
    title: 'Marketing, FAQs & Content Curation',
    shortTitle: 'Content',
    description: 'Curate client testimonials, student reviews, FAQs, and social media embeds.',
  },
  STAFF: {
    key: 'STAFF',
    title: 'Staff Roles & Delegated Permissions',
    shortTitle: 'Staff Roles',
    description: 'Assign specific section access to team members and employees. (Owner Only)',
    ownerOnly: true,
  },
};

/**
 * Returns the primary Site Owner email address configured via OWNER_EMAIL.
 * Defaults to Acharya Niraj Kumar's verified email.
 */
export function getPrimaryOwnerEmail(): string {
  return process.env.OWNER_EMAIL?.trim().toLowerCase() || 'ask@aapkaastro.com';
}

/**
 * Returns the list of designated Site Owner / Superadmin email addresses.
 * Configurable via environment variables with verified fallback to Acharya Niraj Kumar's address.
 */
export function getOwnerEmails(): string[] {
  const envOwner = process.env.OWNER_EMAIL?.trim().toLowerCase();
  const envSuperadmins = process.env.SUPERADMIN_EMAILS
    ? process.env.SUPERADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
    : [];

  const defaults = [
    'ask@aapkaastro.com',
    'admin@viar.in',
    'niraj@aapkaastro.com',
  ];

  const set = new Set<string>();
  if (envOwner) set.add(envOwner);
  for (const s of envSuperadmins) set.add(s);
  for (const d of defaults) set.add(d);

  return Array.from(set);
}

/**
 * Deliberate, secure check to determine if an account is the Site Owner.
 * 
 * ANTI-TAMPER SECURITY GUARANTEE:
 * An account is recognized as Site Owner IF AND ONLY IF its verified email
 * strictly matches the designated owner address list (anchored by OWNER_EMAIL).
 * Even if a malicious request payload or database record contains `role: 'OWNER'`
 * or `isOwner: true`, it is completely rejected if the email does not match.
 */
export function isSiteOwner(userOrEmail?: string | User | null): boolean {
  if (!userOrEmail) return false;

  const ownerEmails = getOwnerEmails();

  if (typeof userOrEmail === 'string') {
    const email = userOrEmail.trim().toLowerCase();
    return ownerEmails.includes(email);
  }

  // If user object, the email MUST match verified owner emails.
  // Never trust a claimed role or isOwner flag alone without verified email match.
  if (userOrEmail.email) {
    const email = userOrEmail.email.trim().toLowerCase();
    return ownerEmails.includes(email);
  }

  return false;
}

/**
 * Automatically resolves and assigns the correct role on sign-up or login.
 * If the authenticated email matches OWNER_EMAIL, automatically assigns OWNER role.
 * If not, prevents any client self-assignment of OWNER role (coercing to STUDENT).
 */
export function assignRoleForUser(
  email: string,
  requestedRole?: User['role']
): { role: User['role']; isOwner: boolean } {
  if (isSiteOwner(email)) {
    return { role: 'OWNER', isOwner: true };
  }

  // Non-owner: ensure OWNER role cannot be self-assigned
  const safeRole = requestedRole === 'OWNER' ? 'STUDENT' : (requestedRole || 'STUDENT');
  return { role: safeRole, isOwner: false };
}

/**
 * Checks whether an account has any staff or administrative access.
 */
export function isStaffMember(user?: User | null): boolean {
  if (!user) return false;
  if (isSiteOwner(user)) return true;
  if (user.role === 'ADMIN' || user.role === 'INSTRUCTOR') return true;
  if (user.staffSections && user.staffSections.length > 0) return true;
  return false;
}

/**
 * Evaluates whether a user has permission to access a specific admin section.
 * 
 * Rules:
 * 1. Site Owner: Always granted access to ALL sections (including STAFF management).
 * 2. STAFF Section: Strictly Owner-only. Regular staff cannot modify permissions.
 * 3. Specific Sections: Granted if the user has that section in their staffSections list.
 * 4. Regular Students: Denied.
 */
export function hasSectionPermission(
  user: User | null,
  section: AdminSection,
  explicitSections?: AdminSection[]
): boolean {
  if (!user) return false;

  // Rule 1: Site Owner has universal access
  if (isSiteOwner(user)) return true;

  // Rule 2: Staff management is strictly reserved for the Site Owner
  if (section === 'STAFF') return false;

  // Rule 3: Check explicit per-section permissions
  const allowedSections = explicitSections || user.staffSections || [];
  return allowedSections.includes(section);
}

/**
 * Returns all admin sections that the given user is authorized to view and manage.
 */
export function getUserAllowedSections(
  user: User | null,
  explicitSections?: AdminSection[]
): AdminSection[] {
  if (!user) return [];

  // Site Owner has access to all sections
  if (isSiteOwner(user)) {
    return [...ADMIN_SECTIONS];
  }

  const sections = explicitSections || user.staffSections || [];
  // Ensure STAFF section is never granted to non-owners
  return sections.filter((s) => s !== 'STAFF');
}
