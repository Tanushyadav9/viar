import { NextRequest, NextResponse } from 'next/server';
import { extractAuthFromRequest, checkStaffSectionAccess } from '@/lib/auth/permissions';

export async function POST(req: NextRequest) {
  try {
    const auth = extractAuthFromRequest(req);
    const accessCheck = checkStaffSectionAccess({
      user: auth.userEmail || auth.userId || null,
      section: 'courses',
      requiredLevel: 'MANAGE',
    });

    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: MANAGE access required for media uploads.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const maxDurationSeconds = body.maxDurationSeconds || 7200; // 2 hours default

    const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const cfApiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (cfAccountId && cfApiToken) {
      // Live Cloudflare Stream Direct Creator Upload
      const cfRes = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/stream/direct_upload`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cfApiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            maxDurationSeconds,
            requireSignedURLs: false,
          }),
        }
      );

      const cfData = await cfRes.json();
      if (!cfRes.ok || !cfData.success) {
        throw new Error(cfData.errors?.[0]?.message || 'Failed to request Cloudflare Stream upload URL');
      }

      return NextResponse.json({
        success: true,
        uploadUrl: cfData.result.uploadURL,
        uid: cfData.result.uid,
        provider: 'cloudflare_stream',
      });
    }

    // Direct Browser Upload Sink (Dev / Mock / Self-hosted Fallback)
    const mockUid = `stream_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const mockUploadUrl = `/api/uploads/direct-sink?type=video&uid=${mockUid}`;

    return NextResponse.json({
      success: true,
      uploadUrl: mockUploadUrl,
      uid: mockUid,
      provider: 'cloudflare_stream_fallback',
      message: 'Direct browser upload endpoint generated.',
    });
  } catch (error) {
    console.error('Cloudflare stream direct upload URL error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
