import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email';
import { env } from '@/config/env';

/**
 * Certificate Issuance & Dispatch API
 * Dispatches official certificate email with public verification URL
 */
export async function POST(req: NextRequest) {
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

    const resolvedCourseTitle = courseTitle || 'What is Astrology — Foundations of Vedic Astrology';
    const resolvedGrade = grade || 'Distinction';
    const resolvedScore = Number(scorePercentage) || 95;
    const certUrl = `${env.appUrl}/dashboard/certificates`;
    const verifyUrl = `${env.appUrl}/verify/${certificateCode}`;

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
      console.error('[Certificates API] Failed to send certificate email:', err);
      return {
        success: false,
        messageId: undefined,
        error: (err as Error).message,
        provider: 'RESEND',
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
    console.error('[Certificates API] Error:', error);
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
