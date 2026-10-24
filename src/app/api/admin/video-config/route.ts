import { NextResponse } from 'next/server';
import { getServerAuthUser, isAuthorizedForSection } from '@/lib/auth/serverAuth';

export async function GET() {
  try {
    const auth = await getServerAuthUser();
    if (!isAuthorizedForSection(auth, 'courses', 'VIEW')) {
      return NextResponse.json(
        { success: false, error: "Forbidden: VIEW permission on 'courses' required." },
        { status: 403 }
      );
    }

    const accountId =
      process.env.CLOUDFLARE_STREAM_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID || '';
    const apiToken =
      process.env.CLOUDFLARE_STREAM_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN || '';
    const subdomain =
      process.env.CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN ||
      process.env.CLOUDFLARE_CUSTOMER_SUBDOMAIN ||
      '';

    const missing: string[] = [];
    if (!accountId) missing.push('CLOUDFLARE_STREAM_ACCOUNT_ID');
    if (!apiToken) missing.push('CLOUDFLARE_STREAM_API_TOKEN');
    if (!subdomain) missing.push('CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN');

    const isConfigured = Boolean(accountId && apiToken);

    return NextResponse.json({
      success: true,
      configured: isConfigured,
      missing,
      provider: 'cloudflare_stream',
      hasSubdomain: Boolean(subdomain),
      message: isConfigured
        ? 'Cloudflare Stream is fully configured for direct browser uploads and signed playback.'
        : `Cloudflare Stream host is not configured. Missing: ${missing.join(', ')}`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
