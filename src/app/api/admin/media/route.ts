import { NextRequest, NextResponse } from 'next/server';
import { extractAuthFromRequest, verifyRouteAccess } from '@/lib/auth/permissions';
import {
  listMediaAssets,
  createMediaAsset,
  deleteMediaAsset,
  isStorageConfigured,
  MAX_IMAGE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
} from '@/lib/content/mediaService';

/**
 * GET /api/admin/media
 * Lists all uploaded media assets and built-in site graphics, annotated with usage locations.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = extractAuthFromRequest(req);
    if (!auth.sessionToken && !auth.userEmail) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    const access = verifyRouteAccess(req, 'media', 'VIEW');
    const contentAccess = verifyRouteAccess(req, 'content', 'VIEW');

    if (!access.allowed && !contentAccess.allowed && !access.isOwner) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have permission to view media assets.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;

    const assets = await listMediaAssets({ search });
    const storageStatus = isStorageConfigured();

    return NextResponse.json({
      success: true,
      assets,
      storageStatus,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/media
 * Registers an uploaded image asset into the media library.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = extractAuthFromRequest(req);
    if (!auth.sessionToken && !auth.userEmail) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    const access = verifyRouteAccess(req, 'media', 'MANAGE');
    const contentAccess = verifyRouteAccess(req, 'content', 'MANAGE');

    if (!access.allowed && !contentAccess.allowed && !access.isOwner) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: MANAGE access required to register media assets.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { filename, url, altTextEn, altTextHi, mimeType, sizeBytes, width, height } = body;

    if (!filename || !url || !altTextEn) {
      return NextResponse.json(
        { success: false, error: 'Filename, URL, and altTextEn are mandatory fields.' },
        { status: 400 }
      );
    }

    if (sizeBytes && sizeBytes > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 5 MB limit.' },
        { status: 400 }
      );
    }

    if (mimeType && !ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        { success: false, error: 'Only JPG, PNG, and WebP images are allowed.' },
        { status: 400 }
      );
    }

    const asset = await createMediaAsset({
      filename: String(filename),
      url: String(url),
      altTextEn: String(altTextEn),
      altTextHi: altTextHi ? String(altTextHi) : undefined,
      mimeType: String(mimeType || 'image/jpeg'),
      sizeBytes: Number(sizeBytes || 0),
      width: width ? Number(width) : undefined,
      height: height ? Number(height) : undefined,
      userId: auth.userId || auth.userEmail || 'system',
    });

    return NextResponse.json({
      success: true,
      asset,
      message: 'Media asset registered successfully.',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/admin/media
 * Removes a media asset if not currently referenced anywhere on the site.
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = extractAuthFromRequest(req);
    if (!auth.sessionToken && !auth.userEmail) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    const access = verifyRouteAccess(req, 'media', 'MANAGE');
    if (!access.allowed && !access.isOwner) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: MANAGE access required to delete media assets.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Asset ID is required for deletion.' },
        { status: 400 }
      );
    }

    const result = await deleteMediaAsset(id, auth.userId || auth.userEmail || 'owner');

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}
