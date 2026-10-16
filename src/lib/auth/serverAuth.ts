import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

import { validateRedirectUrl } from './urlValidation';
import { syncDatabaseUser } from './userSync';

export { validateRedirectUrl };

export interface ServerAuthResult {
  isAuthenticated: boolean;
  userId: string | null;
  email: string | null;
  isEmailVerified: boolean;
  isOwner: boolean;
  isStaff: boolean;
  staffSections: string[];
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | 'OWNER';
  dbUser: {
    id: string;
    email: string | null;
    name: string;
    role: string;
    isOwner: boolean;
  } | null;
}

/**
 * Resolves the authenticated user on the server with Just-In-Time (JIT) Neon database sync.
 * 
 * CORE SECURITY & RELIABILITY GUARANTEES:
 * 1. Just-In-Time (JIT) Sync: Creates/links the database User row on the first authenticated
 *    server request, ensuring a valid row exists even if the Clerk webhook is delayed or missing.
 * 2. Idempotent Linking: If a user row with the same email already exists (e.g. from an order),
 *    it links the clerkId rather than throwing a duplicate constraint or creating duplicate rows.
 * 3. Authoritative Role Computation:
 *    - An account is recognized as OWNER IF AND ONLY IF its verified primary email
 *      strictly equals OWNER_EMAIL (case-insensitively).
 *    - A database OWNER for ANY other email is treated as STUDENT and logged.
 *    - Staff access stays through /admin/team and StaffPermission.
 */
