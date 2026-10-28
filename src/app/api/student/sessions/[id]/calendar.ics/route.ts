import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser } from '@/lib/auth/serverAuth';
import { verifyUserCourseAccess } from '@/lib/auth/course-access';
import { getStudentSessionById } from '@/lib/sessions/oneOnOneService';
import { generateStudentSessionICal } from '@/lib/sessions/calendarFeed';
import { prisma } from '@/lib/prisma';
import {
  gateMeetingLinkForStudent,
} from '@/lib/courses/liveClassJoinWindow';
import { getLiveClassRevealMinutes } from '@/lib/courses/liveClassesService';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized: login required' }, { status: 401 });
    }

    const access = await verifyUserCourseAccess(req, 'what-is-astrology');
    if (!access.isEnrolled) {
      return NextResponse.json({ error: 'Forbidden: enrolled students only' }, { status: 403 });
    }

    const studentId = access.userId || auth.userId;
    const sessionId = params.id;
    const revealMinutes = await getLiveClassRevealMinutes();

    // 1. Check if sessionId corresponds to a Course Live Class (Lesson)
    let courseLesson: {
      id: string;
      title: string;
      type: string;
      status: string;
      agenda: string | null;
      description: string | null;
      liveScheduledAt: Date | null;
      durationMinutes: number | null;
      liveJoinLink: string | null;
      meetingPlatform: string | null;
      module?: {
        course?: {
          title: string;
        } | null;
      } | null;
    } | null = null;

    try {
      courseLesson = await prisma.lesson.findUnique({
        where: { id: sessionId },
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          agenda: true,
          description: true,
          liveScheduledAt: true,
          durationMinutes: true,
          liveJoinLink: true,
          meetingPlatform: true,
          module: {
            select: {
              course: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      });
    } catch (err) {
      console.warn('[calendar.ics] DB query error checking lesson:', err);
    }

    if (courseLesson && courseLesson.type === 'LIVE_SESSION') {
      if (!courseLesson.liveScheduledAt) {
        return NextResponse.json(
          { error: 'Live class is not yet scheduled with a date and time' },
          { status: 400 }
        );
      }

      // Gate meeting link strictly according to reveal window
      const safeMeetingLink = gateMeetingLinkForStudent({
        rawMeetingLink: courseLesson.liveJoinLink,
        startTime: courseLesson.liveScheduledAt,
        durationMinutes: courseLesson.durationMinutes || 60,
        revealMinutesBefore: revealMinutes,
      });

      const icsContent = generateStudentSessionICal({
        id: courseLesson.id,
        title: courseLesson.title,
        startTime: courseLesson.liveScheduledAt.toISOString(),
        duration: courseLesson.durationMinutes || 60,
        meetingLink: safeMeetingLink,
        meetingPlatform: courseLesson.meetingPlatform || 'Google Meet',
        sharedNotes: courseLesson.agenda || courseLesson.description || 'Interactive live session with Acharya Niraj Kumar.',
        courseTitle: courseLesson.module?.course?.title || 'Foundations of Vedic Astrology',
      });

      return new Response(icsContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': `attachment; filename="viar-live-class-${courseLesson.id}.ics"`,
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    }

    // 2. Fallback to individual 1-on-1 session (if 1-on-1 enabled)
    const targetSession = await getStudentSessionById(sessionId).catch(() => null);

    if (!targetSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (targetSession.studentId !== studentId) {
      return NextResponse.json(
        { error: 'Forbidden: you can only download calendar for your own sessions' },
        { status: 403 }
      );
    }

    const icsContent = generateStudentSessionICal({
      id: targetSession.id,
      title: targetSession.title,
      startTime: targetSession.startTime,
      duration: targetSession.duration,
      meetingLink: targetSession.meetingLink,
      meetingPlatform: targetSession.meetingPlatform,
      sharedNotes: targetSession.sharedNotes,
      homework: targetSession.homework,
      courseTitle: targetSession.courseTitle,
    });

    return new Response(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="viar-session-${targetSession.id}.ics"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to generate calendar event';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
