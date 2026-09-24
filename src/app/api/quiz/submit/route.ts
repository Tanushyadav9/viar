import { NextRequest, NextResponse } from 'next/server';
import { RateLimiters } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

/**
 * Quiz Submission API
 * Enforces rate limiting against brute-forcing answers.
 * Maximum 5 quiz submissions per hour per user/IP.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || '127.0.0.1';

  try {
    const body = await req.json();
    const { cohortId, studentId, studentEmail, answers } = body;

    const rateKey = studentId ? `${studentId}:${ip}` : (studentEmail ? `${studentEmail}:${ip}` : ip);
    const rateLimitResult = await RateLimiters.quiz(rateKey);

    if (!rateLimitResult.success) {
      logger.securityAlert('Quiz submission rate limit exceeded', {
        event: 'rate_limit_exceeded',
        ip,
        identifier: rateKey,
        endpoint: '/api/quiz/submit',
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded: maximum 5 quiz attempts allowed per hour. Please review study materials before trying again.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.resetSeconds),
          },
        }
      );
    }

    if (!cohortId || !answers || typeof answers !== 'object') {
      return NextResponse.json(
        { success: false, error: 'cohortId and answers payload required.' },
        { status: 400 }
      );
    }

    logger.info('Quiz attempt submitted and accepted', {
      service: 'quiz',
      cohortId,
      studentId,
      studentEmail,
    });

    return NextResponse.json({
      success: true,
      message: 'Quiz submission accepted.',
      remainingAttempts: rateLimitResult.remaining,
    });
  } catch (err) {
    logger.error('Quiz submission API error', err, { service: 'quiz', ip });
    return NextResponse.json(
      { success: false, error: 'Failed to process quiz submission.' },
      { status: 500 }
    );
  }
}
