/**
 * ==============================================================================
 * UNIFIED PERMISSION POLICY MODULE
 * ==============================================================================
 * 
 * Single source of truth for authorization rules across the Viar platform.
 * Page guards, layout boundaries, and every API route derive from this policy.
 * 
 * PERMISSION MATRIX:
 * ┌──────────────────────────────────────┬───────┬───────────────────────────┬──────────────────┐
 * │ Area                                 │ Owner │ Staff (if granted section)│ Student          │
 * ├──────────────────────────────────────┼───────┼───────────────────────────┼──────────────────┤
 * │ Payment approvals                    │ Yes   │ No                        │ No               │
 * │ Payment settings                     │ Yes   │ No                        │ No               │
 * │ Grant or revoke enrolment            │ Yes   │ No                        │ No               │
 * │ Team / Staff permissions             │ Yes   │ No                        │ No               │
 * │ Diagnostics                          │ Yes   │ No                        │ No               │
 * │ Legal text & pricing policies        │ Yes   │ No                        │ No               │
 * │ Courses, lessons                     │ Yes   │ Yes (courses section)     │ No               │
 * │ Quizzes                              │ Yes   │ Yes (quizzes section)     │ No               │
 * │ Site content (general)               │ Yes   │ Yes (content section)     │ No               │
 * │ Media library                        │ Yes   │ Yes (media section)       │ No               │
 * │ Cohorts & schedules                  │ Yes   │ Yes (cohorts section)     │ No               │
 * │ Student roster (read only)           │ Yes   │ Yes (students section)    │ No               │
 * │ Own enrolments, progress, orders,    │ Yes   │ Yes                       │ Own data only    │
 * │ receipts, certificates               │       │                           │                  │
 * └──────────────────────────────────────┴───────┴───────────────────────────┴──────────────────┘
 */

export type PermissionArea =
  | 'payment_approvals'      // Payment approvals / verification (Owner only)
  | 'payment_settings'       // Payment gateway credentials & settings (Owner only)
  | 'enrollment_mutation'    // Grant or revoke enrollment (Owner only)
  | 'team'                   // Team / staff permissions management (Owner only)
  | 'diagnostics'            // Diagnostics & system health deep inspect (Owner only)
  | 'legal_text'             // Legal policies, pricing & terms (Owner only)
  | 'courses'                // Courses & curriculum management (Owner or Staff with 'courses')
  | 'quizzes'                // Quizzes and tests management (Owner or Staff with 'quizzes')
  | 'site_content'           // Site content editing (Owner or Staff with 'content')
  | 'media'                  // Media library uploads & management (Owner or Staff with 'media')
  | 'cohorts'                // Cohorts and live class scheduling (Owner or Staff with 'cohorts')
  | 'student_roster'         // Student roster (read-only: Owner or Staff with 'students')
  | 'own_data';              // Own enrolments, progress, orders, certificates (Student, Staff, Owner)

export interface PolicySubject {
  isAuthenticated: boolean;
  userId: string | null;       // Database user ID (primary foreign key)
  clerkId: string | null;      // Clerk user ID (user_...)
  email: string | null;        // Verified email
  isOwner: boolean;
  isStaff: boolean;
  staffSections: string[];     // Granted admin sections (lowercase)
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | 'OWNER';
}

export interface PermissionCheckContext {
  targetUserId?: string | null;
  collection?: string | null;
  section?: string | null;
  action?: 'VIEW' | 'MANAGE' | 'APPROVE' | 'REJECT' | 'DELETE';
}

/**
 * Checks whether an area is strictly restricted to the Site Owner.
 */
export function isOwnerOnlyArea(area: PermissionArea): boolean {
  return (
    area === 'payment_approvals' ||
    area === 'payment_settings' ||
    area === 'enrollment_mutation' ||
    area === 'team' ||
    area === 'diagnostics' ||
    area === 'legal_text'
  );
}

/**
 * Evaluates whether a subject is authorized to access a specific area
 * according to the canonical Permission Policy.
 */
