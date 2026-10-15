import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Public Health Endpoint: /api/health
 * 
 * Minimal public probe for site monitors and status checks.
 * Pings the database to verify live connectivity.
 * CRITICAL: Returns NO internal, user, or configuration data.
 */
export async function GET() {
  try {
    // Lightweight database ping only
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch {
    // Return error status with zero leaked details
    return NextResponse.json({ status: 'error' }, { status: 503 });
  }
}
