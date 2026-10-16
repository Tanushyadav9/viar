import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

import { validateRedirectUrl } from './urlValidation';

export { validateRedirectUrl };

export interface ServerAuthResult {
  isAuthenticated: boolean;
  userId: string | null;
  email: string | null;
  isEmailVerified: boolean;
  isOwner: boolean;
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
 * Resolves the authenticated user on the server.
 * 
 * OWNER DETECTION SECURITY GUARANTEES:
 * 1. Reads primary email directly from Clerk's currentUser() backend API.
 * 2. Confirms that verification status is strictly 'verified'.
 * 3. Compares verified email case-insensitively against process.env.OWNER_EMAIL.
 * 4. NEVER trusts default session claims (which do not contain email).
 * 5. NEVER trusts browser-supplied cookies or headers in production.
 */
export async function getServerAuthUser(): Promise<ServerAuthResult> {
  const fallbackResult: ServerAuthResult = {
    isAuthenticated: false,
    userId: null,
    email: null,
    isEmailVerified: false,
    isOwner: false,
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

    // Look up user row in Neon PostgreSQL database
    let dbUser = null;
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

      // If user is verified owner, ensure DB state reflects OWNER role
      if (isOwner && dbUser && (!dbUser.isOwner || dbUser.role !== 'OWNER')) {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { isOwner: true, role: 'OWNER' },
        }).catch(() => {});
      }
    } catch {
      // Database connection error handling
      dbUser = null;
    }

    // Determine effective role
    let role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | 'OWNER' = 'STUDENT';
    if (isOwner) {
      role = 'OWNER';
    } else if (dbUser?.role === 'ADMIN' || dbUser?.role === 'INSTRUCTOR' || dbUser?.role === 'OWNER') {
      role = dbUser.role as 'INSTRUCTOR' | 'ADMIN' | 'OWNER';
    }

    return {
      isAuthenticated: true,
      userId,
      email: verifiedEmail,
      isEmailVerified,
      isOwner,
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
 * Server Layout Guard: Requires Site Owner.
 */
export async function requireOwner(targetPath: string = '/admin'): Promise<ServerAuthResult> {
  const result = await getServerAuthUser();
  if (!result.isAuthenticated || !result.userId) {
    const validTarget = validateRedirectUrl(targetPath, '/admin');
    redirect(`/login?redirect_url=${encodeURIComponent(validTarget)}`);
  }
  if (!result.isOwner) {
    redirect('/login?error=owner_only');
  }
  return result;
}

/**
 * Server Layout Guard: Requires Instructor or Admin or Owner.
 */
export async function requireInstructor(targetPath: string = '/instructor'): Promise<ServerAuthResult> {
  const result = await getServerAuthUser();
  if (!result.isAuthenticated || !result.userId) {
    const validTarget = validateRedirectUrl(targetPath, '/instructor');
    redirect(`/login?redirect_url=${encodeURIComponent(validTarget)}`);
  }
  if (!result.isOwner && result.role !== 'INSTRUCTOR' && result.role !== 'ADMIN') {
    redirect('/login?error=unauthorized_role');
  }
  return result;
}
