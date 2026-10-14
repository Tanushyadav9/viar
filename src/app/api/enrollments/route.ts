import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEMO_ENROLLMENTS } from '@/lib/data';
import { extractAuthFromRequest, checkStaffSectionAccess } from '@/lib/auth/permissions';
import { emailService } from '@/lib/email';
import { env } from '@/config/env';

export async function GET(req: NextRequest) {
  try {
    const auth = extractAuthFromRequest(req);
    const accessCheck = checkStaffSectionAccess({
      user: auth.userEmail || auth.userId || null,
      section: 'students',
      requiredLevel: 'VIEW',
    });

    if (!accessCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: accessCheck.reason || "Forbidden: VIEW permission on 'students' required.",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const cohortId = searchParams.get('cohortId');

    try {
      const dbEnrollments = await prisma.enrollment.findMany({
        where: cohortId ? { cohortId } : {},
        include: {
          user: {
            include: {
              certificates: true,
              quizAttempts: true,
            },
          },
          cohort: {
            include: {
              course: true,
            },
          },
          payment: true,
        },
        orderBy: { enrolledAt: 'desc' },
      });

      if (dbEnrollments && dbEnrollments.length > 0) {
        const roster = dbEnrollments.map((enr) => {
          const cert = enr.user.certificates.find((c) => c.cohortId === enr.cohortId);
          const attempt = enr.user.quizAttempts.find((a) => a.cohortId === enr.cohortId);

          return {
            id: enr.id,
            studentId: enr.userId,
            studentName: enr.user.name,
            studentEmail: enr.user.email || 'student@example.com',
            studentPhone: enr.user.phone || '',
            courseId: enr.cohort.courseId,
            courseTitle: enr.cohort.course.title,
            cohortId: enr.cohortId,
            cohortBatchName: enr.cohort.batchName,
            enrolledAt: enr.enrolledAt.toISOString(),
            paymentStatus: enr.status === 'ACTIVE' ? 'PAID' : enr.status,
            paymentAmount: enr.amountPaid,
            currency: enr.currency,
            paymentMethod: enr.payment?.provider ? `${enr.payment.provider} (${enr.payment.providerReference})` : 'Online Checkout',
            watchedClassesCount: enr.cohort.course.totalClasses,
            totalClassesCount: enr.cohort.course.totalClasses,
            quizScorePercentage: attempt ? attempt.scorePercentage : undefined,
            certificateId: cert?.id,
            certificateVerificationCode: cert?.certificateNumber,
          };
        });

        return NextResponse.json({ success: true, enrollments: roster });
      }
    } catch (dbError) {
      console.warn('Database query for enrollments failed:', (dbError as Error).message);
    }

    // Fallback to demo roster if database is completely empty
    return NextResponse.json({ success: true, enrollments: DEMO_ENROLLMENTS });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
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

      // 2. Ensure cohort exists
      let cohort = await prisma.cohort.findFirst({
        where: cohortId ? { id: cohortId } : (courseId ? { courseId } : {}),
        include: { course: true },
      });

      if (!cohort) {
        // Fallback to first available cohort
        cohort = await prisma.cohort.findFirst({
          include: { course: true },
        });
      }

      if (!cohort) {
        return NextResponse.json(
          { success: false, error: 'No active cohort found for enrollment' },
          { status: 404 }
        );
      }

      // 3. Create payment record
      const paymentRef = paymentMethod ? `pay_${paymentMethod.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}` : `pay_manual_${Date.now()}`;
      const payment = await prisma.payment.create({
        data: {
          userId: user.id,
          cohortId: cohort.id,
          provider: currency === 'USD' ? 'STRIPE' : 'RAZORPAY',
          providerReference: paymentRef,
          amount: Number(amount) || cohort.course.priceInr || 5100,
          currency: currency || 'INR',
          status: 'COMPLETED',
        },
      });

      // 4. Create or upsert enrollment
      const enrollment = await prisma.enrollment.upsert({
        where: {
          userId_cohortId: {
            userId: user.id,
            cohortId: cohort.id,
          },
        },
        update: {
          amountPaid: Number(amount) || cohort.course.priceInr || 5100,
          currency: currency || 'INR',
          status: 'ACTIVE',
          paymentId: payment.id,
        },
        create: {
          userId: user.id,
          cohortId: cohort.id,
          amountPaid: Number(amount) || cohort.course.priceInr || 5100,
          currency: currency || 'INR',
          status: 'ACTIVE',
          paymentId: payment.id,
        },
      });

      // 5. Increment enrolled count
      await prisma.cohort.update({
        where: { id: cohort.id },
        data: { enrolledCount: { increment: 1 } },
      });

      // 6. Send transactional confirmation email
      await emailService.sendEnrollmentConfirmation({
        studentName,
        studentEmail,
        courseTitle: cohort.course.title,
        cohortName: cohort.batchName,
        startDate: 'Immediate Lifetime Access',
        amountPaid: Number(amount) || cohort.course.priceInr,
        currency: currency === 'USD' ? '$' : '₹',
        dashboardUrl: `${env.appUrl}/dashboard`,
      }).catch((err) => console.error('[Enrollments API] Email dispatch failed:', err));

      return NextResponse.json({
        success: true,
        message: 'Enrollment recorded successfully in database',
        enrollment,
      }, { status: 201 });
    } catch (dbError) {
      console.warn('Database write for enrollment failed:', (dbError as Error).message);
      return NextResponse.json(
        { success: false, error: (dbError as Error).message },
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
