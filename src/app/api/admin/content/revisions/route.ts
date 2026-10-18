import { NextRequest, NextResponse } from 'next/server';
import { extractAuthFromRequest, verifyRouteAccess } from '@/lib/auth/permissions';
import { getContentRevisions, restoreContentRevision } from '@/lib/content/contentService';
import { prisma } from '@/lib/prisma';

const OWNER_ONLY_COLLECTIONS = new Set(['legal', 'pricing', 'payment_settings', 'payment']);

/**
 * GET /api/admin/content/revisions?contentId=...
 * Retrieves audit snapshot history for a given content item.
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
    const auth = extractAuthFromRequest(req);
    if (!auth.sessionToken && !auth.userEmail) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    const access = verifyRouteAccess(req, 'content', 'MANAGE');
    if (!access.allowed && !access.isOwner) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: MANAGE access required to restore content revisions.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { revisionId } = body;

    if (!revisionId) {
      return NextResponse.json({ success: false, error: 'revisionId is required.' }, { status: 400 });
    }

    // Verify owner check if restoring a protected collection
    const revision = await prisma.contentRevision.findUnique({
      where: { id: revisionId },
    });

    if (!revision) {
      return NextResponse.json({ success: false, error: 'Revision snapshot not found.' }, { status: 404 });
    }

    if (OWNER_ONLY_COLLECTIONS.has(revision.collection) && !access.isOwner) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Legal pages and pricing settings can only be restored by the Site Owner.' },
        { status: 403 }
      );
    }

    const restored = await restoreContentRevision(revisionId, auth.userId || auth.userEmail || 'admin');

    return NextResponse.json({
      success: true,
      item: restored,
      message: 'Revision snapshot restored successfully. Cache updated.',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}
