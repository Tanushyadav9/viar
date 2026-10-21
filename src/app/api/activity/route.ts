import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerAuthUser, isAuthorizedForSection } from '@/lib/auth/serverAuth';

export async function GET(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!isAuthorizedForSection(auth, 'courses', 'VIEW') && !isAuthorizedForSection(auth, 'analytics', 'VIEW')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Staff access required to view activity logs.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const entityType = searchParams.get('entityType');
    const limit = Math.min(100, Number(searchParams.get('limit')) || 50);

    const whereClause: Record<string, unknown> = {};
    if (courseId) whereClause.courseId = courseId;
    if (entityType) whereClause.entityType = entityType;

    const logs = await prisma.activityLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { course: { select: { title: true, slug: true } } },
    });

    return NextResponse.json({ success: true, logs });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
