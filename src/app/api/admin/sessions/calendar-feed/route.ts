import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser } from '@/lib/auth/serverAuth';
import { regenerateCalendarFeedToken, getCalendarFeedToken } from '@/lib/sessions/calendarFeed';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized: login required' }, { status: 401 });
    }
    const isOwnerUser = auth.isOwner || auth.role === 'OWNER';
    if (!isOwnerUser) {
      return NextResponse.json({ error: 'Forbidden: only the Owner can access the private calendar feed' }, { status: 403 });
    }

    const token = getCalendarFeedToken();
    const url = new URL(req.url);
    const feedUrl = `${url.origin}/api/admin/sessions/calendar.ics?token=${token}`;

    return NextResponse.json({
      success: true,
      token,
      feedUrl,
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
      return NextResponse.json({ error: 'Forbidden: only the Owner can regenerate the private calendar feed token' }, { status: 403 });
    }

    const newToken = regenerateCalendarFeedToken();
    const url = new URL(req.url);
    const feedUrl = `${url.origin}/api/admin/sessions/calendar.ics?token=${newToken}`;

    return NextResponse.json({
      success: true,
      token: newToken,
      feedUrl,
      message: 'Secret calendar feed token regenerated successfully.',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error regenerating calendar token';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
