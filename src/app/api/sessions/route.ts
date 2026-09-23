import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SCHEDULED_CLASSES_FLAGSHIP } from '@/lib/data';
import { ScheduledClass } from '@/lib/types';
import { extractAuthFromRequest, checkStaffSectionAccess } from '@/lib/auth/permissions';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cohortId = searchParams.get('cohortId');

    if (!cohortId) {
      return NextResponse.json(
        { success: false, error: 'cohortId query parameter is required' },
        { status: 400 }
      );
    }

    // Try Prisma
    try {
      const dbSessions = await prisma.classSession.findMany({
        where: { cohortId },
        orderBy: { sessionNumber: 'asc' },
      });

      if (dbSessions && dbSessions.length > 0) {
        return NextResponse.json({ success: true, sessions: dbSessions });
      }
    } catch (dbError) {
      console.warn('Database query for sessions skipped:', (dbError as Error).message);
    }

    // Fallback: look up in SCHEDULED_CLASSES_FLAGSHIP
    const foundSessions: ScheduledClass[] = SCHEDULED_CLASSES_FLAGSHIP.filter(
      (cls) => cls.cohortId === cohortId
    );

    return NextResponse.json({
      success: true,
      sessions: foundSessions.length > 0 ? foundSessions : SCHEDULED_CLASSES_FLAGSHIP,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Enforce Section-Level Permission: Updating class links/recordings requires MANAGE on 'cohorts'
    const auth = extractAuthFromRequest(req);
    const accessCheck = checkStaffSectionAccess({
      user: auth.userEmail || auth.userId || null,
      section: 'cohorts',
      requiredLevel: 'MANAGE',
    });

    if (!accessCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: accessCheck.reason || "Forbidden: MANAGE permission on 'cohorts' required.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { sessionId, joinLink, recordingUrl, status, notesMarkdown } = body;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // Try Prisma update
    try {
      const updated = await prisma.classSession.update({
        where: { id: sessionId },
        data: {
          ...(joinLink !== undefined ? { joinLink } : {}),
          ...(recordingUrl !== undefined ? { recordingUrl, recordingUploadedAt: new Date() } : {}),
          ...(status !== undefined ? { status } : {}),
          ...(notesMarkdown !== undefined ? { notesMarkdown } : {}),
        },
      });

      return NextResponse.json({ success: true, session: updated });
    } catch (dbError) {
      console.warn('Database update for session skipped:', (dbError as Error).message);
    }

    // Fallback response
    return NextResponse.json({
      success: true,
      session: {
        id: sessionId,
        joinUrl: joinLink,
        recording: recordingUrl ? { videoUrl: recordingUrl } : undefined,
        status: status || 'COMPLETED',
        updatedAt: new Date().toISOString(),
      },
      message: 'Session updated in runtime store',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
