import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerAuthUser, isAuthorizedForSection } from '@/lib/auth/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!isAuthorizedForSection(auth, 'students', 'VIEW')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Staff access required to export student roster.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const cohortId = searchParams.get('cohortId');

    const whereClause: Record<string, unknown> = {};
    if (cohortId && cohortId !== 'all') whereClause.cohortId = cohortId;
    if (courseId && courseId !== 'all') {
      whereClause.OR = [
        { courseId },
        { cohort: { courseId } },
      ];
    }

    const enrollments = await prisma.enrollment.findMany({
      where: whereClause,
      include: {
        user: {
          include: {
            certificates: true,
            quizAttempts: { orderBy: { attemptedAt: 'desc' } },
            lessonProgress: { where: { completed: true } },
          },
        },
        course: {
          include: {
            modules: { include: { lessons: true } },
          },
        },
        cohort: {
          include: {
            course: {
              include: {
                modules: { include: { lessons: true } },
              },
            },
          },
        },
        payment: true,
      },
      orderBy: { enrolledAt: 'desc' },
    });

    const csvRows: string[] = [];
    // Header
    csvRows.push([
      'Student Name',
      'Email',
      'Phone',
      'Course',
      'Batch',
      'Enrolled Date',
      'Amount Paid',
      'Currency',
      'Payment Status',
      'Payment Reference',
      'Progress %',
      'Quiz Result',
      'Certificate Code',
    ].map((h) => `"${h}"`).join(','));

    for (const enr of enrollments) {
      const associatedCourse = enr.course || enr.cohort?.course;
      const totalLessons = associatedCourse?.modules?.reduce((acc: number, m: { lessons: unknown[] }) => acc + m.lessons.length, 0) || associatedCourse?.totalClasses || 23;
      const progressPct = Math.min(100, Math.round((enr.user.lessonProgress.length / Math.max(1, totalLessons)) * 100));
      const cert = enr.user.certificates.find((c) => c.cohortId === enr.cohortId || c.courseId === associatedCourse?.id);
      const attempt = enr.user.quizAttempts[0];

      const quizText = attempt ? (attempt.passed ? `Passed (${attempt.scorePercentage}%)` : `Failed (${attempt.scorePercentage}%)`) : 'Not Attempted';
      const certText = cert ? cert.certificateNumber : 'None';

      const row = [
        enr.user.name,
        enr.user.email || '',
        enr.user.phone || '',
        associatedCourse?.title || '',
        enr.cohort?.batchName || 'Self-Paced Access',
        enr.enrolledAt.toISOString().split('T')[0],
        enr.amountPaid.toString(),
        enr.currency,
        enr.status,
        enr.paymentReference || enr.payment?.providerReference || 'Direct',
        `${progressPct}%`,
        quizText,
        certText,
      ];

      csvRows.push(row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','));
    }

    const csvContent = '\uFEFF' + csvRows.join('\r\n'); // Add UTF-8 BOM for Excel compatibility

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="viar-student-roster-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('CSV export error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
