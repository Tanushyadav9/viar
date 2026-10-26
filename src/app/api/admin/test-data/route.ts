import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser, isAuthorizedForSection } from '@/lib/auth/serverAuth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  void req;
  try {
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated || (!auth.isOwner && !auth.isStaff)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const ownerEmail = (process.env.OWNER_EMAIL || 'aapkaastro1606@gmail.com').trim().toLowerCase();

    // 1. Find all test orders
    const testOrders = await prisma.order.findMany({
      where: {
        OR: [
          { notes: { contains: '[TEST' } },
          { studentEmail: ownerEmail },
          { user: { email: ownerEmail } },
          { user: { name: { contains: '[TEST' } } },
        ],
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Find all test users
    const testUsers = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: '[TEST' } },
          { email: ownerEmail },
          { orders: { some: { notes: { contains: '[TEST' } } } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isOwner: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Find test enrollments
    const testUserIds = testUsers.map((u) => u.id);
    const testEnrollments = await prisma.enrollment.findMany({
      where: {
        OR: [
          { userId: { in: testUserIds } },
          { order: { notes: { contains: '[TEST' } } },
          { paymentReference: { contains: 'TEST' } },
        ],
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({
      success: true,
      dryRun: {
        testOrdersCount: testOrders.length,
        testUsersCount: testUsers.length,
        testEnrollmentsCount: testEnrollments.length,
        testOrders,
        testUsers,
        testEnrollments,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated || (!auth.isOwner && !isAuthorizedForSection(auth, 'students', 'MANAGE'))) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Owner or Staff with students MANAGE permission required.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { studentId, isTest } = body;

    if (!studentId) {
      return NextResponse.json({ success: false, error: 'studentId is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: studentId } });
    if (!user) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    let updatedName = user.name;
    if (isTest) {
      if (!updatedName.startsWith('[TEST]')) {
        updatedName = `[TEST] ${updatedName}`.trim();
      }
    } else {
      updatedName = updatedName.replace(/^\[TEST\]\s*/i, '').trim();
    }

    const updatedUser = await prisma.user.update({
      where: { id: studentId },
      data: { name: updatedName },
    });

    // Also update order notes
    if (isTest) {
      await prisma.order.updateMany({
        where: { userId: studentId },
        data: { notes: '[TEST_PURCHASE] Marked as test student order - excluded from live metrics' },
      });
    } else {
      const orders = await prisma.order.findMany({ where: { userId: studentId } });
      for (const ord of orders) {
        if (ord.notes?.includes('[TEST')) {
          await prisma.order.update({
            where: { id: ord.id },
            data: { notes: ord.notes.replace(/\[TEST_PURCHASE\]\s*/g, '').replace(/\[TEST\]\s*/g, '').trim() || null },
          });
        }
      }
    }

    await prisma.activityLog.create({
      data: {
        userId: auth.userId || null,
        userEmail: auth.email || null,
        action: isTest ? 'STUDENT_MARKED_AS_TEST' : 'STUDENT_UNMARKED_AS_TEST',
        entityType: 'STUDENT',
        entityId: studentId,
        reason: isTest
          ? `Marked student "${updatedUser.name}" as test data (excluded from live metrics)`
          : `Removed test tag from student "${updatedUser.name}"`,
        details: { studentId, isTest, name: updatedUser.name },
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: isTest
        ? `Student marked as test. All metrics exclude this record.`
        : `Student unmarked as test.`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated || !auth.isOwner) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only the Site Owner can permanently remove test data.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { confirmation } = body;

    if (confirmation !== 'DELETE_TEST_DATA') {
      return NextResponse.json(
        {
          success: false,
          error: 'Please confirm deletion by supplying confirmation: "DELETE_TEST_DATA".',
        },
        { status: 400 }
      );
    }

    const ownerEmail = (process.env.OWNER_EMAIL || 'aapkaastro1606@gmail.com').trim().toLowerCase();

    // 1. Delete test orders (orders with [TEST or owner test orders)
    const deletedOrders = await prisma.order.deleteMany({
      where: {
        OR: [
          { notes: { contains: '[TEST' } },
          { studentEmail: ownerEmail },
          { user: { email: ownerEmail } },
        ],
      },
    });

    // 2. Delete test enrollments
    const deletedEnrollments = await prisma.enrollment.deleteMany({
      where: {
        OR: [
          { paymentReference: { contains: 'TEST' } },
          { user: { name: { contains: '[TEST' } } },
        ],
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: auth.userId || null,
        userEmail: auth.email || null,
        action: 'TEST_DATA_CLEARED',
        entityType: 'SYSTEM',
        entityId: 'test_data',
        reason: `Removed ${deletedOrders.count} test orders and ${deletedEnrollments.count} test enrollments`,
        details: { deletedOrders: deletedOrders.count, deletedEnrollments: deletedEnrollments.count },
      },
    });

    return NextResponse.json({
      success: true,
      deletedOrdersCount: deletedOrders.count,
      deletedEnrollmentsCount: deletedEnrollments.count,
      message: `Successfully cleared ${deletedOrders.count} test order(s) and ${deletedEnrollments.count} test enrollment(s).`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
