import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser } from '@/lib/auth/serverAuth';
import { retryFailedEmail } from '@/lib/sessions/outboxService';

export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized: login required' }, { status: 401 });
    }

    if (!auth.isOwner) {
      return NextResponse.json({ error: 'Forbidden: only the Owner can retry failed email dispatches' }, { status: 403 });
    }

    const body = await req.json();
    const emailId = body.emailId;

    if (!emailId) {
      return NextResponse.json({ error: 'emailId is required' }, { status: 400 });
    }

    const result = await retryFailedEmail(emailId);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Retry failed',
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Email retry dispatched successfully',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to retry email';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
