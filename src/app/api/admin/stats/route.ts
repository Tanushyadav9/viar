import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser } from '@/lib/auth/serverAuth';
import { getUnifiedAdminStats } from '@/lib/analytics/stats';

export async function GET(req: NextRequest) {
  void req;
  try {
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated || (!auth.isOwner && !auth.isStaff)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required.' },
        { status: 403 }
      );
    }

    const stats = await getUnifiedAdminStats();
    return NextResponse.json({ success: true, stats });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to fetch admin metrics.',
      },
      { status: 500 }
    );
  }
}
