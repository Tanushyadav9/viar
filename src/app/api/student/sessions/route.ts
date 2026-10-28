import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser } from '@/lib/auth/serverAuth';
import { verifyUserCourseAccess } from '@/lib/auth/course-access';
import { listStudentSessions, listSessionRequests } from '@/lib/sessions/oneOnOneService';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated || !auth.userId) {
      return NextResponse.json(
        { error: 'Unauthorized: login required', enrolled: false },
        { status: 401 }
      );
    }

    // Verify enrollment strictly: unapproved, rejected, or revoked students see nothing
    const access = await verifyUserCourseAccess(req, 'what-is-astrology');
    if (!access.isEnrolled) {
      return NextResponse.json(
        {
          error: 'Forbidden: access restricted to enrolled students',
          enrolled: false,
          reason: access.reason || 'No active enrollment found',
        },
        { status: 403 }
      );
    }

    const studentId = access.userId || auth.userId;

    // Fetch this student's individual sessions (if 1-on-1 enabled)
    const rawSessions = await listStudentSessions({ studentId }).catch(() => []);

    // Cleanse individual sessions: strictly strip privateNotes (reserved exclusively for Owner)
    const sanitizedIndividualSessions = rawSessions.map((s) => ({
      id: s.id,
      title: s.title,
      startTime: s.startTime,
      duration: s.duration,
      meetingLink: s.meetingLink,
      meetingPlatform: s.meetingPlatform,
      status: s.status,
      sharedNotes: s.sharedNotes,
      homework: s.homework,
      recordingUrl: s.recordingUrl,
      courseTitle: s.courseTitle,
      moduleTitle: s.moduleTitle,
      lessonTitle: s.lessonTitle,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      // Zero privateNotes sent to client
    }));

    // Fetch Course Live Classes (flagship course interactive classes where all approved students attend)
    let courseLiveLessons: Array<{
      id: string;
      title: string;
      agenda: string | null;
      description: string | null;
      liveScheduledAt: Date | null;
      durationMinutes: number | null;
      liveJoinLink: string | null;
      meetingPlatform: string | null;
      status: string;
      recordingUrl: string | null;
      documentUrl: string | null;
      createdAt: Date;
      updatedAt: Date;
      module?: {
        id: string;
        title: string;
        order: number;
        course?: {
          title: string;
        } | null;
      } | null;
    }> = [];

    try {
      courseLiveLessons = await prisma.lesson.findMany({
        where: {
          type: 'LIVE_SESSION',
          status: { in: ['SCHEDULED', 'PUBLISHED', 'COMPLETED'] },
          liveScheduledAt: { not: null },
        },
        include: {
          module: {
            select: {
              id: true,
              title: true,
              order: true,
              course: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
        orderBy: { liveScheduledAt: 'asc' },
      });
    } catch (err) {
      console.warn('[student/sessions] Error fetching course live lessons:', err);
    }

    const sanitizedCourseLiveSessions = courseLiveLessons.map((l) => ({
      id: l.id,
      title: l.title,
      startTime: l.liveScheduledAt!.toISOString(),
      duration: l.durationMinutes || 60,
      meetingLink: l.liveJoinLink,
      meetingPlatform: l.meetingPlatform || 'GOOGLE_MEET',
      status: l.status === 'PUBLISHED' ? 'SCHEDULED' : l.status,
      sharedNotes: l.agenda || l.description || '',
      homework: null,
      recordingUrl: l.recordingUrl,
      documentUrl: l.documentUrl,
      notesPdf: l.documentUrl,
      courseTitle: l.module?.course?.title || 'Foundations of Vedic Astrology',
      moduleTitle: l.module?.title || `Module ${l.module?.order || 1}`,
      lessonTitle: l.title,
      isCourseLiveClass: true,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
      // Zero privateHostNotes sent to client
    }));

    // Merge individual sessions with Course Live Classes
    const sanitizedSessions = [...sanitizedCourseLiveSessions, ...sanitizedIndividualSessions];

    const nowMs = Date.now();

    // Segregate upcoming vs past sessions
    const upcomingSessions = sanitizedSessions.filter((s) => {
      if (s.status === 'COMPLETED' || s.status === 'CANCELLED') return false;
      const endMs = new Date(s.startTime).getTime() + (s.duration || 60) * 60 * 1000;
      return endMs >= nowMs;
    });

    // Earliest upcoming session sorted chronologically
    upcomingSessions.sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    const nextSession = upcomingSessions.length > 0 ? upcomingSessions[0] : null;

    // Past sessions (completed, missed, or end time passed)
    const pastSessions = sanitizedSessions.filter((s) => {
      if (s.status === 'COMPLETED' || s.status === 'MISSED') return true;
      const endMs = new Date(s.startTime).getTime() + (s.duration || 60) * 60 * 1000;
      return endMs < nowMs;
    });
    pastSessions.sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    // Fetch student's session requests (reschedule or initial)
    const requests = await listSessionRequests({ studentId }).catch(() => []);

    return NextResponse.json(
      {
        success: true,
        enrolled: true,
        enrollmentId: access.enrollmentId || null,
        timezone: (auth.dbUser as { timezone?: string | null })?.timezone || 'Asia/Kolkata',
        nextSession,
        upcomingSessions,
        pastSessions,
        allSessions: sanitizedSessions,
        requests,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch student sessions';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
