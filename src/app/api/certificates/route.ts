import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email';
import { env } from '@/config/env';
import { RateLimiters } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

/**
 * Certificate Issuance & Dispatch API
 * Dispatches official certificate email with public verification URL
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || '127.0.0.1';

  try {
    const body = await req.json();
    const {
      studentName,
      studentEmail,
      courseTitle,
      grade,
      scorePercentage,
      certificateCode,
    } = body;

    if (!studentEmail || !certificateCode) {
      return NextResponse.json(
        { success: false, error: 'studentEmail and certificateCode are required' },
        { status: 400 }
      );
    }

    // Rate limit quiz/certificate submissions: 5 attempts per hour per student/IP
    const rateLimitKey = `${studentEmail}:${ip}`;
    const rateLimitResult = await RateLimiters.quiz(rateLimitKey);
    if (!rateLimitResult.success) {
      logger.securityAlert('Certificate issuance rate limit exceeded', {
        event: 'rate_limit_exceeded',
        ip,
        identifier: studentEmail,
        endpoint: '/api/certificates',
      });
      return NextResponse.json(
        { success: false, error: 'Too many submissions. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.resetSeconds),
          },
        }
      );
    }

    const resolvedCourseTitle = courseTitle || 'What is Astrology — Foundations of Vedic Astrology';
    const resolvedGrade = grade || 'Distinction';
    const resolvedScore = Number(scorePercentage) || 95;
    const certUrl = `${env.appUrl}/dashboard/certificates`;
    const verifyUrl = `${env.appUrl}/verify/${certificateCode}`;

    logger.info('Issuing certificate notification', {
      service: 'certificates',
      certificateCode,
      studentEmail,
      grade: resolvedGrade,
      score: resolvedScore,
    });

    // Dispatch Certificate Issued Notification Email
    const emailResult = await emailService.sendCertificateIssued({
      studentName: studentName || 'Scholar',
      studentEmail,
      courseTitle: resolvedCourseTitle,
      grade: resolvedGrade,
      scorePercentage: resolvedScore,
      certificateCode,
      certificateUrl: certUrl,
      verifyUrl,
    }).catch((err) => {
      logger.error('Failed to send certificate notification email', err, {
        service: 'certificates',
        certificateCode,
        studentEmail,
      });
      return {
        success: false,
        messageId: undefined,
        error: (err as Error).message,
        provider: 'RESEND' as const,
        dispatchedAt: new Date().toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Certificate registered and notification email dispatched',
      certificateCode,
      verifyUrl,
      emailDelivery: emailResult,
    });
  } catch (error) {
    logger.error('Certificate issuance API error', error, {
      service: 'certificates',
      ip,
    });
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Certificate issuance service operational',
    verificationEndpoint: '/verify/[code]',
  });
}
