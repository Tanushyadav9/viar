import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser, isAuthorizedForSection } from '@/lib/auth/serverAuth';
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
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    const hasAccess = isAuthorizedForSection(auth, 'media', 'VIEW') || isAuthorizedForSection(auth, 'content', 'VIEW');
    if (!hasAccess) {
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
 * Uploads a new media asset, writes it to Neon Object Storage (or local media directory),
 * records metadata in PostgreSQL, and enforces the 5MB file size limit.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    const hasManageAccess = isAuthorizedForSection(auth, 'media', 'MANAGE') || isAuthorizedForSection(auth, 'content', 'MANAGE');
    if (!hasManageAccess) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: MANAGE access required to upload media.' },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const label = (formData.get('label') as string) || undefined;
    const altTextEn = (formData.get('altTextEn') as string) || undefined;
    const altTextHi = (formData.get('altTextHi') as string) || undefined;
    const folder = (formData.get('folder') as string) || 'general';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file was provided in the upload request.' },
        { status: 400 }
      );
    }

    // 1. Enforce 5MB upload ceiling
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: `File exceeds maximum allowed upload limit of 5MB (${(file.size / (1024 * 1024)).toFixed(1)}MB provided).`,
        },
        { status: 400 }
      );
    }

    // 2. Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported image format (${file.type}). Allowed formats: WebP, AVIF, PNG, JPEG, SVG.`,
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const asset = await createMediaAsset({
      buffer,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      label,
      altTextEn,
      altTextHi,
      folder,
      uploadedByEmail: auth.email || 'site_owner',
    });

    return NextResponse.json({
      success: true,
      asset,
      message: `Asset '${file.name}' uploaded and registered successfully.`,
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
 * Deletes an uploaded media asset if not in active use on published pages.
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    const hasManageAccess = isAuthorizedForSection(auth, 'media', 'MANAGE') || isAuthorizedForSection(auth, 'content', 'MANAGE');
    if (!hasManageAccess) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: MANAGE access required to delete media.' },
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
        { success: false, error: 'Media asset ID is required.' },
        { status: 400 }
      );
    }

    const deleted = await deleteMediaAsset(id);

    return NextResponse.json({
      success: true,
      message: `Media asset '${deleted.fileName}' deleted successfully.`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}
