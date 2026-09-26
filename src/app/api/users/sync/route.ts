import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assignRoleForUser } from '@/lib/auth/permissions';
import { logger } from '@/lib/logger';

/**
 * User JIT Session Sync API: /api/users/sync
 * 
 * Invoked by client upon sign-up or login with verified user info,
 * ensuring a real corresponding row exists in the PostgreSQL/Neon `User` table.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, clerkId, email, name, avatarUrl, phone } = body;

    if (!email && !clerkId && !id) {
      return NextResponse.json(
        { success: false, error: 'User identifier required' },
        { status: 400 }
      );
    }

    const cleanEmail = email ? email.trim().toLowerCase() : null;
    const finalClerkId = clerkId || id;
    const { role, isOwner } = assignRoleForUser(cleanEmail || '');

    const user = await prisma.user.upsert({
      where: cleanEmail ? { email: cleanEmail } : { clerkId: finalClerkId },
      update: {
        ...(finalClerkId ? { clerkId: finalClerkId } : {}),
        ...(name ? { name: name.trim() } : {}),
        ...(avatarUrl ? { avatarUrl } : {}),
        ...(phone ? { phone } : {}),
        role,
        isOwner,
      },
      create: {
        clerkId: finalClerkId,
        email: cleanEmail,
        name: name ? name.trim() : (cleanEmail ? cleanEmail.split('@')[0] : 'Student'),
        avatarUrl: avatarUrl || null,
        phone: phone || null,
        role,
        isOwner,
        country: 'IN',
        timezone: 'Asia/Kolkata',
      },
    });

    logger.info('Synced user session to database', {
      service: 'auth',
      userId: user.id,
      clerkId: user.clerkId,
      email: user.email,
      role: user.role,
      isOwner: user.isOwner,
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
