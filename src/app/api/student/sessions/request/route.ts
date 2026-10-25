import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser } from '@/lib/auth/serverAuth';
import { verifyUserCourseAccess } from '@/lib/auth/course-access';
import {
  createSessionRequest,
  listStudentSessions,
  updateStudentSession,
  getCourseSessionSettings,
} from '@/lib/sessions/oneOnOneService';

export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated || !auth.userId) {
      return NextResponse.json(
        { error: 'Unauthorized: login required', enrolled: false },
        { status: 401 }
      );
    }

    // Verify student is actively enrolled
    const access = await verifyUserCourseAccess(req, 'what-is-astrology');
    if (!access.isEnrolled) {
      return NextResponse.json(
        {
          error: 'Forbidden: only active enrolled students may request 1-on-1 sessions',
          enrolled: false,
          reason: access.reason || 'No active enrollment',
        },
        { status: 403 }
      );
    }

    const studentId = access.userId || auth.userId;
    const body = await req.json();

    const requestType: 'INITIAL' | 'RESCHEDULE' =
      body.requestType === 'RESCHEDULE' ? 'RESCHEDULE' : 'INITIAL';

    // Validate preferred windows (2 to 3 windows expected)
    const preferredWindows = Array.isArray(body.preferredWindows)
      ? body.preferredWindows
      : [];

    if (preferredWindows.length === 0) {
      return NextResponse.json(
        { error: 'Please provide at least one preferred time window' },
        { status: 400 }
      );
    }

    let targetSessionId: string | null = null;

    if (requestType === 'RESCHEDULE') {
      if (!body.studentSessionId) {
        return NextResponse.json(
          { error: 'studentSessionId is required to request a reschedule' },
          { status: 400 }
        );
      }

      // Security check: verify this session belongs strictly to THIS student
      const studentSessions = await listStudentSessions({ studentId });
      const targetSession = studentSessions.find((s) => s.id === body.studentSessionId);

      if (!targetSession) {
        return NextResponse.json(
          { error: 'Session not found or does not belong to your account' },
          { status: 404 }
        );
      }

      // Check Owner-configured notice period (default: 24 hours)
      const settings = await getCourseSessionSettings(targetSession.courseId || 'course-what-is-astrology');
      const noticeHours = settings.minimumRescheduleNoticeHours ?? 24;
      const hoursRemaining = (new Date(targetSession.startTime).getTime() - Date.now()) / (1000 * 60 * 60);

      if (hoursRemaining < noticeHours) {
        const roundedHours = Math.max(0, Math.round(hoursRemaining));
        return NextResponse.json(
          {
            error: `Reschedule requests require at least ${noticeHours} hours advance notice. This session is scheduled in ${roundedHours} hours. Please message Acharya ji directly on WhatsApp for urgent adjustments.`,
            noticePeriodHours: noticeHours,
            hoursRemaining: roundedHours,
            whatsAppUrl: `https://wa.me/919311215564?text=${encodeURIComponent(
              `Namaste Acharya ji, I have an urgent reschedule request for my session (${targetSession.title}) starting in ${roundedHours} hours.`
            )}`,
          },
          { status: 400 }
        );
      }

      targetSessionId = targetSession.id;

      // Update session status to indicate reschedule has been requested
      await updateStudentSession(targetSession.id, {
        status: 'RESCHEDULE_REQUESTED',
      });
    }

    // Create session request record
    const sessionReq = await createSessionRequest({
      enrollmentId: access.enrollmentId || 'enr_student_default',
      studentId,
      studentName: auth.dbUser?.name || 'Student',
      studentEmail: auth.email || '',
      studentPhone: auth.dbUser?.phone || '',
      courseId: 'course-what-is-astrology',
      studentSessionId: targetSessionId,
      requestType,
      message: body.message || null,
      preferredWindows,
      rescheduleReason: body.rescheduleReason || null,
    });

    return NextResponse.json({
      success: true,
      request: sessionReq,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create session request';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
