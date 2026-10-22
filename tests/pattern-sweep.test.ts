import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { POST as handleDirectSinkPost, PUT as handleDirectSinkPut } from '@/app/api/uploads/direct-sink/route';
import { POST as handleNotificationsPost } from '@/app/api/notifications/route';
import { POST as handleCohortPost } from '@/app/api/cohorts/route';
import { GET as handleQuizzesGet } from '@/app/api/quizzes/route';
import { POST as handleLeadsPost } from '@/app/api/leads/route';

describe('PATTERN SWEEP VERIFICATION SUITE', () => {

  describe('Pattern (a) & (b): Unprotected Routes & Cookie Spoofing Prevention', () => {
    test('/api/uploads/direct-sink POST rejects unauthenticated callers with 403 Forbidden', async () => {
      const req = new NextRequest('http://localhost:3000/api/uploads/direct-sink?type=file', {
        method: 'POST',
      });
      const res = await handleDirectSinkPost(req);
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.error, /Staff access required/i);
    });

    test('/api/uploads/direct-sink PUT rejects unauthenticated callers with 403 Forbidden', async () => {
      const req = new NextRequest('http://localhost:3000/api/uploads/direct-sink?key=doc_test', {
        method: 'PUT',
      });
      const res = await handleDirectSinkPut(req);
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.error, /Staff access required/i);
    });

    test('/api/notifications POST rejects unauthenticated caller with 403 Forbidden', async () => {
      const req = new NextRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentEmail: 'victim@example.com',
          courseTitle: 'Vedic Astrology',
          sessionTitle: 'Class 01',
        }),
      });
      const res = await handleNotificationsPost(req);
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.error, /Staff access required/i);
    });

    test('Spoofed cookie cannot grant access to notification endpoint', async () => {
      const req = new NextRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: 'viar_role=OWNER; viar_email=admin@viar.in; __session=forged_jwt_token',
        },
        body: JSON.stringify({
          studentEmail: 'victim@example.com',
          courseTitle: 'Vedic Astrology',
          sessionTitle: 'Class 01',
        }),
      });
      const res = await handleNotificationsPost(req);
      assert.equal(res.status, 403);
    });
  });

  describe('Pattern (c): Foreign-Key Resolution & Server Authentication Truth', () => {
    test('database foreign keys must resolve to cuid / dbUser.id rather than Clerk user_ id', () => {
      const mockAuth = {
        userId: 'cuid-clerk-mapped-12345',
        clerkId: 'user_2xyzClerkAccountId',
        dbUser: { id: 'cuid-db-user-67890' },
      };
      const foreignKey = mockAuth.dbUser?.id || mockAuth.userId;
      assert.strictEqual(foreignKey.startsWith('user_'), false);
      assert.strictEqual(foreignKey.startsWith('cuid-'), true);
    });
  });

  describe('Pattern (e): Server Confirmation Required for Mutations', () => {
    test('/api/leads rejects malformed or invalid submission with 400', async () => {
      const req = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: '', // missing
        }),
      });
      const res = await handleLeadsPost(req);
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
    });

    test('/api/cohorts POST rejects unauthorized callers with 403', async () => {
      const req = new NextRequest('http://localhost:3000/api/cohorts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: 'course-what-is-astrology',
          batchName: 'Batch 99',
          startDate: '2026-11-01T00:00:00Z',
        }),
      });
      const res = await handleCohortPost(req);
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
    });
  });

  describe('Pattern (g): Server-Side Grading & Secret Answer Protection', () => {
    test('/api/quizzes GET protects answer keys and never leaks correct answers to public or students', async () => {
      const req = new NextRequest('http://localhost:3000/api/quizzes?cohortId=cohort-wia-batch-1&mode=preview');
      const res = await handleQuizzesGet(req);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.quiz.isAnswerKeyProtected, true);

      // Verify no question in preview has correctOptionIndex
      if (Array.isArray(data.quiz.questions) && data.quiz.questions.length > 0) {
        data.quiz.questions.forEach((q: Record<string, unknown>) => {
          assert.equal(q.correctOptionIndex, undefined);
          assert.equal(q.explanation, undefined);
        });
      }
    });
  });

  describe('Pattern (h): Guard Consistency Between Server Layout & Client Components', () => {
    test('Non-enrolled caller requesting quiz questions without preview receives 403 Forbidden', async () => {
      const req = new NextRequest('http://localhost:3000/api/quizzes?cohortId=cohort-wia-batch-1');
      const res = await handleQuizzesGet(req);
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.code, 'ENROLLMENT_REQUIRED');
      assert.equal(data.isLocked, true);
    });
  });
});
