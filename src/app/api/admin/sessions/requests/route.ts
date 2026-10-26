import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser, canAccessSection } from '@/lib/auth/serverAuth';
import { listSessionRequests } from '@/lib/sessions/oneOnOneService';

export const dynamic = 'force-dynamic';

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

    const requests = await listSessionRequests({ studentId, status });

    return NextResponse.json({
      success: true,
      requests,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error fetching session requests';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
