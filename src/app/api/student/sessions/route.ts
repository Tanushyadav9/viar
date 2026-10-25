import { NextResponse } from 'next/server';
import { getServerAuthUser } from '@/lib/auth/serverAuth';
import { listOneOnOneSessions } from '@/lib/sessions/oneOnOneService';

export async function GET() {
  try {
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized: login required' }, { status: 401 });
    }

    const sessions = await listOneOnOneSessions({ studentId: auth.userId });

    return NextResponse.json({
      success: true,
      sessions,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch student sessions';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
