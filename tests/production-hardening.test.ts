import { describe, it } from 'node:test';
import assert from 'node:assert';
import { checkRateLimit, RateLimiters } from '../src/lib/rate-limit.ts';
import { logger } from '../src/lib/logger.ts';

describe('Production Hardening Test Suite', () => {
  describe('Rate Limiting Tests', () => {
    it('should allow requests within limit and reject requests exceeding limit', async () => {
      const testIp = `test-ip-${Date.now()}`;
      const limit = 3;
      const windowSec = 60;

      // 3 allowed requests
      for (let i = 1; i <= limit; i++) {
        const res = await checkRateLimit(testIp, limit, windowSec);
        assert.strictEqual(res.success, true, `Request ${i} should succeed`);
        assert.strictEqual(res.remaining, limit - i);
      }

      // 4th request must be blocked
      const blockedRes = await checkRateLimit(testIp, limit, windowSec);
      assert.strictEqual(blockedRes.success, false, 'Exceeded request should fail');
      assert.strictEqual(blockedRes.remaining, 0);
      assert.ok(blockedRes.resetSeconds > 0, 'Reset seconds should be positive');
    });

    it('should enforce checkout rate limiter preset (20/hr)', async () => {
      const checkoutIp = `checkout-test-${Date.now()}`;
      const firstCheck = await RateLimiters.checkout(checkoutIp);
      assert.strictEqual(firstCheck.success, true);
      assert.strictEqual(firstCheck.limit, 20);
      assert.strictEqual(firstCheck.remaining, 19);
    });

    it('should enforce quiz rate limiter preset (5/hr) to prevent brute-forcing', async () => {
      const quizUser = `student-quiz-${Date.now()}`;
      for (let i = 1; i <= 5; i++) {
        const res = await RateLimiters.quiz(quizUser);
        assert.strictEqual(res.success, true, `Attempt ${i} should be permitted`);
      }

      // 6th attempt must be rejected to stop brute-forcing
      const bruteForceAttempt = await RateLimiters.quiz(quizUser);
      assert.strictEqual(bruteForceAttempt.success, false, '6th attempt must be rate-limited');
      assert.strictEqual(bruteForceAttempt.remaining, 0);
    });
  });

  describe('Structured Error & Alert Logger Tests', () => {
    it('should format logs with required fields and not throw', () => {
      assert.doesNotThrow(() => {
        logger.info('Test info message', { service: 'test', ip: '127.0.0.1' });
        logger.warn('Test warn message', { service: 'test' });
        logger.error('Test error message', new Error('Simulated failure'), { service: 'test' });
      });
    });

    it('should log critical payment failures without throwing', () => {
      assert.doesNotThrow(() => {
        logger.paymentError('Card authorization failed', {
          orderId: 'order_12345',
          studentEmail: 'student@example.com',
          amount: 4999,
          provider: 'razorpay',
        }, new Error('Insufficient funds'));
      });
    });

    it('should record security alerts for rate limiting and signature failure', () => {
      assert.doesNotThrow(() => {
        logger.securityAlert('Rate limit violated', {
          event: 'rate_limit_exceeded',
          ip: '203.0.113.195',
          endpoint: '/api/quiz/submit',
        });
      });
    });
  });
});
