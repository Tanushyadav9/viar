import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser } from '@/lib/auth/serverAuth';
import { approveOrder, rejectOrder, refundOrder } from '@/lib/payments/orders';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const auth = await getServerAuthUser();

    // Only Owner is authorized to verify, approve, reject, or refund tuition orders
    if (!auth.isAuthenticated || !auth.isOwner) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only the Site Owner is authorized to manage orders.' },
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

    if (action === 'APPROVE') {
      const result = await approveOrder({
        orderId: id,
        reviewedByEmail: userEmail,
        bankConfirmed: Boolean(bankConfirmed),
      });

      return NextResponse.json({
        success: true,
        action: 'APPROVED',
        ...result,
      });
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
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
