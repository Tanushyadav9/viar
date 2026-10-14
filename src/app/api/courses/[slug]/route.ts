import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { INITIAL_COURSES } from '@/lib/data';
import { extractAuthFromRequest, checkStaffSectionAccess } from '@/lib/auth/permissions';

function formatCourse(course: Record<string, unknown> | null) {
  if (!course) return null;
  return {
    ...course,
    modules: Array.isArray(course.syllabusJson) ? course.syllabusJson : [],
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slugOrId = params.slug;

    try {
      const course = await prisma.course.findFirst({
        where: {
          OR: [{ slug: slugOrId }, { id: slugOrId }],
        },
        include: { cohorts: true, quizzes: true },
      });

      if (course) {
        return NextResponse.json({ success: true, course: formatCourse(course) });
      }
    } catch (dbError) {
      console.warn('Database query for course slug failed:', (dbError as Error).message);
    }

    const fallback = INITIAL_COURSES.find(
      (c) => c.slug === slugOrId || c.id === slugOrId
    );

    if (fallback) {
      return NextResponse.json({ success: true, course: fallback });
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

    const dataToUpdate: Record<string, unknown> = {};
    if (body.title !== undefined) dataToUpdate.title = body.title;
    if (body.description !== undefined) dataToUpdate.description = body.description;
    if (body.priceInr !== undefined) dataToUpdate.priceInr = Number(body.priceInr);
    if (body.priceUsd !== undefined) dataToUpdate.priceUsd = Number(body.priceUsd);
    if (body.originalPriceInr !== undefined) dataToUpdate.originalPriceInr = Number(body.originalPriceInr);
    if (body.originalPriceUsd !== undefined) dataToUpdate.originalPriceUsd = Number(body.originalPriceUsd);
    if (body.durationWeeks !== undefined) dataToUpdate.durationWeeks = Number(body.durationWeeks);
    if (body.totalClasses !== undefined) dataToUpdate.totalClasses = Number(body.totalClasses);
    if (body.status !== undefined) dataToUpdate.status = body.status;
    if (body.category !== undefined) dataToUpdate.category = body.category;
    if (body.instructorName !== undefined) dataToUpdate.instructorName = body.instructorName;
    if (body.instructorBio !== undefined) dataToUpdate.instructorBio = body.instructorBio;
    if (body.modules !== undefined) {
      dataToUpdate.syllabusJson = body.modules;
      dataToUpdate.totalClasses = body.modules.length;
    }

    // Find course first to obtain its id
    const existing = await prisma.course.findFirst({
      where: {
        OR: [{ slug: slugOrId }, { id: slugOrId }],
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    const updated = await prisma.course.update({
      where: { id: existing.id },
      data: dataToUpdate,
      include: { cohorts: true },
    });

    return NextResponse.json({ success: true, course: formatCourse(updated) });
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

    const slugOrId = params.slug;
    const { searchParams } = new URL(req.url);
    const archive = searchParams.get('archive') === 'true';

    const existing = await prisma.course.findFirst({
      where: {
        OR: [{ slug: slugOrId }, { id: slugOrId }],
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    if (archive) {
      const archived = await prisma.course.update({
        where: { id: existing.id },
        data: { status: 'DRAFT' },
      });
      return NextResponse.json({
        success: true,
        message: 'Course archived successfully',
        course: archived,
      });
    }

    await prisma.course.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true, message: 'Course deleted permanently' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
