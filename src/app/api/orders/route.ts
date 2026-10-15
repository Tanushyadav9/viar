import { NextRequest, NextResponse } from 'next/server';
import { extractAuthFromRequest } from '@/lib/auth/permissions';
import { prisma } from '@/lib/prisma';
import { createOrGetActiveOrder } from '@/lib/payments/orders';

export async function POST(req: NextRequest) {
  try {
    const auth = extractAuthFromRequest(req);
    
    // Resolve user: must be logged in to create an order
    let resolvedUserId: string | undefined = auth.userId;
    let resolvedEmail: string | undefined = auth.userEmail;
    let resolvedName: string | undefined = undefined;

    if (!resolvedUserId && resolvedEmail) {
      const user = await prisma.user.findUnique({
        where: { email: resolvedEmail },
      });
      if (user) {
        resolvedUserId = user.id;
        resolvedName = user.name ?? undefined;
      }
    }

    const body = await req.json().catch(() => ({}));
    const { courseId, cohortId, studentName, studentEmail, studentPhone, notes } = body;

    // If client provided studentEmail and we have no userId, try resolving or creating user
    if (!resolvedUserId && studentEmail) {
      const user = await prisma.user.upsert({
        where: { email: studentEmail.trim().toLowerCase() },
        update: {
          phone: studentPhone ? studentPhone.trim() : undefined,
          name: studentName ? studentName.trim() : undefined,
        },
        create: {
          email: studentEmail.trim().toLowerCase(),
          name: studentName ? studentName.trim() : 'Student',
          phone: studentPhone ? studentPhone.trim() : null,
          role: 'STUDENT',
        },
      });
      resolvedUserId = user.id;
      resolvedEmail = user.email ?? undefined;
      resolvedName = user.name ?? undefined;
    }

    if (!resolvedUserId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required. Please sign in or create an account to proceed to checkout.',
        },
        { status: 401 }
      );
    }

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'courseId is required.' },
        { status: 400 }
      );
    }

    if (!studentPhone || !studentPhone.trim()) {
      return NextResponse.json(
        { success: false, error: 'A valid mobile phone number is required at checkout for enrollment verification.' },
        { status: 400 }
      );
    }

    const result = await createOrGetActiveOrder({
      userId: resolvedUserId,
      courseId: courseId.trim(),
      cohortId: cohortId?.trim() || undefined,
      studentName: (studentName || resolvedName || '').trim(),
      studentEmail: (studentEmail || resolvedEmail || '').trim(),
      studentPhone: studentPhone.trim(),
      notes: notes?.trim(),
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create or retrieve order.';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = extractAuthFromRequest(req);
    const { searchParams } = new URL(req.url);
    const orderRef = searchParams.get('ref');

    if (orderRef) {
      const order = await prisma.order.findUnique({
        where: { orderReference: orderRef.trim() },
        include: {
          course: { select: { id: true, title: true, slug: true } },
          cohort: { select: { id: true, batchName: true } },
        },
      });

      if (!order) {
        return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
      }

      return NextResponse.json({ success: true, order });
    }

    // Otherwise list user's orders
    if (!auth.userId && !auth.userEmail) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    let userId = auth.userId;
    if (!userId && auth.userEmail) {
      const user = await prisma.user.findUnique({ where: { email: auth.userEmail } });
      if (user) userId = user.id;
    }

    if (!userId) {
      return NextResponse.json({ success: true, orders: [] });
    }

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        cohort: { select: { id: true, batchName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, orders });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to fetch orders.' },
      { status: 500 }
    );
  }
}
