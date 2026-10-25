import { NextResponse } from 'next/server';
import { getServerAuthUser, isAuthorizedForSection } from '@/lib/auth/serverAuth';
import { listFailedEmails } from '@/lib/sessions/outboxService';

export async function GET() {
  try {
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized: login required' }, { status: 401 });
    }

    if (!auth.isOwner && !isAuthorizedForSection(auth, 'sessions', 'VIEW')) {
      return NextResponse.json({ error: 'Forbidden: Owner or staff access required' }, { status: 403 });
    }

    const failures = await listFailedEmails();

    return NextResponse.json({
      success: true,
      count: failures.length,
      failures,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to list outbox failures';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
