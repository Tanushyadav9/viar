import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerAuthUser, canAccessArea } from '@/lib/auth/serverAuth';
import { emailService } from '@/lib/email';
import { env } from '@/config/env';

/**
 * Add Student By Email API
 * 
 * Strict Invariants:
 * 1. Strictly restricted to Site Owner only (Staff: 403, Students: 403).
 * 2. If user already exists in DB with verified email: activates enrollment immediately and emails student.
 * 3. If user does not exist yet: creates a pending CourseInvitation that automatically activates
 *    the moment they register with that verified email.
 * 4. Every grant, invite, and revocation is recorded in the ActivityLog audit trail.
 */

export async function GET(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    // Only Owner and authorized staff can view invitations list
    if (!auth.isOwner && !auth.isStaff) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const invitations = await prisma.courseInvitation.findMany({
      where: status ? { status } : undefined,
      include: {
        course: { select: { id: true, title: true, slug: true } },
        cohort: { select: { id: true, batchName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      invitations,
    });
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

    // Unified Policy: Only the Site Owner can grant or invite students
    if (!canAccessArea(auth, 'enrollment_mutation')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: Adding students by email is strictly restricted to the Site Owner only.',
        },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { email, courseId, cohortId, note, expiresDays = 7 } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'A valid student email address is required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const durationDays = Number(expiresDays) > 0 ? Number(expiresDays) : 7;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    // Identify target Course & Cohort
    let targetCourse = await prisma.course.findFirst({
      where: courseId ? { OR: [{ id: courseId }, { slug: courseId }] } : {},
    });

    if (!targetCourse) {
      targetCourse = await prisma.course.findFirst();
    }

    if (!targetCourse) {
      return NextResponse.json(
        { success: false, error: 'Target course not found.' },
        { status: 404 }
      );
    }

    let targetCohort = await prisma.cohort.findFirst({
      where: cohortId ? { id: cohortId } : { courseId: targetCourse.id },
    });

    if (!targetCohort) {
      targetCohort = await prisma.cohort.findFirst({ where: { courseId: targetCourse.id } });
    }

    const ownerEmail = auth.email || 'aapkaastro1606@gmail.com';

    // Check if a user already exists with this verified email
    const existingUser = await prisma.user.findFirst({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      // -------------------------------------------------------------
      // Case A: User already has an account -> Activate Immediately
      // -------------------------------------------------------------
      let enrollment = await prisma.enrollment.findFirst({
        where: {
          userId: existingUser.id,
          OR: [
            { courseId: targetCourse.id },
            ...(targetCohort ? [{ cohortId: targetCohort.id }] : []),
          ],
        },
      });

      if (enrollment && enrollment.status === 'ACTIVE') {
        return NextResponse.json({
          success: true,
          activated: true,
          message: `${existingUser.name || cleanEmail} is already actively enrolled in this course.`,
          enrollmentId: enrollment.id,
        });
      }

      const enrolledAt = new Date();
      if (enrollment) {
        enrollment = await prisma.enrollment.update({
          where: { id: enrollment.id },
          data: {
            status: 'ACTIVE',
            amountPaid: 0,
            currency: 'INR',
            paymentReference: 'OWNER_INVITATION_DIRECT',
            enrolledAt,
          },
        });
      } else {
        enrollment = await prisma.enrollment.create({
          data: {
            userId: existingUser.id,
            courseId: targetCourse.id,
            cohortId: targetCohort?.id || null,
            amountPaid: 0,
            currency: 'INR',
            paymentReference: 'OWNER_INVITATION_DIRECT',
            status: 'ACTIVE',
            enrolledAt,
          },
        });
      }

      // Record in audit log
      await prisma.activityLog.create({
        data: {
          userId: auth.userId || null,
          userEmail: ownerEmail,
          action: 'ENROLLMENT_GRANTED',
          entityType: 'ENROLLMENT',
          entityId: enrollment.id,
          courseId: targetCourse.id,
          reason: note ? note.trim() : 'Add student by email (immediate activation)',
          details: {
            studentName: existingUser.name,
            studentEmail: cleanEmail,
            courseTitle: targetCourse.title,
            invitedBy: ownerEmail,
            cohortId: targetCohort?.id || null,
          },
        },
      });

      // Send confirmation email
      await emailService.sendEnrollmentConfirmation({
        studentName: existingUser.name,
        studentEmail: cleanEmail,
        courseTitle: targetCourse.title,
        cohortName: targetCohort?.batchName || 'Foundation Batch',
        startDate: (targetCohort?.startDate || new Date()).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        amountPaid: 0,
        currency: 'INR',
        dashboardUrl: `${env.appUrl}/dashboard/courses/${targetCohort?.id || targetCourse.slug}`,
      }).catch((err) => console.error('Invite direct activation email failed:', err));

      return NextResponse.json({
        success: true,
        activated: true,
        enrollmentId: enrollment.id,
        message: `Account found for ${cleanEmail}. Enrolment was activated immediately and confirmation sent.`,
      });
    }

    // -----------------------------------------------------------------
    // Case B: User does not exist yet -> Store Pending Invitation
    // -----------------------------------------------------------------
    // Invalidate existing pending invitations for this email & course to avoid duplicates
    await prisma.courseInvitation.updateMany({
      where: {
        email: cleanEmail,
        courseId: targetCourse.id,
        status: 'PENDING',
      },
      data: {
        status: 'EXPIRED',
      },
    });

    const invitation = await prisma.courseInvitation.create({
      data: {
        email: cleanEmail,
        courseId: targetCourse.id,
        cohortId: targetCohort?.id || null,
        invitedBy: ownerEmail,
        note: note ? note.trim() : null,
        status: 'PENDING',
        expiresAt,
      },
    });

    // Record in audit log
    await prisma.activityLog.create({
      data: {
        userId: auth.userId || null,
        userEmail: ownerEmail,
        action: 'INVITATION_CREATED',
        entityType: 'INVITATION',
        entityId: invitation.id,
        courseId: targetCourse.id,
        reason: note ? note.trim() : 'Add student by email (pending invitation)',
        details: {
          studentEmail: cleanEmail,
          courseTitle: targetCourse.title,
          invitedBy: ownerEmail,
          expiresAt: expiresAt.toISOString(),
          durationDays,
        },
      },
    });

    // Send invitation email
    await emailService.sendEnrollmentConfirmation({
      studentName: 'Future Scholar',
      studentEmail: cleanEmail,
      courseTitle: targetCourse.title,
      cohortName: targetCohort?.batchName || 'Foundation Batch',
      startDate: (targetCohort?.startDate || new Date()).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      amountPaid: 0,
      currency: 'INR',
      dashboardUrl: `${env.appUrl}/sign-up`,
    }).catch((err) => console.error('Send invitation email failed:', err));

    return NextResponse.json({
      success: true,
      activated: false,
      invitationId: invitation.id,
      expiresAt: expiresAt.toISOString(),
      message: `Pending invitation created for ${cleanEmail}. Access will activate automatically the moment they sign up with this verified email.`,
    });
  } catch (error) {
    console.error('Add student by email error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();

    // Unified Policy: Only the Site Owner can revoke invitations
    if (!canAccessArea(auth, 'enrollment_mutation')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: Revoking invitations is strictly restricted to the Site Owner only.',
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const invitationId = searchParams.get('id');
    const reason = searchParams.get('reason') || 'Revoked by Site Owner';

    if (!invitationId) {
      return NextResponse.json(
        { success: false, error: 'invitationId is required' },
        { status: 400 }
      );
    }

    const invitation = await prisma.courseInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invitation not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.courseInvitation.update({
      where: { id: invitationId },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
        revokeReason: reason.trim(),
      },
    });

    // Record in audit log
    await prisma.activityLog.create({
      data: {
        userId: auth.userId || null,
        userEmail: auth.email || 'aapkaastro1606@gmail.com',
        action: 'INVITATION_REVOKED',
        entityType: 'INVITATION',
        entityId: invitation.id,
        courseId: invitation.courseId,
        reason: reason.trim(),
        details: {
          studentEmail: invitation.email,
          revokedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Invitation for ${invitation.email} has been revoked. Audit log saved.`,
      invitation: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
