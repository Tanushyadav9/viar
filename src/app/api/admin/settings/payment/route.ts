import { NextRequest, NextResponse } from 'next/server';
import { extractAuthFromRequest, isSiteOwner } from '@/lib/auth/permissions';
import { getPaymentSettings, updatePaymentSettings } from '@/lib/payments/settings';

export async function GET(req: NextRequest) {
  try {
    const auth = extractAuthFromRequest(req);
    const userEmail = auth.userEmail || '';

    // Only Owner is allowed to inspect or manage critical payment routing settings
    if (!isSiteOwner(userEmail)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only the Site Owner can access payment settings.' },
        { status: 403 }
      );
    }

    const settings = await getPaymentSettings();
    return NextResponse.json({ success: true, settings });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to fetch payment settings.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = extractAuthFromRequest(req);
    const userEmail = auth.userEmail || '';

    if (!isSiteOwner(userEmail)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only the Site Owner can modify payment routing settings.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { upiId, payeeName, qrImageUrl, whatsappNumber, orderExpiryDays } = body;

    const updated = await updatePaymentSettings({
      upiId: String(upiId || ''),
      payeeName: String(payeeName || ''),
      qrImageUrl: qrImageUrl ? String(qrImageUrl) : null,
      whatsappNumber: String(whatsappNumber || ''),
      orderExpiryDays: Number(orderExpiryDays) || 3,
      updatedByEmail: userEmail,
    });

    return NextResponse.json({
      success: true,
      settings: updated,
      message: 'Payment settings updated successfully. An audit notice has been emailed to the Owner.',
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to update payment settings.' },
      { status: 400 }
    );
  }
}
