import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser, isAuthorizedForSection } from '@/lib/auth/serverAuth';
import { updateLiveClass } from '@/lib/courses/liveClassesService';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    const result = await updateLiveClass({
      lessonId: params.id,
      userId: auth.userId,
      userEmail: auth.email,
      data: body.data || body,
      cancellationReason: body.cancellationReason || body.data?.cancellationReason || null,
    });

    return NextResponse.json({
      success: true,
      ...result,
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
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // If draft with no progress, can delete, or archive
    await prisma.lesson.delete({
      where: { id: params.id },
    });

    await prisma.activityLog.create({
      data: {
        userId: auth.userId || null,
        userEmail: auth.email || null,
        action: 'LIVE_CLASS_DELETED',
        entityType: 'LESSON',
        entityId: params.id,
        reason: `Deleted live class "${existing.title}"`,
      },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: 'Live class deleted successfully',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete live class';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
