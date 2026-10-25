import { NextRequest, NextResponse } from 'next/server';
import { checkAndQueueReminders, processOutboxQueue } from '@/lib/sessions/outboxService';

// Fallback secret for cron authentication
const DEFAULT_CRON_SECRET = 'sec_cron_viar_reminders_88f2';

function isAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization') || '';
  const xCronSecret = req.headers.get('x-cron-secret') || '';
  const expectedSecret = process.env.CRON_SECRET || DEFAULT_CRON_SECRET;

  if (xCronSecret && xCronSecret === expectedSecret) return true;

  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token === expectedSecret) return true;
  }

  // Allow query parameter ?secret= in webhooks/crons if permitted
  const url = new URL(req.url);
  const querySecret = url.searchParams.get('secret');
  if (querySecret && querySecret === expectedSecret) return true;

  return false;
}

export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}

async function handleCron(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid cron authentication token' },
      { status: 401 }
    );
  }

  const start = Date.now();

  try {
    // 1. Scan for 24-hour and 1-hour pre-class reminders (strictly idempotent)
    const reminderScan = await checkAndQueueReminders();

    // 2. Process pending items in outbox queue with retry handling
    const outboxDispatch = await processOutboxQueue(50);

    const durationMs = Date.now() - start;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      durationMs,
      reminders: {
        queued24h: reminderScan.queued24h,
        queued1h: reminderScan.queued1h,
        errors: reminderScan.errors,
      },
      outbox: {
        processed: outboxDispatch.processed,
        sent: outboxDispatch.sent,
        failed: outboxDispatch.failed,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Cron job execution error';
    return NextResponse.json(
      {
        success: false,
        error: msg,
        durationMs: Date.now() - start,
      },
      { status: 500 }
    );
  }
}
