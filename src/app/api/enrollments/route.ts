import { NextRequest, NextResponse } from 'next/server';
import { ONE_TO_ONE_ENABLED } from '@/config/features';
import { prisma } from '@/lib/prisma';
import { getServerAuthUser, canAccessArea } from '@/lib/auth/serverAuth';
import { emailService } from '@/lib/email';
import { env } from '@/config/env';

export async function GET(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated || !auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Session required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');
    const cohortId = searchParams.get('cohortId');
    const searchQuery = searchParams.get('q') || '';

    const hasRosterPermission = canAccessArea(auth, 'student_roster');
    let targetUserIdForQuery: string | null = null;

    if (requestedUserId) {
      const isSelf = canAccessArea(auth, 'own_data', { targetUserId: requestedUserId });
      if (!isSelf && !hasRosterPermission) {
        return NextResponse.json(
          {
            success: false,
            error: "Forbidden: Students may only view their own enrollments. Roster access requires 'students' permission.",
          },
          { status: 403 }
        );
      }
      targetUserIdForQuery = requestedUserId;
    } else {
      // If no userId is specified:
      // - If caller has roster permission (Owner or Staff with 'students'), query the general roster
      // - If caller is a regular student, automatically default to their OWN enrollments (never 403!)
      if (!hasRosterPermission) {
        targetUserIdForQuery = auth.userId;
      }
    }

    try {
      const whereClause: Record<string, unknown> = {};
      if (targetUserIdForQuery) {
        const isSelfMatch =
          targetUserIdForQuery === auth.userId ||
          targetUserIdForQuery === auth.clerkId ||
          targetUserIdForQuery === 'self' ||
          targetUserIdForQuery === 'me' ||
          (auth.email && targetUserIdForQuery.toLowerCase() === auth.email.toLowerCase());

        if (isSelfMatch) {
          whereClause.OR = [
            { userId: auth.userId },
            ...(auth.clerkId ? [{ user: { clerkId: auth.clerkId } }] : []),
            ...(auth.email ? [{ user: { email: auth.email } }] : []),
          ];
        } else {
          whereClause.OR = [
            { userId: targetUserIdForQuery },
            { user: { clerkId: targetUserIdForQuery } },
            { user: { email: targetUserIdForQuery } },
          ];
        }
      }
      if (cohortId && cohortId !== 'all') whereClause.cohortId = cohortId;
      if (courseId && courseId !== 'all') {
        const courseMatches = [
          { courseId },
          { cohort: { courseId } },
          { course: { slug: courseId } },
        ];
        if (whereClause.OR) {
          whereClause.AND = [{ OR: courseMatches }];
        } else {
          whereClause.OR = courseMatches;
        }
      }

      if (searchQuery.trim()) {
        whereClause.user = {
          OR: [
            { name: { contains: searchQuery.trim(), mode: 'insensitive' } },
            { email: { contains: searchQuery.trim(), mode: 'insensitive' } },
            { phone: { contains: searchQuery.trim(), mode: 'insensitive' } },
          ],
        };
      }

      const dbEnrollments = await prisma.enrollment.findMany({
        where: whereClause,
        include: {
          user: {
            include: {
              certificates: true,
              quizAttempts: { orderBy: { attemptedAt: 'desc' } },
              lessonProgress: { where: { completed: true } },
            },
          },
          course: {
            include: {
              modules: {
                include: { lessons: true },
              },
            },
          },
          cohort: {
            include: {
              course: {
                include: {
                  modules: {
                    include: { lessons: true },
                  },
                },
              },
            },
          },
          payment: true,
          order: true,
        },
        orderBy: { enrolledAt: 'desc' },
      });

      if (dbEnrollments && dbEnrollments.length > 0) {
        const roster = dbEnrollments.map((enr) => {
          const associatedCourse = enr.course || enr.cohort?.course;
          const totalLessonsInCourse = associatedCourse?.modules?.reduce((acc: number, m: { lessons: unknown[] }) => acc + m.lessons.length, 0) || associatedCourse?.totalClasses || 23;
          const completedLessonsCount = enr.user.lessonProgress.length;
          const progressPercentage = Math.min(100, Math.round((completedLessonsCount / Math.max(1, totalLessonsInCourse)) * 100));

          const cert = enr.user.certificates.find((c) => c.cohortId === enr.cohortId || c.courseId === associatedCourse?.id);
          const latestAttempt = enr.user.quizAttempts[0];

          let quizResult = 'Not Attempted';
          if (latestAttempt) {
            quizResult = latestAttempt.passed
              ? `Passed (${latestAttempt.scorePercentage}%)`
              : `Failed (${latestAttempt.scorePercentage}%)`;
          }

          let certificateStatus = 'Not Issued';
          if (cert) {
            certificateStatus = `Issued (${cert.certificateNumber})`;
          } else if (latestAttempt && latestAttempt.passed) {
            certificateStatus = 'Eligible (Exam Passed)';
          }

          const isTest = Boolean(
            enr.order?.notes?.includes('[TEST_PURCHASE]') ||
            enr.paymentReference?.includes('TEST') ||
            enr.paymentReference?.includes('WALKTHROUGH') ||
            enr.user?.name?.startsWith('[TEST]') ||
            enr.user?.email?.includes('example.com')
          );

          let paymentMethod = 'Granted by Owner, no payment';
          let displayAmount = 0;
          let paymentReference = '—';

          if (enr.order && enr.order.status === 'APPROVED') {
            paymentMethod = 'UPI QR Code';
            displayAmount = enr.order.amount || 5100;
            paymentReference = enr.order.utr ? `UTR: ${enr.order.utr}` : enr.order.orderReference;
          } else if (enr.payment && enr.payment.status === 'COMPLETED') {
            paymentMethod = enr.payment.provider === 'UPI_QR' ? 'UPI QR Code' :
                            enr.payment.provider === 'BANK_TRANSFER' ? 'Bank Transfer' :
                            'Offline Payment';
            displayAmount = enr.payment.amount || 0;
            paymentReference = enr.payment.providerReference || '—';
          } else if (enr.amountPaid > 0 && enr.paymentReference && !enr.paymentReference.startsWith('MANUAL') && !enr.paymentReference.startsWith('OWNER') && !enr.paymentReference.startsWith('VIAR-ORD-WALKTHROUGH')) {
            paymentMethod = 'Offline Payment';
            displayAmount = enr.amountPaid;
            paymentReference = enr.paymentReference;
          } else {
            // Manual grant by Owner without an actual recorded payment
            paymentMethod = 'Granted by Owner, no payment';
            displayAmount = 0;
            paymentReference = '—';
          }

          return {
            id: enr.id,
            studentId: enr.userId,
            studentName: enr.user?.name || 'Student',
            studentEmail: enr.user?.email || 'student@example.com',
            studentPhone: enr.user?.phone || '',
            courseId: associatedCourse?.id || 'course-what-is-astrology',
            courseTitle: associatedCourse?.title || 'The Ultimate Vedic Astrology Course',
            cohortId: enr.cohortId || '',
            cohortBatchName:
              enr.cohort?.batchName ||
              (ONE_TO_ONE_ENABLED ? 'Recorded modules and 1-on-1 sessions' : 'Recorded modules and live classes'),
            enrolledAt: enr.enrolledAt ? enr.enrolledAt.toISOString() : new Date().toISOString(),
            amountPaid: displayAmount,
            paymentAmount: displayAmount,
            currency: enr.currency || 'INR',
            paymentStatus: enr.status || 'ACTIVE',
            paymentReference,
            paymentId: paymentReference !== '—' ? paymentReference : enr.id,
            paymentMethod,
            isTest,
            progressPercentage,
            completedLessonsCount,
            totalLessonsCount: totalLessonsInCourse,
            quizResult,
            quizScorePercentage: latestAttempt?.scorePercentage,
            certificateStatus,
            certificateId: cert?.id,
            certificateVerificationCode: cert?.certificateNumber,
          };
        });

        return NextResponse.json({ success: true, enrollments: roster });
      }
    } catch (dbError) {
      console.warn('Database query for enrollments failed:', (dbError as Error).message);
    }

    return NextResponse.json({ success: true, enrollments: [] });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    // Unified Policy: Granting or revoking enrolment is strictly Owner-only
    if (!canAccessArea(auth, 'enrollment_mutation')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Manually granting course access is restricted to the Site Owner only.' },
        { status: 403 }
      );
    }
    const body = await req.json();
    const {
      studentName,
      studentEmail,
      studentPhone,
      courseId,
      cohortId,
      amount,
      currency,
      paymentMethod,
    } = body;

    if (!studentName || !studentEmail) {
      return NextResponse.json(
        { success: false, error: 'studentName and studentEmail are required' },
        { status: 400 }
      );
    }

    try {
      // 1. Ensure user exists
      let user = await prisma.user.findFirst({
        where: { email: studentEmail },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            name: studentName,
            email: studentEmail,
            phone: studentPhone || null,
            role: 'STUDENT',
          },
        });
      }

      // 2. Ensure course and cohort exist
      let targetCourse = await prisma.course.findFirst({
        where: courseId ? { OR: [{ id: courseId }, { slug: courseId }] } : {},
      });

      let cohort = await prisma.cohort.findFirst({
        where: cohortId ? { id: cohortId } : (targetCourse ? { courseId: targetCourse.id } : {}),
        include: { course: true },
      });

      if (!cohort) {
        cohort = await prisma.cohort.findFirst({
          include: { course: true },
        });
      }

      if (!cohort) {
        return NextResponse.json(
          { success: false, error: 'No active course found for enrollment' },
          { status: 404 }
        );
      }

      targetCourse = cohort.course;

      // 3. Create payment record
      const paymentRef = paymentMethod ? `pay_${paymentMethod.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}` : `pay_direct_${Date.now()}`;
      const payment = await prisma.payment.create({
        data: {
          userId: user.id,
          cohortId: cohort.id,
          courseId: targetCourse.id,
          provider: 'MANUAL_VERIFICATION',
          providerReference: paymentRef,
          amount: Number(amount) || targetCourse.priceInr || 5100,
          currency: 'INR',
          status: 'COMPLETED',
          studentName: user.name,
          studentEmail: user.email,
          studentPhone: user.phone,
        },
      });

      // 4. Create enrollment (historical price paid is immutably stored in amountPaid)
      const enrollment = await prisma.enrollment.create({
        data: {
          userId: user.id,
          courseId: targetCourse.id,
          cohortId: cohort.id,
          paymentId: payment.id,
          paymentReference: paymentRef,
          amountPaid: Number(amount) || targetCourse.priceInr || 5100,
          currency: currency || 'INR',
          status: 'ACTIVE',
        },
      });

      // 5. Update cohort enrolled count
      await prisma.cohort.update({
        where: { id: cohort.id },
        data: { enrolledCount: { increment: 1 } },
      });

      // 6. Log enrollment creation
      await prisma.activityLog.create({
        data: {
          userId: auth.userId || user.id,
          userEmail: auth.userEmail || user.email,
          action: 'ENROLLMENT_CREATED',
          entityType: 'ENROLLMENT',
          entityId: enrollment.id,
          courseId: targetCourse.id,
          reason: `Student enrollment created via ${paymentMethod || 'Checkout'}`,
          details: { studentName, studentEmail, amountPaid: enrollment.amountPaid, currency: enrollment.currency },
        },
      });

      // 7. Dispatch Welcome Enrollment Email
      await emailService.sendEnrollmentConfirmation({
        studentName,
        studentEmail,
        courseTitle: targetCourse.title,
        cohortName: cohort.batchName,
        startDate: cohort.startDate.toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        amountPaid: enrollment.amountPaid,
        currency: enrollment.currency,
        dashboardUrl: `${env.appUrl}/dashboard/courses/${cohort.id}`,
      }).catch((err) => console.error('Enrollment email failed:', err));

      return NextResponse.json({
        success: true,
        enrollmentId: enrollment.id,
        userId: user.id,
        cohortId: cohort.id,
        courseId: targetCourse.id,
      }, { status: 201 });
    } catch (dbErr) {
      console.error('Enrollment DB creation error:', dbErr);
      return NextResponse.json(
        { success: false, error: (dbErr as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
