import { NextRequest, NextResponse } from 'next/server';
import { getPaymentSettings } from '@/lib/payments/settings';

export async function GET(req: NextRequest) {
  void req;
  try {
    const settings = await getPaymentSettings();
    return NextResponse.json({
      success: true,
      config: {
        upiId: settings.upiId,
        payeeName: settings.payeeName,
        whatsappNumber: settings.whatsappNumber,
        qrImageUrl: settings.qrImageUrl,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to fetch public payment configuration' },
      { status: 500 }
    );
  }
}
