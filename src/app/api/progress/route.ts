import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractAuthFromRequest } from '@/lib/auth/permissions';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const auth = extractAuthFromRequest(req);
    const userId = searchParams.get('userId') || auth.userId;
    const courseId = searchParams.get('courseId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    try {
      // 1. Fetch relational LessonProgress
      const lessonProgress = await prisma.lessonProgress.findMany({
        where: { userId },
        include: {
          lesson: {
            include: {
              module: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      // 2. Fetch legacy sessionProgress for backward compatibility
      const sessionProgress = await prisma.sessionProgress.findMany({
        where: { userId },
        include: { classSession: true },
      });

      // 3. Compute completion stats for course if courseId provided
      let totalLessons = 23;
      let completedLessonsCount = lessonProgress.filter((p) => p.completed).length;

      if (courseId) {
        const course = await prisma.course.findFirst({
          where: { OR: [{ id: courseId }, { slug: courseId }] },
          include: {
            modules: {
              include: { lessons: true },
            },
          },
        });

        if (course) {
          totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0) || course.totalClasses || 23;
          const courseLessonIds = new Set(course.modules.flatMap((m) => m.lessons.map((l) => l.id)));
          completedLessonsCount = lessonProgress.filter((p) => courseLessonIds.has(p.lessonId) && p.completed).length;
        }
      }

      const progressPercentage = Math.min(100, Math.round((completedLessonsCount / Math.max(1, totalLessons)) * 100));

      return NextResponse.json({
        success: true,
        lessonProgress,
        progress: sessionProgress, // legacy compatibility
        completedLessonIds: lessonProgress.filter((p) => p.completed).map((p) => p.lessonId),
        lastAccessedLessonId: lessonProgress[0]?.lessonId || null,
        completedLessonsCount,
        totalLessons,
        progressPercentage,
      });
    } catch (dbError) {
      console.warn('Database query for progress skipped:', (dbError as Error).message);
      return NextResponse.json({
        success: true,
        lessonProgress: [],
        progress: [],
        completedLessonIds: [],
        progressPercentage: 0,
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
    const body = await req.json();
    const auth = extractAuthFromRequest(req);
    const userId = body.userId || auth.userId;
    const { lessonId, classSessionId, watched, completed, watchedSeconds, totalDurationSeconds } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // Determine completion:
    // 1. Explicit boolean flag if passed
    // 2. Or >= 90% watched (as required: "a video counts as complete at about 90% watched")
    let isCompleted = completed !== undefined ? Boolean(completed) : (watched !== undefined ? Boolean(watched) : false);

    if (watchedSeconds !== undefined && totalDurationSeconds !== undefined && totalDurationSeconds > 0) {
      if (watchedSeconds >= 0.9 * totalDurationSeconds) {
        isCompleted = true;
      }
    }

    // Case A: LessonProgress (Relational Model)
    if (lessonId) {
      try {
        const lp = await prisma.lessonProgress.upsert({
          where: {
            userId_lessonId: {
              userId,
              lessonId,
            },
          },
          update: {
            completed: isCompleted,
            watchedSeconds: Math.round(watchedSeconds || 0),
            completedAt: isCompleted ? new Date() : null,
          },
          create: {
            userId,
            lessonId,
            completed: isCompleted,
            watchedSeconds: Math.round(watchedSeconds || 0),
            completedAt: isCompleted ? new Date() : null,
          },
        });

        return NextResponse.json({
          success: true,
          lessonId,
          completed: lp.completed,
          watchedSeconds: lp.watchedSeconds,
          completedAt: lp.completedAt,
        });
      } catch (dbErr) {
        console.warn('Database write for LessonProgress failed:', (dbErr as Error).message);
        return NextResponse.json({
          success: true,
          lessonId,
          completed: isCompleted,
          watchedSeconds: Math.round(watchedSeconds || 0),
        });
      }
    }

    // Case B: Legacy ClassSessionProgress
    if (classSessionId) {
      try {
        if (watched === false) {
          await prisma.sessionProgress.deleteMany({
            where: { userId, classSessionId },
          });
          return NextResponse.json({ success: true, marked: false });
        } else {
          const progress = await prisma.sessionProgress.upsert({
            where: {
              userId_classSessionId: { userId, classSessionId },
            },
            update: { watchedAt: new Date() },
            create: { userId, classSessionId, watchedAt: new Date() },
          });
          return NextResponse.json({ success: true, progress, marked: true });
        }
      } catch (dbError) {
        console.warn('Database write for session progress skipped:', (dbError as Error).message);
        return NextResponse.json({
          success: true,
          marked: watched !== false,
          userId,
          classSessionId,
          watchedAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json(
      { success: false, error: 'Either lessonId or classSessionId is required' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
