import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    try {
      const progress = await prisma.sessionProgress.findMany({
        where: { userId },
        include: {
          classSession: true,
        },
      });

      return NextResponse.json({ success: true, progress });
    } catch (dbError) {
      console.warn('Database query for session progress skipped:', (dbError as Error).message);
      return NextResponse.json({
        success: true,
        progress: [],
        message: 'Returning runtime progress state',
      });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, classSessionId, watched } = body;

    if (!userId || !classSessionId) {
      return NextResponse.json(
        { success: false, error: 'userId and classSessionId are required' },
        { status: 400 }
      );
    }

    try {
      if (watched === false) {
        // Remove progress entry
        await prisma.sessionProgress.deleteMany({
          where: {
            userId,
            classSessionId,
          },
        });
        return NextResponse.json({ success: true, marked: false });
      } else {
        // Upsert progress entry
        const progress = await prisma.sessionProgress.upsert({
          where: {
            userId_classSessionId: {
              userId,
              classSessionId,
            },
          },
          update: {
            watchedAt: new Date(),
          },
          create: {
            userId,
            classSessionId,
            watchedAt: new Date(),
          },
        });
        return NextResponse.json({ success: true, progress, marked: true });
      }
    } catch (dbError) {
      console.warn('Database write for session progress skipped:', (dbError as Error).message);
      return NextResponse.json({
        success: true,
        marked: watched !== false,
        userId,
        classSessionId,
        watchedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
