import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser, isAuthorizedForSection } from '@/lib/auth/serverAuth';
import { updateLiveClass } from '@/lib/courses/liveClassesService';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getServerAuthUser();
    if (!isAuthorizedForSection(auth, 'courses', 'VIEW')) {
      return NextResponse.json({ error: 'Unauthorized: insufficient permissions' }, { status: 403 });
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: params.id },
      include: {
        module: {
          select: {
            id: true,
            title: true,
            order: true,
            courseId: true,
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Live class not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, lesson });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch live class';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getServerAuthUser();
    if (!isAuthorizedForSection(auth, 'courses', 'MANAGE')) {
      return NextResponse.json({ error: 'Unauthorized: staff management permission required' }, { status: 403 });
    }

    const body = await req.json();
    const { data = {}, cancellationReason } = body;

    const updated = await updateLiveClass({
      lessonId: params.id,
      data,
      userId: auth.userId,
      userEmail: auth.email,
      cancellationReason,
    });

    return NextResponse.json({
      success: true,
      lesson: updated,
    });
  } catch (err: unknown) {
    const errorObj = err as { status?: number; clash?: unknown; message?: string };
    const statusCode = errorObj?.status === 409 ? 409 : 400;
    const message = err instanceof Error ? err.message : 'Failed to update live class';

    return NextResponse.json(
      {
        success: false,
        error: message,
        clash: errorObj?.clash || null,
      },
      { status: statusCode }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getServerAuthUser();
    if (!isAuthorizedForSection(auth, 'courses', 'MANAGE')) {
      return NextResponse.json({ error: 'Unauthorized: staff management permission required' }, { status: 403 });
    }

    const existing = await prisma.lesson.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Live class not found' }, { status: 404 });
    }

    if (existing.status === 'DRAFT') {
      await prisma.lesson.delete({
        where: { id: params.id },
      });
      return NextResponse.json({ success: true, deleted: true });
    }

    // Scheduled or completed classes are cancelled with audit trail
    const updated = await updateLiveClass({
      lessonId: params.id,
      data: { status: 'CANCELLED' },
      userId: auth.userId,
      userEmail: auth.email,
      cancellationReason: 'Class cancelled by administrative staff.',
    });

    return NextResponse.json({ success: true, cancelled: true, lesson: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete live class';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
