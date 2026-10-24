import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerAuthUser, isAuthorizedForSection } from '@/lib/auth/serverAuth';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slugOrId = params.slug;
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode'); // e.g. 'preview'

    const auth = await getServerAuthUser();
    const isStaff = isAuthorizedForSection(auth, 'courses', 'VIEW');

    const course = await prisma.course.findFirst({
      where: {
        OR: [{ slug: slugOrId }, { id: slugOrId }],
      },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              include: {
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
              },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    // Check if user has active enrollment
    let isEnrolled = false;
    if (auth.userId) {
      const enr = await prisma.enrollment.findFirst({
        where: {
          userId: auth.userId,
          status: 'ACTIVE',
          OR: [{ courseId: course.id }, { course: { slug: course.slug } }],
        },
      });
      if (enr) isEnrolled = true;
    }

    const canViewPrivateMeetingLinks = isStaff || isEnrolled;

    // Filter and sanitize modules and lessons
    const sanitizedModules = course.modules
      .filter((m) => {
        if (isStaff && mode !== 'student') return true;
        // Non-staff only see PUBLISHED modules
        return m.status === 'PUBLISHED';
      })
      .map((m) => ({
        ...m,
        lessons: m.lessons
          .filter((l) => {
            if (isStaff && mode !== 'student') return true;
            // Non-staff only see PUBLISHED lessons
            return l.status === 'PUBLISHED';
          })
          .map((l) => ({
            ...l,
            // Meeting links are shareable by nature and shown ONLY to approved students
            liveJoinLink: canViewPrivateMeetingLinks ? l.liveJoinLink : null,
          })),
      }));

    return NextResponse.json({
      success: true,
      modules: sanitizedModules,
      isUserEnrolled: isEnrolled,
      isStaff,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const auth = await getServerAuthUser();
    if (!isAuthorizedForSection(auth, 'courses', 'MANAGE')) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: MANAGE permission on 'courses' required.",
        },
        { status: 403 }
      );
    }

    const slugOrId = params.slug;
    const body = await req.json();
    const {
      itemType,
      moduleId,
      title,
      titleHi,
      description,
      descriptionHi,
      order,
      lessonType,
      type,
      status,
      isFreePreview,
      videoProviderId,
      videoDuration,
      isExternalVideo,
      externalVideoUrl,
      documentKey,
      documentUrl,
      notesMarkdown,
      liveScheduledAt,
      liveTimezone,
      durationMinutes,
      liveJoinLink,
      meetingPlatform,
      agenda,
      recordingUrl,
      recordingStreamId,
    } = body;

    const course = await prisma.course.findFirst({
      where: {
        OR: [{ slug: slugOrId }, { id: slugOrId }],
      },
      include: { modules: true },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    if (itemType === 'MODULE') {
      const moduleCount = course.modules.length;
      const newModule = await prisma.module.create({
        data: {
          courseId: course.id,
          title: title || `Module ${moduleCount + 1}`,
          titleHi: titleHi || null,
          description: description || '',
          descriptionHi: descriptionHi || null,
          order: order !== undefined ? Number(order) : moduleCount + 1,
          status: status || 'PUBLISHED',
        },
      });

      await prisma.activityLog.create({
        data: {
          userId: auth.userId || null,
          userEmail: auth.email || null,
          action: 'MODULE_CREATED',
          entityType: 'MODULE',
          entityId: newModule.id,
          courseId: course.id,
          reason: `Created module "${newModule.title}"`,
          details: { title: newModule.title, order: newModule.order },
        },
      });

      return NextResponse.json({ success: true, module: newModule }, { status: 201 });
    }

    if (itemType === 'LESSON') {
      if (!moduleId) {
        return NextResponse.json({ success: false, error: 'moduleId is required to create a lesson' }, { status: 400 });
      }

      const existingLessons = await prisma.lesson.count({ where: { moduleId } });
      const newLesson = await prisma.lesson.create({
        data: {
          moduleId,
          title: title || `Lesson ${existingLessons + 1}`,
          titleHi: titleHi || null,
          description: description || '',
          descriptionHi: descriptionHi || null,
          order: order !== undefined ? Number(order) : existingLessons + 1,
          type: (lessonType || type || 'VIDEO'),
          status: status || 'PUBLISHED',
          isFreePreview: Boolean(isFreePreview),
          videoProviderId: videoProviderId || null,
          videoDuration: videoDuration ? Number(videoDuration) : null,
          isExternalVideo: Boolean(isExternalVideo),
          externalVideoUrl: externalVideoUrl || null,
          documentKey: documentKey || null,
          documentUrl: documentUrl || null,
          notesMarkdown: notesMarkdown || null,
          liveScheduledAt: liveScheduledAt ? new Date(liveScheduledAt) : null,
          liveTimezone: liveTimezone || 'Asia/Kolkata',
          durationMinutes: durationMinutes !== undefined ? Number(durationMinutes) : 60,
          liveJoinLink: liveJoinLink || null,
          meetingPlatform: meetingPlatform || 'GOOGLE_MEET',
          agenda: agenda || null,
          recordingUrl: recordingUrl || null,
          recordingStreamId: recordingStreamId || null,
        },
      });

      await prisma.activityLog.create({
        data: {
          userId: auth.userId || null,
          userEmail: auth.email || null,
          action: 'LESSON_CREATED',
          entityType: 'LESSON',
          entityId: newLesson.id,
          courseId: course.id,
          reason: `Created lesson "${newLesson.title}" (${newLesson.type})`,
          details: { title: newLesson.title, type: newLesson.type, isFreePreview: newLesson.isFreePreview },
        },
      });

      return NextResponse.json({ success: true, lesson: newLesson }, { status: 201 });
    }

    return NextResponse.json({ success: false, error: 'Invalid itemType. Must be MODULE or LESSON.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest
) {
  try {
    const auth = await getServerAuthUser();
    if (!isAuthorizedForSection(auth, 'courses', 'MANAGE')) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: MANAGE permission on 'courses' required.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      itemType,
      id,
      title,
      titleHi,
      description,
      descriptionHi,
      order,
      status,
      lessonType,
      type,
      isFreePreview,
      videoProviderId,
      videoDuration,
      isExternalVideo,
      externalVideoUrl,
      documentKey,
      documentUrl,
      notesMarkdown,
      liveScheduledAt,
      liveTimezone,
      durationMinutes,
      liveJoinLink,
      meetingPlatform,
      agenda,
      recordingUrl,
      recordingStreamId,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Item ID is required for update' }, { status: 400 });
    }

    if (itemType === 'MODULE') {
      const updateData: Record<string, unknown> = {};
      if (title !== undefined) updateData.title = title;
      if (titleHi !== undefined) updateData.titleHi = titleHi;
      if (description !== undefined) updateData.description = description;
      if (descriptionHi !== undefined) updateData.descriptionHi = descriptionHi;
      if (order !== undefined) updateData.order = Number(order);
      if (status !== undefined) updateData.status = status;

      const updated = await prisma.module.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json({ success: true, module: updated });
    }

    if (itemType === 'LESSON') {
      const updateData: Record<string, unknown> = {};
      if (title !== undefined) updateData.title = title;
      if (titleHi !== undefined) updateData.titleHi = titleHi;
      if (description !== undefined) updateData.description = description;
      if (descriptionHi !== undefined) updateData.descriptionHi = descriptionHi;
      if (order !== undefined) updateData.order = Number(order);
      if (status !== undefined) updateData.status = status;
      if (lessonType !== undefined || type !== undefined) updateData.type = lessonType || type;
      if (isFreePreview !== undefined) updateData.isFreePreview = Boolean(isFreePreview);
      if (videoProviderId !== undefined) updateData.videoProviderId = videoProviderId;
      if (videoDuration !== undefined) updateData.videoDuration = Number(videoDuration);
      if (isExternalVideo !== undefined) updateData.isExternalVideo = Boolean(isExternalVideo);
      if (externalVideoUrl !== undefined) updateData.externalVideoUrl = externalVideoUrl;
      if (documentKey !== undefined) updateData.documentKey = documentKey;
      if (documentUrl !== undefined) updateData.documentUrl = documentUrl;
      if (notesMarkdown !== undefined) updateData.notesMarkdown = notesMarkdown;
      if (liveScheduledAt !== undefined) updateData.liveScheduledAt = liveScheduledAt ? new Date(liveScheduledAt) : null;
      if (liveTimezone !== undefined) updateData.liveTimezone = liveTimezone;
      if (durationMinutes !== undefined) updateData.durationMinutes = Number(durationMinutes);
      if (liveJoinLink !== undefined) updateData.liveJoinLink = liveJoinLink;
      if (meetingPlatform !== undefined) updateData.meetingPlatform = meetingPlatform;
      if (agenda !== undefined) updateData.agenda = agenda;
      if (recordingUrl !== undefined) updateData.recordingUrl = recordingUrl;
      if (recordingStreamId !== undefined) updateData.recordingStreamId = recordingStreamId;

      const updated = await prisma.lesson.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json({ success: true, lesson: updated });
    }

    return NextResponse.json({ success: false, error: 'Invalid itemType. Must be MODULE or LESSON.' }, { status: 400 });
  } catch (error) {
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
    const auth = await getServerAuthUser();
    if (!isAuthorizedForSection(auth, 'courses', 'MANAGE')) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: MANAGE permission on 'courses' required.",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const itemType = searchParams.get('itemType'); // 'MODULE' | 'LESSON'
    const id = searchParams.get('id');

    if (!id || !itemType) {
      return NextResponse.json({ success: false, error: 'id and itemType are required' }, { status: 400 });
    }

    const slugOrId = params.slug;
    const course = await prisma.course.findFirst({
      where: {
        OR: [{ slug: slugOrId }, { id: slugOrId }],
      },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    if (itemType === 'LESSON') {
      // Invariant: "a lesson with student progress is archived, not deleted"
      const progressCount = await prisma.lessonProgress.count({
        where: { lessonId: id },
      });

      if (progressCount > 0) {
        const archived = await prisma.lesson.update({
          where: { id },
          data: { status: 'ARCHIVED' },
        });

        await prisma.activityLog.create({
          data: {
            userId: auth.userId || null,
            userEmail: auth.email || null,
            action: 'LESSON_ARCHIVED',
            entityType: 'LESSON',
            entityId: id,
            courseId: course.id,
            reason: `Lesson archived because student progress exists (${progressCount} records)`,
            details: { title: archived.title, progressCount },
          },
        });

        return NextResponse.json({
          success: true,
          archived: true,
          message: `Lesson has student progress (${progressCount} records); it was archived instead of deleted to protect student completion history.`,
          lesson: archived,
        });
      }

      const deleted = await prisma.lesson.delete({ where: { id } });

      await prisma.activityLog.create({
        data: {
          userId: auth.userId || null,
          userEmail: auth.email || null,
          action: 'LESSON_DELETED',
          entityType: 'LESSON',
          entityId: id,
          courseId: course.id,
          reason: `Lesson "${deleted.title}" deleted permanently (zero student progress)`,
          details: { title: deleted.title },
        },
      });

      return NextResponse.json({
        success: true,
        deleted: true,
        message: 'Lesson deleted permanently.',
      });
    }

    if (itemType === 'MODULE') {
      const progressCount = await prisma.lessonProgress.count({
        where: { lesson: { moduleId: id } },
      });

      if (progressCount > 0) {
        await prisma.$transaction([
          prisma.module.update({ where: { id }, data: { status: 'ARCHIVED' } }),
          prisma.lesson.updateMany({ where: { moduleId: id }, data: { status: 'ARCHIVED' } }),
        ]);

        await prisma.activityLog.create({
          data: {
            userId: auth.userId || null,
            userEmail: auth.email || null,
            action: 'MODULE_ARCHIVED',
            entityType: 'MODULE',
            entityId: id,
            courseId: course.id,
            reason: `Module archived because member lessons have student progress (${progressCount} records)`,
          },
        });

        return NextResponse.json({
          success: true,
          archived: true,
          message: `Module has lessons with student progress (${progressCount} records); it was archived instead of deleted.`,
        });
      }

      await prisma.module.delete({ where: { id } });

      await prisma.activityLog.create({
        data: {
          userId: auth.userId || null,
          userEmail: auth.email || null,
          action: 'MODULE_DELETED',
          entityType: 'MODULE',
          entityId: id,
          courseId: course.id,
          reason: 'Module deleted permanently (zero student progress)',
        },
      });

      return NextResponse.json({
        success: true,
        deleted: true,
        message: 'Module deleted permanently.',
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid itemType' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
