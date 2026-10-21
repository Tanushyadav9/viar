import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerAuthUser, isAuthorizedForSection } from '@/lib/auth/serverAuth';

export async function POST(
  req: NextRequest
) {
  try {
    const auth = await getServerAuthUser();
    if (!isAuthorizedForSection(auth, 'courses', 'MANAGE')) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: MANAGE permission on 'courses' required.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { itemType, items } = body;
    // items: Array<{ id: string, order: number }>

    if (!Array.isArray(items) || !itemType) {
      return NextResponse.json({ success: false, error: 'items array and itemType are required' }, { status: 400 });
    }

    if (itemType === 'MODULE') {
      await prisma.$transaction(
        items.map((item) =>
          prisma.module.update({
            where: { id: item.id },
            data: { order: Number(item.order) },
          })
        )
      );

      return NextResponse.json({ success: true, message: 'Modules reordered successfully' });
    }

    if (itemType === 'LESSON') {
      await prisma.$transaction(
        items.map((item) =>
          prisma.lesson.update({
            where: { id: item.id },
            data: {
              order: Number(item.order),
              ...(item.moduleId ? { moduleId: item.moduleId } : {}),
            },
          })
        )
      );

      return NextResponse.json({ success: true, message: 'Lessons reordered successfully' });
    }

    return NextResponse.json({ success: false, error: 'Invalid itemType' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
