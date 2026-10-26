import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser, canAccessSection } from '@/lib/auth/serverAuth';
import { listStudentSessions, getCourseSessionSettings } from '@/lib/sessions/oneOnOneService';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated || (!auth.isOwner && !canAccessSection(auth, 'students') && !canAccessSection(auth, 'sessions'))) {
      return NextResponse.json({ error: 'Unauthorized: students or sessions access required' }, { status: 403 });
    }

    const studentId = params.id;
    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // 1. Fetch user & enrollment from Prisma (with fallback)
    let userRecord: {
      id: string;
      name: string;
      email: string;
      phone?: string | null;
      timezone?: string | null;
      role?: string;
      createdAt?: Date;
    } | null = null;

    let enrollmentRecord: {
      id: string;
      courseId: string;
      courseTitle: string;
      enrolledAt: Date | string;
      status: string;
      amountPaid?: number;
    } | null = null;

    let completedLessonsCount = 0;
    let quizAttempts: Array<{
      id: string;
      quizTitle: string;
      score: number;
      totalQuestions: number;
      scorePercentage: number;
      passed: boolean;
      attemptedAt: string;
    }> = [];

    try {
      const u = await prisma.user.findUnique({
        where: { id: studentId },
        include: {
          enrollments: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                  sessionsIncludedPerStudent: true,
                  modules: {
                    include: {
                      lessons: {
                        select: {
                          id: true,
                          videoProviderId: true,
                          externalVideoUrl: true,
                          notesMarkdown: true,
                          documentKey: true,
                          documentUrl: true,
                        },
                      },
                    },
                  },
                },
              },
            },
            take: 1,
          },
          lessonProgress: {
            where: { completed: true },
          },
          quizAttempts: {
            include: {
              quiz: { select: { title: true } },
            },
            orderBy: { attemptedAt: 'desc' },
          },
        },
      });

      if (u) {
        userRecord = {
          id: u.id,
          name: u.name,
          email: u.email || '',
          phone: u.phone,
          timezone: 'Asia/Kolkata',
          role: u.role,
          createdAt: u.createdAt,
        };

        completedLessonsCount = u.lessonProgress?.length || 0;

        if (u.enrollments && u.enrollments.length > 0) {
          const enr = u.enrollments[0];
          enrollmentRecord = {
            id: enr.id,
            courseId: enr.courseId || 'course-what-is-astrology',
            courseTitle: enr.course?.title || 'The Ultimate Astrology Course: Foundations to Chart Mastery',
            enrolledAt: enr.enrolledAt,
            status: enr.status,
            amountPaid: enr.amountPaid !== undefined && enr.amountPaid !== null ? enr.amountPaid : 0,
          };
        }

        if (u.quizAttempts) {
          quizAttempts = u.quizAttempts.map((q) => ({
            id: q.id,
            quizTitle: q.quiz?.title || 'Final Certification Assessment (20 Questions)',
            score: q.score,
            totalQuestions: q.totalQuestions,
            scorePercentage: q.scorePercentage,
            passed: q.passed,
            attemptedAt: q.attemptedAt.toISOString(),
          }));
        }
      }
    } catch {}

    if (!userRecord) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const associatedCourse = userRecord ? (await prisma.course.findFirst({
      where: { OR: [{ id: enrollmentRecord?.courseId || 'course-what-is-astrology' }, { slug: 'wia-foundations' }] },
      include: {
        modules: {
          include: { lessons: true },
        },
      },
    }).catch(() => null)) : null;

    const allCourseLessons = associatedCourse?.modules?.flatMap((m) => m.lessons) || [];
    const totalLessons = allCourseLessons.length > 0 ? allCourseLessons.length : 23;
    const modulesCount = associatedCourse?.modules?.length || 8;
    const totalVideos = allCourseLessons.filter((l) => Boolean((l.videoProviderId && l.videoProviderId.trim()) || (l.externalVideoUrl && l.externalVideoUrl.trim()))).length;
    const progressPercentage = Math.min(100, Math.round((completedLessonsCount / Math.max(1, totalLessons)) * 100));

    // 2. Fetch all sessions for this student
    const studentSessions = await listStudentSessions({ studentId });
    const upcomingSessions = studentSessions.filter((s) => s.status === 'SCHEDULED' || s.status === 'RESCHEDULE_REQUESTED');
    const pastSessions = studentSessions.filter((s) => s.status === 'COMPLETED' || s.status === 'MISSED' || s.status === 'CANCELLED');

    // 3. Course settings (included sessions count)
    const courseSettings = await getCourseSessionSettings(enrollmentRecord?.courseId || 'course-what-is-astrology');
    const sessionsIncluded = courseSettings.sessionsIncludedPerStudent; // Int or null
    const sessionsUsed = studentSessions.filter((s) => s.status === 'COMPLETED' || s.status === 'SCHEDULED').length;

    return NextResponse.json({
      success: true,
      student: userRecord,
      enrollment: enrollmentRecord,
      progress: {
        completedLessons: completedLessonsCount,
        totalLessons,
        percentage: progressPercentage,
        totalVideos,
        modulesCount,
      },
      quizResults: quizAttempts,
      sessions: {
        all: studentSessions,
        upcoming: upcomingSessions,
        past: pastSessions,
      },
      sessionsIncluded, // null by default, only shown if Owner set it!
      sessionsUsed,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error fetching student details';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
