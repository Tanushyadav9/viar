import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { prisma } from '@/lib/prisma';
import { env } from '@/config/env';
import { logger } from '@/lib/logger';
import { assignRoleForUser } from '@/lib/auth/permissions';

/**
 * Clerk Webhook Handler: /api/webhooks/clerk
 * 
 * Synchronizes Clerk users into the local PostgreSQL/Neon `User` table via Prisma.
 * Supported events:
 * - user.created: Creates a local User row with clerkId, email, name, avatar, role, isOwner.
 * - user.updated: Updates email, name, avatarUrl.
 * - user.deleted: Safely removes or disassociates the local user.
 * 
 * Cryptographic verification:
 * Uses `svix` with `CLERK_WEBHOOK_SECRET` (whsec_...) from env.
 */
export async function POST(req: NextRequest) {
  const webhookSecret = env.auth.clerkWebhookSecret || process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.error(
      'Clerk webhook received but CLERK_WEBHOOK_SECRET is not configured',
      new Error('Missing CLERK_WEBHOOK_SECRET'),
      { service: 'auth', endpoint: '/api/webhooks/clerk' }
    );
    return NextResponse.json(
      { error: 'Webhook secret not configured on server' },
      { status: 500 }
    );
  }

  // Retrieve Svix verification headers
  const svixId = req.headers.get('svix-id');
  const svixTimestamp = req.headers.get('svix-timestamp');
  const svixSignature = req.headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    logger.securityAlert('Clerk webhook missing required Svix signature headers', {
      event: 'invalid_signature_headers',
      endpoint: '/api/webhooks/clerk',
    });
    return NextResponse.json(
      { error: 'Missing required svix verification headers' },
      { status: 400 }
    );
  }

  const rawPayload = await req.text();

  let evt: any;
  try {
    const wh = new Webhook(webhookSecret);
    wh.verify(rawPayload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });
    evt = JSON.parse(rawPayload);
  } catch (err: any) {
    logger.securityAlert('Invalid Clerk webhook signature', {
      event: 'invalid_clerk_signature',
      endpoint: '/api/webhooks/clerk',
      error: err?.message,
    });
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  const eventType = evt.type;
  const data = evt.data;

  try {
    if (eventType === 'user.created') {
      const clerkId = data.id;
      const primaryEmailObj = data.email_addresses?.find(
        (e: any) => e.id === data.primary_email_address_id
      ) || data.email_addresses?.[0];
      const email = primaryEmailObj?.email_address?.trim().toLowerCase() || null;

      const firstName = data.first_name || '';
      const lastName = data.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim() || (email ? email.split('@')[0] : 'Student');
      const avatarUrl = data.image_url || data.profile_image_url || null;

      const phoneObj = data.phone_numbers?.find(
        (p: any) => p.id === data.primary_phone_number_id
      ) || data.phone_numbers?.[0];
      const phone = phoneObj?.phone_number || null;

      // Assign role with strict anti-tamper guarantee: Site Owner recognized only if email matches OWNER_EMAIL
      const { role, isOwner } = assignRoleForUser(email || '');

      // Upsert into local Prisma User table
      const user = await prisma.user.upsert({
        where: { clerkId },
        update: {
          email,
          phone,
          name: fullName,
          avatarUrl,
          role,
          isOwner,
        },
        create: {
          clerkId,
          email,
          phone,
          name: fullName,
          avatarUrl,
          role,
          isOwner,
          country: 'IN',
          timezone: 'Asia/Kolkata',
        },
      });

      logger.info('Synced new Clerk user into local database', {
        service: 'auth',
        clerkId,
        userId: user.id,
        email,
        role: user.role,
        isOwner: user.isOwner,
      });

      return NextResponse.json({ success: true, event: 'user.created', userId: user.id });
    }

    if (eventType === 'user.updated') {
      const clerkId = data.id;
      const primaryEmailObj = data.email_addresses?.find(
        (e: any) => e.id === data.primary_email_address_id
      ) || data.email_addresses?.[0];
      const email = primaryEmailObj?.email_address?.trim().toLowerCase() || null;

      const firstName = data.first_name || '';
      const lastName = data.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim() || undefined;
      const avatarUrl = data.image_url || data.profile_image_url || undefined;

      const { role, isOwner } = assignRoleForUser(email || '');

      const user = await prisma.user.upsert({
        where: { clerkId },
        update: {
          email,
          ...(fullName ? { name: fullName } : {}),
          ...(avatarUrl ? { avatarUrl } : {}),
          role,
          isOwner,
        },
        create: {
          clerkId,
          email,
          name: fullName || (email ? email.split('@')[0] : 'Student'),
          avatarUrl,
          role,
          isOwner,
        },
      });

      logger.info('Updated Clerk user in local database', {
        service: 'auth',
        clerkId,
        userId: user.id,
        email,
      });

      return NextResponse.json({ success: true, event: 'user.updated', userId: user.id });
    }

    if (eventType === 'user.deleted') {
      const clerkId = data.id;
      if (clerkId) {
        await prisma.user.deleteMany({
          where: { clerkId },
        });

        logger.info('Deleted Clerk user from local database', {
          service: 'auth',
          clerkId,
        });
      }

      return NextResponse.json({ success: true, event: 'user.deleted' });
    }

    return NextResponse.json({ received: true, ignored: true, type: eventType });
  } catch (error: any) {
    logger.error('Failed to process Clerk webhook event in local database', error, {
      service: 'auth',
      eventType,
      clerkId: data?.id,
    });
    return NextResponse.json(
      { error: 'Database synchronization failed', details: error?.message },
      { status: 500 }
    );
  }
}
