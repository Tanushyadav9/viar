import { prisma } from '@/lib/prisma';

export interface UnifiedAdminStats {
  totalRevenueInr: number;
  approvedOrdersCount: number;
  totalStudents: number;
  totalActiveEnrollments: number;
  completionRate: number;
  certificatesIssued: number;
  totalExamAttempts: number;
  passedExamAttempts: number;
  examPassRate: number | null; // null if 0 attempts
  pendingPaymentsCount: number; // orders in PAYMENT_CLAIMED status
  activeCoursesCount: number;
}

/**
 * Single source of truth for administrative metrics across all screens.
 * 
 * Rules enforced:
 * 1. Revenue equals the exact sum of approved ₹ orders (status = 'APPROVED').
 * 2. Students count equals distinct users with active enrollments (status = 'ACTIVE').
 * 3. Exam pass rate computed from real quiz attempts (QuizAttempt.passed).
 * 4. Completion rate computed from verified certificates issued divided by active students.
 * 5. No USD revenue or invented percentages.
 */
export async function getUnifiedAdminStats(): Promise<UnifiedAdminStats> {
  try {
    const ownerEmail = (process.env.OWNER_EMAIL || 'aapkaastro1606@gmail.com').trim().toLowerCase();

    // 1. Revenue strictly from real APPROVED customer orders (excluding owner & test purchases)
    const revenueAggregate = await prisma.order.aggregate({
      where: {
        status: 'APPROVED',
        AND: [
          { notes: { not: { contains: '[TEST_PURCHASE]' } } },
          { studentEmail: { not: ownerEmail } },
        ],
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    const totalRevenueInr = revenueAggregate._sum.amount || 0;
    const approvedOrdersCount = revenueAggregate._count.id;

    // 2. Students strictly from real non-test ACTIVE enrollments
    const distinctActiveStudents = await prisma.enrollment.findMany({
      where: {
        status: 'ACTIVE',
        user: {
          isOwner: false,
          email: { not: ownerEmail },
        },
        OR: [
          { order: null },
          { order: { notes: { not: { contains: '[TEST_PURCHASE]' } } } },
        ],
      },
      select: { userId: true },
      distinct: ['userId'],
    });
    const totalStudents = distinctActiveStudents.length;
    const totalActiveEnrollments = await prisma.enrollment.count({
      where: { status: 'ACTIVE' },
    });

    // 3. Certificates & Completion
    const certificatesIssued = await prisma.certificate.count();
    const completionRate = totalStudents > 0 ? Math.round((certificatesIssued / totalStudents) * 100) : 0;

    // 4. Real exam attempts
    const totalExamAttempts = await prisma.quizAttempt.count();
    const passedExamAttempts = await prisma.quizAttempt.count({
      where: { passed: true },
    });
    const examPassRate = totalExamAttempts > 0 ? Math.round((passedExamAttempts / totalExamAttempts) * 100) : null;

    // 5. Pending payments waiting for verification (PAYMENT_CLAIMED)
    const pendingPaymentsCount = await prisma.order.count({
      where: { status: 'PAYMENT_CLAIMED' },
    });

    // 6. Active courses
    const activeCoursesCount = await prisma.course.count({
      where: { status: 'PUBLISHED' },
    });

    return {
      totalRevenueInr,
      approvedOrdersCount,
      totalStudents,
      totalActiveEnrollments,
      completionRate,
      certificatesIssued,
      totalExamAttempts,
      passedExamAttempts,
      examPassRate,
      pendingPaymentsCount,
      activeCoursesCount,
    };
  } catch (err) {
    console.warn('Database query for admin stats skipped:', (err as Error).message);
    return {
      totalRevenueInr: 0,
      approvedOrdersCount: 0,
      totalStudents: 0,
      totalActiveEnrollments: 0,
      completionRate: 0,
      certificatesIssued: 0,
      totalExamAttempts: 0,
      passedExamAttempts: 0,
      examPassRate: null,
      pendingPaymentsCount: 0,
      activeCoursesCount: 0,
    };
  }
}
