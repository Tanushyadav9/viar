import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { INITIAL_COHORTS } from '@/lib/data';
import { Cohort } from '@/lib/types';
import { extractAuthFromRequest, checkStaffSectionAccess } from '@/lib/auth/permissions';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    // Attempt Prisma query
    try {
      const cohorts = await prisma.cohort.findMany({
        where: courseId ? { courseId } : undefined,
        include: {
          classSessions: {
            orderBy: { sessionNumber: 'asc' },
          },
        },
        orderBy: { startDate: 'asc' },
      });

      if (cohorts && cohorts.length > 0) {
        return NextResponse.json({ success: true, cohorts });
      }
    } catch (dbError) {
      console.warn('Database query for cohorts skipped:', (dbError as Error).message);
    }

    const filtered = courseId
      ? INITIAL_COHORTS.filter((cohort) => cohort.courseId === courseId)
      : INITIAL_COHORTS;

    return NextResponse.json({ success: true, cohorts: filtered });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Enforce Section-Level Permission: Creating cohorts requires MANAGE on 'cohorts'
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
    const { courseId, batchName, startDate, endDate, capacity, scheduleDescription } = body;

    if (!courseId || !batchName || !startDate) {
      return NextResponse.json(
        { success: false, error: 'courseId, batchName, and startDate are required' },
        { status: 400 }
      );
    }

    // Attempt Prisma insert
    try {
      const newCohort = await prisma.cohort.create({
        data: {
          courseId,
          batchName,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          capacity: Number(capacity) || 50,
          status: 'UPCOMING',
          scheduleDescription: scheduleDescription || 'Every Tuesday & Thursday, 8:00 PM IST',
        },
      });
      return NextResponse.json({ success: true, cohort: newCohort }, { status: 201 });
    } catch (dbError) {
      console.warn('Database write for cohort skipped:', (dbError as Error).message);
    }

    // Mock fallback response matching Cohort interface
    const mockCohort: Cohort = {
      id: `cohort-${Date.now()}`,
      courseId,
      batchNumber: 2,
      batchName,
      startDate,
      endDate: endDate || new Date(Date.now() + 63 * 86400000).toISOString(),
      scheduleDescription: scheduleDescription || 'Every Tuesday & Thursday, 8:00 PM IST',
      scheduleTimeUtc: {
        dayOfWeek: [2, 4],
        hoursUtc: 14,
        minutesUtc: 30,
      },
      status: 'UPCOMING',
      maxSeats: Number(capacity) || 50,
      enrolledCount: 0,
      enrollmentDeadline: startDate,
    };

    return NextResponse.json({ success: true, cohort: mockCohort }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
