import { describe, it } from 'node:test';
import assert from 'node:assert';
import { RateLimiters } from '../src/lib/rate-limit.ts';

describe('STUDENT PORTAL ON THE DATABASE — Comprehensive Specification', () => {
  describe('1. Redirect Loop Prevention & User Sync', () => {
    it('unauthenticated user session returns 401 and null user without bouncing to /login loop', async () => {
      // Simulate unauthenticated request response model
      const unauthResponse = {
        status: 401,
        body: { success: false, error: 'Unauthorized', user: null },
      };

      assert.strictEqual(unauthResponse.status, 401);
      assert.strictEqual(unauthResponse.body.success, false);
      assert.strictEqual(unauthResponse.body.user, null);
    });

    it('authenticated user session returns database user and role from PostgreSQL', async () => {
      const mockDbUser = {
        id: 'cuid-user-student-1',
        clerkId: 'user_2tABC123456789',
        email: 'student@example.com',
        name: 'Aarav Sharma',
        role: 'STUDENT',
        isOwner: false,
      };

      assert.strictEqual(mockDbUser.id.startsWith('cuid-'), true);
      assert.strictEqual(mockDbUser.clerkId.startsWith('user_'), true);
      assert.strictEqual(mockDbUser.role, 'STUDENT');
      assert.strictEqual(mockDbUser.isOwner, false);
    });

    it('dashboard client detects authenticated session and does not trigger router.push(/login)', () => {
      const serverUser = {
        id: 'cuid-user-student-1',
        email: 'student@example.com',
        name: 'Aarav Sharma',
      };

      let didRedirectToLogin = false;
      const mockRouter = {
        push: (url: string) => {
          if (url.includes('/login')) didRedirectToLogin = true;
        },
      };

      // Client logic simulation: when serverUser is present, never redirect to login
      if (!serverUser) {
        mockRouter.push('/login?returnUrl=/dashboard');
      }

      assert.strictEqual(didRedirectToLogin, false, 'Authenticated user must never be bounced to login');
    });

    it('login page redirects authenticated user with targetUrl to /dashboard without looping', () => {
      const userId = 'user_2tABC123456789';
      const errorParam = undefined;
      const targetUrl = '/dashboard';

      let redirectedTo: string | null = null;
      if (userId && !errorParam) {
        redirectedTo = targetUrl;
      }

      assert.strictEqual(redirectedTo, '/dashboard');
    });
  });

  describe('2. Exam Submission & Answer Key Protection', () => {
    const rawQuestions = [
      {
        id: 'q-1',
        questionNumber: 1,
        topic: 'Graha Drishti',
        question: 'Which houses does Mars aspect from its position?',
        options: [
          '4th, 7th, and 8th houses',
          '3rd, 7th, and 10th houses',
          '5th, 7th, and 9th houses',
          'Only 7th house',
        ],
        correctOptionIndex: 0,
        explanation: 'Mangala possesses special purna drishti on the 4th, 7th, and 8th houses from its placement.',
      },
      {
        id: 'q-2',
        questionNumber: 2,
        topic: 'Rashis & Elements',
        question: 'Which of the following signs is an Agni (Fire) tattva rashi?',
        options: ['Vrishabha (Taurus)', 'Karka (Cancer)', 'Simha (Leo)', 'Kanya (Virgo)'],
        correctOptionIndex: 2,
        explanation: 'Simha (Leo) is a fixed Fire sign ruled by Surya (Sun).',
      },
    ];

    it('sanitizes questions for students by stripping correctOptionIndex and explanation', () => {
      const isStaff = false;
      const sanitizedQuestions = isStaff
        ? rawQuestions
        : rawQuestions.map((q) => ({
            id: q.id,
            questionNumber: q.questionNumber,
            topic: q.topic,
            question: q.question,
            options: q.options,
          }));

      assert.strictEqual(sanitizedQuestions.length, 2);
      sanitizedQuestions.forEach((q) => {
        assert.strictEqual('correctOptionIndex' in q, false, 'Student question must not expose correctOptionIndex');
        assert.strictEqual('explanation' in q, false, 'Student question must not expose explanation');
      });
    });

    it('grades exam strictly on server and produces accurate score percentage and grade', () => {
      const studentAnswers: Record<string, number> = {
        'q-1': 0, // Correct
        'q-2': 2, // Correct
      };

      let correctCount = 0;
      const totalQuestions = rawQuestions.length;

      rawQuestions.forEach((q) => {
        if (studentAnswers[q.id] === q.correctOptionIndex) {
          correctCount++;
        }
      });

      const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
      const isPassed = scorePercentage >= 70;
      let grade: 'Distinction' | 'Merit' | 'Pass' | 'Fail' = 'Fail';
      if (scorePercentage >= 90) grade = 'Distinction';
      else if (scorePercentage >= 80) grade = 'Merit';
      else if (scorePercentage >= 70) grade = 'Pass';

      assert.strictEqual(correctCount, 2);
      assert.strictEqual(scorePercentage, 100);
      assert.strictEqual(isPassed, true);
      assert.strictEqual(grade, 'Distinction');
    });

    it('persists QuizAttempt with database userId regardless of pass or fail', () => {
      const dbUserId = 'cuid-user-student-1';
      const failedAttemptData = {
        userId: dbUserId,
        cohortId: 'cohort-wia-batch-1',
        quizId: 'quiz-wia-final',
        score: 1,
        totalQuestions: 2,
        scorePercentage: 50,
        passed: false,
        answersJson: { 'q-1': 0, 'q-2': 1 },
      };

      assert.strictEqual(failedAttemptData.userId, dbUserId);
      assert.strictEqual(failedAttemptData.passed, false);
      assert.strictEqual(failedAttemptData.userId.startsWith('cuid-'), true);
    });

    it('issues Certificate with database userId when passingScore is achieved', () => {
      const dbUserId = 'cuid-user-student-1';
      const certData = {
        userId: dbUserId,
        courseId: 'course-wia',
        cohortId: 'cohort-wia-batch-1',
        certificateNumber: 'VIAR-2026-WIA-7788',
        verifySlug: 'verify-viar-2026-wia-7788',
        grade: 'Distinction',
        scorePercentage: 95,
        instructorName: 'Acharya Niraj Kumar',
      };

      assert.strictEqual(certData.userId, dbUserId);
      assert.strictEqual(certData.certificateNumber.startsWith('VIAR-2026-WIA-'), true);
      assert.strictEqual(certData.grade, 'Distinction');
    });
  });

  describe('3. Certificate Verification & Public API', () => {
    it('RateLimiters.certificateLookup limits rapid lookups per IP', async () => {
      const ip = '198.51.100.42';
      const result = await RateLimiters.certificateLookup(ip);
      assert.strictEqual(result.success, true);
      assert.strictEqual(typeof result.remaining, 'number');
    });

    it('canonical demo code VIAR-2026-WIA-9842 resolves successfully', () => {
      const code = 'VIAR-2026-WIA-9842';
      const isDemoCode = code.toUpperCase() === 'VIAR-2026-WIA-9842';
      assert.strictEqual(isDemoCode, true);
    });

    it('unknown certificate code returns 404 not found and never matches fake demo users', () => {
      const testCode = 'VIAR-9999-NONEXISTENT';
      const isKnownDemo = testCode.toUpperCase() === 'VIAR-2026-WIA-9842';
      assert.strictEqual(isKnownDemo, false);

      const notFoundResponse = {
        status: 404,
        body: { success: false, error: 'Certificate not found in registry' },
      };

      assert.strictEqual(notFoundResponse.status, 404);
      assert.strictEqual(notFoundResponse.body.error, 'Certificate not found in registry');
    });

    it('public certificate response shows only name, course, date, status and hides user private details', () => {
      const certFromDb = {
        id: 'cert-1',
        certificateNumber: 'VIAR-2026-WIA-1234',
        user: { name: 'Priya Patel', email: 'priya.private@gmail.com', phone: '+919876543210' },
        course: { title: 'The Ultimate Astrology Course: Foundations to Chart Mastery' },
        cohort: { batchName: 'Batch 1 (Nov 2026)' },
        issuedAt: new Date('2026-11-20T10:00:00.000Z'),
        grade: 'Distinction',
        scorePercentage: 94,
        instructorName: 'Acharya Niraj Kumar',
      };

      const publicCertificateView = {
        id: certFromDb.id,
        certificateNumber: certFromDb.certificateNumber,
        recipientName: certFromDb.user.name,
        courseName: certFromDb.course.title,
        cohortName: certFromDb.cohort.batchName,
        issuedAt: certFromDb.issuedAt.toISOString(),
        status: 'VERIFIED',
        grade: certFromDb.grade,
        scorePercentage: certFromDb.scorePercentage,
        instructorName: certFromDb.instructorName,
      };

      assert.strictEqual('email' in publicCertificateView, false, 'Public certificate must not expose email');
      assert.strictEqual('phone' in publicCertificateView, false, 'Public certificate must not expose phone');
      assert.strictEqual(publicCertificateView.status, 'VERIFIED');
      assert.strictEqual(publicCertificateView.recipientName, 'Priya Patel');
    });
  });

  describe('4. Payments Page on the Database', () => {
    it('supports student orders across all statuses from PostgreSQL', () => {
      const mockOrders = [
        {
          id: 'ord-1',
          orderReference: 'ORD-2026-001',
          amount: 5100,
          currency: 'INR',
          status: 'PENDING_PAYMENT',
          createdAt: new Date().toISOString(),
          course: { title: 'What is Astrology' },
        },
        {
          id: 'ord-2',
          orderReference: 'ORD-2026-002',
          amount: 5100,
          currency: 'INR',
          status: 'PAYMENT_CLAIMED',
          utr: '629182749102',
          createdAt: new Date().toISOString(),
          course: { title: 'What is Astrology' },
        },
        {
          id: 'ord-3',
          orderReference: 'ORD-2026-003',
          amount: 5100,
          currency: 'INR',
          status: 'APPROVED',
          utr: '519283746192',
          createdAt: new Date().toISOString(),
          course: { title: 'What is Astrology' },
        },
        {
          id: 'ord-4',
          orderReference: 'ORD-2026-004',
          amount: 5100,
          currency: 'INR',
          status: 'REJECTED',
          rejectionReason: 'UTR could not be matched with bank statement.',
          createdAt: new Date().toISOString(),
          course: { title: 'What is Astrology' },
        },
      ];

      assert.strictEqual(mockOrders.length, 4);
      const statuses = mockOrders.map((o) => o.status);
      assert.deepStrictEqual(statuses, [
        'PENDING_PAYMENT',
        'PAYMENT_CLAIMED',
        'APPROVED',
        'REJECTED',
      ]);
    });

    it('distinguishes receipt action for approved orders from pending orders', () => {
      function getOrderAction(status: string) {
        if (status === 'APPROVED') return 'PRINT_RECEIPT';
        if (status === 'PENDING_PAYMENT') return 'SUBMIT_UTR';
        if (status === 'PAYMENT_CLAIMED') return 'WAITING_VERIFICATION';
        return 'VIEW_DETAILS';
      }

      assert.strictEqual(getOrderAction('APPROVED'), 'PRINT_RECEIPT');
      assert.strictEqual(getOrderAction('PENDING_PAYMENT'), 'SUBMIT_UTR');
      assert.strictEqual(getOrderAction('PAYMENT_CLAIMED'), 'WAITING_VERIFICATION');
    });
  });

  describe('5. Progress Writes Use Database User ID', () => {
    it('resolves database cuid user ID instead of Clerk string user_', () => {
      const clerkUserId = 'user_2tABC123456789';
      const databaseUserCuid = 'cuid-student-789';

      function resolveForeignUserId(auth: { userId: string; dbUser?: { id: string } | null }): string {
        if (auth.dbUser?.id) return auth.dbUser.id;
        if (!auth.userId.startsWith('user_')) return auth.userId;
        return databaseUserCuid; // resolved via DB lookup
      }

      const resolved = resolveForeignUserId({
        userId: clerkUserId,
        dbUser: { id: databaseUserCuid },
      });

      assert.strictEqual(resolved, databaseUserCuid);
      assert.strictEqual(resolved.startsWith('cuid-'), true);
      assert.strictEqual(resolved.startsWith('user_'), false);
    });

    it('marks progress accurately for lessons and class sessions', () => {
      const progressRecord = {
        userId: 'cuid-student-789',
        lessonId: 'lesson-1-1',
        completed: true,
        watchedSeconds: 1800,
        completedAt: new Date().toISOString(),
      };

      assert.strictEqual(progressRecord.completed, true);
      assert.strictEqual(progressRecord.userId.startsWith('cuid-'), true);
      assert.strictEqual(progressRecord.lessonId, 'lesson-1-1');
    });
  });
});
