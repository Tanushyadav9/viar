import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerAuthUser } from '@/lib/auth/serverAuth';

export const dynamic = 'force-dynamic';

async function checkOwnerAccess(): Promise<boolean> {
  const serverAuth = await getServerAuthUser();
  return Boolean(serverAuth.isAuthenticated && serverAuth.isOwner);
}

/**
 * GET /api/admin/knowledge
 * Owner-only endpoint to fetch all knowledge entries and unanswered questions.
 */
export async function GET(req: NextRequest) {
  try {
    const isOwner = await checkOwnerAccess(req);
    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Owner access required.' },
        { status: 403 }
      );
    }

    const [entries, unanswered] = await Promise.all([
      prisma.knowledgeEntry.findMany({
        orderBy: [{ orderIndex: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.unansweredQuestion.findMany({
        orderBy: [{ count: 'desc' }, { lastAskedAt: 'desc' }],
        take: 100,
      }),
    ]);

    return NextResponse.json({
      success: true,
      entries,
      unanswered,
    });
  } catch (error) {
    console.error('[API Admin Knowledge GET Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch knowledge entries.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/knowledge
 * Owner-only endpoint to create a new KnowledgeEntry.
 */
export async function POST(req: NextRequest) {
  try {
    const isOwner = await checkOwnerAccess(req);
    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Owner access required.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.question || !body.answer) {
      return NextResponse.json(
        { success: false, error: 'Fields "question" and "answer" are required.' },
        { status: 400 }
      );
    }

    const entry = await prisma.knowledgeEntry.create({
      data: {
        question: String(body.question).trim(),
        answer: String(body.answer).trim(),
        category: body.category ? String(body.category).trim() : 'general',
        language: body.language ? String(body.language).trim() : 'en',
        published: body.published !== false,
        orderIndex: typeof body.orderIndex === 'number' ? body.orderIndex : 0,
      },
    });

    // If an unansweredQuestionId was provided, mark it as CONVERTED
    if (body.unansweredQuestionId) {
      await prisma.unansweredQuestion
        .update({
          where: { id: String(body.unansweredQuestionId) },
          data: {
            status: 'CONVERTED',
            knowledgeEntryId: entry.id,
          },
        })
        .catch(() => {});
    }

    return NextResponse.json({
      success: true,
      entry,
    });
  } catch (error) {
    console.error('[API Admin Knowledge POST Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create knowledge entry.' },
      { status: 500 }
    );
  }
}
