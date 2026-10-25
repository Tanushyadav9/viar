import 'server-only';
import { prisma } from '@/lib/prisma';
import type { OrderData } from '@/lib/payments/orderTypes';
import {
  type UserCourseState,
  type UserCourseStatusResult,
  OWNER_WHATSAPP_NUMBER,
  getWhatsAppContactUrl,
} from './enrollmentTypes';

export type { UserCourseState, UserCourseStatusResult };
export { OWNER_WHATSAPP_NUMBER, getWhatsAppContactUrl };
/**
 * Server-authoritative resolution of a student's real state for a given course.
 * Inspects Neon PostgreSQL database for:
 * 1. Active / revoked enrollments
 * 2. Non-expired pending course invitations
 * 3. Open (pending/claimed) or rejected orders
 */
export async function getUserCourseStatus(params: {
  userId?: string | null;
  userEmail?: string | null;
  courseSlugOrId: string;
}): Promise<UserCourseStatusResult> {
  const { userId, userEmail, courseSlugOrId } = params;

  // Resolve course ID and default cohort
  const course = await prisma.course.findFirst({
    where: {
      OR: [{ id: courseSlugOrId }, { slug: courseSlugOrId }],
    },
    include: {
      cohorts: { select: { id: true } },
    },
  }).catch(() => null);

  const courseId = course?.id || courseSlugOrId;
  const courseSlug = course?.slug || 'what-is-astrology';
  const defaultCohortId = course?.cohorts?.[0]?.id || 'cohort-wia-batch-1';
  const courseTitle = course?.title || 'What is Astrology';

  const defaultWhatsAppUrl = getWhatsAppContactUrl(
    `Hello Acharya Ji, I have a question regarding enrollment for "${courseTitle}".`
  );

  // 1. Not signed in
  if (!userId) {
    // Check if there is a pending invitation for this email (e.g. if email was passed via query or session)
    if (userEmail) {
      const pendingInvite = await prisma.courseInvitation.findFirst({
        where: {
          email: userEmail.trim().toLowerCase(),
          courseId,
          status: 'PENDING',
          expiresAt: { gt: new Date() },
        },
      }).catch(() => null);

      if (pendingInvite) {
        return {
          state: 'INVITATION_PENDING',
          isEnrolled: false,
          canAccessCourse: false,
          invitedEmail: pendingInvite.email,
          button: {
            text: 'Sign in with the invited email',
            textHi: 'आमंत्रित ईमेल से लॉगिन करें',
            href: `/login?email=${encodeURIComponent(pendingInvite.email)}&redirect=/courses/${courseSlug}`,
            variant: 'gold',
            actionType: 'login',
          },
          whatsappUrl: defaultWhatsAppUrl,
        };
      }
    }

    return {
      state: 'NOT_SIGNED_IN',
      isEnrolled: false,
      canAccessCourse: false,
      button: {
        text: 'Enroll',
        textHi: 'प्रवेश लें',
        href: `/login?redirect=/courses/${courseSlug}`,
        variant: 'gold',
        actionType: 'login',
      },
      whatsappUrl: defaultWhatsAppUrl,
    };
  }

  // 2. User is signed in. Check for existing Enrollment first
  let enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      OR: [
        { courseId },
        { cohort: { courseId } },
      ],
    },
    orderBy: { createdAt: 'desc' },
  }).catch(() => null);

  if (!enrollment) {
    try {
      const { ViarStore } = await import('../store.ts');
      const storeList = ViarStore.getEnrollments() as Array<{
        id: string;
        userId?: string;
        studentId?: string;
        studentEmail?: string;
        courseId?: string;
        cohortId?: string;
        courseSlug?: string;
        status?: string;
        paymentStatus?: string;
      }>;
      const match = storeList.find(
        (e) =>
          (e.userId === userId || e.studentId === userId || (userEmail && e.studentEmail === userEmail)) &&
          (e.courseId === courseId || e.courseSlug === courseSlug || courseSlug === 'what-is-astrology')
      );
      if (match) {
        enrollment = {
          id: match.id,
          userId,
          cohortId: match.cohortId || defaultCohortId,
          status: (match.status || 'ACTIVE') as 'ACTIVE',
        } as unknown as typeof enrollment;
      }
    } catch {}
  }

  if (enrollment) {
    if (enrollment.status === 'ACTIVE') {
      const courseAccessUrl = `/dashboard/courses/${enrollment.cohortId || defaultCohortId}`;
      return {
        state: 'ENROLLED',
        isEnrolled: true,
        canAccessCourse: true,
        enrollmentId: enrollment.id,
        cohortId: enrollment.cohortId || defaultCohortId,
        button: {
          text: "You're enrolled. Go to my course",
          textHi: 'आप नामांकित हैं। मेरे कोर्स पर जाएं',
          href: courseAccessUrl,
          variant: 'emerald',
          actionType: 'redirect',
        },
        whatsappUrl: defaultWhatsAppUrl,
      };
    }

    if (enrollment.status === 'REVOKED' || enrollment.status === 'REFUNDED') {
      const revokedWhatsAppUrl = getWhatsAppContactUrl(
        `Namaste Acharya Ji, my course access for "${courseTitle}" has ended. Please let me know how to restore access.`
      );
      return {
        state: 'ACCESS_REVOKED',
        isEnrolled: false,
        canAccessCourse: false,
        enrollmentId: enrollment.id,
        button: {
          text: 'Access ended. Contact us',
          textHi: 'पहुंच समाप्त। संपर्क करें',
          href: revokedWhatsAppUrl,
          variant: 'amber',
          actionType: 'whatsapp',
        },
        whatsappUrl: revokedWhatsAppUrl,
      };
    }
  }

  // 3. Check for pending CourseInvitation for this user's email if not already enrolled
  if (userEmail) {
    const pendingInvite = await prisma.courseInvitation.findFirst({
      where: {
        email: userEmail.trim().toLowerCase(),
        courseId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
    }).catch(() => null);

    if (pendingInvite) {
      return {
        state: 'INVITATION_PENDING',
        isEnrolled: false,
        canAccessCourse: false,
        invitedEmail: pendingInvite.email,
        button: {
          text: 'Sign in with the invited email',
          textHi: 'आमंत्रित ईमेल से लॉगिन करें',
          href: `/login?email=${encodeURIComponent(pendingInvite.email)}&redirect=/courses/${courseSlug}`,
          variant: 'gold',
          actionType: 'login',
        },
        whatsappUrl: defaultWhatsAppUrl,
      };
    }
  }

  // 4. Check for Orders
  const order = await prisma.order.findFirst({
    where: {
      userId,
      courseId,
    },
    include: {
      course: { select: { id: true, title: true, slug: true } },
      cohort: { select: { id: true, batchName: true } },
    },
    orderBy: { createdAt: 'desc' },
  }).catch(() => null);

  const now = new Date();

  if (order) {
    // If order is approved, user is enrolled
    if (order.status === 'APPROVED') {
      const courseAccessUrl = `/dashboard/courses/${order.cohortId || defaultCohortId}`;
      return {
        state: 'ENROLLED',
        isEnrolled: true,
        canAccessCourse: true,
        order: order as unknown as OrderData,
        cohortId: order.cohortId || defaultCohortId,
        button: {
          text: "You're enrolled. Go to my course",
          textHi: 'आप नामांकित हैं। मेरे कोर्स पर जाएं',
          href: courseAccessUrl,
          variant: 'emerald',
          actionType: 'redirect',
        },
        whatsappUrl: defaultWhatsAppUrl,
      };
    }

    // Payment Claimed (waiting for Owner bank verification)
    if (order.status === 'PAYMENT_CLAIMED') {
      return {
        state: 'ORDER_CLAIMED',
        isEnrolled: false,
        canAccessCourse: false,
        order: order as unknown as OrderData,
        cohortId: order.cohortId || defaultCohortId,
        button: {
          text: 'Payment under verification',
          textHi: 'भुगतान सत्यापन प्रक्रिया में है',
          href: `/checkout/${order.cohortId || defaultCohortId}`,
          variant: 'amber',
          actionType: 'link',
        },
        whatsappUrl: getWhatsAppContactUrl(
          `Namaste Acharya Ji, I have submitted my UTR for order ${order.orderReference}. Please verify my payment.`
        ),
      };
    }

    // Pending payment (and not expired)
    if (order.status === 'PENDING_PAYMENT') {
      if (new Date(order.expiresAt) > now) {
        return {
          state: 'ORDER_PENDING',
          isEnrolled: false,
          canAccessCourse: false,
          order: order as unknown as OrderData,
          cohortId: order.cohortId || defaultCohortId,
          button: {
            text: 'Resume payment',
            textHi: 'भुगतान जारी रखें',
            href: `/checkout/${order.cohortId || defaultCohortId}`,
            variant: 'gold',
            actionType: 'link',
          },
          whatsappUrl: defaultWhatsAppUrl,
        };
      }
    }

    // Order rejected by Owner
    if (order.status === 'REJECTED') {
      const reason = order.rejectionReason || 'Payment verification could not be completed.';
      return {
        state: 'ORDER_REJECTED',
        isEnrolled: false,
        canAccessCourse: false,
        order: order as unknown as OrderData,
        rejectionReason: reason,
        cohortId: order.cohortId || defaultCohortId,
        button: {
          text: 'Try again',
          textHi: 'पुनः प्रयास करें',
          href: `/checkout/${order.cohortId || defaultCohortId}?retry=1`,
          variant: 'outline',
          actionType: 'link',
        },
        whatsappUrl: getWhatsAppContactUrl(
          `Namaste Acharya Ji, regarding rejected order ${order.orderReference} (${reason}), I would like to try again.`
        ),
      };
    }
  }

  // 5. Signed in, nothing yet
  return {
    state: 'NO_ORDER',
    isEnrolled: false,
    canAccessCourse: false,
    cohortId: defaultCohortId,
    button: {
      text: 'Enroll',
      textHi: 'प्रवेश लें',
      href: `/checkout/${defaultCohortId}`,
      variant: 'gold',
      actionType: 'link',
    },
    whatsappUrl: defaultWhatsAppUrl,
  };
}
