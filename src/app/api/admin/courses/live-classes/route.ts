import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser, isAuthorizedForSection } from '@/lib/auth/serverAuth';
import {
  listLiveClasses,
  createLiveClass,
  getLiveClassRevealMinutes,
  setLiveClassRevealMinutes,
  LiveClassInput,
} from '@/lib/courses/liveClassesService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!isAuthorizedForSection(auth, 'courses', 'VIEW')) {
      return NextResponse.json({ error: 'Unauthorized: insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId') || undefined;

    const data = await listLiveClasses({
      courseId,
      includePrivateNotes: true,
    });
    const revealMinutes = await getLiveClassRevealMinutes();

    return NextResponse.json({
      success: true,
      revealMinutesBefore: revealMinutes,
      ...data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch live classes';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!isAuthorizedForSection(auth, 'courses', 'MANAGE')) {
      return NextResponse.json({ error: 'Unauthorized: staff management permission required' }, { status: 403 });
    }

    const body = await req.json();

    if (body.action === 'set_reveal_minutes') {
      const minutes = await setLiveClassRevealMinutes({
        minutes: Number(body.minutes),
        userId: auth.userId,
        userEmail: auth.email,
      });
      return NextResponse.json({ success: true, revealMinutesBefore: minutes });
    }

    const input: LiveClassInput = {
      moduleId: body.moduleId,
      title: body.title,
      titleHi: body.titleHi || null,
      agenda: body.agenda || null,
      date: body.date,
      startTime: body.startTime,
      durationMinutes: Number(body.durationMinutes) || 60,
      provider: body.provider === 'ZOOM' ? 'ZOOM' : 'GOOGLE_MEET',
      meetingLink: body.meetingLink || null,
      zoomPasscode: body.zoomPasscode || null,
      privateHostNotes: body.privateHostNotes || null,
      notesPdf: body.notesPdf || body.documentUrl || null,
      documentUrl: body.documentUrl || body.notesPdf || null,
      status: body.status === 'DRAFT' ? 'DRAFT' : 'SCHEDULED',
      recordingUrl: body.recordingUrl || null,
      recordingStreamId: body.recordingStreamId || null,
    };

    const lesson = await createLiveClass({
      userId: auth.userId,
      userEmail: auth.email,
      data: input,
    });

    return NextResponse.json({
      success: true,
      lesson,
    });
  } catch (err: unknown) {
    const errorObj = err as { status?: number; clash?: unknown; message?: string };
    const statusCode = errorObj?.status === 409 ? 409 : 400;
    const message = err instanceof Error ? err.message : 'Failed to schedule live class';

    return NextResponse.json(
      {
        success: false,
        error: message,
        clash: errorObj?.clash || null,
      },
      { status: statusCode }
    );
  }
}
