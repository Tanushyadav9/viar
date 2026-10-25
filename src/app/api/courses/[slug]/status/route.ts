import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser } from '@/lib/auth/serverAuth';
import { getUserCourseStatus } from '@/lib/courses/enrollmentStatus';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    slug: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const auth = await getServerAuthUser();
    const { searchParams } = new URL(req.url);
    const queryEmail = searchParams.get('email');

    const result = await getUserCourseStatus({
      userId: auth.userId || null,
      userEmail: auth.email || queryEmail || null,
      courseSlugOrId: params.slug,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to resolve course status',
      },
      { status: 500 }
    );
  }
}
