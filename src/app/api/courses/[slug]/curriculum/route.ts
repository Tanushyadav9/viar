import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractAuthFromRequest, checkStaffSectionAccess } from '@/lib/auth/permissions';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slugOrId = params.slug;

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

    return NextResponse.json({ success: true, modules: course.modules });
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
    const { itemType, moduleId, title, titleHi, description, descriptionHi, order, lessonType, isFreePreview, videoProviderId, videoDuration, documentKey, documentUrl, liveScheduledAt, liveTimezone, liveJoinLink } = body;

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
        },
      });

      await prisma.activityLog.create({
        data: {
          userId: auth.userId || null,
          userEmail: auth.userEmail || null,
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
          type: lessonType || 'VIDEO',
          isFreePreview: Boolean(isFreePreview),
          videoProviderId: videoProviderId || null,
          videoDuration: videoDuration ? Number(videoDuration) : null,
          documentKey: documentKey || null,
          documentUrl: documentUrl || null,
          liveScheduledAt: liveScheduledAt ? new Date(liveScheduledAt) : null,
          liveTimezone: liveTimezone || 'Asia/Kolkata',
          liveJoinLink: liveJoinLink || null,
        },
      });

      await prisma.activityLog.create({
        data: {
          userId: auth.userId || null,
          userEmail: auth.userEmail || null,
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

    const body = await req.json();
    const { itemType, id, title, titleHi, description, descriptionHi, order, lessonType, isFreePreview, videoProviderId, videoDuration, documentKey, documentUrl, liveScheduledAt, liveTimezone, liveJoinLink } = body;

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
      if (lessonType !== undefined) updateData.type = lessonType;
      if (isFreePreview !== undefined) updateData.isFreePreview = Boolean(isFreePreview);
      if (videoProviderId !== undefined) updateData.videoProviderId = videoProviderId;
      if (videoDuration !== undefined) updateData.videoDuration = Number(videoDuration);
      if (documentKey !== undefined) updateData.documentKey = documentKey;
      if (documentUrl !== undefined) updateData.documentUrl = documentUrl;
      if (liveScheduledAt !== undefined) updateData.liveScheduledAt = liveScheduledAt ? new Date(liveScheduledAt) : null;
      if (liveTimezone !== undefined) updateData.liveTimezone = liveTimezone;
      if (liveJoinLink !== undefined) updateData.liveJoinLink = liveJoinLink;

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
      include: {
        enrollments: true,
        cohorts: { include: { enrollments: true } },
      },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    // Rule: "A course or module with enrolled students can only be archived, never hard-deleted."
    const totalEnrollments = course.enrollments.length + course.cohorts.reduce((acc, c) => acc + c.enrollments.length, 0);

    if (totalEnrollments > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete curriculum item: this course has ${totalEnrollments} enrolled students. Deleting live content would break student access.`,
        },
        { status: 400 }
      );
    }

    if (itemType === 'MODULE') {
      await prisma.module.delete({ where: { id } });
      return NextResponse.json({ success: true, message: 'Module deleted permanently' });
    }

    if (itemType === 'LESSON') {
      await prisma.lesson.delete({ where: { id } });
      return NextResponse.json({ success: true, message: 'Lesson deleted permanently' });
    }

    return NextResponse.json({ success: false, error: 'Invalid itemType' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
