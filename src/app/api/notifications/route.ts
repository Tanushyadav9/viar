import { NextRequest, NextResponse } from 'next/server';
import { sendClassReminder, ClassReminderPayload } from '@/lib/notifications';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      studentEmail,
      studentName,
      courseTitle,
      sessionNumber,
      sessionTitle,
      scheduledAtUtc,
      joinLink,
      studentPhone,
      studentTimezone,
    } = body;

    if (!studentEmail || !courseTitle || !sessionTitle) {
      return NextResponse.json(
        { success: false, error: 'studentEmail, courseTitle, and sessionTitle are required' },
        { status: 400 }
      );
    }

    const payload: ClassReminderPayload = {
      studentName: studentName || 'Learner',
      studentEmail,
      studentPhone,
      courseTitle,
      sessionNumber: Number(sessionNumber) || 1,
      sessionTitle,
      scheduledAtUtc: scheduledAtUtc || new Date(Date.now() + 3600000).toISOString(),
      studentTimezone: studentTimezone || 'Asia/Kolkata',
      joinLink: joinLink || 'https://zoom.us/j/viar-live-session',
    };

    const results = await sendClassReminder(payload);

    return NextResponse.json({
      success: true,
      message: 'Reminder notification queued and dispatched successfully',
      deliveries: results,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

// GET endpoint to simulate a cron scan for sessions starting in 1 hour
export async function GET() {
  try {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const windowStart = new Date(oneHourFromNow.getTime() - 15 * 60 * 1000);
    const windowEnd = new Date(oneHourFromNow.getTime() + 15 * 60 * 1000);

    let upcomingCount = 0;
    try {
      const upcomingSessions = await prisma.classSession.findMany({
        where: {
          scheduledAt: {
            gte: windowStart,
            lte: windowEnd,
          },
          status: 'UPCOMING',
        },
        include: {
          cohort: {
            include: {
              enrollments: {
                include: { user: true },
              },
              course: true,
            },
          },
        },
      });
      upcomingCount = upcomingSessions.length;
    } catch (dbErr) {
      console.warn('Database scan for upcoming sessions skipped:', (dbErr as Error).message);
    }

    return NextResponse.json({
      success: true,
      scanTime: now.toISOString(),
      reminderWindow: {
        from: windowStart.toISOString(),
        to: windowEnd.toISOString(),
      },
      upcomingSessionsFound: upcomingCount,
      status: 'Scheduler operational',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
