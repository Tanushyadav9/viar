import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      name,
      message,
      stack,
      digest,
      segment,
      url,
      userAgent,
      timestamp,
    } = body;

    // 1. Mandatory server stdout/stderr diagnostic log
    console.error(
      `[CLIENT-ERROR-LOGGER] [Segment: ${segment || 'unknown'}] ${name || 'Error'}: ${message || 'Unknown'}\n` +
      `URL: ${url || 'N/A'}\n` +
      `Digest: ${digest || 'N/A'}\n` +
      `Timestamp: ${timestamp || new Date().toISOString()}\n` +
      `UserAgent: ${userAgent || 'N/A'}\n` +
      `Stack:\n${stack || 'No stack trace provided'}`
    );

    // 2. Persist diagnostic trace to ActivityLog if database is available and not running in test suite
    if (process.env.NODE_ENV !== 'test') {
      try {
        await prisma.activityLog.create({
          data: {
            action: 'CLIENT_CRASH_REPORTED',
            entityType: 'CLIENT_ERROR',
            entityId: String(digest || `err-${Date.now()}`),
            reason: String(message || 'Unknown error').slice(0, 500),
            details: {
              name,
              segment,
              url,
              digest,
              userAgent,
              timestamp,
              stack: stack ? String(stack).slice(0, 2000) : null,
            },
          },
        });
      } catch {
        // If DB write is temporarily degraded, server log above has already captured the report
      }
    }

    return NextResponse.json({ success: true, logged: true });
  } catch (err) {
    console.error('[CLIENT-ERROR-LOGGER] Failed to process error report:', err);
    return NextResponse.json({ success: false, error: 'Failed to record error' }, { status: 500 });
  }
}
