import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser } from '@/lib/auth/serverAuth';
import { verifyUserCourseAccess } from '@/lib/auth/course-access';
import { getStudentSessionById } from '@/lib/sessions/oneOnOneService';
import { generateStudentSessionICal } from '@/lib/sessions/calendarFeed';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const access = await verifyUserCourseAccess(req, 'what-is-astrology');
    if (!access.isEnrolled) {
      return NextResponse.json({ error: 'Forbidden: enrolled students only' }, { status: 403 });
    }

    const studentId = access.userId || auth.userId;
    const sessionId = params.id;

    // Fetch session by id and enforce strict student ownership
    const targetSession = await getStudentSessionById(sessionId);

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
        'Content-Disposition': `attachment; filename="viar-class-${targetSession.id}.ics"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to generate calendar event';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
