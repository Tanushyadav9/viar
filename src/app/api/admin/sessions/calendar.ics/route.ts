import { NextRequest, NextResponse } from 'next/server';
import { verifyCalendarFeedToken, generateICalendarFeed } from '@/lib/sessions/calendarFeed';
import { listStudentSessions } from '@/lib/sessions/oneOnOneService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token || !verifyCalendarFeedToken(token)) {
      return new NextResponse('Unauthorized calendar subscription feed. Invalid secret token.', {
        status: 401,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    const sessions = await listStudentSessions({ status: 'ALL' });
    const icalContent = generateICalendarFeed(sessions);

    return new NextResponse(icalContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="viar-personal-sessions.ics"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error generating iCal feed';
    return new NextResponse(msg, { status: 500 });
  }
}
