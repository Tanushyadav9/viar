import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { INITIAL_FINAL_TEST } from '@/lib/data';
import { RateLimiters } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { emailService } from '@/lib/email';
import { env } from '@/config/env';
import { isSiteOwner, isDevSimulationAllowed } from '@/lib/auth/permissions';

/**
 * Quiz Submission API
 * Enforces server-side answer verification, rate limiting, and PostgreSQL persistence.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || '127.0.0.1';

  try {
    const body = await req.json();
    const { cohortId, courseId, studentId, studentEmail, studentName, answers } = body;

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

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Answers payload is required.' },
        { status: 400 }
      );
    }

    // Server-side Enrollment Check: Only active students or staff may submit certification exams
    const normalizedEmail = studentEmail ? String(studentEmail).trim().toLowerCase() : undefined;
    const isStaffOrOwner = normalizedEmail && isSiteOwner(normalizedEmail);

    let hasActiveEnrollment = Boolean(isStaffOrOwner);
    if (!hasActiveEnrollment) {
      try {
        const enr = await prisma.enrollment.findFirst({
          where: {
            status: 'ACTIVE',
            OR: [
              ...(studentId ? [{ userId: studentId }] : []),
              ...(normalizedEmail ? [{ user: { email: normalizedEmail } }] : []),
            ],
            AND: [
              {
                OR: [
                  ...(courseId ? [{ courseId }, { course: { slug: courseId } }] : []),
                  ...(cohortId ? [{ cohortId }] : []),
                  { cohortId: 'cohort-wia-batch-1' },
                ],
              },
            ],
          },
        });
        if (enr) hasActiveEnrollment = true;
      } catch (err) {
        console.warn('DB enrollment check in quiz submit failed:', err);
      }
    }

    // Allow dev simulation / test runner
    if (!hasActiveEnrollment && (isDevSimulationAllowed() || process.env.NODE_ENV === 'test')) {
      hasActiveEnrollment = true;
    }

    if (!hasActiveEnrollment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Only actively enrolled scholars may take and submit final certification exams.',
          code: 'ENROLLMENT_REQUIRED',
        },
        { status: 403 }
      );
    }

interface QuizQuestionItem {
  id: string;
  questionNumber?: number;
  question: string;
  topic?: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
}

interface QuizRecord {
  id: string;
  courseId: string;
  title: string;
  passingPercentage: number;
  durationMinutes: number;
  questionsJson: unknown;
  questions?: Array<{
    id: string;
    order: number;
    question: string;
    options: Array<{ id: string; order: number; text: string; isCorrect: boolean }>;
  }>;
}

interface CertificateResult {
  id: string;
  verificationCode: string;
  verifySlug: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  cohortBatchName: string;
  scorePercentage: number;
  grade: string;
  instructorName: string;
  instructorTitle: string;
  issuedAt: string;
  verificationUrl: string;
}

    // 1. Fetch Master Quiz from PostgreSQL (or canonical fallback)
    let masterQuiz: QuizRecord | null = null;
    try {
      if (cohortId) {
        const cohort = await prisma.cohort.findUnique({
          where: { id: cohortId },
          include: {
            course: {
              include: {
                quizzes: {
                  include: {
                    questions: {
                      include: { options: true },
                      orderBy: { order: 'asc' },
                    },
                  },
                },
              },
            },
          },
        });
        masterQuiz = (cohort?.course?.quizzes?.[0] as unknown as QuizRecord) || null;
      }
      if (!masterQuiz && courseId) {
        masterQuiz = (await prisma.quiz.findFirst({
          where: { OR: [{ courseId }, { course: { slug: courseId } }] },
          include: {
            questions: {
              include: { options: true },
              orderBy: { order: 'asc' },
            },
          },
        }) as unknown as QuizRecord) || null;
      }
      if (!masterQuiz) {
        masterQuiz = (await prisma.quiz.findFirst({
          include: {
            questions: {
              include: { options: true },
              orderBy: { order: 'asc' },
            },
          },
        }) as unknown as QuizRecord) || null;
      }
    } catch (dbErr) {
      console.warn('DB quiz lookup failed; falling back to canonical quiz:', (dbErr as Error).message);
    }

    const passingPercentage = masterQuiz?.passingPercentage || INITIAL_FINAL_TEST.passingPercentage || 70;

    // 2. Server-side Grading
    let correctCount = 0;
    let totalQuestions = 0;

    if (masterQuiz?.questions && masterQuiz.questions.length > 0) {
      totalQuestions = masterQuiz.questions.length;
      masterQuiz.questions.forEach((q) => {
        const studentSelected = answers[q.id];
        if (studentSelected !== undefined) {
          // Can be option index or option id
          const correctOption = q.options.find((opt) => opt.isCorrect);
          const isMatchByIndex = typeof studentSelected === 'number' && q.options[studentSelected]?.isCorrect;
          const isMatchById = correctOption && String(studentSelected) === String(correctOption.id);
          if (isMatchByIndex || isMatchById) {
            correctCount++;
          }
        }
      });
    } else {
      const quizQuestions: QuizQuestionItem[] = masterQuiz && Array.isArray(masterQuiz.questionsJson)
        ? (masterQuiz.questionsJson as QuizQuestionItem[])
        : (INITIAL_FINAL_TEST.questions as QuizQuestionItem[]);

      totalQuestions = quizQuestions.length;
      quizQuestions.forEach((q: QuizQuestionItem) => {
        const studentSelected = answers[q.id];
        if (studentSelected !== undefined && Number(studentSelected) === Number(q.correctOptionIndex)) {
          correctCount++;
        }
      });
    }

    const scorePercentage = Math.round((correctCount / Math.max(1, totalQuestions)) * 100);
    const isPassed = scorePercentage >= passingPercentage;

    let certificate: CertificateResult | null = null;

    // 3. If passed, generate certificate
    if (isPassed) {
      const codeRandom = Math.floor(1000 + Math.random() * 9000);
      const verificationCode = `VIAR-2026-WIA-${codeRandom}`;
      const verifySlug = `verify-${verificationCode.toLowerCase()}`;
      let grade: 'Distinction' | 'Merit' | 'Pass' = 'Pass';
      if (scorePercentage >= 90) grade = 'Distinction';
      else if (scorePercentage >= 80) grade = 'Merit';

      certificate = {
        id: `cert-${Date.now()}`,
        verificationCode,
        verifySlug,
        studentId: studentId || `user-${Date.now()}`,
        studentName: studentName || 'Scholar',
        studentEmail: studentEmail || 'student@example.com',
        courseTitle: 'The Ultimate Astrology Course: Foundations to Chart Mastery',
        cohortBatchName: 'Self-Paced Masterclass — Vihangam Institute of Astrology and Research',
        scorePercentage,
        grade,
        instructorName: 'Acharya Niraj Kumar',
        instructorTitle: 'Jyotish Acharya (Bharatiya Vidya Bhavan) | Founder, VIAR & Aapka Astro',
        issuedAt: new Date().toISOString(),
        verificationUrl: `${env.appUrl}/verify/${verificationCode}`,
      };

      // Try database persistence for user, attempt, and certificate
      try {
        let dbUser = null;
        if (studentEmail) {
          dbUser = await prisma.user.findFirst({ where: { email: studentEmail } });
          if (!dbUser) {
            dbUser = await prisma.user.create({
              data: {
                name: studentName || 'Scholar',
                email: studentEmail,
                role: 'STUDENT',
              },
            });
          }
        }

        if (dbUser && cohortId) {
          const cohortExists = await prisma.cohort.findUnique({ where: { id: cohortId } });
          if (cohortExists) {
            await prisma.quizAttempt.create({
              data: {
                userId: dbUser.id,
                cohortId,
                score: correctCount,
                totalQuestions,
                scorePercentage,
                passed: isPassed,
                answersJson: answers,
              },
            });

            await prisma.certificate.create({
              data: {
                userId: dbUser.id,
                cohortId,
                certificateNumber: verificationCode,
                verifySlug,
                grade,
                scorePercentage,
                instructorName: 'Acharya Niraj Kumar',
              },
            });
          }
        }
      } catch (persistErr) {
        console.warn('Certificate DB persistence non-fatal error:', (persistErr as Error).message);
      }

      // Dispatch Certificate Email notification
      if (studentEmail) {
        await emailService.sendCertificateIssued({
          studentName: studentName || 'Scholar',
          studentEmail,
          courseTitle: 'The Ultimate Astrology Course: Foundations to Chart Mastery',
          certificateCode: verificationCode,
          certificateUrl: `${env.appUrl}/verify/${verificationCode}`,
          verifyUrl: `${env.appUrl}/verify/${verificationCode}`,
          scorePercentage,
          grade,
        }).catch((err) => console.error('[Quiz Submit] Certificate email dispatch failed:', err));
      }
    }

    logger.info('Quiz attempt graded successfully on server', {
      service: 'quiz',
      cohortId,
      studentEmail,
      score: correctCount,
      totalQuestions,
      scorePercentage,
      isPassed,
    });

    return NextResponse.json({
      success: true,
      score: correctCount,
      totalQuestions,
      scorePercentage,
      isPassed,
      certificate,
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
