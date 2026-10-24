import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerAuthUser, isAuthorizedForSection } from './serverAuth';
export {
  generateSignedPlaybackToken,
  generateSignedDocumentToken,
  verifySignedPlaybackToken,
  verifySignedDocumentToken,
} from './token-crypto';

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
  _req: NextRequest,
  courseSlugOrId: string
): Promise<UserCourseAccessResult> {
  const auth = await getServerAuthUser();
  const email = auth.email?.toLowerCase().trim();
  const userId = auth.userId;

  // 1. Site Owner check
  if (auth.isOwner) {
    return {
      isEnrolled: true,
      isStaffOrOwner: true,
      userEmail: email || undefined,
      userId: userId || undefined,
      reason: 'Site Owner Access',
    };
  }

  // 2. Staff Permission check (Granular RBAC)
  if (isAuthorizedForSection(auth, 'courses', 'VIEW')) {
    return {
      isEnrolled: true,
      isStaffOrOwner: true,
      userEmail: email || undefined,
      userId: userId || undefined,
      reason: 'Staff Section Access',
    };
  }

  // If unauthenticated, cannot be enrolled
  if (!auth.isAuthenticated || (!email && !userId)) {
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

    // Build user match criteria using verified database userId and Clerk ID
    const userMatch: Array<{ userId?: string; user?: { email?: string; clerkId?: string } }> = [];
    if (userId) {
      userMatch.push({ userId });
      userMatch.push({ user: { clerkId: auth.clerkId || userId } });
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
      select: {
        id: true,
        userId: true,
        user: { select: { name: true, email: true } },
      },
    });

    if (enrollment) {
      return {
        isEnrolled: true,
        isStaffOrOwner: false,
        enrollmentId: enrollment.id,
        userId: enrollment.userId,
        userName: enrollment.user.name,
        userEmail: enrollment.user.email || undefined,
        reason: 'Active Student Enrollment',
      };
    }

    return {
      isEnrolled: false,
      isStaffOrOwner: false,
      reason: 'No Active Enrollment Found',
    };
  } catch (err) {
    console.warn('[verifyUserCourseAccess] Database check error:', err);
    return {
      isEnrolled: false,
      isStaffOrOwner: false,
      reason: 'Database Error During Access Verification',
    };
  }
}
