import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractAuthFromRequest, isSiteOwner, checkStaffSectionAccess } from './permissions';

export interface UserCourseAccessResult {
  isEnrolled: boolean;
  isStaffOrOwner: boolean;
  userId?: string;
  userEmail?: string;
  userName?: string;
  enrollmentId?: string;
  reason?: string;
}

/**
 * Server-Side Access Verification for Courses & Curriculum Media.
 * Enforces:
 * 1. Site Owner and Staff with 'courses' section -> Full Access.
 * 2. Active student enrollment in PostgreSQL -> Full Access.
 * 3. All other requests -> Public Visitor (Restricted Access).
 */
export async function verifyUserCourseAccess(
  req: NextRequest,
  courseSlugOrId: string
): Promise<UserCourseAccessResult> {
  const auth = extractAuthFromRequest(req);
  const email = auth.userEmail?.toLowerCase().trim();
  const userId = auth.userId;

  // 1. Site Owner check
  if (email && isSiteOwner(email)) {
    return {
      isEnrolled: true,
      isStaffOrOwner: true,
      userEmail: email,
      userId,
      reason: 'Site Owner Access',
    };
  }

  // 2. Staff Permission check (Granular RBAC)
  const staffCheck = checkStaffSectionAccess({
    user: email || userId || null,
    section: 'courses',
    requiredLevel: 'VIEW',
  });

  if (staffCheck.allowed) {
    return {
      isEnrolled: true,
      isStaffOrOwner: true,
      userEmail: email,
      userId,
      reason: 'Staff Section Access',
    };
  }

  // If unauthenticated, cannot be enrolled
  if (!email && !userId) {
    return {
      isEnrolled: false,
      isStaffOrOwner: false,
      reason: 'Unauthenticated Visitor',
    };
  }

  // 3. Database Enrollment Verification
  try {
    // Locate the target course id
    const course = await prisma.course.findFirst({
      where: {
        OR: [{ slug: courseSlugOrId }, { id: courseSlugOrId }],
      },
      select: { id: true, slug: true },
    });

    const targetCourseId = course?.id;

    // Build user match criteria
    const userMatch: Array<{ userId?: string; user?: { email?: string; clerkId?: string } }> = [];
    if (userId) {
      userMatch.push({ userId });
      userMatch.push({ user: { clerkId: userId } });
    }
    if (email) userMatch.push({ user: { email } });

    // Look for ACTIVE enrollment matching this course or its cohorts
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        status: 'ACTIVE',
        OR: userMatch,
        AND: [
          {
            OR: [
              ...(targetCourseId ? [{ courseId: targetCourseId }] : []),
              { course: { slug: courseSlugOrId } },
              ...(targetCourseId ? [{ cohort: { courseId: targetCourseId } }] : []),
              { cohort: { course: { slug: courseSlugOrId } } },
              { cohortId: courseSlugOrId }, // in case a cohortId was directly passed
            ],
          },
        ],
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });

    if (enrollment) {
      return {
        isEnrolled: true,
        isStaffOrOwner: false,
        userId: enrollment.userId,
        userEmail: enrollment.user.email || undefined,
        userName: enrollment.user.name || undefined,
        enrollmentId: enrollment.id,
        reason: 'Active Student Enrollment',
      };
    }
  } catch (err) {
    console.warn('Database enrollment verification error:', (err as Error).message);
  }

  return {
    isEnrolled: false,
    isStaffOrOwner: false,
    userEmail: email,
    userId,
    reason: 'No Active Enrollment Found',
  };
}

export {
  generateSignedPlaybackToken,
  verifySignedPlaybackToken,
  generateSignedDocumentToken,
  verifySignedDocumentToken,
} from './token-crypto';

