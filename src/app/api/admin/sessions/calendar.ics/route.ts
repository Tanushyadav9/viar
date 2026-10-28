import { NextRequest, NextResponse } from 'next/server';
import {
  verifyCalendarFeedToken,
  verifyCalendarFeedTokenAsync,
  generateOwnerLiveClassesICal,
  generateICalendarFeed,
} from '@/lib/sessions/calendarFeed';
import { listStudentSessions } from '@/lib/sessions/oneOnOneService';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return new NextResponse('Unauthorized calendar subscription feed. Missing secret token.', {
        status: 401,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    const isValid = verifyCalendarFeedToken(token) || (await verifyCalendarFeedTokenAsync(token));
    if (!isValid) {
      return new NextResponse('Unauthorized calendar subscription feed. Invalid secret token.', {
        status: 401,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    // Query course live classes from database (live classes only)
    let liveClasses: Array<{
      id: string;
      title: string;
      startTime: Date | string;
      durationMinutes: number;
      meetingLink: string | null;
      meetingPlatform: string;
      agenda?: string | null;
      status: string;
      courseTitle?: string | null;
    }> = [];

    try {
      const dbLessons = await prisma.lesson.findMany({
        where: {
          type: 'LIVE_SESSION',
          status: { not: 'CANCELLED' },
          liveScheduledAt: { not: null },
        },
        include: {
          module: {
            include: {
              course: { select: { title: true } },
            },
          },
        },
        orderBy: { liveScheduledAt: 'asc' },
      });

      if (dbLessons && dbLessons.length > 0) {
        liveClasses = dbLessons.map((l) => ({
          id: l.id,
          title: l.title,
          startTime: l.liveScheduledAt!,
          durationMinutes: l.durationMinutes || 60,
          meetingLink: l.liveJoinLink || null,
          meetingPlatform: l.meetingPlatform || 'GOOGLE_MEET',
          agenda: l.agenda || null,
          status: l.status,
          courseTitle: l.module?.course?.title || 'Foundations of Vedic Astrology',
        }));
      }
    } catch {
      // Database offline/sandbox fallback
    }

    let icalContent: string;
    if (liveClasses.length > 0) {
      icalContent = generateOwnerLiveClassesICal(liveClasses);
    } else {
      // Fallback for tests / memory sessions (still strictly zero student PII)
      const sessions = await listStudentSessions({ status: 'ALL' });
      icalContent = generateICalendarFeed(sessions);
    }

    return new NextResponse(icalContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="viar-live-classes.ics"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error generating iCal feed';
    return new NextResponse(msg, { status: 500 });
  }
}
