import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser, isAuthorizedForSection } from '@/lib/auth/serverAuth';
import {
  getContentItem,
  getCollectionItems,
  saveContentItem,
  updateContentStatus,
} from '@/lib/content/contentService';
import { prisma } from '@/lib/prisma';
import type { ContentStatus } from '@/lib/types';

const OWNER_ONLY_COLLECTIONS = new Set(['legal', 'pricing', 'payment_settings', 'payment']);

/**
 * GET /api/admin/content
 * Fetches content items for a collection, or a specific item by key.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    if (!isAuthorizedForSection(auth, 'content', 'VIEW')) {
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
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    if (!isAuthorizedForSection(auth, 'content', 'MANAGE')) {
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
    if (OWNER_ONLY_COLLECTIONS.has(normalizedCollection) && !auth.isOwner) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Legal policies and pricing settings can only be edited by the Site Owner.' },
        { status: 403 }
      );
    }

    // Public contact email MUST NOT be the Owner login address
    if (normalizedCollection === 'site_settings' && String(key).toLowerCase() === 'contact_email') {
      const emailValue = (contentEn || contentHi || '').trim().toLowerCase();
      if (emailValue === 'aapkaastro1606@gmail.com') {
        return NextResponse.json(
          {
            success: false,
            error: 'The public contact email cannot be the private Owner login email (aapkaastro1606@gmail.com). Please use a dedicated public inquiry address such as contact@viar.in or admissions@viar.in.',
          },
          { status: 400 }
        );
      }
    }

    // Testimonials MUST include a required consent note before publishing
    if (normalizedCollection === 'testimonials' && status === 'PUBLISHED') {
      const meta = (typeof metadata === 'object' && metadata !== null) ? metadata : {};
      if (!meta.consentGiven || !meta.consentNote || !String(meta.consentNote).trim()) {
        return NextResponse.json(
          {
            success: false,
            error: 'A required consent note is mandatory to publish student testimonials (e.g. "Written consent received via email").',
          },
          { status: 400 }
        );
      }
    }

    // Quick status toggle action
    if (action === 'hide' || action === 'publish') {
      const newStatus: ContentStatus = action === 'hide' ? 'HIDDEN' : 'PUBLISHED';
      const updated = await updateContentStatus(
        collection,
        key,
        newStatus,
        auth.email || 'system',
        changeSummary || `Status set to ${newStatus}`
      );
      return NextResponse.json({
        success: true,
        item: updated,
        message: `Content item status updated to ${newStatus}.`,
      });
    }

    const saved = await saveContentItem({
      collection: normalizedCollection,
      key: String(key).trim(),
      titleEn: titleEn ? String(titleEn) : undefined,
      titleHi: titleHi ? String(titleHi) : undefined,
      contentEn: contentEn !== undefined ? String(contentEn) : undefined,
      contentHi: contentHi !== undefined ? String(contentHi) : undefined,
      metadata: typeof metadata === 'object' && metadata !== null ? metadata : undefined,
      status: (status as ContentStatus) || 'PUBLISHED',
      sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
      changeSummary: changeSummary ? String(changeSummary) : (id ? 'Updated via Admin Studio' : 'Created via Admin Studio'),
    }, auth.email || 'site_owner');

    return NextResponse.json({
      success: true,
      item: saved,
      message: `Content item '${key}' saved successfully.`,
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
 * Deletes a content item permanently (only permitted if not a protected site_settings item).
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    if (!isAuthorizedForSection(auth, 'content', 'MANAGE')) {
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

    if (OWNER_ONLY_COLLECTIONS.has(item.collection) && !auth.isOwner) {
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
