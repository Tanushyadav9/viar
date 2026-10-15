import { NextRequest, NextResponse } from 'next/server';
import { claimOrderPayment } from '@/lib/payments/orders';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Order ID is required.' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { utr, notes } = body;

    const result = await claimOrderPayment({
      orderIdOrReference: id,
      utr: typeof utr === 'string' ? utr.trim() : undefined,
      notes: typeof notes === 'string' ? notes.trim() : undefined,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to submit payment claim.';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
