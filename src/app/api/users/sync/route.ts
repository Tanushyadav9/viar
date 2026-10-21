import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerAuthUser } from '@/lib/auth/serverAuth';
import { syncDatabaseUser } from '@/lib/auth/userSync';
import { logger } from '@/lib/logger';

/**
 * User JIT Session Sync API: /api/users/sync
 * 
 * Invoked upon sign-up or login with verified user info,
 * ensuring a real corresponding row exists in the PostgreSQL/Neon `User` table.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, clerkId, email, name, avatarUrl, phone } = body;

    const finalClerkId = clerkId || id;
    if (!finalClerkId) {
      return NextResponse.json(
        { success: false, error: 'Clerk user identifier required' },
        { status: 400 }
      );
    }

    const syncResult = await syncDatabaseUser({
      clerkId: finalClerkId,
      email,
      name,
      avatarUrl,
      phone,
    });

    const user = syncResult.user;

    logger.info('Synced user session to database', {
      service: 'auth',
      userId: user.id,
      clerkId: user.clerkId,
      email: user.email,
      role: user.role,
      isOwner: user.isOwner,
      linkedExistingEmail: syncResult.linkedExistingEmail,
      demotedFromOwner: syncResult.demotedFromOwner,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        name: user.name,
        role: user.role,
        isOwner: user.isOwner,
      },
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Database sync error';
    logger.error('Failed to sync user session to database', error instanceof Error ? error : new Error(String(error)), {
      service: 'auth',
      endpoint: '/api/users/sync',
    });
    return NextResponse.json(
      { success: false, error: errMessage },
      { status: 500 }
    );
  }
}

/**
 * Get current authenticated user session from database
 */
export async function GET() {
  try {
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated || !auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', user: null },
        { status: 401 }
      );
    }

    let user = auth.dbUser;
    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { id: auth.userId },
            ...(auth.clerkId ? [{ clerkId: auth.clerkId }] : []),
            ...(auth.email ? [{ email: auth.email }] : []),
          ],
        },
      });
    }

    if (!user && auth.clerkId) {
      try {
        const synced = await syncDatabaseUser({
          clerkId: auth.clerkId,
          email: auth.email,
        });
        user = synced.user;
      } catch {
        // Non-fatal sync fallback
      }
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User record not found in database', user: null },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: auth.role,
        isOwner: auth.isOwner,
        staffSections: auth.staffSections,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Database session lookup failed' },
      { status: 500 }
    );
  }
}
