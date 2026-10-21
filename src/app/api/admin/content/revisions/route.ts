import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser, isAuthorizedForSection } from '@/lib/auth/serverAuth';
import { getContentRevisions, restoreContentRevision } from '@/lib/content/contentService';
import { prisma } from '@/lib/prisma';

const OWNER_ONLY_COLLECTIONS = new Set(['legal', 'pricing', 'payment_settings', 'payment']);

/**
 * GET /api/admin/content/revisions?contentId=...
 * Retrieves audit snapshot history for a given content item.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    if (!isAuthorizedForSection(auth, 'content', 'VIEW')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have permission to view content revisions.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const contentId = searchParams.get('contentId');

    if (!contentId) {
      return NextResponse.json({ success: false, error: 'contentId parameter is required.' }, { status: 400 });
    }

    const revisions = await getContentRevisions(contentId);

    return NextResponse.json({
      success: true,
      revisions,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/content/revisions
 * Restores a content item to a previous snapshot revision with 1-click restore.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    if (!isAuthorizedForSection(auth, 'content', 'MANAGE')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: MANAGE access required to restore content revisions.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { revisionId, reason } = body;

    if (!revisionId) {
      return NextResponse.json(
        { success: false, error: 'revisionId is required to perform a rollback.' },
        { status: 400 }
      );
    }

    // Verify item ownership if owner-only collection
    const revision = await prisma.contentRevision.findUnique({
      where: { id: revisionId },
      include: { contentItem: true },
    });

    if (!revision) {
      return NextResponse.json({ success: false, error: 'Revision record not found.' }, { status: 404 });
    }

    if (OWNER_ONLY_COLLECTIONS.has(revision.contentItem.collection) && !auth.isOwner) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Legal pages and pricing settings can only be restored by the Site Owner.' },
        { status: 403 }
      );
    }

    const restoredItem = await restoreContentRevision(
      revisionId,
      auth.email || 'site_owner',
      reason || 'Restored via Content Studio history'
    );

    return NextResponse.json({
      success: true,
      item: restoredItem,
      message: `Content successfully restored to revision from ${new Date(revision.createdAt).toLocaleString()}.`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}
