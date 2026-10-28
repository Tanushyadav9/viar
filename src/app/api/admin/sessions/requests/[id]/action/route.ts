import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser } from '@/lib/auth/serverAuth';
import {
  resolveSessionRequest,
  createStudentSessionWithValidation,
} from '@/lib/sessions/oneOnOneService';
import { sendSessionRequestStatusEmail, sendSessionScheduledEmail } from '@/lib/sessions/sessionEmail';
import { ONE_TO_ONE_ENABLED } from '@/config/features';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized: login required' }, { status: 401 });
    }
    if (!auth.isOwner) {
      return NextResponse.json({ error: 'Forbidden: only the Owner can schedule, propose, or decline requests' }, { status: 403 });
    }

    const requestId = params.id;
    const body = await req.json();
    const { action, studentEmail, studentName, ...data } = body;

    if (!action || !['SCHEDULE', 'PROPOSE', 'DECLINE'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action: must be SCHEDULE, PROPOSE, or DECLINE' }, { status: 400 });
    }

    if (action === 'SCHEDULE') {
      // 1. Create the session with clash protection
      const validation = await createStudentSessionWithValidation({
        enrollmentId: data.enrollmentId,
        studentId: data.studentId,
        courseId: data.courseId,
        title: data.title || (ONE_TO_ONE_ENABLED ? '1-on-1 Vedic Astrology Mentorship' : 'Vedic Astrology Live Class'),
        startTime: data.startTime,
        duration: data.duration || 60,
        meetingLink: data.meetingLink,
        meetingPlatform: data.meetingPlatform || 'GOOGLE_MEET',
        sharedNotes: data.notes,
        createdByUserId: auth.userId || 'usr_owner_001',
        allowOutsideWorkingHours: Boolean(data.allowOutsideWorkingHours),
      });

      if (validation.clashError) {
        return NextResponse.json({ error: validation.clashError, isClash: true }, { status: 409 });
      }

      if (validation.workingHoursWarning) {
        return NextResponse.json(
          {
            error: validation.workingHoursWarning,
            requiresConfirmation: true,
          },
          { status: 422 }
        );
      }

      const createdSession = validation.sessions[0];

      // 2. Mark request as ACCEPTED
      await resolveSessionRequest({
        requestId,
        status: 'ACCEPTED',
        resolvedByUserId: auth.userId || 'usr_owner_001',
        studentSessionId: createdSession?.id,
      });

      // 3. Email the student
      if (studentEmail) {
        await sendSessionScheduledEmail({
          studentName: studentName || 'Student',
          studentEmail,
          topic: data.title || (ONE_TO_ONE_ENABLED ? '1-on-1 Vedic Astrology Mentorship' : 'Vedic Astrology Live Class'),
          startTimeUtc: data.startTime,
          durationMinutes: data.duration || 60,
          meetingLink: data.meetingLink,
          notes: data.notes,
        });
      }

      return NextResponse.json({
        success: true,
        session: createdSession,
        message: 'Session scheduled from request and student emailed.',
      });
    }

    if (action === 'PROPOSE') {
      const proposedTime = data.proposedTimeText || 'Another time window';
      const reason = data.note || 'Proposed by Acharya Niraj Kumar';

      await resolveSessionRequest({
        requestId,
        status: 'DECLINED', // marks current pending request resolved
        resolvedByUserId: auth.userId || 'usr_owner_001',
        rescheduleReason: `Alternate proposed: ${proposedTime}. Note: ${reason}`,
      });

      if (studentEmail) {
        await sendSessionRequestStatusEmail({
          studentName: studentName || 'Student',
          studentEmail,
          status: 'PROPOSAL',
          proposedTime,
          reason,
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Proposed alternate time sent to student via email.',
      });
    }

    if (action === 'DECLINE') {
      const reason = data.reason || 'Requested slot unavailable in Acharya ji schedule.';

      await resolveSessionRequest({
        requestId,
        status: 'DECLINED',
        resolvedByUserId: auth.userId || 'usr_owner_001',
        rescheduleReason: reason,
      });

      if (studentEmail) {
        await sendSessionRequestStatusEmail({
          studentName: studentName || 'Student',
          studentEmail,
          status: 'DECLINED',
          reason,
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Request declined and student notified via email.',
      });
    }

    return NextResponse.json({ error: 'Unhandled action' }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error executing request action';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
