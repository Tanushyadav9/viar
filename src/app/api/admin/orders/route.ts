import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser, isAuthorizedForSection } from '@/lib/auth/serverAuth';
import { prisma } from '@/lib/prisma';
import type { OrderStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!isAuthorizedForSection(auth, 'payments', 'VIEW')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Access to order verification queue is restricted.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status') || 'ALL';
    const searchQuery = (searchParams.get('q') || '').trim();

    const whereClause: Record<string, unknown> = {};

    if (statusParam && statusParam !== 'ALL') {
      whereClause.status = statusParam as OrderStatus;
    }

    if (searchQuery) {
      whereClause.OR = [
        { orderReference: { contains: searchQuery, mode: 'insensitive' } },
        { utr: { contains: searchQuery, mode: 'insensitive' } },
        { studentName: { contains: searchQuery, mode: 'insensitive' } },
        { studentEmail: { contains: searchQuery, mode: 'insensitive' } },
        { studentPhone: { contains: searchQuery, mode: 'insensitive' } },
        { user: { name: { contains: searchQuery, mode: 'insensitive' } } },
        { user: { email: { contains: searchQuery, mode: 'insensitive' } } },
        { user: { phone: { contains: searchQuery, mode: 'insensitive' } } },
      ];
    }

    const [orders, counts, approvedRevenueAgg] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        include: {
          course: { select: { id: true, title: true, slug: true } },
          cohort: { select: { id: true, batchName: true } },
          user: { select: { id: true, name: true, email: true, phone: true } },
          enrollment: { select: { id: true, status: true, enrolledAt: true } },
        },
        orderBy: [
          // Prioritize claimed payments awaiting verification
          { status: 'asc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.order.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.order.aggregate({
        where: { status: 'APPROVED' },
        _sum: { amount: true },
      }),
    ]);

    const countsByStatus: Record<string, number> = {
      ALL: 0,
      PENDING_PAYMENT: 0,
      PAYMENT_CLAIMED: 0,
      APPROVED: 0,
      REJECTED: 0,
      EXPIRED: 0,
      REFUNDED: 0,
    };

    let total = 0;
    for (const c of counts) {
      countsByStatus[c.status] = c._count.id;
      total += c._count.id;
    }
    countsByStatus.ALL = total;

    // Check which users in the orders list are already actively enrolled
    const userIds = Array.from(new Set(orders.map((o) => o.userId).filter(Boolean)));
    const activeEnrollments = await prisma.enrollment.findMany({
      where: {
        userId: { in: userIds },
        status: 'ACTIVE',
      },
      select: { id: true, userId: true, courseId: true },
    });

    const activeKeySet = new Set(activeEnrollments.map((e) => e.userId + ":" + e.courseId));

    const enrichedOrders = orders.map((order) => ({
      ...order,
      isAlreadyEnrolled: activeKeySet.has(order.userId + ":" + order.courseId) && order.status !== "APPROVED",
    }));

    return NextResponse.json({
      success: true,
      orders: enrichedOrders,
      countsByStatus,
      totalApprovedRevenueInr: approvedRevenueAgg._sum.amount || 0,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to fetch orders queue.' },
      { status: 500 }
    );
  }
}
