import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerAuthUser } from '@/lib/auth/serverAuth';

export const dynamic = 'force-dynamic';

async function checkOwnerAccess(): Promise<boolean> {
  const serverAuth = await getServerAuthUser();
  return Boolean(serverAuth.isAuthenticated && serverAuth.isOwner);
}

/**
 * PATCH /api/admin/knowledge/unanswered/[id]
 * Updates status of an unanswered question (e.g. DISMISSED or CONVERTED).
 */
export async function PATCH(
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
    const body = await req.json().catch(() => ({}));
    const status = body.status === 'DISMISSED' ? 'DISMISSED' : 'CONVERTED';

    const updated = await prisma.unansweredQuestion.update({
      where: { id },
      data: {
        status,
        knowledgeEntryId: body.knowledgeEntryId || null,
      },
    });

    return NextResponse.json({
      success: true,
      question: updated,
    });
  } catch (error) {
    console.error('[API Unanswered PATCH Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update unanswered question status.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/knowledge/unanswered/[id]
 * Deletes an unanswered question record.
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
    await prisma.unansweredQuestion.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      deletedId: id,
    });
  } catch (error) {
    console.error('[API Unanswered DELETE Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete unanswered question.' },
      { status: 500 }
    );
  }
}
