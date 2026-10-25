import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser, canAccessArea } from '@/lib/auth/serverAuth';
import { approveOrder, rejectOrder, refundOrder } from '@/lib/payments/orders';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const auth = await getServerAuthUser();

    // Unified Policy: Payment and order approvals are strictly Owner-only (Staff: No, Student: No)
    if (!canAccessArea(auth, 'payment_approvals')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only the Site Owner is authorized to manage and approve orders.' },
        { status: 403 }
      );
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Order ID is required.' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, bankConfirmed, rejectionReason, refundReason } = body;
    const userEmail = auth.email || 'aapkaastro1606@gmail.com';

    if (action === 'APPROVE' || action === 'RECORD_DUPLICATE_PAYMENT' || action === 'CANCEL_DUPLICATE') {
      const duplicateResolution = action === 'RECORD_DUPLICATE_PAYMENT'
        ? 'RECORD_REFUND_DUE'
        : action === 'CANCEL_DUPLICATE'
        ? 'CANCEL_ORDER'
        : body.duplicateResolution;

      try {
        const result = await approveOrder({
          orderId: id,
          reviewedByEmail: userEmail,
          bankConfirmed: Boolean(bankConfirmed || duplicateResolution),
          duplicateResolution,
        });

        return NextResponse.json({
          success: true,
          action: duplicateResolution ? (duplicateResolution === 'RECORD_REFUND_DUE' ? 'REFUNDED' : 'CANCELLED') : 'APPROVED',
          ...result,
        });
      } catch (err: unknown) {
        if ((err as { code?: string })?.code === 'DUPLICATE_PAYMENT_BLOCKED') {
          return NextResponse.json(
            {
              success: false,
              code: 'DUPLICATE_PAYMENT_BLOCKED',
              isAlreadyEnrolled: true,
              error: (err as Error).message,
            },
            { status: 409 }
          );
        }
        throw err;
      }
    }

    if (action === 'REJECT') {
      if (!rejectionReason || !rejectionReason.trim()) {
        return NextResponse.json(
          { success: false, error: 'A rejection reason is required.' },
          { status: 400 }
        );
      }

      const order = await rejectOrder({
        orderId: id,
        reviewedByEmail: userEmail,
        rejectionReason: rejectionReason.trim(),
      });

      return NextResponse.json({
        success: true,
        action: 'REJECTED',
        order,
        message: 'Order has been rejected and marked in the audit log.',
      });
    }

    if (action === 'REFUND') {
      if (!refundReason || !refundReason.trim()) {
        return NextResponse.json(
          { success: false, error: 'A reason for the refund is required.' },
          { status: 400 }
        );
      }

      const order = await refundOrder({
        orderId: id,
        reviewedByEmail: userEmail,
        refundReason: refundReason.trim(),
      });

      return NextResponse.json({
        success: true,
        action: 'REFUNDED',
        order,
        message: 'Order marked REFUNDED and student enrollment access revoked in PostgreSQL.',
      });
    }

    return NextResponse.json(
      { success: false, error: `Invalid action "${action}". Must be APPROVE, REJECT, or REFUND.` },
      { status: 400 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Order action failed.';
    const status = message.toLowerCase().includes('not found') ? 404 : 400;
    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}
