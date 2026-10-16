import { prisma } from '../prisma.ts';
import { logger } from '../logger.ts';
import type { UserRole } from '../types.ts';
import { getPrimaryOwnerEmail } from './permissions.ts';

export interface SyncUserParams {
  clerkId: string;
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  isEmailVerified?: boolean;
}

export interface SyncUserResult {
  user: {
    id: string;
    clerkId: string | null;
    email: string | null;
    name: string;
    phone: string | null;
    role: UserRole;
    isOwner: boolean;
    avatarUrl: string | null;
  };
  created: boolean;
  linkedExistingEmail: boolean;
  demotedFromOwner: boolean;
}

/**
 * Computes the authorized role and isOwner status.
 * 
 * SECURITY INVARIANTS:
 * 1. An account is recognized as Site Owner IF AND ONLY IF its verified email
 *    strictly matches OWNER_EMAIL (case-insensitively).
 * 2. A database OWNER for ANY other email is treated as STUDENT and logged.
 * 3. Staff access stays through /admin/team and StaffPermission.
 */
export function computeEffectiveRole(params: {
  email?: string | null;
  isEmailVerified?: boolean;
  existingRole?: UserRole | string | null;
  existingIsOwner?: boolean | null;
}): {
  role: UserRole;
  isOwner: boolean;
  wasDemoted: boolean;
} {
  const primaryOwnerEmail = getPrimaryOwnerEmail();
  const cleanEmail = params.email ? params.email.trim().toLowerCase() : '';

  // 1. OWNER is recognized ONLY when verified email strictly equals OWNER_EMAIL
  const isOwnerMatch = Boolean(
    params.isEmailVerified &&
    cleanEmail &&
    primaryOwnerEmail &&
    cleanEmail === primaryOwnerEmail
  );

  if (isOwnerMatch) {
    return {
      role: 'OWNER',
      isOwner: true,
      wasDemoted: false,
    };
  }

  // 2. Not the site owner:
  // If the database record previously had role === 'OWNER' or isOwner === true,
  // it MUST be treated as STUDENT and logged.
  if (params.existingRole === 'OWNER' || params.existingIsOwner === true) {
    return {
      role: 'STUDENT',
      isOwner: false,
      wasDemoted: true,
    };
  }

  // 3. Staff access: Preserve existing staff role if already assigned via /admin/team
  if (params.existingRole === 'INSTRUCTOR' || params.existingRole === 'ADMIN') {
    return {
      role: params.existingRole as UserRole,
      isOwner: false,
      wasDemoted: false,
    };
  }

  // 4. Default for all other users is STUDENT
  return {
    role: 'STUDENT',
    isOwner: false,
    wasDemoted: false,
  };
}

/**
 * Idempotently creates or updates the database User row for an authenticated Clerk session.
 * 
 * Core Behaviors:
 * 1. Checks if a row already exists with the given clerkId.
 * 2. If not found by clerkId, checks if a row already exists with the same email.
 *    If found by email, links clerkId to that existing row instead of duplicating.
 * 3. Computes roles strictly: OWNER only when verified email equals OWNER_EMAIL.
 *    Any database OWNER for any other email is treated as STUDENT and logged.
 * 4. Ensures every sign-in creates the database User row (just-in-time and webhook).
 */
export async function syncDatabaseUser(params: SyncUserParams): Promise<SyncUserResult> {
  const cleanClerkId = params.clerkId.trim();
  const cleanEmail = params.email ? params.email.trim().toLowerCase() : null;
  const cleanName = params.name?.trim() || (cleanEmail ? cleanEmail.split('@')[0] : 'Student');
  const cleanPhone = params.phone?.trim() || null;
  const avatarUrl = params.avatarUrl || null;
  const isEmailVerified = params.isEmailVerified ?? Boolean(cleanEmail);

  let existingUser = null;
  let linkedExistingEmail = false;

  // 1. Check if user already exists by clerkId
  existingUser = await prisma.user.findUnique({
    where: { clerkId: cleanClerkId },
  });

  // 2. If not found by clerkId, look up by unique email to link instead of duplicate
  if (!existingUser && cleanEmail) {
    const existingByEmail = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });
    if (existingByEmail) {
      existingUser = existingByEmail;
      linkedExistingEmail = true;
    }
  }

  // 3. Compute effective role & owner flag
  const { role, isOwner, wasDemoted } = computeEffectiveRole({
    email: cleanEmail,
    isEmailVerified,
    existingRole: existingUser?.role,
    existingIsOwner: existingUser?.isOwner,
  });

  // 4. If an unauthorized database OWNER was detected, log immediately
  if (wasDemoted) {
    logger.securityAlert('Database OWNER for non-owner email demoted to STUDENT', {
      event: 'unauthorized_access',
      service: 'auth',
      email: cleanEmail,
      clerkId: cleanClerkId,
      userId: existingUser?.id,
      previousRole: existingUser?.role,
      previousIsOwner: existingUser?.isOwner,
    });

    await prisma.activityLog.create({
      data: {
        action: 'UNAUTHORIZED_OWNER_DEMOTED',
        entityType: 'USER',
        entityId: existingUser?.id || cleanClerkId,
        userEmail: cleanEmail,
        userName: cleanName,
        reason: 'Database OWNER does not match OWNER_EMAIL. Treated as STUDENT.',
        details: {
          email: cleanEmail,
          clerkId: cleanClerkId,
          previousRole: existingUser?.role,
          previousIsOwner: existingUser?.isOwner,
          demotedAt: new Date().toISOString(),
        },
      },
    }).catch(() => {});
  }

  // 5. Update existing record (links clerkId to existing email row)
  if (existingUser) {
    const updated = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        clerkId: cleanClerkId,
        ...(cleanEmail ? { email: cleanEmail } : {}),
        ...(params.name ? { name: cleanName } : {}),
        ...(cleanPhone ? { phone: cleanPhone } : {}),
        ...(avatarUrl ? { avatarUrl } : {}),
        role,
        isOwner,
      },
      select: {
        id: true,
        clerkId: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isOwner: true,
        avatarUrl: true,
      },
    });

    return {
      user: updated,
      created: false,
      linkedExistingEmail,
      demotedFromOwner: wasDemoted,
    };
  }

  // 6. Create new record (with retry if concurrent insert created the email)
  try {
    const created = await prisma.user.create({
      data: {
        clerkId: cleanClerkId,
        email: cleanEmail,
        name: cleanName,
        phone: cleanPhone,
        avatarUrl,
        role,
        isOwner,
        country: 'IN',
        timezone: 'Asia/Kolkata',
      },
      select: {
        id: true,
        clerkId: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isOwner: true,
        avatarUrl: true,
      },
    });

    return {
      user: created,
      created: true,
      linkedExistingEmail: false,
      demotedFromOwner: false,
    };
  } catch (err: unknown) {
    // Handle Prisma unique constraint race condition on email (P2002)
    if (cleanEmail && (err as { code?: string })?.code === 'P2002') {
      const concurrentUser = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });
      if (concurrentUser) {
        const fallbackUpdated = await prisma.user.update({
          where: { id: concurrentUser.id },
          data: {
            clerkId: cleanClerkId,
            role,
            isOwner,
          },
          select: {
            id: true,
            clerkId: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            isOwner: true,
            avatarUrl: true,
          },
        });
        return {
          user: fallbackUpdated,
          created: false,
          linkedExistingEmail: true,
          demotedFromOwner: wasDemoted,
        };
      }
    }
    throw err;
  }
}
