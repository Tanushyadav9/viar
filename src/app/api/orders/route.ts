import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser } from '@/lib/auth/serverAuth';
import { prisma } from '@/lib/prisma';
import { createOrGetActiveOrder } from '@/lib/payments/orders';

export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated || !auth.userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required. Please sign in or create an account to proceed to checkout.',
        },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { courseId, cohortId, studentName, studentEmail, studentPhone, notes } = body;

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

    // Always link order directly to the verified database user ID
    const result = await createOrGetActiveOrder({
      userId: auth.userId,
      courseId: courseId.trim(),
      cohortId: cohortId?.trim() || undefined,
      studentName: (studentName || auth.dbUser?.name || '').trim(),
      studentEmail: (studentEmail || auth.email || '').trim(),
      studentPhone: studentPhone.trim(),
      notes: notes?.trim(),
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: unknown) {
    const errorObj = err as {
      code?: string;
      status?: number;
      message?: string;
      order?: unknown;
      upiUri?: string;
      qrCodeUrl?: string;
      staticQrUrl?: string | null;
      settings?: unknown;
      redirectUrl?: string;
    };

    if (errorObj?.code === 'ALREADY_ENROLLED') {
      return NextResponse.json(
        {
          success: false,
          code: 'ALREADY_ENROLLED',
          error: errorObj.message || 'You already have an active enrollment in this course.',
          redirectUrl: errorObj.redirectUrl || '/dashboard/courses',
        },
        { status: 409 }
      );
    }

    if (errorObj?.code === 'ORDER_EXISTS') {
      return NextResponse.json(
        {
          success: false,
          code: 'ORDER_EXISTS',
          message: errorObj.message || 'An open order already exists for this course.',
          order: errorObj.order,
          upiUri: errorObj.upiUri,
          qrCodeUrl: errorObj.qrCodeUrl,
          staticQrUrl: errorObj.staticQrUrl,
          settings: errorObj.settings,
        },
        { status: 409 }
      );
    }

    const message = err instanceof Error ? err.message : 'Failed to create or retrieve order.';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    const { searchParams } = new URL(req.url);
    const orderRef = searchParams.get('ref');

    // Public lookup by order reference for checkout verification
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

    // Otherwise list user's orders (must be authenticated)
    if (!auth.isAuthenticated || !auth.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { userId: auth.userId },
          ...(auth.clerkId ? [{ user: { clerkId: auth.clerkId } }] : []),
          ...(auth.email ? [{ user: { email: auth.email } }] : []),
        ],
      },
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
