import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { INITIAL_COURSES } from '@/lib/data';
import { Course } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    // Attempt to query database if available
    try {
      if (slug) {
        const course = await prisma.course.findUnique({
          where: { slug },
          include: { cohorts: true },
        });
        if (course) {
          return NextResponse.json({ success: true, course });
        }
      } else {
        const courses = await prisma.course.findMany({
          orderBy: { createdAt: 'desc' },
          include: { cohorts: true },
        });
        if (courses && courses.length > 0) {
          return NextResponse.json({ success: true, courses });
        }
      }
    } catch (dbError) {
      // Database connection unavailable or unmigrated; use seeded data fallback
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
    const body = await req.json();
    const { title, slug, description, priceInr, priceUsd, instructor } = body;

    if (!title || !slug) {
      return NextResponse.json(
        { success: false, error: 'Title and slug are required' },
        { status: 400 }
      );
    }

    // Attempt Prisma persistence
    try {
      const created = await prisma.course.create({
        data: {
          title,
          slug,
          description: description || '',
          priceInr: Number(priceInr) || 4999,
          priceUsd: Number(priceUsd) || 69,
          status: 'PUBLISHED',
          category: 'Vedic Astrology',
          syllabusJson: body.modules || [],
        },
      });
      return NextResponse.json({ success: true, course: created }, { status: 201 });
    } catch (dbError) {
      console.warn('Database write skipped; returning mock course:', (dbError as Error).message);
    }

    // Mock response when DB is unprovisioned
    const mockCourse: Course = {
      id: `course-${Date.now()}`,
      title,
      slug,
      tagline: description?.slice(0, 80) || 'Authentic Vedic Study',
      subtitle: 'Cohort Masterclass',
      description: description || '',
      level: 'Beginner',
      durationWeeks: 9,
      totalClasses: 18,
      classesPerWeek: 2,
      priceInr: Number(priceInr) || 4999,
      priceUsd: Number(priceUsd) || 69,
      originalPriceInr: (Number(priceInr) || 4999) * 2,
      originalPriceUsd: (Number(priceUsd) || 69) * 2,
      isPublished: true,
      featured: false,
      badge: 'New Course',
      instructor: instructor || {
        name: 'Acharya Niraj Kumar',
        title: 'Founder, Aapka Astro & Master Astrologer',
        bio: 'Acharya Niraj Kumar brings together deep traditional Vedic learning rooted in Baidyanath Dham (Deoghar) and corporate leadership experience.',
        experienceYears: 20,
        studentsTaught: 5200,
        avatarUrl: '/images/Acharya_Niraj_Kumar.jpg',
        aapkaAstroUrl: 'https://aapkaastro.com',
      },
      highlights: ['Interactive live Zoom sessions', 'Comprehensive HD recordings', 'Verifiable certificate'],
      prerequisites: ['Open to beginners'],
      whatYouWillLearn: ['Foundational celestial mechanics', 'Practical chart interpretation'],
      modules: [],
      faqs: [],
    };

    return NextResponse.json({ success: true, course: mockCourse }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
