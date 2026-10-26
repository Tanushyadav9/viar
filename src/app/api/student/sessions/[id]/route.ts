import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser } from '@/lib/auth/serverAuth';
import { verifyUserCourseAccess } from '@/lib/auth/course-access';
import { getStudentSessionById } from '@/lib/sessions/oneOnOneService';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const sessionId = params?.id;
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const session = await getStudentSessionById(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const currentStudentId = access.userId || auth.userId;

    // Strict Security Authorization: Student sees only their own sessions!
    // Attempting to read another student's session by ID returns 403 Forbidden.
    // Meeting link, notes and materials are NEVER returned to anyone else.
    if (session.studentId !== currentStudentId) {
      return NextResponse.json(
        { error: 'Forbidden: you can only view your own sessions' },
        { status: 403 }
      );
    }

    // Return sanitized session: strip privateNotes (Owner only)
    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        studentId: session.studentId,
        title: session.title,
        startTime: session.startTime,
        duration: session.duration,
        meetingLink: session.meetingLink,
        meetingPlatform: session.meetingPlatform,
        status: session.status,
        sharedNotes: session.sharedNotes,
        homework: session.homework,
        recordingUrl: session.recordingUrl,
        courseTitle: session.courseTitle,
        moduleTitle: session.moduleTitle,
        lessonTitle: session.lessonTitle,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to retrieve session';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
