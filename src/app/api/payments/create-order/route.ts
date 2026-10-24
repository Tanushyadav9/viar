import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UPI_CONFIG, generateUpiUrl, generateWhatsAppPaymentSubmissionUrl } from '@/lib/payments/upi';
import { getPaymentSettings } from '@/lib/payments/settings';
import { RateLimiters } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

/**
 * POST /api/payments/create-order
 * 
 * Handles UPI QR payment order generation & transaction submission.
 * Saves payment intent directly into PostgreSQL `Payment` table with status 'PENDING'.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || '127.0.0.1';

  // Enforce rate limiting: 20 attempts per hour per IP
  const rateLimitResult = await RateLimiters.checkout(ip);
  if (!rateLimitResult.success) {
    logger.securityAlert('Checkout rate limit exceeded', {
      event: 'rate_limit_exceeded',
      ip,
      endpoint: '/api/payments/create-order',
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Too many checkout attempts. Please try again later.',
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimitResult.resetSeconds),
        },
      }
    );
  }

  try {
    const body = await req.json();
    const {
      cohortId,
      courseId,
      studentName,
      studentEmail,
      studentPhone,
      amount,
      utr,
      screenshotUrl,
      notes,
    } = body;

    if (!studentEmail || !studentName) {
      return NextResponse.json(
        { success: false, error: 'Student name and email are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = studentEmail.trim().toLowerCase();
    const cleanName = studentName.trim();
    const cleanPhone = studentPhone ? studentPhone.trim() : null;
    const finalAmount = Number(amount) || UPI_CONFIG.defaultAmountInr;

    // 1. Resolve course and cohort from database
    let dbCourse = null;
    if (courseId) {
      dbCourse = await prisma.course.findFirst({
        where: { OR: [{ id: courseId }, { slug: courseId }] },
      }).catch(() => null);
    }

    let dbCohort = null;
    if (cohortId) {
      dbCohort = await prisma.cohort.findFirst({
        where: { id: cohortId },
        include: { course: true },
      }).catch(() => null);
    }

    if (!dbCourse && dbCohort?.course) {
      dbCourse = dbCohort.course;
    }

    const resolvedCourseId = dbCourse?.id || 'cmugp9kmx000010o1wzvybmh5';
    const resolvedCohortId = dbCohort?.id || 'cohort-wia-batch-1';
    const courseTitle = dbCourse?.title || 'The Ultimate Astrology Course: Foundations to Chart Mastery';

    // 2. Find or create User record in PostgreSQL
    let user = await prisma.user.findFirst({
      where: { email: cleanEmail },
    }).catch(() => null);

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          role: 'STUDENT',
        },
      }).catch(async () => {
        return await prisma.user.findFirst({ where: { email: cleanEmail } });
      });
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Database record creation failed.' },
        { status: 500 }
      );
    }

    // 3. Create or record Payment in PostgreSQL with status PENDING
    const paymentRef = utr?.trim() || `upi_qr_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        courseId: resolvedCourseId,
        cohortId: resolvedCohortId,
        provider: 'UPI_QR',
        providerReference: paymentRef,
        amount: finalAmount,
        currency: 'INR',
        status: 'PENDING',
        studentName: cleanName,
        studentEmail: cleanEmail,
        studentPhone: cleanPhone,
        screenshotUrl: screenshotUrl || null,
        notes: notes || (utr ? `Student reported UTR: ${utr}` : 'UPI QR Checkout generated'),
      },
    });

    // 4. Load live payment settings from DB & Generate UPI / WhatsApp Links
    const pSettings = await getPaymentSettings();

    const upiUrl = generateUpiUrl({
      amount: finalAmount,
      studentName: cleanName,
      courseTitle,
      vpa: pSettings.upiId,
      payeeName: pSettings.payeeName,
    });

    const whatsAppUrl = generateWhatsAppPaymentSubmissionUrl({
      ownerPhone: pSettings.whatsappNumber,
      studentName: cleanName,
      studentEmail: cleanEmail,
      studentPhone: cleanPhone || undefined,
      courseTitle,
      amount: finalAmount,
      utr: utr?.trim(),
    });

    logger.info('UPI Checkout initiated', {
      service: 'payments',
      paymentId: payment.id,
      studentEmail: cleanEmail,
      amount: finalAmount,
      provider: 'UPI_QR',
    });

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      orderId: payment.id,
      vpa: UPI_CONFIG.vpa,
      payeeName: UPI_CONFIG.payeeName,
      amount: finalAmount,
      currency: 'INR',
      upiUrl,
      whatsAppUrl,
      ownerWhatsAppDisplay: UPI_CONFIG.ownerWhatsAppDisplay,
    });
  } catch (error) {
    logger.paymentError('Failed to process UPI order submission', {}, error);
    return NextResponse.json(
      { success: false, error: 'Failed to process checkout.' },
      { status: 500 }
    );
  }
}