export async function getServerAuthUser(): Promise<ServerAuthResult> {
  const fallbackResult: ServerAuthResult = {
    isAuthenticated: false,
    userId: null,
    email: null,
    isEmailVerified: false,
    isOwner: false,
    isStaff: false,
    staffSections: [],
    role: 'STUDENT',
    dbUser: null,
  };

  try {
    const { userId } = await auth();
    if (!userId) {
      return fallbackResult;
    }

    // Fetch verified user details from Clerk server backend API
    const clerkUser = await currentUser().catch(() => null);
    let verifiedEmail: string | null = null;
    let isEmailVerified = false;

    if (clerkUser && clerkUser.emailAddresses && clerkUser.emailAddresses.length > 0) {
      const primaryEmailObj =
        clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId) ||
        clerkUser.emailAddresses[0];

      if (primaryEmailObj && primaryEmailObj.verification?.status === 'verified') {
        isEmailVerified = true;
        verifiedEmail = primaryEmailObj.emailAddress.trim().toLowerCase();
      } else if (primaryEmailObj) {
        verifiedEmail = primaryEmailObj.emailAddress.trim().toLowerCase();
      }
    }

    // Server-side Owner detection: primary email verified + matches OWNER_EMAIL
    const ownerEmail = (process.env.OWNER_EMAIL || '').trim().toLowerCase();
    const isOwner = Boolean(
      isEmailVerified &&
      verifiedEmail &&
      ownerEmail &&
      verifiedEmail === ownerEmail
    );

    // Just-In-Time Sync: guarantees the database row exists on the first server request
    let dbUser: ServerAuthResult['dbUser'] = null;
    try {
      const syncResult = await syncDatabaseUser({
        clerkId: userId,
        email: verifiedEmail || (clerkUser?.emailAddresses?.[0]?.emailAddress?.trim().toLowerCase() ?? null),
        name: clerkUser ? `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() : null,
        phone: clerkUser?.phoneNumbers?.[0]?.phoneNumber || null,
        avatarUrl: clerkUser?.imageUrl || null,
        isEmailVerified,
      });
      dbUser = syncResult.user;
    } catch (syncError) {
      console.warn('[getServerAuthUser] JIT syncDatabaseUser warning:', syncError);
      // Fallback read in case of transient DB write issue
      try {
        dbUser = await prisma.user.findFirst({
          where: {
            OR: [
              { clerkId: userId },
              ...(verifiedEmail ? [{ email: verifiedEmail }] : []),
            ],
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isOwner: true,
          },
        });
      } catch {
        dbUser = null;
      }
    }

    // Authoritative role & staff permission computation
    let role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | 'OWNER' = 'STUDENT';
    let isStaff = false;
    let staffSections: string[] = [];

    if (isOwner) {
      role = 'OWNER';
      isStaff = true;
      staffSections = ['courses', 'cohorts', 'students', 'quizzes', 'analytics', 'payments', 'staff'];
    } else {
      // Query active StaffPermission records from Neon PostgreSQL
      if (dbUser) {
        try {
          const activePerms = await prisma.staffPermission.findMany({
            where: {
              OR: [
                { userId: dbUser.id },
                ...(dbUser.email ? [{ userId: dbUser.email }] : []),
                ...(verifiedEmail ? [{ userId: verifiedEmail }] : []),
              ],
              revokedAt: null,
            },
            select: { section: true },
          });

          if (activePerms && activePerms.length > 0) {
            staffSections = Array.from(new Set(activePerms.map((p) => p.section.toLowerCase())));
            isStaff = true;
          }
        } catch {
          // Graceful fallback on unprovisioned/offline DB in test environments
          staffSections = [];
        }
      }

      if (dbUser?.role === 'ADMIN' || dbUser?.role === 'INSTRUCTOR') {
        role = dbUser.role as 'INSTRUCTOR' | 'ADMIN';
        isStaff = true;
        if (staffSections.length === 0) {
          staffSections = ['courses', 'cohorts', 'students', 'quizzes', 'analytics', 'payments'];
        }
      } else {
        // Database OWNER for non-owner email is treated strictly as STUDENT (and logged during sync)
        role = 'STUDENT';
      }
    }

    return {
      isAuthenticated: true,
      userId,
      email: verifiedEmail,
      isEmailVerified,
      isOwner,
      isStaff,
      staffSections,
      role,
      dbUser,
    };
  } catch (error) {
    console.warn('[getServerAuthUser] Error resolving server session:', error);
    return fallbackResult;
  }
}

/**
 * Server Layout Guard: Requires valid authentication.
 */
export async function requireAuth(targetPath: string = '/dashboard'): Promise<ServerAuthResult> {
  const result = await getServerAuthUser();
  if (!result.isAuthenticated || !result.userId) {
    const validTarget = validateRedirectUrl(targetPath, '/dashboard');
    redirect(`/login?redirect_url=${encodeURIComponent(validTarget)}`);
  }
  return result;
}

/**
 * Server Layout Guard: Requires Site Owner OR authorized Staff member.
 * - Site Owner: Reaches admin areas directly with no redirect and no loop.
 * - Staff member: Allowed into admin area if granted permissions exist.
 * - Students: Redirected away to /dashboard?error=admin_restricted (no loop).
 * - Unauthenticated: Redirected to /login with validated redirect_url.
 */
export async function requireAdminOrStaff(targetPath: string = '/admin'): Promise<ServerAuthResult> {
  const result = await getServerAuthUser();
  if (!result.isAuthenticated || !result.userId) {
    const validTarget = validateRedirectUrl(targetPath, '/admin');
    redirect(`/login?redirect_url=${encodeURIComponent(validTarget)}`);
  }
  if (!result.isOwner && !result.isStaff) {
    redirect('/dashboard?error=admin_restricted');
  }
  return result;
}

/**
 * Server Layout Guard: Requires Site Owner strictly.
 * - Site Owner: Passes directly with no redirect.
 * - Staff member: Redirected to /admin?error=owner_only (retained in admin area, notified of restriction).
 * - Students: Redirected away to /dashboard?error=admin_restricted.
 * - Unauthenticated: Redirected to /login with validated redirect_url.
 */
export async function requireOwner(targetPath: string = '/admin'): Promise<ServerAuthResult> {
  const result = await getServerAuthUser();
  if (!result.isAuthenticated || !result.userId) {
    const validTarget = validateRedirectUrl(targetPath, '/admin');
    redirect(`/login?redirect_url=${encodeURIComponent(validTarget)}`);
  }
  if (!result.isOwner) {
    if (result.isStaff) {
      redirect('/admin?error=owner_only');
    } else {
      redirect('/dashboard?error=admin_restricted');
    }
  }
  return result;
}

/**
 * Server Layout Guard: Requires Instructor or Admin or Owner or authorized Staff.
 * - Site Owner & Staff: Passes directly with no redirect.
 * - Students: Redirected away to /dashboard?error=instructor_restricted.
 * - Unauthenticated: Redirected to /login with validated redirect_url.
 */
export async function requireInstructor(targetPath: string = '/instructor'): Promise<ServerAuthResult> {
  const result = await getServerAuthUser();
  if (!result.isAuthenticated || !result.userId) {
    const validTarget = validateRedirectUrl(targetPath, '/instructor');
    redirect(`/login?redirect_url=${encodeURIComponent(validTarget)}`);
  }
  if (!result.isOwner && !result.isStaff && result.role !== 'INSTRUCTOR' && result.role !== 'ADMIN') {
    redirect('/dashboard?error=instructor_restricted');
  }
  return result;
}
