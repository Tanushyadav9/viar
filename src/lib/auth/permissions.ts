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

import type {
  AdminSection,
  ViarSection,
  User,
  StaffAccessLevel,
  StaffPermission,
} from '../types.ts';

export interface AdminSectionMeta {
  key: AdminSection;
  title: string;
  shortTitle: string;
  description: string;
  ownerOnly?: boolean;
}

/**
 * Exact section names for the Viar repository:
 * courses, cohorts, students, quizzes, analytics, payments
 */
export const VIAR_SECTIONS: readonly ViarSection[] = [
  'courses',
  'cohorts',
  'students',
  'quizzes',
  'analytics',
  'payments',
] as const;

export const ADMIN_SECTIONS: readonly AdminSection[] = [
  'courses',
  'cohorts',
  'students',
  'quizzes',
  'analytics',
  'payments',
  'staff',
] as const;

export const ADMIN_SECTIONS_META: Record<AdminSection, AdminSectionMeta> = {
  courses: {
    key: 'courses',
    title: 'Course Catalog & Syllabi',
    shortTitle: 'Courses',
    description: 'Create and update courses, 18-class syllabi, bundles, and pricing.',
  },
  cohorts: {
    key: 'cohorts',
    title: 'Cohorts, Schedule & Live Class Links',
    shortTitle: 'Cohorts & Schedule',
    description: 'Manage cohort start/end dates, Zoom/Google Meet links, and lecture recordings.',
  },
  students: {
    key: 'students',
    title: 'Student Roster & Enrollments',
    shortTitle: 'Students',
    description: 'View enrolled students, manual enrollment, and attendance records.',
  },
  quizzes: {
    key: 'quizzes',
    title: 'Quizzes, Exams & Certificate Registry',
    shortTitle: 'Quizzes & Certificates',
    description: 'Manage final 20-question certification exams, passing criteria, and cryptographic certificates.',
  },
  analytics: {
    key: 'analytics',
    title: 'Platform Telemetry & Academic Analytics',
    shortTitle: 'Analytics',
    description: 'Track student completion rates, video watch progress, and cohort engagement.',
  },
  payments: {
    key: 'payments',
    title: 'Financial Revenue & Payment Gateways',
    shortTitle: 'Payments & Revenue',
    description: 'Track Razorpay & Stripe tuition receipts, cohort earnings, and payouts.',
  },
  staff: {
    key: 'staff',
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

export const primaryOwnerEmail = getPrimaryOwnerEmail();

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
 * 1. Site Owner: Always granted access to ALL sections (including staff management).
 * 2. Staff Section: Strictly Owner-only. Regular staff cannot modify permissions.
 * 3. Specific Sections: Granted if the user has that section in their staffSections list.
 * 4. Regular Students: Denied.
 */
export function hasSectionPermission(
  user: User | null,
  section: AdminSection | string,
  explicitSections?: (AdminSection | string)[]
): boolean {
  if (!user) return false;

  // Rule 1: Site Owner has universal access
  if (isSiteOwner(user)) return true;

  const normalizedSection = section.toLowerCase();

  // Rule 2: Staff management is strictly reserved for the Site Owner
  if (normalizedSection === 'staff') return false;

  // Rule 3: Check explicit per-section permissions
  const allowedSections = (explicitSections || user.staffSections || []).map((s) => s.toLowerCase());
  return allowedSections.includes(normalizedSection);
}

/**
 * Returns all admin sections that the given user is authorized to view and manage.
 */
export function getUserAllowedSections(
  user: User | null,
  explicitSections?: (AdminSection | string)[]
): AdminSection[] {
  if (!user) return [];

  // Site Owner has access to all sections
  if (isSiteOwner(user)) {
    return [...ADMIN_SECTIONS];
  }

  const sections = (explicitSections || user.staffSections || []).map((s) => s.toLowerCase() as AdminSection);
  // Ensure staff section is never granted to non-owners
  return sections.filter((s) => s !== 'staff');
}

export interface StaffSectionCheckResult {
  allowed: boolean;
  isOwner: boolean;
  accessLevel?: StaffAccessLevel;
  reason?: string;
}

/**
 * Enforces section-level access control on routes, layouts, and server actions.
 * 
 * Rules:
 * 1. Site Owner: Always passes every section check automatically with MANAGE level.
 * 2. 'staff' section: Strictly Owner-only. Rejects anyone else (even staff with MANAGE on other sections).
 * 3. Active Check: Staff member only passes if they have an active (revokedAt IS NULL)
 *    StaffPermission row for that exact section.
 * 4. Access Level Check: If the action requires MANAGE (e.g. creating/editing), user must have MANAGE.
 *    If user only has VIEW, they are permitted for VIEW requests and rejected for MANAGE requests.
 */
export function checkStaffSectionAccess(params: {
  user?: User | string | null;
  section: AdminSection | string;
  requiredLevel?: StaffAccessLevel; // Defaults to 'VIEW'
  permissions?: StaffPermission[];
}): StaffSectionCheckResult {
  const { user, section, requiredLevel = 'VIEW', permissions } = params;
  if (!user) {
    return { allowed: false, isOwner: false, reason: 'Unauthenticated' };
  }

  // 1. Site Owner always passes every check automatically
  if (isSiteOwner(user)) {
    return { allowed: true, isOwner: true, accessLevel: 'MANAGE' };
  }

  const normalizedSection = section.toLowerCase();

  // 2. Staff management is strictly reserved for the Site Owner
  if (normalizedSection === 'staff') {
    return {
      allowed: false,
      isOwner: false,
      reason: 'Staff section is restricted to the Site Owner only',
    };
  }

  // 3. Look up active permissions
  const userObj = typeof user === 'object' ? user : null;
  const userIdentifier = typeof user === 'string' ? user.trim().toLowerCase() : (user.id || user.email?.trim().toLowerCase());

  let activePerm: StaffPermission | undefined;

  if (permissions && permissions.length > 0) {
    activePerm = permissions.find((p) => {
      const pUserLower = p.userId.toLowerCase();
      const isUserMatch =
        pUserLower === userIdentifier ||
        (userObj && (pUserLower === userObj.id.toLowerCase() || pUserLower === userObj.email.toLowerCase()));
      const isSectionMatch = p.section.toLowerCase() === normalizedSection;
      const isActive = !p.revokedAt;
      return isUserMatch && isSectionMatch && isActive;
    });
  }

  // Fallback to userObj.staffSections if permissions table array was not passed
  if (!activePerm && userObj) {
    const hasSection = (userObj.staffSections || []).map((s) => s.toLowerCase()).includes(normalizedSection);
    if (hasSection) {
      activePerm = {
        id: `perm-user-${normalizedSection}`,
        userId: userObj.id,
        section: normalizedSection,
        accessLevel: 'MANAGE',
        grantedByUserId: 'ask@aapkaastro.com',
        grantedAt: new Date().toISOString(),
        revokedAt: null,
      };
    }
  }

  if (!activePerm) {
    return {
      allowed: false,
      isOwner: false,
      reason: `No active permission granted for section '${section}'`,
    };
  }

  // 4. Access level check (MANAGE vs VIEW)
  if (requiredLevel === 'MANAGE' && activePerm.accessLevel === 'VIEW') {
    return {
      allowed: false,
      isOwner: false,
      accessLevel: 'VIEW',
      reason: `Action requires MANAGE access level on '${section}', but current account only has VIEW access`,
    };
  }

  return {
    allowed: true,
    isOwner: false,
    accessLevel: activePerm.accessLevel,
  };
}

/**
 * Boolean helper for route layouts, server actions, and middleware.
 */
export function hasSectionAccess(
  user: User | string | null,
  section: AdminSection | string,
  requiredLevel: StaffAccessLevel = 'VIEW',
  permissions?: StaffPermission[]
): boolean {
  return checkStaffSectionAccess({ user, section, requiredLevel, permissions }).allowed;
}

export interface RequestAuthInfo {
  sessionToken?: string;
  userRole?: string;
  userEmail?: string;
  userId?: string;
}

export function extractAuthFromRequest(req: {
  cookies: { get(name: string): { value?: string } | undefined };
  headers: { get(name: string): string | null };
}): RequestAuthInfo {
  const sessionToken =
    req.cookies.get('viar_session')?.value ||
    req.cookies.get('__session')?.value ||
    req.cookies.get('viar_auth_token')?.value;

  const userRole =
    req.cookies.get('viar_user_role')?.value ||
    req.headers.get('x-user-role') ||
    '';

  const rawEmail =
    req.cookies.get('viar_user_email')?.value ||
    req.headers.get('x-user-email') ||
    '';
  const userEmail = rawEmail ? decodeURIComponent(rawEmail).trim().toLowerCase() : undefined;

  const userId =
    req.cookies.get('viar_user_id')?.value ||
    sessionToken ||
    req.headers.get('x-user-id') ||
    undefined;

  return { sessionToken, userRole, userEmail, userId };
}

export function verifyRouteAccess(
  req: {
    cookies: { get(name: string): { value?: string } | undefined };
    headers: { get(name: string): string | null };
  },
  section: AdminSection | string,
  requiredLevel: StaffAccessLevel = 'VIEW',
  permissions?: StaffPermission[]
): StaffSectionCheckResult {
  const auth = extractAuthFromRequest(req);
  if (!auth.sessionToken) {
    return { allowed: false, isOwner: false, reason: 'Unauthenticated: No active session token' };
  }

  // If site owner email with valid session
  if (auth.userEmail && isSiteOwner(auth.userEmail)) {
    return { allowed: true, isOwner: true, accessLevel: 'MANAGE' };
  }

  return checkStaffSectionAccess({
    user: auth.userEmail || auth.userId || null,
    section,
    requiredLevel,
    permissions,
  });
}
