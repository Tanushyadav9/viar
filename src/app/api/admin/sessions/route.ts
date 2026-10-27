import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser, canAccessSection } from '@/lib/auth/serverAuth';
import {
  listStudentSessions,
  createStudentSessionWithValidation,
  updateStudentSession,
  deleteOneOnOneSession,
  generateWhatsAppShareUrl,
  getCourseSessionSettings,
} from '@/lib/sessions/oneOnOneService';
import { sendSessionScheduledEmail } from '@/lib/sessions/sessionEmail';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized: login required' }, { status: 401 });
    }
    if (!auth.isOwner && !canAccessSection(auth, 'sessions')) {
      return NextResponse.json({ error: 'Forbidden: explicit sessions permission required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId') || undefined;
    const status = searchParams.get('status') || undefined;

    const sessions = await listStudentSessions({ studentId, status });

    // Also get enrolled students list for the dropdown
    let enrolledStudents: Array<{
      id: string;
      name: string;
      email: string;
      phone?: string | null;
      timezone?: string;
      enrolledAt?: string;
      courseTitle?: string;
    }> = [];

    try {
      const dbUsers = await prisma.user.findMany({
        where: {
          role: 'STUDENT',
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          enrollments: {
            select: {
              enrolledAt: true,
              course: { select: { title: true } },
            },
            take: 1,
          },
        },
        orderBy: { name: 'asc' },
        take: 100,
      });

      if (dbUsers && dbUsers.length > 0) {
        enrolledStudents = dbUsers.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email || '',
          phone: u.phone,
          timezone: 'Asia/Kolkata',
          enrolledAt: u.enrollments?.[0]?.enrolledAt?.toISOString(),
          courseTitle: u.enrollments?.[0]?.course?.title || 'Foundations of Vedic Astrology (Jyotish)',
        }));
      }
    } catch {}

    // Zero mock student fallbacks: only real enrolled students from the database
    // Per-course session settings (e.g. sessionsIncludedPerStudent)
    const settings = await getCourseSessionSettings('course-what-is-astrology');

    const enhancedSessions = sessions.map((s) => ({
      ...s,
      whatsAppShareUrl: generateWhatsAppShareUrl(s),
    }));

    return NextResponse.json(
      {
        success: true,
        isOwner: auth.isOwner,
        sessions: enhancedSessions,
        students: enrolledStudents,
        courseSettings: settings,
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
    const msg = error instanceof Error ? error.message : 'Failed to fetch sessions';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized: login required' }, { status: 401 });
    }
    if (!auth.isOwner) {
      return NextResponse.json({ error: 'Forbidden: only the Owner can create sessions' }, { status: 403 });
    }

    const body = await req.json();
    const {
      studentId,
      studentName,
      studentEmail,
      studentTimezone,
      courseId,
      moduleId,
      lessonId,
      title,
      scheduledAt,
      durationMinutes,
      meetingPlatform,
      meetingLink,
      notes,
      sharedNotes,
      privateNotes,
      repeatWeeklyCount,
      allowOutsideWorkingHours,
    } = body;

    if (!studentId || !title || !scheduledAt) {
      return NextResponse.json(
        { error: 'Missing required fields: studentId, title, and scheduledAt are required.' },
        { status: 400 }
      );
    }

    const validation = await createStudentSessionWithValidation({
      studentId,
      courseId: courseId || 'course-what-is-astrology',
      moduleId: moduleId || null,
      lessonId: lessonId || null,
      title,
      startTime: scheduledAt,
      duration: durationMinutes ? Number(durationMinutes) : 60,
      meetingPlatform: meetingPlatform || 'GOOGLE_MEET',
      meetingLink: meetingLink || null,
      sharedNotes: sharedNotes || notes || null,
      privateNotes: privateNotes || null,
      createdByUserId: auth.userId || 'usr_owner_001',
      repeatWeeklyCount: repeatWeeklyCount ? Number(repeatWeeklyCount) : 1,
      allowOutsideWorkingHours: Boolean(allowOutsideWorkingHours),
    });

    if (validation.clashError) {
      return NextResponse.json(
        {
          error: validation.clashError,
          isClash: true,
        },
        { status: 409 }
      );
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

    const primarySession = validation.sessions[0];

    // Trigger transactional confirmation email to student
    let recipientEmail = studentEmail || primarySession.studentEmail;
    let recipientName = studentName || primarySession.studentName || 'Student';
    let recipientTimezone = studentTimezone;

    if (!recipientEmail && studentId) {
      try {
        const u = await prisma.user.findUnique({
          where: { id: studentId },
          select: { email: true, name: true, timezone: true },
        });
        if (u?.email) {
          recipientEmail = u.email;
          if (!recipientName || recipientName === 'Student') recipientName = u.name;
          if (!recipientTimezone) recipientTimezone = u.timezone || 'Asia/Kolkata';
        }
      } catch (lookupErr) {
        console.warn('[sessions.POST] Student user lookup warning:', lookupErr);
      }
    }

    let emailSent = false;
    if (recipientEmail) {
      try {
        emailSent = await sendSessionScheduledEmail({
          studentName: recipientName,
          studentEmail: recipientEmail,
          topic: title,
          startTimeUtc: primarySession.startTime,
          durationMinutes: primarySession.duration,
          meetingLink: primarySession.meetingLink,
          notes: primarySession.sharedNotes,
          studentTimezone: recipientTimezone || 'Asia/Kolkata',
          sessionId: primarySession.id,
        });
      } catch (emailErr) {
        console.error('[sendSessionScheduledEmail] Failed:', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      emailSent,
      recipientEmail: recipientEmail || null,
      session: {
        ...primarySession,
        whatsAppShareUrl: generateWhatsAppShareUrl(primarySession),
      },
      sessions: validation.sessions.map((s) => ({
        ...s,
        whatsAppShareUrl: generateWhatsAppShareUrl(s),
      })),
      countCreated: validation.sessions.length,
      message:
        validation.sessions.length > 1
          ? `Successfully scheduled ${validation.sessions.length} weekly sessions. Confirmation email ${emailSent ? 'sent' : 'queued'}.`
          : `Session scheduled successfully. Confirmation email ${emailSent ? 'sent' : 'queued'} to student.`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create session';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized: login required' }, { status: 401 });
    }
    if (!auth.isOwner) {
      return NextResponse.json({ error: 'Forbidden: only the Owner can update or change sessions' }, { status: 403 });
    }

    const body = await req.json();
    const {
      id,
      title,
      startTime,
      scheduledAt,
      duration,
      durationMinutes,
      meetingLink,
      meetingPlatform,
      status,
      privateNotes,
      sharedNotes,
      homework,
      recordingUrl,
      taughtRecord,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Session ID is required.' }, { status: 400 });
    }

    const updated = await updateStudentSession(
      id,
      {
        title,
        startTime: startTime || scheduledAt,
        duration: duration || durationMinutes,
        meetingLink,
        meetingPlatform,
        status,
        privateNotes,
        sharedNotes: sharedNotes || taughtRecord,
        homework,
        recordingUrl,
      },
      auth.userId || 'usr_owner_001'
    );

    if (!updated) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      session: {
        ...updated,
        whatsAppShareUrl: generateWhatsAppShareUrl(updated),
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to update session';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized: login required' }, { status: 401 });
    }
    if (!auth.isOwner) {
      return NextResponse.json({ error: 'Forbidden: only the Owner can cancel or delete sessions' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const deleted = await deleteOneOnOneSession(id);
    return NextResponse.json({ success: true, deleted });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to delete session';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
