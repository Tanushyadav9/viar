import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { INITIAL_COURSES } from '@/lib/data';
import { extractAuthFromRequest, checkStaffSectionAccess } from '@/lib/auth/permissions';
import {
  verifyUserCourseAccess,
  generateSignedPlaybackToken,
  generateSignedDocumentToken,
} from '@/lib/auth/course-access';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slugOrId = params.slug;
    const access = await verifyUserCourseAccess(req, slugOrId);
    const isAuthorized = access.isEnrolled || access.isStaffOrOwner;

    try {
      const course = await prisma.course.findFirst({
        where: {
          OR: [{ slug: slugOrId }, { id: slugOrId }],
        },
        include: {
          cohorts: true,
          modules: {
            orderBy: { order: 'asc' },
            include: {
              lessons: {
                orderBy: { order: 'asc' },
              },
            },
          },
          quizzes: {
            include: {
              questions: {
                orderBy: { order: 'asc' },
                include: {
                  options: {
                    orderBy: { order: 'asc' },
                  },
                },
              },
            },
          },
          enrollments: {
            select: { id: true, userId: true },
          },
        },
      });

      if (course) {
        // Status Visibility Protection:
        // DRAFT courses are only accessible to Staff / Owner
        if (course.status === 'DRAFT' && !access.isStaffOrOwner) {
          return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
        }

        // ARCHIVED courses are only accessible to enrolled students or Staff / Owner
        if (course.status === 'ARCHIVED' && !isAuthorized) {
          return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
        }

        // Content Gating: sanitize lessons and quizzes based on enrollment status
        const sanitizedModules = course.modules.map((m) => ({
          ...m,
          lessons: m.lessons.map((lesson) => {
            const isFree = Boolean(lesson.isFreePreview);

            if (isAuthorized) {
              // Authorized student or staff: issue signed playback and document tokens
              let playbackUrl = lesson.videoProviderId || null;
              let signedToken: string | undefined;

              if (lesson.type === 'VIDEO' && lesson.videoProviderId) {
                const tokenData = generateSignedPlaybackToken(lesson.id, access.userId || 'staff');
                signedToken = tokenData.token;
                playbackUrl = `/api/courses/${course.slug}/lessons/${lesson.id}/play?token=${tokenData.token}`;
              }

              let docDownloadUrl = lesson.documentUrl || null;
              if (lesson.type === 'DOCUMENT' && (lesson.documentKey || lesson.documentUrl)) {
                const docTokenData = generateSignedDocumentToken(
                  lesson.id,
                  lesson.documentKey || 'study-guide',
                  access.userId || 'staff'
                );
                docDownloadUrl = docTokenData.downloadPath;
              }

              return {
                ...lesson,
                isLocked: false,
                playbackUrl,
                signedPlaybackToken: signedToken,
                documentDownloadUrl: docDownloadUrl,
              };
            }

            // Public Visitor / Non-Enrolled:
            if (isFree) {
              return {
                ...lesson,
                isLocked: false,
                playbackUrl: lesson.videoProviderId,
              };
            }

            // Paid lesson strictly stripped on the server
            return {
              id: lesson.id,
              moduleId: lesson.moduleId,
              order: lesson.order,
              type: lesson.type,
              title: lesson.title,
              description: lesson.description,
              isFreePreview: false,
              videoDuration: lesson.videoDuration,
              isLocked: true,
              // Strictly nullify secret keys and URLs on server
              videoProviderId: null,
              playbackUrl: null,
              documentKey: null,
              documentUrl: null,
              liveJoinLink: null,
              signedPlaybackToken: null,
              documentDownloadUrl: null,
            };
          }),
        }));

        // Quizzes protection: Never leak correct answers to clients before submission
        const sanitizedQuizzes = course.quizzes.map((q) => {
          if (!isAuthorized) {
            // Locked preview for non-enrolled visitors
            return {
              id: q.id,
              title: q.title,
              passingPercentage: q.passingPercentage,
              durationMinutes: q.durationMinutes,
              totalQuestions: q.questions.length,
              isLocked: true,
              questions: [],
            };
          }

          // Enrolled students receive questions and options with isCorrect stripped
          return {
            ...q,
            isLocked: false,
            questions: q.questions.map((qn) => ({
              id: qn.id,
              order: qn.order,
              question: qn.question,
              // Explanation stripped if not staff to prevent answer leakage
              explanation: access.isStaffOrOwner ? qn.explanation : undefined,
              options: qn.options.map((opt) => ({
                id: opt.id,
                order: opt.order,
                text: opt.text,
                // Only staff sees correct answer on fetch; students are graded on server
                isCorrect: access.isStaffOrOwner ? opt.isCorrect : undefined,
              })),
            })),
          };
        });

        return NextResponse.json({
          success: true,
          isUserEnrolled: access.isEnrolled,
          isStaffOrOwner: access.isStaffOrOwner,
          course: {
            ...course,
            enrollmentCount: course.enrollments.length,
            modules: sanitizedModules,
            quizzes: sanitizedQuizzes,
          },
        });
      }
    } catch (dbError) {
      console.warn('Database query for course slug failed:', (dbError as Error).message);
    }

    const fallback = INITIAL_COURSES.find(
      (c) => c.slug === slugOrId || c.id === slugOrId
    );

    if (fallback) {
      return NextResponse.json({
        success: true,
        isUserEnrolled: isAuthorized,
        isStaffOrOwner: access.isStaffOrOwner,
        course: fallback,
      });
    }

    return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const auth = extractAuthFromRequest(req);
    const accessCheck = checkStaffSectionAccess({
      user: auth.userEmail || auth.userId || null,
      section: 'courses',
      requiredLevel: 'MANAGE',
    });

    if (!accessCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: accessCheck.reason || "Forbidden: MANAGE permission on 'courses' required.",
        },
        { status: 403 }
      );
    }

    const slugOrId = params.slug;
    const body = await req.json();

    // 1. Find course first to obtain its current data
    const existing = await prisma.course.findFirst({
      where: {
        OR: [{ slug: slugOrId }, { id: slugOrId }],
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    // 2. Rule: Publish and unpublish are OWNER-ONLY
    if (body.status !== undefined && body.status !== existing.status) {
      if (!accessCheck.isOwner) {
        return NextResponse.json(
          {
            success: false,
            error: 'Forbidden: Publishing, unpublishing, or archiving courses is restricted to the Site Owner only.',
          },
          { status: 403 }
        );
      }
    }

    // 3. Rule: Price changes are OWNER-ONLY
    const isPriceAltered =
      (body.priceInr !== undefined && Number(body.priceInr) !== existing.priceInr) ||
      (body.priceUsd !== undefined && Number(body.priceUsd) !== existing.priceUsd) ||
      (body.originalPriceInr !== undefined && Number(body.originalPriceInr) !== existing.originalPriceInr) ||
      (body.originalPriceUsd !== undefined && Number(body.originalPriceUsd) !== existing.originalPriceUsd);

    if (isPriceAltered && !accessCheck.isOwner) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: Modifying course tuition prices is restricted to the Site Owner only.',
        },
        { status: 403 }
      );
    }

    // 4. Build update payload
    const dataToUpdate: Record<string, unknown> = {};
    if (body.title !== undefined) dataToUpdate.title = body.title;
    if (body.shortDescription !== undefined) dataToUpdate.shortDescription = body.shortDescription;
    if (body.description !== undefined) dataToUpdate.description = body.description;
    if (body.level !== undefined) dataToUpdate.level = body.level;
    if (body.category !== undefined) dataToUpdate.category = body.category;
    if (body.thumbnailUrl !== undefined) dataToUpdate.thumbnailUrl = body.thumbnailUrl;
    if (body.displayOrder !== undefined) dataToUpdate.displayOrder = Number(body.displayOrder);
    if (body.passingScore !== undefined) dataToUpdate.passingScore = Number(body.passingScore);
    if (body.certificateEnabled !== undefined) dataToUpdate.certificateEnabled = Boolean(body.certificateEnabled);
    if (body.isComingSoon !== undefined) dataToUpdate.isComingSoon = Boolean(body.isComingSoon);
    if (body.status !== undefined) dataToUpdate.status = body.status;

    // Owner price updates (never changes existing historical enrollments)
    if (body.priceInr !== undefined) dataToUpdate.priceInr = Number(body.priceInr);
    if (body.priceUsd !== undefined) dataToUpdate.priceUsd = Number(body.priceUsd);
    if (body.originalPriceInr !== undefined) dataToUpdate.originalPriceInr = Number(body.originalPriceInr);
    if (body.originalPriceUsd !== undefined) dataToUpdate.originalPriceUsd = Number(body.originalPriceUsd);

    if (body.durationWeeks !== undefined) dataToUpdate.durationWeeks = Number(body.durationWeeks);
    if (body.totalClasses !== undefined) dataToUpdate.totalClasses = Number(body.totalClasses);
    if (body.instructorName !== undefined) dataToUpdate.instructorName = body.instructorName;
    if (body.instructorBio !== undefined) dataToUpdate.instructorBio = body.instructorBio;
    if (body.syllabusJson !== undefined) dataToUpdate.syllabusJson = body.syllabusJson;

    const updated = await prisma.course.update({
      where: { id: existing.id },
      data: dataToUpdate,
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
            },
          },
        },
        quizzes: true,
      },
    });

    // 5. Record Activity Log
    await prisma.activityLog.create({
      data: {
        userId: auth.userId || null,
        userEmail: auth.userEmail || null,
        action: body.status !== undefined && body.status !== existing.status ? `COURSE_STATUS_${body.status}` : 'COURSE_UPDATED',
        entityType: 'COURSE',
        entityId: updated.id,
        courseId: updated.id,
        reason: body.status !== undefined && body.status !== existing.status ? `Status changed from ${existing.status} to ${body.status}` : 'Course details modified',
        details: {
          updatedFields: Object.keys(dataToUpdate),
          title: updated.title,
        },
      },
    });

    return NextResponse.json({ success: true, course: updated });
  } catch (error) {
    console.error('Course update error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const auth = extractAuthFromRequest(req);
    const accessCheck = checkStaffSectionAccess({
      user: auth.userEmail || auth.userId || null,
      section: 'courses',
      requiredLevel: 'MANAGE',
    });

    // Rule: Delete is Owner-only
    if (!accessCheck.isOwner) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: Deleting or archiving courses is strictly restricted to the Site Owner only.',
        },
        { status: 403 }
      );
    }

    const slugOrId = params.slug;
    const { searchParams } = new URL(req.url);
    const requestedArchive = searchParams.get('archive') === 'true';

    const existing = await prisma.course.findFirst({
      where: {
        OR: [{ slug: slugOrId }, { id: slugOrId }],
      },
      include: {
        enrollments: true,
        cohorts: {
          include: { enrollments: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    // Count all direct or cohort enrollments
    const directEnrollments = existing.enrollments.length;
    const cohortEnrollments = existing.cohorts.reduce((acc, c) => acc + c.enrollments.length, 0);
    const totalEnrollments = directEnrollments + cohortEnrollments;

    // Rule: "Deleting is protected. A course or module with enrolled students can only be archived, never hard-deleted.
    // Archived courses disappear from the public catalog but remain fully accessible to students who already bought them.
    // Hard delete is allowed only for drafts with zero enrollments, and only after a clear confirmation."
    if (totalEnrollments > 0) {
      // Hard delete is completely disallowed!
      if (!requestedArchive) {
        return NextResponse.json(
          {
            success: false,
            error: `Course "${existing.title}" has ${totalEnrollments} enrolled scholar(s) and cannot be hard-deleted. It can only be archived to preserve student access.`,
            canArchive: true,
            enrollmentCount: totalEnrollments,
          },
          { status: 400 }
        );
      }

      // Safe Archive operation
      const archived = await prisma.course.update({
        where: { id: existing.id },
        data: { status: 'ARCHIVED' },
      });

      await prisma.activityLog.create({
        data: {
          userId: auth.userId || null,
          userEmail: auth.userEmail || null,
          action: 'COURSE_ARCHIVED',
          entityType: 'COURSE',
          entityId: existing.id,
          courseId: existing.id,
          reason: `Course with ${totalEnrollments} enrolled students archived by Owner to preserve student access while unpublishing from public catalog.`,
          details: { title: existing.title, slug: existing.slug, enrollmentCount: totalEnrollments },
        },
      });

      return NextResponse.json({
        success: true,
        message: `Course "${existing.title}" has been moved to ARCHIVED status. It is hidden from the catalog but remains accessible to all ${totalEnrollments} enrolled students.`,
        course: archived,
      });
    }

    // If zero enrollments, check if archive was explicitly requested
    if (requestedArchive) {
      const archived = await prisma.course.update({
        where: { id: existing.id },
        data: { status: 'ARCHIVED' },
      });

      await prisma.activityLog.create({
        data: {
          userId: auth.userId || null,
          userEmail: auth.userEmail || null,
          action: 'COURSE_ARCHIVED',
          entityType: 'COURSE',
          entityId: existing.id,
          courseId: existing.id,
          reason: 'Course moved to ARCHIVED status by Site Owner.',
          details: { title: existing.title, slug: existing.slug },
        },
      });

      return NextResponse.json({
        success: true,
        message: `Course "${existing.title}" archived successfully.`,
        course: archived,
      });
    }

    // Zero enrollments: Must be DRAFT to hard delete
    if (existing.status !== 'DRAFT') {
      return NextResponse.json(
        {
          success: false,
          error: `Only draft courses with zero enrollments can be hard-deleted. Please unpublish or archive "${existing.title}" first.`,
          canArchive: true,
        },
        { status: 400 }
      );
    }

    // Hard delete draft course
    await prisma.activityLog.create({
      data: {
        userId: auth.userId || null,
        userEmail: auth.userEmail || null,
        action: 'COURSE_HARD_DELETED',
        entityType: 'COURSE',
        entityId: existing.id,
        courseId: null,
        reason: `Draft course "${existing.title}" with zero enrollments permanently deleted by Site Owner.`,
        details: { title: existing.title, slug: existing.slug },
      },
    });

    await prisma.course.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({
      success: true,
      message: `Draft course "${existing.title}" permanently deleted.`,
    });
  } catch (error) {
    console.error('Course deletion error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
