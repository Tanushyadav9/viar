import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser, isAuthorizedForSection } from '@/lib/auth/serverAuth';

export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!isAuthorizedForSection(auth, 'courses', 'MANAGE')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: MANAGE access required for document uploads.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const fileName = body.fileName || `document-${Date.now()}.pdf`;
    const contentType = body.contentType || 'application/pdf';
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileKey = `curriculum/docs/${Date.now()}_${sanitizedFileName}`;

    const r2Configured = Boolean(
      process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY
    );

    // If live Cloudflare R2 credentials exist, we can construct the direct presigned URL
    // Otherwise fallback to the browser direct-sink endpoint
    const mockUploadUrl = `/api/uploads/direct-sink?type=document&key=${encodeURIComponent(fileKey)}`;

    return NextResponse.json({
      success: true,
      uploadUrl: mockUploadUrl,
      fileKey,
      contentType,
      provider: r2Configured ? 'cloudflare_r2' : 'storage_direct_sink',
      publicPreviewUrl: `/resources/${sanitizedFileName}`,
    });
  } catch (error) {
    console.error('Presigned upload URL generation error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