export function canAccessArea(
  user: PolicySubject | null | undefined,
  area: PermissionArea,
  context?: PermissionCheckContext
): boolean {
  if (!user || !user.isAuthenticated) {
    return false;
  }

  // 1. Site Owner has full, permanent, unrestricted access across all areas
  if (user.isOwner) {
    return true;
  }

  // 2. Evaluate specific area permissions
  switch (area) {
    // -----------------------------------------------------------------------
    // OWNER-ONLY AREAS: Staff: No, Student: No
    // -----------------------------------------------------------------------
    case 'payment_approvals':
    case 'payment_settings':
    case 'enrollment_mutation':
    case 'team':
    case 'diagnostics':
    case 'legal_text':
      return false;

    // -----------------------------------------------------------------------
    // STAFF-ACCESSIBLE AREAS (only if granted that section)
    // -----------------------------------------------------------------------
    case 'courses':
      return user.isStaff && user.staffSections.map((s) => s.toLowerCase()).includes('courses');

    case 'quizzes':
      return user.isStaff && user.staffSections.map((s) => s.toLowerCase()).includes('quizzes');

    case 'site_content': {
      // Legal and pricing content collections are strictly Owner-only!
      const col = context?.collection ? context.collection.trim().toLowerCase() : '';
      if (['legal', 'pricing', 'payment_settings', 'payment'].includes(col)) {
        return false;
      }
      return user.isStaff && user.staffSections.map((s) => s.toLowerCase()).includes('content');
    }

    case 'media':
      return user.isStaff && user.staffSections.map((s) => s.toLowerCase()).includes('media');

    case 'cohorts':
      return user.isStaff && user.staffSections.map((s) => s.toLowerCase()).includes('cohorts');

    case 'student_roster':
      return user.isStaff && user.staffSections.map((s) => s.toLowerCase()).includes('students');

    // -----------------------------------------------------------------------
    // OWN DATA (enrolments, progress, orders, receipts, certificates)
    // Student: Own data only
    // Staff with 'students' / Owner: Can read others
    // -----------------------------------------------------------------------
    case 'own_data': {
      if (!context?.targetUserId) {
        // Querying caller's own context without explicit target
        return true;
      }

      const target = context.targetUserId.trim().toLowerCase();
      const isCaller =
        (user.userId && target === user.userId.toLowerCase()) ||
        (user.clerkId && target === user.clerkId.toLowerCase()) ||
        (user.email && target === user.email.toLowerCase()) ||
        target === 'me' ||
        target === 'self';

      if (isCaller) {
        return true;
      }

      // Querying someone else's data requires staff with 'students' section or Owner
      return user.isStaff && user.staffSections.map((s) => s.toLowerCase()).includes('students');
    }

    default:
      return false;
  }
}

/**
 * Checks section-level access for admin navigation and layouts.
 */
export function canAccessSection(
  user: PolicySubject | null | undefined,
  section: string,
  requiredLevel: 'VIEW' | 'MANAGE' = 'VIEW'
): boolean {
  void requiredLevel;
  if (!user || !user.isAuthenticated) return false;
  if (user.isOwner) return true;

  const normalized = section.trim().toLowerCase();
  // 'staff' section is strictly Owner-only!
  if (normalized === 'staff') return false;

  return user.isStaff && user.staffSections.map((s) => s.toLowerCase()).includes(normalized);
}

/**
 * Returns all admin sections that the given user is authorized to view.
 */
export function getAllowedAdminSections(
  user: PolicySubject | null | undefined,
  allSections: readonly string[] = [
    'content',
    'media',
    'courses',
    'cohorts',
    'sessions',
    'students',
    'quizzes',
    'analytics',
    'payments',
  ]
): string[] {
  if (!user || !user.isAuthenticated) return [];
  if (user.isOwner) {
    return [...allSections, 'staff'];
  }
  if (!user.isStaff) return [];

  const granted = (user.staffSections || []).map((s) => s.toLowerCase());
  return allSections.filter((s) => granted.includes(s.toLowerCase()) && s !== 'staff');
}
