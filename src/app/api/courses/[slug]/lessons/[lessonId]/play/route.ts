import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  verifyUserCourseAccess,
  verifySignedPlaybackToken,
  generateSignedPlaybackToken,
} from '@/lib/auth/course-access';
import { env } from '@/config/env';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string; lessonId: string } }
) {
  try {
    const { lessonId } = params;
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    // 1. Fetch lesson and its course/module
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      );
    }

    const course = lesson.module.course;

    // 2. Free Preview check: Anyone can stream free preview lessons
    if (lesson.isFreePreview) {
      return NextResponse.json({
        success: true,
        isFreePreview: true,
        lessonTitle: lesson.title,
        videoProviderId: lesson.videoProviderId,
        playbackUrl: lesson.videoProviderId,
        duration: lesson.videoDuration,
      });
    }

    // 3. Paid Lesson Access Gating: Must have valid signed token OR active enrollment / staff session
    let isAuthorized = false;
    let authorizedUserId: string | undefined;

    // Check token if provided
    if (token) {
      const tokenVerification = verifySignedPlaybackToken(token);
      if (tokenVerification.valid && tokenVerification.lessonId === lessonId) {
        isAuthorized = true;
        authorizedUserId = tokenVerification.userId;
      }
    }

    // Fallback: check session from request cookies/headers
    if (!isAuthorized) {
      const access = await verifyUserCourseAccess(req, course.slug);
      if (access.isEnrolled || access.isStaffOrOwner) {
        isAuthorized = true;
        authorizedUserId = access.userId;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          error: 'Paid enrollment required to stream this masterclass video.',
          code: 'ENROLLMENT_REQUIRED',
        },
        { status: 403 }
      );
    }

    // 4. External Video or Secure Cloudflare Stream Playback
    if (lesson.isExternalVideo && (lesson.externalVideoUrl || lesson.videoProviderId)) {
      return NextResponse.json({
        success: true,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        playbackUrl: lesson.externalVideoUrl || lesson.videoProviderId,
        isExternal: true,
        duration: lesson.videoDuration,
        provider: 'external',
        warning: 'Not protected: anyone with this link can share it',
      });
    }

    const rawVideoId = lesson.videoProviderId || '';
    const isYouTube = rawVideoId.includes('youtube.com') || rawVideoId.includes('youtu.be');

    // Issue refreshed short-lived token (15 mins)
    const { token: signedToken, expiresAt } = generateSignedPlaybackToken(
      lessonId,
      authorizedUserId || 'scholar',
      900
    );

    let securePlaybackUrl = rawVideoId;
    let provider = 'cloudflare';

    if (env.video.cloudflare.customerSubdomain && env.video.cloudflare.accountId && !isYouTube) {
      // Cloudflare Stream direct signed token embed
      securePlaybackUrl = `https://${env.video.cloudflare.customerSubdomain}/${rawVideoId}/iframe?token=${signedToken}`;
      provider = 'cloudflare';
    } else {
      // Direct stream or internal secure video proxy
      securePlaybackUrl = rawVideoId;
      provider = isYouTube ? 'restricted_embed' : 'stream';
    }

    return NextResponse.json({
      success: true,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      playbackUrl: securePlaybackUrl,
      signedToken,
      expiresAt,
      duration: lesson.videoDuration,
      provider,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
