import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { prisma } from '@/lib/prisma';
import { env } from '@/config/env';
import { logger } from '@/lib/logger';
import { syncDatabaseUser } from '@/lib/auth/userSync';

interface ClerkEmailAddress {
  id: string;
  email_address: string;
}

interface ClerkPhoneNumber {
  id: string;
  phone_number: string;
}

interface ClerkUserData {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
  profile_image_url?: string | null;
  primary_email_address_id?: string | null;
  primary_phone_number_id?: string | null;
  email_addresses?: ClerkEmailAddress[];
  phone_numbers?: ClerkPhoneNumber[];
}

interface ClerkWebhookEvent {
  type: 'user.created' | 'user.updated' | 'user.deleted' | string;
  data: ClerkUserData;
}

/**
 * Clerk Webhook Handler: /api/webhooks/clerk
 * 
 * Synchronizes Clerk users into the local PostgreSQL/Neon `User` table via Prisma.
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
      event: 'invalid_signature',
      endpoint: '/api/webhooks/clerk',
    });
    return NextResponse.json(
      { error: 'Missing required svix verification headers' },
      { status: 400 }
    );
  }

  const rawPayload = await req.text();

  let evt: ClerkWebhookEvent;
  try {
    const wh = new Webhook(webhookSecret);
    wh.verify(rawPayload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });
    evt = JSON.parse(rawPayload) as ClerkWebhookEvent;
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : 'Invalid signature';
    logger.securityAlert('Invalid Clerk webhook signature', {
      event: 'invalid_signature',
      endpoint: '/api/webhooks/clerk',
      error: errMessage,
    });
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  const eventType = evt.type;
  const data = evt.data;

  // Track webhook receipt for Owner diagnostics
  const receivedAt = new Date().toISOString();
  (globalThis as unknown as { __lastClerkWebhookTimestamp?: string }).__lastClerkWebhookTimestamp = receivedAt;

  try {
    // Record webhook telemetry in clerk_webhook_events table for Owner diagnostics
    await prisma.clerkWebhookEvent.create({
      data: {
        eventId: svixId,
        eventType,
        payload: evt as unknown as object,
        status: 'PROCESSED',
      },
    }).catch(() => {});

    // Also record in ActivityLog table (non-blocking)
    await prisma.activityLog.create({
      data: {
        action: 'CLERK_WEBHOOK_RECEIVED',
        entityType: 'WEBHOOK',
        entityId: svixId,
        reason: eventType,
        details: {
          eventType,
          svixId,
          svixTimestamp,
          receivedAt,
        },
      },
    }).catch(() => {});
  } catch {
    // Silently continue if DB logging fails
  }

  try {
    if (eventType === 'user.created' || eventType === 'user.updated') {
      const clerkId = data.id;
      const primaryEmailObj = data.email_addresses?.find(
        (e) => e.id === data.primary_email_address_id
      ) || data.email_addresses?.[0];
      const email = primaryEmailObj?.email_address?.trim().toLowerCase() || null;
      const isEmailVerified = primaryEmailObj ? true : false; // Webhooks from Clerk represent verified email records

      const firstName = data.first_name || '';
      const lastName = data.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim() || (email ? email.split('@')[0] : 'Student');
      const avatarUrl = data.image_url || data.profile_image_url || null;

      const phoneObj = data.phone_numbers?.find(
        (p) => p.id === data.primary_phone_number_id
      ) || data.phone_numbers?.[0];
      const phone = phoneObj?.phone_number || null;

      // Idempotently upsert user, linking existing email rows instead of duplicating
      const syncResult = await syncDatabaseUser({
        clerkId,
        email,
        name: fullName,
        phone,
        avatarUrl,
        isEmailVerified,
      });

      logger.info(
        eventType === 'user.created'
          ? 'Synced new Clerk user into local database'
          : 'Updated Clerk user in local database',
        {
          service: 'auth',
          clerkId,
          userId: syncResult.user.id,
          email,
          role: syncResult.user.role,
          isOwner: syncResult.user.isOwner,
          created: syncResult.created,
          linkedExistingEmail: syncResult.linkedExistingEmail,
          demotedFromOwner: syncResult.demotedFromOwner,
        }
      );

      return NextResponse.json({
        success: true,
        event: eventType,
        userId: syncResult.user.id,
        linkedExistingEmail: syncResult.linkedExistingEmail,
      });
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
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Database sync failed';
    try {
      await prisma.clerkWebhookEvent.create({
        data: {
          eventId: svixId,
          eventType,
          payload: evt as unknown as object,
          status: 'ERROR',
          errorMessage: errMessage,
        },
      }).catch(() => {});
    } catch {}

    logger.error('Failed to process Clerk webhook event in local database', error instanceof Error ? error : new Error(String(error)), {
      service: 'auth',
      eventType,
      clerkId: data?.id,
    });
    return NextResponse.json(
      { error: 'Database synchronization failed', details: errMessage },
      { status: 500 }
    );
  }
}
