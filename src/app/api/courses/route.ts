import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getServerAuthUser, isAuthorizedForSection } from '@/lib/auth/serverAuth';

function formatCourseResponse(course: Record<string, unknown> | null) {
  if (!course) return null;
  return {
    ...course,
    modules: Array.isArray(course.syllabusJson) ? course.syllabusJson : (course.modules || []),
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const id = searchParams.get('id');
    const searchQuery = searchParams.get('q') || '';
    const statusParam = searchParams.get('status');

    // Check staff access to determine if draft/archived courses may be viewed
    const auth = await getServerAuthUser();
    const isStaffOrOwner = isAuthorizedForSection(auth, 'courses', 'VIEW');

    // Database lookup
    if (slug || id) {
      const course = await prisma.course.findFirst({
        where: slug ? { slug } : (id ? { id } : {}),
        include: {
          cohorts: true,
          quizzes: true,
          modules: {
            orderBy: { order: 'asc' },
            include: {
              lessons: {
                orderBy: { order: 'asc' },
              },
            },
          },
          enrollments: { select: { id: true } },
        },
      });

      if (!course) {
        return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
      }

      // If not staff, hidden courses (DRAFT/ARCHIVED) are 404
      if (!isStaffOrOwner && course.status !== 'PUBLISHED' && course.status !== 'COMING_SOON') {
        return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        course: {
          ...formatCourseResponse(course),
          enrollmentCount: course.enrollments.length,
        },
      });
    }

    const whereClause: Record<string, unknown> = {};

    // If not staff, strictly only show published courses to public visitors
    if (!isStaffOrOwner) {
      whereClause.status = { in: ['PUBLISHED', 'COMING_SOON'] };
    } else if (statusParam && statusParam !== 'ALL') {
      whereClause.status = statusParam;
    }

    if (searchQuery.trim()) {
      whereClause.OR = [
        { title: { contains: searchQuery.trim(), mode: 'insensitive' } },
        { description: { contains: searchQuery.trim(), mode: 'insensitive' } },
        { slug: { contains: searchQuery.trim(), mode: 'insensitive' } },
      ];
    }

    try {
      const courses = await prisma.course.findMany({
        where: whereClause,
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
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
          enrollments: { select: { id: true } },
        },
      });

      return NextResponse.json({
        success: true,
        courses: courses.map((c) => ({
          ...formatCourseResponse(c),
          enrollmentCount: c.enrollments.length,
        })),
      });
    } catch (dbErr) {
      console.warn('Database query for courses failed:', (dbErr as Error).message);
      return NextResponse.json({
        success: true,
        courses: [],
      });
    }
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
      title,
      slug,
      shortDescription,
      description,
      priceInr,
      originalPriceInr,
      durationWeeks,
      totalClasses,
      status,
      category,
      level,
      displayOrder,
      passingScore,
      certificateEnabled,
      thumbnailUrl,
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

    // Only Owner can publish directly upon creation or set custom prices
    const initialStatus = auth.isOwner ? (status || 'DRAFT') : 'DRAFT';

    const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const created = await prisma.course.create({
      data: {
        title,
        slug: finalSlug,
        shortDescription: shortDescription || 'Practical self-paced Vedic astrology masterclass.',
        description: description || 'Comprehensive Vedic astrology curriculum.',
        level: level || 'Beginner',
        category: category || 'Vedic Astrology',
        thumbnailUrl: thumbnailUrl || '/images/Acharya_Niraj_Kumar_Headshot.jpg',
        priceInr: Number(priceInr) || 5100,
        originalPriceInr: Number(originalPriceInr) || (Number(priceInr) || 5100) * 2,
        durationWeeks: Number(durationWeeks) || 8,
        totalClasses: Number(totalClasses) || (modules?.length || 0),
        classesPerWeek: 0,
        displayOrder: Number(displayOrder) || 0,
        passingScore: Number(passingScore) || 70,
        certificateEnabled: certificateEnabled !== undefined ? Boolean(certificateEnabled) : true,
        status: initialStatus,
        instructorName: instructorName || 'Acharya Niraj Kumar',
        instructorBio: instructorBio || null,
        syllabusJson: modules || [],
      },
    });

    // Automatically create a cohort for self-paced enrollment
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

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: auth.userId || null,
        userEmail: auth.userEmail || null,
        action: 'COURSE_CREATED',
        entityType: 'COURSE',
        entityId: created.id,
        courseId: created.id,
        reason: `Course created in ${initialStatus} status`,
        details: { title: created.title, slug: created.slug },
      },
    });

    // Invalidate caches so public catalog updates within ~1 minute without redeployment
    try {
      revalidatePath('/courses');
      revalidatePath('/sitemap.xml');
    } catch (e) {
      console.warn('Cache revalidation skipped in background:', (e as Error).message);
    }

    return NextResponse.json({
      success: true,
      course: formatCourseResponse(created),
      cohort,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
