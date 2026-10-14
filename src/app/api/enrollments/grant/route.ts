import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractAuthFromRequest, checkStaffSectionAccess } from '@/lib/auth/permissions';
import { emailService } from '@/lib/email';
import { env } from '@/config/env';

export async function POST(req: NextRequest) {
  try {
    const auth = extractAuthFromRequest(req);
    const accessCheck = checkStaffSectionAccess({
      user: auth.userEmail || auth.userId || null,
      section: 'students',
      requiredLevel: 'MANAGE',
    });

    // Rule: "The Owner can grant or revoke access manually (for example for an offline payment or a refund), with a required reason recorded in an audit log."
    if (!accessCheck.isOwner) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: Manually granting course access is restricted to the Site Owner only.',
        },
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
      amountPaid,
      currency,
      reason,
    } = body;

    if (!studentName?.trim() || !studentEmail?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Student name and email are required.' },
        { status: 400 }
      );
    }

    // Rule: REQUIRED REASON
    if (!reason || !reason.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'A specific reason is strictly required to manually grant course access (e.g., "Offline cash payment received at Baidyanath Dham Ashram" or "Scholarship grant").',
        },
        { status: 400 }
      );
    }

    // 1. Ensure User exists
    let user = await prisma.user.findFirst({
      where: { email: studentEmail.trim().toLowerCase() },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: studentName.trim(),
          email: studentEmail.trim().toLowerCase(),
          phone: studentPhone?.trim() || null,
          role: 'STUDENT',
        },
      });
    }

    // 2. Identify Course and Cohort
    let targetCourse = await prisma.course.findFirst({
      where: courseId ? { OR: [{ id: courseId }, { slug: courseId }] } : {},
    });

    let cohort = await prisma.cohort.findFirst({
      where: cohortId ? { id: cohortId } : (targetCourse ? { courseId: targetCourse.id } : {}),
      include: { course: true },
    });

    if (!cohort) {
      cohort = await prisma.cohort.findFirst({ include: { course: true } });
    }

    if (!cohort) {
      return NextResponse.json({ success: false, error: 'No active cohort found' }, { status: 404 });
    }

    targetCourse = cohort.course;

    // 3. Create or Reactivate Enrollment
    let enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: user.id,
        cohortId: cohort.id,
      },
    });

    const parsedAmount = amountPaid !== undefined ? Number(amountPaid) : targetCourse.priceInr;

    if (enrollment) {
      enrollment = await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          status: 'ACTIVE',
          amountPaid: parsedAmount,
          currency: currency || 'INR',
          paymentReference: 'MANUAL_GRANT_OWNER',
        },
      });
    } else {
      enrollment = await prisma.enrollment.create({
        data: {
          userId: user.id,
          courseId: targetCourse.id,
          cohortId: cohort.id,
          paymentReference: 'MANUAL_GRANT_OWNER',
          amountPaid: parsedAmount,
          currency: currency || 'INR',
          status: 'ACTIVE',
        },
      });

      await prisma.cohort.update({
        where: { id: cohort.id },
        data: { enrolledCount: { increment: 1 } },
      });
    }

    // 4. Record REQUIRED audit log entry
    await prisma.activityLog.create({
      data: {
        userId: auth.userId || null,
        userEmail: auth.userEmail || null,
        action: 'ENROLLMENT_GRANTED',
        entityType: 'ENROLLMENT',
        entityId: enrollment.id,
        courseId: targetCourse.id,
        reason: reason.trim(),
        details: {
          studentName: user.name,
          studentEmail: user.email,
          courseTitle: targetCourse.title,
          amountPaid: enrollment.amountPaid,
          currency: enrollment.currency,
          cohortBatchName: cohort.batchName,
        },
      },
    });

    // 5. Send confirmation email
    await emailService.sendEnrollmentConfirmation({
      studentName: user.name,
      studentEmail: user.email || studentEmail,
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
    }).catch((err) => console.error('Grant enrollment email failed:', err));

    return NextResponse.json({
      success: true,
      message: `Access successfully granted to ${user.name}. Audit log recorded.`,
      enrollmentId: enrollment.id,
    });
  } catch (error) {
    console.error('Manual grant error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
