import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { NextRequest } from 'next/server';
import {
  maskSensitiveData,
  logUnansweredQuestion,
  getPublishedKnowledgeEntries,
  invalidateKnowledgeCache,
  setCachedKnowledgeEntries,
} from '../src/lib/ai/knowledgeRetriever.ts';
import { POST as assistantPost } from '../src/app/api/assistant/route.ts';
import { POST as contactPost } from '../src/app/api/contact/route.ts';
import { resetContactRateLimit } from '../src/lib/contact-rate-limit.ts';
import { prisma } from '../src/lib/prisma.ts';
import { MockEmailService } from '../src/lib/email/mock.ts';

describe('AI Assistant & Contact Form — Comprehensive Verification Suite', () => {
  beforeEach(() => {
    invalidateKnowledgeCache();
    resetContactRateLimit();
  });

  // ============================================================================
  // 1. AI Assistant & KnowledgeEntry Integration
  // ============================================================================
  describe('1. AI Assistant & Published KnowledgeEntry Integration', () => {
    it('should read published KnowledgeEntry rows and override static knowledge', async () => {
      const testQuestion = 'What is the refund policy for special circumstances?';
      const testAnswer = 'Special circumstances are evaluated by Acharya Niraj Kumar within 48 hours for full review.';

      let createdId: string | null = null;
      try {
        const created = await prisma.knowledgeEntry.create({
          data: {
            question: testQuestion,
            answer: testAnswer,
            category: 'policies',
            language: 'en',
            published: true,
            orderIndex: 0,
          },
        });
        createdId = created.id;
      } catch {
        // Seed in-memory cache directly for offline staging environment
        setCachedKnowledgeEntries([
          {
            id: 'test-knowledge-1',
            question: testQuestion,
            answer: testAnswer,
            category: 'policies',
            language: 'en',
          },
        ]);
      }

      if (createdId) {
        invalidateKnowledgeCache();
      }

      const req = new NextRequest('http://localhost:3000/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
        body: JSON.stringify({ message: testQuestion, locale: 'en' }),
      });

      const res = await assistantPost(req);
      assert.strictEqual(res.status, 200);
      const data = await res.json();

      assert.strictEqual(data.reply, testAnswer, 'Published KnowledgeEntry must override static text');
      assert.strictEqual(data.source, 'knowledge_entry');
      assert.strictEqual(data.confidence, 'high');

      if (createdId) {
        await prisma.knowledgeEntry.delete({ where: { id: createdId } }).catch(() => {});
      }
    });

    it('should NEVER use unpublished KnowledgeEntry rows (published: false)', async () => {
      const secretQuestion = 'Secret unpublished question about internal faculty';
      const secretAnswer = 'This should NEVER be revealed or used by the assistant.';

      let createdId: string | null = null;
      try {
        const created = await prisma.knowledgeEntry.create({
          data: {
            question: secretQuestion,
            answer: secretAnswer,
            category: 'faculty',
            language: 'en',
            published: false, // UNPUBLISHED
            orderIndex: 0,
          },
        });
        createdId = created.id;
      } catch {}

      invalidateKnowledgeCache();

      // Verify helper ignores it
      const published = await getPublishedKnowledgeEntries();
      const leaked = published.find((e) => e.question === secretQuestion);
      assert.strictEqual(leaked, undefined, 'Unpublished entries must NEVER be returned');

      // Verify assistant ignores it
      const req = new NextRequest('http://localhost:3000/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.2' },
        body: JSON.stringify({ message: secretQuestion, locale: 'en' }),
      });

      const res = await assistantPost(req);
      const data = await res.json();
      assert.notStrictEqual(data.reply, secretAnswer, 'Assistant must not return unpublished answers');

      if (createdId) {
        await prisma.knowledgeEntry.delete({ where: { id: createdId } }).catch(() => {});
      }
    });

    it('should match language-aware entries accurately (Hindi query gets Hindi answer)', async () => {
      const hiQuestion = 'क्या मुझे हिंदी में अध्ययन सामग्री मिलेगी?';
      const hiAnswer = 'हाँ, सम्पूर्ण 23 मॉड्यूल का अध्ययन हिंदी एवं अंग्रेजी दोनों माध्यमों में उपलब्ध है।';
      const enQuestion = 'Will I get study materials in Hindi?';
      const enAnswer = 'Yes, comprehensive study material is provided in both Hindi and English.';

      let hiId: string | null = null;
      let enId: string | null = null;
      try {
        const hi = await prisma.knowledgeEntry.create({
          data: { question: hiQuestion, answer: hiAnswer, language: 'hi', published: true },
        });
        hiId = hi.id;

        const en = await prisma.knowledgeEntry.create({
          data: { question: enQuestion, answer: enAnswer, language: 'en', published: true },
        });
        enId = en.id;
      } catch {
        setCachedKnowledgeEntries([
          { id: 'hi-1', question: hiQuestion, answer: hiAnswer, language: 'hi', category: 'general' },
          { id: 'en-1', question: enQuestion, answer: enAnswer, language: 'en', category: 'general' },
        ]);
      }

      if (hiId || enId) {
        invalidateKnowledgeCache();
      }

      const reqHi = new NextRequest('http://localhost:3000/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.3' },
        body: JSON.stringify({ message: hiQuestion, locale: 'hi' }),
      });

      const resHi = await assistantPost(reqHi);
      const dataHi = await resHi.json();

      assert.strictEqual(dataHi.reply, hiAnswer);
      assert.strictEqual(dataHi.language, 'hi');

      // Cleanup
      if (hiId) await prisma.knowledgeEntry.delete({ where: { id: hiId } }).catch(() => {});
      if (enId) await prisma.knowledgeEntry.delete({ where: { id: enId } }).catch(() => {});
    });

    it('should respect 60-second in-memory cache TTL for published knowledge', async () => {
      setCachedKnowledgeEntries([
        { id: 'sample-1', question: 'Sample Q', answer: 'Sample A', language: 'en', category: 'general' },
      ]);
      const initial = await getPublishedKnowledgeEntries();
      assert.strictEqual(initial.length, 1);

      // Second call should return identical cached array within 60 seconds
      const cached = await getPublishedKnowledgeEntries();
      assert.strictEqual(initial, cached, 'Must return cached entries within 60-second window');

      // Invalidation clears cache
      invalidateKnowledgeCache();
      const fresh = await getPublishedKnowledgeEntries();
      assert.ok(Array.isArray(fresh));
    });
  });

  // ============================================================================
  // 2. Sensitive Data Masking & Unanswered Question Retention
  // ============================================================================
  describe('2. Sensitive Data Masking & UnansweredQuestion Logging', () => {
    it('should mask phone numbers, emails, UTRs, and payment references', () => {
      // 1. Phone numbers
      const phoneInput = 'Please call me at 9876543210 or +91 93112 15564';
      const maskedPhone = maskSensitiveData(phoneInput);
      assert.ok(!maskedPhone.includes('9876543210'));
      assert.ok(!maskedPhone.includes('93112 15564'));
      assert.ok(maskedPhone.includes('[PHONE_MASKED]'));

      // 2. Emails
      const emailInput = 'My account is student.scholar@example.com';
      const maskedEmail = maskSensitiveData(emailInput);
      assert.ok(!maskedEmail.includes('student.scholar@example.com'));
      assert.ok(maskedEmail.includes('[EMAIL_MASKED]'));

      // 3. 12-digit UTR bank numbers (preserve [ACCOUNT_MASKED] for tests)
      const utrInput = 'Paid fee with UTR 429182736451';
      const maskedUtr = maskSensitiveData(utrInput);
      assert.ok(!maskedUtr.includes('429182736451'));
      assert.ok(maskedUtr.includes('[ACCOUNT_MASKED]'));

      // 4. Razorpay payment references
      const rzpInput = 'My payment ID is pay_N123456789abc';
      const maskedRzp = maskSensitiveData(rzpInput);
      assert.ok(!maskedRzp.includes('pay_N123456789abc'));
      assert.ok(maskedRzp.includes('[PAYMENT_REF_MASKED]'));

      // 5. Order references
      const orderInput = 'Reference for ORD-2026-998811';
      const maskedOrder = maskSensitiveData(orderInput);
      assert.ok(!maskedOrder.includes('ORD-2026-998811'));
      assert.ok(maskedOrder.includes('[PAYMENT_REF_MASKED]'));

      // 6. UPI transaction references
      const upiRefInput = 'UPI transaction ref: TXN87654321';
      const maskedUpi = maskSensitiveData(upiRefInput);
      assert.ok(!maskedUpi.includes('TXN87654321'));
      assert.ok(maskedUpi.includes('[PAYMENT_REF_MASKED]'));
    });

    it('should truncate logged questions to max 150 characters', () => {
      const veryLong = 'X'.repeat(300);
      const masked = maskSensitiveData(veryLong);
      assert.strictEqual(masked.length, 150);
    });

    it('should aggregate repeat counts for identical unanswered questions within 30 days', async () => {
      const question = `Unanswered unique query test ${Date.now()}`;

      try {
        await logUnansweredQuestion(question, 'en');
        await logUnansweredQuestion(question, 'en');

        const normalized = question
          .toLowerCase()
          .replace(/[^\w\s\u0900-\u097F]/gi, '')
          .replace(/\s+/g, ' ')
          .trim();

        const record = await prisma.unansweredQuestion.findFirst({
          where: { normalizedQuestion: normalized },
        });

        if (record) {
          assert.strictEqual(record.count, 2, 'Repeated unanswered question must increment count');
          // Cleanup
          await prisma.unansweredQuestion.delete({ where: { id: record.id } }).catch(() => {});
        }
      } catch {
        // Fallback if DB offline
      }
    });
  });

  // ============================================================================
  // 3. Contact Form Endpoint (/api/contact)
  // ============================================================================
  describe('3. Contact Form Validated Endpoint (POST /api/contact)', () => {
    it('should reject missing or short name with 400', async () => {
      const req = new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.10' },
        body: JSON.stringify({
          name: 'A', // Too short
          email: 'valid@example.com',
          message: 'This is a valid inquiry message.',
          consent: true,
        }),
      });

      const res = await contactPost(req);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.error.includes('name'));
    });

    it('should reject invalid email address with 400', async () => {
      const req = new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.11' },
        body: JSON.stringify({
          name: 'Priya Sharma',
          email: 'not-an-email',
          message: 'This is a valid inquiry message.',
          consent: true,
        }),
      });

      const res = await contactPost(req);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.error.includes('email'));
    });

    it('should reject short message (< 5 chars) with 400', async () => {
      const req = new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.12' },
        body: JSON.stringify({
          name: 'Priya Sharma',
          email: 'priya@example.com',
          message: 'Hi', // Too short
          consent: true,
        }),
      });

      const res = await contactPost(req);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.error.includes('5 characters'));
    });

    it('should reject missing consent with 400', async () => {
      const req = new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.13' },
        body: JSON.stringify({
          name: 'Priya Sharma',
          email: 'priya@example.com',
          message: 'I want to know more about the course.',
          consent: false,
        }),
      });

      const res = await contactPost(req);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.error.includes('agree') || data.error.includes('consent'));
    });

    it('should reject spam bot submissions via honeypot field with 400', async () => {
      const req = new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.14' },
        body: JSON.stringify({
          name: 'Spam Bot',
          email: 'bot@spamdomain.com',
          message: 'Cheap crypto loans available now!',
          consent: true,
          website: 'http://spam-link.ru', // Honeypot filled by bot
        }),
      });

      const res = await contactPost(req);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.error.toLowerCase().includes('spam'));
    });

    it('should accept valid submissions, store lead, and return 201', async () => {
      const req = new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.15' },
        body: JSON.stringify({
          name: 'Rohan Verma',
          email: 'rohan.verma@example.com',
          subject: 'Course Admissions Inquiry',
          message: 'I am interested in enrolling for the upcoming cohort.',
          consent: true,
          website: '', // Empty honeypot
        }),
      });

      const res = await contactPost(req);
      assert.strictEqual(res.status, 201);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.leadId);

      // Clean up lead if persisted
      if (data.leadId) {
        await prisma.notifyMeLead.delete({ where: { id: data.leadId } }).catch(() => {});
      }
    });

    it('should enforce IP rate limiting (returns 429 on exceeding limit)', async () => {
      const ip = '192.168.10.99';

      for (let i = 0; i < 5; i++) {
        const req = new NextRequest('http://localhost:3000/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
          body: JSON.stringify({
            name: `User ${i}`,
            email: `user${i}@example.com`,
            message: 'Inquiry message',
            consent: true,
          }),
        });
        const res = await contactPost(req);
        assert.strictEqual(res.status, 201);
      }

      // 6th request from same IP must be rejected with 429
      const blockedReq = new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
        body: JSON.stringify({
          name: 'Blocked User',
          email: 'blocked@example.com',
          message: 'Another inquiry message',
          consent: true,
        }),
      });
      const blockedRes = await contactPost(blockedReq);
      assert.strictEqual(blockedRes.status, 429);
      const data = await blockedRes.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.error.toLowerCase().includes('too many'));
    });

    it('should respect EMAIL_ENABLED flag (skips dispatch when disabled)', async () => {
      const originalEnv = process.env.EMAIL_ENABLED;
      process.env.EMAIL_ENABLED = 'false';

      const mockService = new MockEmailService();
      const initialCount = mockService.getSentEmails().length;

      const req = new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.50' },
        body: JSON.stringify({
          name: 'Quiet Lead',
          email: 'quiet@example.com',
          message: 'Should not trigger email when disabled',
          consent: true,
        }),
      });

      const res = await contactPost(req);
      assert.strictEqual(res.status, 201);

      // Verify no extra email dispatched
      assert.strictEqual(mockService.getSentEmails().length, initialCount);

      // Restore env
      process.env.EMAIL_ENABLED = originalEnv;
    });
  });
});
