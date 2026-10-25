import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser, canAccessSection } from '@/lib/auth/serverAuth';
import {
  getCourseSessionSettings,
  updateCourseSessionSettings,
} from '@/lib/sessions/oneOnOneService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated || (!auth.isOwner && !canAccessSection(auth, 'sessions'))) {
      return NextResponse.json({ error: 'Unauthorized: sessions access required' }, { status: 403 });
    }

    const settings = await getCourseSessionSettings('course-what-is-astrology');

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch session settings';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated || (!auth.isOwner && !canAccessSection(auth, 'sessions'))) {
      return NextResponse.json({ error: 'Unauthorized: sessions access required' }, { status: 403 });
    }

    const body = await req.json();

    const updated = await updateCourseSessionSettings('course-what-is-astrology', {
      sessionsIncludedPerStudent:
        body.sessionsIncludedPerStudent !== undefined
          ? body.sessionsIncludedPerStudent === '' || body.sessionsIncludedPerStudent === null
            ? null
            : Number(body.sessionsIncludedPerStudent)
          : undefined,
      maximumActiveStudents:
        body.maximumActiveStudents !== undefined
          ? body.maximumActiveStudents === '' || body.maximumActiveStudents === null
            ? null
            : Number(body.maximumActiveStudents)
          : undefined,
      minimumRescheduleNoticeHours:
        body.minimumRescheduleNoticeHours !== undefined
          ? body.minimumRescheduleNoticeHours === '' || body.minimumRescheduleNoticeHours === null
            ? null
            : Number(body.minimumRescheduleNoticeHours)
          : undefined,
    });

    return NextResponse.json({
      success: true,
      settings: updated,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to update session settings';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
