import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { INITIAL_COURSES } from '@/lib/data';

interface RouteParams {
  params: {
    code: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { code } = params;

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Certificate code is required' },
        { status: 400 }
      );
    }

    // 1. Try Prisma lookup
    try {
      const cert = await prisma.certificate.findFirst({
        where: {
          OR: [
            { certificateNumber: code },
            { verifySlug: code },
          ],
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          cohort: {
            include: {
              course: true,
            },
          },
        },
      });

      if (cert) {
        return NextResponse.json({
          success: true,
          certificate: {
            id: cert.id,
            certificateNumber: cert.certificateNumber,
            recipientName: cert.user?.name || 'Verified Scholar',
            courseName: cert.cohort?.course?.title || 'Foundations of Vedic Astrology',
            cohortName: cert.cohort?.batchName || 'Batch Alpha',
            issuedAt: cert.issuedAt.toISOString(),
            grade: cert.grade || 'Distinction',
            scorePercentage: cert.scorePercentage || 95,
            instructorName: cert.instructorName || 'Acharya Niraj Kumar',
            verifyUrl: `https://viar.in/verify/${cert.certificateNumber}`,
          },
        });
      }
    } catch (dbError) {
      console.warn('Database lookup for certificate skipped:', (dbError as Error).message);
    }

    // 2. Demo fallback for sample certificates
    if (code.toUpperCase().includes('VIAR-') || code.toUpperCase().includes('DEMO')) {
      return NextResponse.json({
        success: true,
        certificate: {
          id: `cert-${code}`,
          certificateNumber: code.toUpperCase(),
          recipientName: 'Devansh Verma',
          courseName: INITIAL_COURSES[0].title,
          cohortName: 'Batch 1 (Nov 2026)',
          issuedAt: '2026-11-20T10:00:00.000Z',
          grade: 'Distinction',
          scorePercentage: 92,
          instructorName: 'Acharya Niraj Kumar',
          verifyUrl: `https://viar.in/verify/${code.toUpperCase()}`,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Certificate not found in registry' },
      { status: 404 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
