import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { INITIAL_COURSES } from '@/lib/data';
import { extractAuthFromRequest, checkStaffSectionAccess } from '@/lib/auth/permissions';

function formatCourseResponse(course: Record<string, unknown> | null) {
  if (!course) return null;
  return {
    ...course,
    modules: Array.isArray(course.syllabusJson) ? course.syllabusJson : [],
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const id = searchParams.get('id');

    // Attempt to query database if available
    try {
      if (slug || id) {
        const course = await prisma.course.findFirst({
          where: slug ? { slug } : (id ? { id } : {}),
          include: { cohorts: true, quizzes: true },
        });
        if (course) {
          return NextResponse.json({ success: true, course: formatCourseResponse(course) });
        }
      } else {
        const courses = await prisma.course.findMany({
          orderBy: { createdAt: 'desc' },
          include: { cohorts: true },
        });
        if (courses && courses.length > 0) {
          return NextResponse.json({
            success: true,
            courses: courses.map(formatCourseResponse),
          });
        }
      }
    } catch (dbError) {
      console.warn('Database query skipped, falling back to seed courses:', (dbError as Error).message);
    }

    // Fallback to in-memory/seed catalog
    if (slug) {
      const course = INITIAL_COURSES.find((c) => c.slug === slug);
      if (!course) {
        return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, course });
    }

    return NextResponse.json({ success: true, courses: INITIAL_COURSES });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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
    const {
      title,
      slug,
      description,
      priceInr,
      priceUsd,
      originalPriceInr,
      originalPriceUsd,
      durationWeeks,
      totalClasses,
      status,
      category,
      instructorName,
      instructorBio,
      modules,
    } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Course title is required' },
        { status: 400 }
      );
    }

    const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Attempt Prisma persistence
    try {
      const created = await prisma.course.create({
        data: {
          title,
          slug: finalSlug,
          description: description || 'Comprehensive Vedic astrology masterclass.',
          priceInr: Number(priceInr) || 5100,
          priceUsd: Number(priceUsd) || 69,
          originalPriceInr: Number(originalPriceInr) || (Number(priceInr) || 5100) * 2,
          originalPriceUsd: Number(originalPriceUsd) || (Number(priceUsd) || 69) * 2,
          durationWeeks: Number(durationWeeks) || 8,
          totalClasses: Number(totalClasses) || 23,
          classesPerWeek: 0,
          status: status || 'PUBLISHED',
          category: category || 'Vedic Astrology',
          instructorName: instructorName || 'Acharya Niraj Kumar',
          instructorBio: instructorBio || null,
          syllabusJson: modules || [],
        },
      });

      // Automatically create self-paced cohort for this new course
      const cohort = await prisma.cohort.create({
        data: {
          courseId: created.id,
          batchName: `${created.title} — Self-Paced Access`,
          startDate: new Date(),
          capacity: 500,
          status: 'ACTIVE',
          scheduleDescription: '100% On-Demand Self-Paced Video Learning with Verifiable Certification',
        },
      });

      return NextResponse.json({
        success: true,
        course: formatCourseResponse(created),
        cohort,
      }, { status: 201 });
    } catch (dbError) {
      console.warn('Database write failed for course creation:', (dbError as Error).message);
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

export async function PATCH(req: NextRequest) {
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
    const { id, slug, ...updates } = body;

    if (!id && !slug) {
      return NextResponse.json(
        { success: false, error: 'Course id or slug is required for update' },
        { status: 400 }
      );
    }

    const dataToUpdate: Record<string, unknown> = {};
    if (updates.title !== undefined) dataToUpdate.title = updates.title;
    if (updates.description !== undefined) dataToUpdate.description = updates.description;
    if (updates.priceInr !== undefined) dataToUpdate.priceInr = Number(updates.priceInr);
    if (updates.priceUsd !== undefined) dataToUpdate.priceUsd = Number(updates.priceUsd);
    if (updates.originalPriceInr !== undefined) dataToUpdate.originalPriceInr = Number(updates.originalPriceInr);
    if (updates.originalPriceUsd !== undefined) dataToUpdate.originalPriceUsd = Number(updates.originalPriceUsd);
    if (updates.durationWeeks !== undefined) dataToUpdate.durationWeeks = Number(updates.durationWeeks);
    if (updates.totalClasses !== undefined) dataToUpdate.totalClasses = Number(updates.totalClasses);
    if (updates.status !== undefined) dataToUpdate.status = updates.status;
    if (updates.category !== undefined) dataToUpdate.category = updates.category;
    if (updates.instructorName !== undefined) dataToUpdate.instructorName = updates.instructorName;
    if (updates.instructorBio !== undefined) dataToUpdate.instructorBio = updates.instructorBio;
    if (updates.modules !== undefined) {
      dataToUpdate.syllabusJson = updates.modules;
      dataToUpdate.totalClasses = updates.modules.length;
    }

    const updated = await prisma.course.update({
      where: id ? { id } : { slug },
      data: dataToUpdate,
      include: { cohorts: true },
    });

    return NextResponse.json({
      success: true,
      course: formatCourseResponse(updated),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
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
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');
    const archive = searchParams.get('archive') === 'true';

    if (!id && !slug) {
      return NextResponse.json(
        { success: false, error: 'Course id or slug query parameter is required' },
        { status: 400 }
      );
    }

    if (archive) {
      const archived = await prisma.course.update({
        where: id ? { id } : { slug: slug! },
        data: { status: 'DRAFT' },
      });
      return NextResponse.json({
        success: true,
        message: 'Course archived successfully',
        course: archived,
      });
    }

    await prisma.course.delete({
      where: id ? { id } : { slug: slug! },
    });

    return NextResponse.json({
      success: true,
      message: 'Course deleted permanently',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
