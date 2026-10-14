import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractAuthFromRequest, checkStaffSectionAccess } from '@/lib/auth/permissions';

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
          error: 'Forbidden: Manually revoking course access is restricted to the Site Owner only.',
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { enrollmentId, reason } = body;

    if (!enrollmentId) {
      return NextResponse.json({ success: false, error: 'enrollmentId is required.' }, { status: 400 });
    }

    // Rule: REQUIRED REASON
    if (!reason || !reason.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'A specific reason is strictly required to revoke course access (e.g. "Full tuition refund issued" or "Student requested course cancellation").',
        },
        { status: 400 }
      );
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { user: true, cohort: { include: { course: true } } },
    });

    if (!enrollment) {
      return NextResponse.json({ success: false, error: 'Enrollment record not found.' }, { status: 404 });
    }

    // Update status to REVOKED
    const updated = await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { status: 'REVOKED' },
    });

    // Record in ActivityLog
    await prisma.activityLog.create({
      data: {
        userId: auth.userId || null,
        userEmail: auth.userEmail || null,
        action: 'ENROLLMENT_REVOKED',
        entityType: 'ENROLLMENT',
        entityId: enrollment.id,
        courseId: enrollment.courseId || enrollment.cohort?.courseId || null,
        reason: reason.trim(),
        details: {
          studentName: enrollment.user.name,
          studentEmail: enrollment.user.email,
          courseTitle: enrollment.cohort?.course?.title || 'Astrology Masterclass',
          amountPaid: enrollment.amountPaid,
          currency: enrollment.currency,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Access revoked for student ${enrollment.user.name}. Audit log recorded.`,
      enrollment: updated,
    });
  } catch (error) {
    console.error('Revoke enrollment error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
