import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser } from '@/lib/auth/serverAuth';
import {
  regenerateCalendarFeedToken,
  getCalendarFeedToken,
  maskCalendarToken,
} from '@/lib/sessions/calendarFeed';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized: login required' }, { status: 401 });
    }
    const isOwnerUser = auth.isOwner || auth.role === 'OWNER';
    if (!isOwnerUser) {
      return NextResponse.json(
        { error: 'Forbidden: only the Owner can access the private calendar feed' },
        { status: 403 }
      );
    }

    const token = getCalendarFeedToken();
    const maskedToken = maskCalendarToken(token);
    const url = new URL(req.url);
    const feedUrl = `${url.origin}/api/admin/sessions/calendar.ics?token=${token}`;
    const maskedFeedUrl = `${url.origin}/api/admin/sessions/calendar.ics?token=${maskedToken}`;

    return NextResponse.json({
      success: true,
      token,
      maskedToken,
      feedUrl,
      maskedFeedUrl,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error fetching calendar feed token';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized: login required' }, { status: 401 });
    }
    const isOwnerUser = auth.isOwner || auth.role === 'OWNER';
    if (!isOwnerUser) {
      return NextResponse.json(
        { error: 'Forbidden: only the Owner can regenerate the private calendar feed token' },
        { status: 403 }
      );
    }

    const newToken = regenerateCalendarFeedToken();
    const maskedToken = maskCalendarToken(newToken);
    const url = new URL(req.url);
    const feedUrl = `${url.origin}/api/admin/sessions/calendar.ics?token=${newToken}`;
    const maskedFeedUrl = `${url.origin}/api/admin/sessions/calendar.ics?token=${maskedToken}`;

    return NextResponse.json({
      success: true,
      token: newToken,
      maskedToken,
      feedUrl,
      maskedFeedUrl,
      message: 'Secret calendar feed token regenerated successfully. Previous feed URLs are now invalidated.',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error regenerating calendar token';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
