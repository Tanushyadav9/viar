import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerAuthUser } from '@/lib/auth/serverAuth';
import { extractAuthFromRequest, isSiteOwner } from '@/lib/auth/permissions';

export const dynamic = 'force-dynamic';

async function checkOwnerAccess(req: NextRequest): Promise<boolean> {
  const serverAuth = await getServerAuthUser();
  if (serverAuth.isAuthenticated && serverAuth.isOwner) return true;

  const headerAuth = extractAuthFromRequest(req);
  if (isSiteOwner(headerAuth.userEmail)) return true;

  return false;
}

/**
 * PUT /api/admin/knowledge/[id]
 * Updates an existing KnowledgeEntry.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isOwner = await checkOwnerAccess(req);
    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Owner access required.' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload.' },
        { status: 400 }
      );
    }

    const dataToUpdate: Record<string, unknown> = {};
    if (typeof body.question === 'string') dataToUpdate.question = body.question.trim();
    if (typeof body.answer === 'string') dataToUpdate.answer = body.answer.trim();
    if (typeof body.category === 'string') dataToUpdate.category = body.category.trim();
    if (typeof body.language === 'string') dataToUpdate.language = body.language.trim();
    if (typeof body.published === 'boolean') dataToUpdate.published = body.published;
    if (typeof body.orderIndex === 'number') dataToUpdate.orderIndex = body.orderIndex;

    const updated = await prisma.knowledgeEntry.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({
      success: true,
      entry: updated,
    });
  } catch (error) {
    console.error('[API Admin Knowledge PUT Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update knowledge entry.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/knowledge/[id]
 * Deletes a KnowledgeEntry.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isOwner = await checkOwnerAccess(req);
    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Owner access required.' },
        { status: 403 }
      );
    }

    const { id } = params;
    await prisma.knowledgeEntry.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      deletedId: id,
    });
  } catch (error) {
    console.error('[API Admin Knowledge DELETE Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete knowledge entry.' },
      { status: 500 }
    );
  }
}
