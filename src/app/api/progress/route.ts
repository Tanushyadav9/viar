import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerAuthUser, isAuthorizedForSection } from '@/lib/auth/serverAuth';
import { syncDatabaseUser } from '@/lib/auth/userSync';
import { validateLessonPublishReadiness } from '@/lib/curriculum-validation';
import { ViarStore } from '@/lib/store';

export async function GET(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated || !auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please sign in.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');

    // A student can only view their own progress.
    // Staff with 'students' permission or Owner can view progress for any student.
    const isStaffOrOwner = isAuthorizedForSection(auth, 'students', 'VIEW');
    const targetUserId = (isStaffOrOwner && requestedUserId) ? requestedUserId : auth.userId;

    try {
      // 1. Fetch relational LessonProgress using database userId foreign key
      const lessonProgress = await prisma.lessonProgress.findMany({
        where: {
          OR: [
            { userId: targetUserId },
            { user: { clerkId: targetUserId } },
          ],
        },
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
        where: {
          OR: [
            { userId: targetUserId },
            { user: { clerkId: targetUserId } },
          ],
        },
        include: { classSession: true },
      });

      // 3. Compute completion stats for course
      let totalLessons = 23;
      let completedLessonsCount = lessonProgress.filter((p) => p.completed).length;

      const course = await prisma.course.findFirst({
        where: courseId
          ? { OR: [{ id: courseId }, { slug: courseId }] }
          : { OR: [{ id: 'course-what-is-astrology' }, { slug: 'wia-foundations' }] },
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
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated || !auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please sign in.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));

    // Authoritative database user ID resolution (ensures foreign key references User.id)
    let dbUserId = auth.dbUser?.id;
    if (!dbUserId || dbUserId.startsWith('user_')) {
      const dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            ...(auth.clerkId ? [{ clerkId: auth.clerkId }] : []),
            ...(auth.email ? [{ email: auth.email }] : []),
            { id: auth.userId },
          ],
        },
        select: { id: true },
      });
      if (dbUser) {
        dbUserId = dbUser.id;
      } else if (auth.clerkId || auth.email) {
        try {
          const synced = await syncDatabaseUser({
            clerkId: auth.clerkId || auth.userId,
            email: auth.email,
            name: auth.dbUser?.name || 'Scholar',
          });
          dbUserId = synced.user.id;
        } catch {
          dbUserId = auth.userId;
        }
      }
    }

    const userId = dbUserId || auth.userId;
    const { lessonId, classSessionId, watched, completed, watchedSeconds, totalDurationSeconds } = body;

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
      if (isCompleted) {
        let lesson = null;
        try {
          lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            select: {
              id: true,
              type: true,
              videoProviderId: true,
              externalVideoUrl: true,
              documentKey: true,
              documentUrl: true,
              notesMarkdown: true,
              liveScheduledAt: true,
            },
          });
        } catch (findErr) {
          console.warn('Prisma lesson lookup warning:', (findErr as Error).message);
        }

        if (lesson) {
          const readiness = validateLessonPublishReadiness(lesson);
          if (!readiness.canPublish) {
            return NextResponse.json(
              {
                success: false,
                error: readiness.draftReason || 'Cannot complete a lesson that has no content.',
                draftReason: readiness.draftReason,
              },
              { status: 400 }
            );
          }
        } else {
          const fallbackClass = ViarStore.getClassById(lessonId);
          if (fallbackClass) {
            const readiness = validateLessonPublishReadiness({
              type: fallbackClass.lessonType,
              videoProviderId: fallbackClass.recording?.videoUrl || fallbackClass.externalVideoUrl,
              externalVideoUrl: fallbackClass.externalVideoUrl,
              documentKey: fallbackClass.documentKey,
              documentUrl: fallbackClass.documentDownloadUrl,
              notesMarkdown: fallbackClass.notesMarkdown || fallbackClass.recording?.notesMarkdown,
              liveScheduledAt: fallbackClass.scheduledStartTime,
            });
            if (!readiness.canPublish) {
              return NextResponse.json(
                {
                  success: false,
                  error: readiness.draftReason || 'Cannot complete a lesson that has no content.',
                  draftReason: readiness.draftReason,
                },
                { status: 400 }
              );
            }
          }
        }
      }

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
      if (watched !== false) {
        let session = null;
        try {
          session = await prisma.classSession.findUnique({
            where: { id: classSessionId },
            select: {
              id: true,
              recordingUrl: true,
              scheduledAt: true,
            },
          });
        } catch (findErr) {
          console.warn('Prisma classSession lookup warning:', (findErr as Error).message);
        }

        if (session) {
          const hasRecording = Boolean(session.recordingUrl && session.recordingUrl.trim());
          const hasValidDate = Boolean(
            session.scheduledAt &&
            !isNaN(new Date(session.scheduledAt).getTime()) &&
            new Date(session.scheduledAt).getTime() > 86400000
          );
          if (!hasRecording && !hasValidDate) {
            return NextResponse.json(
              {
                success: false,
                error: 'Cannot complete a session that has no recording or scheduled date.',
              },
              { status: 400 }
            );
          }
        } else {
          const fallbackClass = ViarStore.getClassById(classSessionId);
          if (fallbackClass) {
            const hasRec = Boolean(fallbackClass.recording?.videoUrl || fallbackClass.recordingUrl);
            const hasDate = Boolean(
              fallbackClass.scheduledStartTime &&
              !isNaN(new Date(fallbackClass.scheduledStartTime).getTime()) &&
              new Date(fallbackClass.scheduledStartTime).getTime() > 86400000
            );
            if (!hasRec && !hasDate) {
              return NextResponse.json(
                {
                  success: false,
                  error: 'Cannot complete a session that has no recording or scheduled date.',
                },
                { status: 400 }
              );
            }
          }
        }
      }

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
