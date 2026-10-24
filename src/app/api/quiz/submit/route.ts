import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { INITIAL_FINAL_TEST } from '@/lib/data';
import { RateLimiters } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { emailService } from '@/lib/email';
import { env } from '@/config/env';
import { isSiteOwner } from '@/lib/auth/permissions';
import { getServerAuthUser } from '@/lib/auth/serverAuth';

/**
 * Quiz Submission API
 * Enforces server-side answer verification, rate limiting, and PostgreSQL persistence.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || '127.0.0.1';

  try {
    const auth = await getServerAuthUser();
    const body = await req.json().catch(() => ({}));
    const { cohortId, courseId, studentId, studentEmail, studentName, answers } = body;

    const effectiveEmail = auth.email || (studentEmail ? String(studentEmail).trim().toLowerCase() : undefined);
    const effectiveName = auth.dbUser?.name || studentName || 'Scholar';
    const effectiveStudentId = auth.dbUser?.id || auth.userId || studentId;

    const rateKey = effectiveStudentId ? `${effectiveStudentId}:${ip}` : (effectiveEmail ? `${effectiveEmail}:${ip}` : ip);
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
    const isStaffOrOwner = auth.isOwner || (effectiveEmail && isSiteOwner(effectiveEmail));

    let hasActiveEnrollment = Boolean(isStaffOrOwner);
    if (!hasActiveEnrollment) {
      try {
        const enr = await prisma.enrollment.findFirst({
          where: {
            status: 'ACTIVE',
            OR: [
              ...(effectiveStudentId ? [{ userId: effectiveStudentId }] : []),
              ...(effectiveEmail ? [{ user: { email: effectiveEmail } }] : []),
              ...(auth.clerkId ? [{ user: { clerkId: auth.clerkId } }] : []),
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

    // In test mode: allow enrollment simulation if explicitly marked on test persona
    if (!hasActiveEnrollment && (auth as { isTestEnrolled?: boolean })?.isTestEnrolled) {
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
    explanation?: string | null;
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

    // 2. Server-side Grading & Explanations Extraction
    let correctCount = 0;
    let totalQuestions = 0;
    const explanations: Record<string, { correctOptionIndex: number; explanation: string }> = {};

    if (masterQuiz?.questions && masterQuiz.questions.length > 0) {
      totalQuestions = masterQuiz.questions.length;
      masterQuiz.questions.forEach((q) => {
        const studentSelected = answers[q.id];
        const correctIdx = q.options.findIndex((opt) => opt.isCorrect);
        explanations[q.id] = {
          correctOptionIndex: correctIdx >= 0 ? correctIdx : 0,
          explanation: q.explanation || 'Vedic Astrology Principles Reference.',
        };

        if (studentSelected !== undefined) {
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
        explanations[q.id] = {
          correctOptionIndex: q.correctOptionIndex,
          explanation: q.explanation || 'Vedic Astrology Principles Reference.',
        };

        const studentSelected = answers[q.id];
        if (studentSelected !== undefined && Number(studentSelected) === Number(q.correctOptionIndex)) {
          correctCount++;
        }
      });
    }

    const scorePercentage = Math.round((correctCount / Math.max(1, totalQuestions)) * 100);
    const isPassed = scorePercentage >= passingPercentage;

    let grade: 'Distinction' | 'Merit' | 'Pass' | 'Fail' = 'Fail';
    if (scorePercentage >= 90) grade = 'Distinction';
    else if (scorePercentage >= 80) grade = 'Merit';
    else if (scorePercentage >= 70) grade = 'Pass';

    // 3. Resolve Database User (authoritative foreign key)
    let dbUser = auth.dbUser;
    if (!dbUser && (effectiveEmail || effectiveStudentId)) {
      try {
        dbUser = await prisma.user.findFirst({
          where: {
            OR: [
              ...(effectiveEmail ? [{ email: effectiveEmail }] : []),
              ...(effectiveStudentId ? [{ id: effectiveStudentId }] : []),
              ...(auth.clerkId ? [{ clerkId: auth.clerkId }] : []),
            ],
          },
        });

        if (!dbUser && effectiveEmail) {
          dbUser = await prisma.user.create({
            data: {
              name: effectiveName,
              email: effectiveEmail,
              clerkId: auth.clerkId || null,
              role: 'STUDENT',
            },
          });
        }
      } catch (dbUserErr) {
        console.warn('Could not resolve or create DB user in quiz submit:', (dbUserErr as Error).message);
      }
    }

    // Resolve optional cohort and course IDs safely
    let validCohortId: string | null = null;
    if (cohortId) {
      try {
        const cohortExists = await prisma.cohort.findUnique({ where: { id: cohortId } });
        if (cohortExists) validCohortId = cohortExists.id;
      } catch {}
    }

    let validCourseId: string | null = null;
    if (courseId) {
      try {
        const courseExists = await prisma.course.findFirst({
          where: { OR: [{ id: courseId }, { slug: courseId }] },
        });
        if (courseExists) validCourseId = courseExists.id;
      } catch {}
    }

    // 4. Save Quiz Attempt in Database (Recorded for both passed and failed attempts)
    let attemptId = `sub-${Date.now()}`;
    if (dbUser) {
      try {
        const attempt = await prisma.quizAttempt.create({
          data: {
            userId: dbUser.id,
            cohortId: validCohortId,
            quizId: masterQuiz?.id || null,
            score: correctCount,
            totalQuestions,
            scorePercentage,
            passed: isPassed,
            answersJson: answers,
          },
        });
        attemptId = attempt.id;
      } catch (persistErr) {
        console.warn('Quiz attempt DB persistence warning:', (persistErr as Error).message);
      }
    }

    // 5. If passed, generate & save Certificate in Database
    let certificate: CertificateResult | null = null;
    if (isPassed) {
      const codeRandom = Math.floor(1000 + Math.random() * 9000);
      const verificationCode = `VIAR-2026-WIA-${codeRandom}`;
      const verifySlug = `verify-${verificationCode.toLowerCase()}`;

      certificate = {
        id: `cert-${Date.now()}`,
        verificationCode,
        verifySlug,
        studentId: dbUser?.id || effectiveStudentId || `user-${Date.now()}`,
        studentName: effectiveName,
        studentEmail: effectiveEmail || 'student@example.com',
        courseTitle: 'The Ultimate Astrology Course: Foundations to Chart Mastery',
        cohortBatchName: 'Self-Paced Masterclass — Vihangam Institute of Astrology and Research',
        scorePercentage,
        grade,
        instructorName: 'Acharya Niraj Kumar',
        instructorTitle: 'Jyotish Acharya (Bharatiya Vidya Bhavan) | Founder, VIAR & Aapka Astro',
        issuedAt: new Date().toISOString(),
        verificationUrl: `${env.appUrl}/verify/${verificationCode}`,
      };

      if (dbUser) {
        try {
          const dbCert = await prisma.certificate.create({
            data: {
              userId: dbUser.id,
              courseId: validCourseId,
              cohortId: validCohortId,
              certificateNumber: verificationCode,
              verifySlug,
              grade,
              scorePercentage,
              instructorName: 'Acharya Niraj Kumar',
            },
          });
          certificate.id = dbCert.id;
        } catch (persistErr) {
          console.warn('Certificate DB persistence warning:', (persistErr as Error).message);
        }
      }

      // Dispatch Certificate Email notification
      if (effectiveEmail) {
        await emailService.sendCertificateIssued({
          studentName: effectiveName,
          studentEmail: effectiveEmail,
          courseTitle: 'The Ultimate Astrology Course: Foundations to Chart Mastery',
          certificateCode: verificationCode,
          certificateUrl: `${env.appUrl}/verify/${verificationCode}`,
          verifyUrl: `${env.appUrl}/verify/${verificationCode}`,
          scorePercentage,
          grade: (grade === 'Fail' ? 'Pass' : grade) as 'Distinction' | 'Merit' | 'Pass',
        }).catch((err) => console.error('[Quiz Submit] Certificate email dispatch failed:', err));
      }
    }

    logger.info('Quiz attempt graded successfully on server', {
      service: 'quiz',
      cohortId,
      studentEmail: effectiveEmail,
      score: correctCount,
      totalQuestions,
      scorePercentage,
      isPassed,
      grade,
      attemptId,
    });

    return NextResponse.json({
      success: true,
      attemptId,
      score: correctCount,
      totalQuestions,
      scorePercentage,
      isPassed,
      grade,
      certificate,
      explanations,
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
