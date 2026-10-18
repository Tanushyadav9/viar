import { NextRequest, NextResponse } from 'next/server';
import { extractAuthFromRequest, verifyRouteAccess } from '@/lib/auth/permissions';
import {
  getContentItem,
  getCollectionItems,
  saveContentItem,
  updateContentStatus,
} from '@/lib/content/contentService';
import { prisma } from '@/lib/prisma';
import { ContentStatus } from '@/lib/types';

const OWNER_ONLY_COLLECTIONS = new Set(['legal', 'pricing', 'payment_settings', 'payment']);

/**
 * GET /api/admin/content
 * Fetches content items for a collection, or a specific item by key.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = extractAuthFromRequest(req);
    if (!auth.sessionToken && !auth.userEmail) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    const access = verifyRouteAccess(req, 'content', 'VIEW');
    if (!access.allowed && !access.isOwner) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have permission to view content.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const collection = searchParams.get('collection') || 'faqs';
    const key = searchParams.get('key');

    if (key) {
      const item = await getContentItem(collection, key, { previewDraft: true });
      return NextResponse.json({ success: true, item });
    }

    const items = await getCollectionItems(collection, {
      includeHidden: true,
      includeDrafts: true,
    });

    return NextResponse.json({
      success: true,
      collection,
      items,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/content
 * Saves or updates a content item, creates an audit revision snapshot, and triggers cache revalidation.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = extractAuthFromRequest(req);
    if (!auth.sessionToken && !auth.userEmail) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    const access = verifyRouteAccess(req, 'content', 'MANAGE');
    if (!access.allowed && !access.isOwner) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: MANAGE access required to edit content.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      collection,
      key,
      titleEn,
      titleHi,
      contentEn,
      contentHi,
      metadata,
      status,
      sortOrder,
      changeSummary,
      action, // 'save' | 'hide' | 'publish'
      id,
    } = body;

    if (!collection || !key) {
      return NextResponse.json(
        { success: false, error: 'Both collection and key are required fields.' },
        { status: 400 }
      );
    }

    const normalizedCollection = String(collection).trim().toLowerCase();

    // Strict Role Boundary: Legal pages and pricing settings are strictly Owner-Only
    if (OWNER_ONLY_COLLECTIONS.has(normalizedCollection) && !access.isOwner) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Legal policies and pricing settings can only be edited by the Site Owner.' },
        { status: 403 }
      );
    }

    // Quick status toggle action
    if (action === 'status' && id && status) {
      const updated = await updateContentStatus(
        id,
        status as ContentStatus,
        auth.userId || auth.userEmail || 'admin'
      );
      return NextResponse.json({
        success: true,
        item: updated,
        message: `Content status updated to ${status}.`,
      });
    }

    const saved = await saveContentItem(
      {
        collection: normalizedCollection,
        key: String(key).trim().toLowerCase(),
        titleEn: titleEn ? String(titleEn) : '',
        titleHi: titleHi ? String(titleHi) : '',
        contentEn: contentEn ? String(contentEn) : '',
        contentHi: contentHi ? String(contentHi) : '',
        metadata: typeof metadata === 'object' ? metadata : {},
        status: (status as ContentStatus) || 'PUBLISHED',
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
        changeSummary: changeSummary ? String(changeSummary) : undefined,
      },
      auth.userId || auth.userEmail || 'admin'
    );

    return NextResponse.json({
      success: true,
      item: saved,
      message: 'Content published successfully. Changes are live on the website.',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/admin/content
 * Permanent delete of a content item after confirmation modal.
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = extractAuthFromRequest(req);
    if (!auth.sessionToken && !auth.userEmail) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    const access = verifyRouteAccess(req, 'content', 'MANAGE');
    if (!access.allowed && !access.isOwner) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: MANAGE access required to delete content.' },
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
        { success: false, error: 'Content item ID is required for deletion.' },
        { status: 400 }
      );
    }

    const item = await prisma.contentItem.findUnique({
      where: { id },
    });

    if (!item) {
      return NextResponse.json({ success: false, error: 'Content item not found.' }, { status: 404 });
    }

    if (OWNER_ONLY_COLLECTIONS.has(item.collection) && !access.isOwner) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Legal pages and pricing settings can only be deleted by the Site Owner.' },
        { status: 403 }
      );
    }

    await prisma.contentItem.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Content item '${item.titleEn || item.key}' permanently deleted.`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}
