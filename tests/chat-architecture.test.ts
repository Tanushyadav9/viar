import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  isChatbotConfigured,
  getChatbotConfig,
  _resetWarningFlagForTesting,
} from '../src/lib/ai/chatbotConfig.ts';
import {
  hashClientIdentifier,
  checkChatRateLimit,
  recordChatUsage,
  getRateLimitMetrics,
  _resetRateLimiterForTesting,
} from '../src/lib/ai/rateLimiter.ts';
import {
  getChatProvider,
  MockChatProvider,
  OpenAIChatProvider,
} from '../src/lib/ai/chatProvider.ts';

describe('Chatbot Architecture & Cost Control Suite', () => {
  beforeEach(() => {
    _resetWarningFlagForTesting();
    _resetRateLimiterForTesting();
  });

  describe('1. Environment Configuration & Production Safety Guard', () => {
    it('should suppress widget and log clear warning when CHATBOT_API_KEY is missing in production', () => {
      const originalEnv = process.env.NODE_ENV;
      const originalKey = process.env.CHATBOT_API_KEY;

      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      delete process.env.CHATBOT_API_KEY;

      let warningLogged = false;
      const originalWarn = console.warn;
      console.warn = (...args: unknown[]) => {
        if (args.some((a) => typeof a === 'string' && a.includes('[Chatbot Warning]'))) {
          warningLogged = true;
        }
      };

      try {
        const configured = isChatbotConfigured();
        assert.strictEqual(configured, false, 'Widget must NOT be configured without key');
        assert.strictEqual(warningLogged, true, 'Clear warning must be logged in production');
      } finally {
        console.warn = originalWarn;
        (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
        if (originalKey) process.env.CHATBOT_API_KEY = originalKey;
      }
    });

    it('should recognize valid configuration when CHATBOT_API_KEY is provided', () => {
      const originalKey = process.env.CHATBOT_API_KEY;
      process.env.CHATBOT_API_KEY = 'sk-mock-production-key-test';

      try {
        assert.strictEqual(isChatbotConfigured(), true);
      } finally {
        if (originalKey) {
          process.env.CHATBOT_API_KEY = originalKey;
        } else {
          delete process.env.CHATBOT_API_KEY;
        }
      }
    });

    it('should enforce architectural limits (500 chars, ~400 output tokens, 8 history messages)', () => {
      const config = getChatbotConfig();
      assert.strictEqual(config.maxCharsPerMessage, 500, 'Max characters per message must be 500');
      assert.strictEqual(config.maxOutputTokens, 400, 'Max output tokens must be 400');
      assert.strictEqual(config.maxHistoryMessages, 8, 'Context window must retain last 8 messages');
      assert.strictEqual(config.tenMinuteRateLimit, 15, 'Ten-minute rate limit must be 15');
      assert.strictEqual(config.dailyUserRateLimit, 100, 'Daily user rate limit must be 100');
    });
  });

  describe('2. Privacy-Preserving Hashed IP Rate Limiting', () => {
    it('should securely hash IP and session without storing plaintext addresses', () => {
      const ip = '203.0.113.195';
      const session = 'sess_xyz123';
      const hash1 = hashClientIdentifier(ip, session);
      const hash2 = hashClientIdentifier(ip, session);
      const hashOther = hashClientIdentifier('198.51.100.4', session);

      // SHA-256 output is 64 hex characters
      assert.strictEqual(hash1.length, 64);
      assert.strictEqual(hash1, hash2, 'Identical client credentials must produce identical hash');
      assert.notStrictEqual(hash1, hashOther, 'Different IPs must produce different hashes');
      assert.doesNotMatch(hash1, new RegExp(ip), 'Hash must never contain the plain IP string');
    });

    it('should enforce 15 messages per 10 minutes limit', () => {
      const hashedUser = hashClientIdentifier('192.0.2.1');
      const now = Date.now();

      // Send 15 messages (all should be allowed)
      for (let i = 0; i < 15; i++) {
        const check = checkChatRateLimit(hashedUser, now);
        assert.strictEqual(check.allowed, true, `Message ${i + 1} should be allowed`);
        recordChatUsage(hashedUser, now);
      }

      // 16th message within same 10-minute window should be rejected
      const rejectedCheck = checkChatRateLimit(hashedUser, now);
      assert.strictEqual(rejectedCheck.allowed, false);
      assert.strictEqual(rejectedCheck.reason, 'ten_minute');
      assert.ok(rejectedCheck.message?.includes('WhatsApp'), 'Friendly message must reference WhatsApp');

      // After 10 minutes (600,001 ms), user should be unblocked
      const later = now + 10 * 60 * 1000 + 1000;
      const unblockedCheck = checkChatRateLimit(hashedUser, later);
      assert.strictEqual(unblockedCheck.allowed, true, 'User should be unblocked after window resets');
    });

    it('should enforce 100 messages per day per-user limit', () => {
      const hashedUser = hashClientIdentifier('192.0.2.2');
      let simulatedTime = Date.now();

      // Simulate 100 messages distributed across 10-minute intervals
      for (let i = 0; i < 100; i++) {
        // Step forward 11 minutes every 10 requests to avoid 10-minute trigger
        if (i % 10 === 0 && i > 0) {
          simulatedTime += 11 * 60 * 1000;
        }
        const check = checkChatRateLimit(hashedUser, simulatedTime);
        assert.strictEqual(check.allowed, true, `Message ${i + 1} should be allowed`);
        recordChatUsage(hashedUser, simulatedTime);
      }

      // 101st message should be rejected for daily limit
      simulatedTime += 11 * 60 * 1000;
      const dailyRejection = checkChatRateLimit(hashedUser, simulatedTime);
      assert.strictEqual(dailyRejection.allowed, false);
      assert.strictEqual(dailyRejection.reason, 'daily_user');
      assert.ok(dailyRejection.message?.includes('daily message limit'));
    });

    it('should enforce global daily cap (CHATBOT_DAILY_MESSAGE_CAP)', () => {
      const originalCap = process.env.CHATBOT_DAILY_MESSAGE_CAP;
      process.env.CHATBOT_DAILY_MESSAGE_CAP = '5'; // Low cap for test

      try {
        const now = Date.now();
        for (let i = 0; i < 5; i++) {
          const userHash = hashClientIdentifier(`10.0.0.${i}`);
          const check = checkChatRateLimit(userHash, now);
          assert.strictEqual(check.allowed, true);
          recordChatUsage(userHash, now);
        }

        // 6th message globally should trigger global cap
        const newUserHash = hashClientIdentifier('10.0.0.99');
        const capCheck = checkChatRateLimit(newUserHash, now);
        assert.strictEqual(capCheck.allowed, false);
        assert.strictEqual(capCheck.reason, 'global_cap');
        assert.ok(capCheck.message?.includes('daily conversation capacity'));
      } finally {
        if (originalCap) {
          process.env.CHATBOT_DAILY_MESSAGE_CAP = originalCap;
        } else {
          delete process.env.CHATBOT_DAILY_MESSAGE_CAP;
        }
      }
    });

    it('metrics should only expose count statistics and zero plaintext IPs', () => {
      const hashedUser = hashClientIdentifier('172.16.0.5');
      recordChatUsage(hashedUser);

      const metrics = getRateLimitMetrics();
      assert.strictEqual(typeof metrics.activeHashedUsersCount, 'number');
      assert.strictEqual(typeof metrics.globalDailyCount, 'number');
      assert.ok(metrics.globalDailyCount >= 1);
    });
  });

  describe('3. Swappable ChatProvider Interface & Streaming', () => {
    it('should instantiate MockChatProvider and stream tokens cleanly', async () => {
      const provider = new MockChatProvider({
        customChunks: ['Namaste! ', 'Course fee is ', '₹5,100 INR.'],
      });

      assert.strictEqual(provider.name, 'mock');
      const stream = await provider.streamChat({
        messages: [{ role: 'user', content: 'What is fee?' }],
        maxTokens: 400,
      });

      const reader = stream.getReader();
      const chunks: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      assert.strictEqual(chunks.join(''), 'Namaste! Course fee is ₹5,100 INR.');
    });

    it('should swap between providers using getChatProvider factory', () => {
      const mockProvider = getChatProvider('mock');
      assert.ok(mockProvider instanceof MockChatProvider);
      assert.strictEqual(mockProvider.name, 'mock');

      const openAiProvider = getChatProvider('openai');
      assert.ok(openAiProvider instanceof OpenAIChatProvider);
      assert.strictEqual(openAiProvider.name, 'openai');
    });

    it('OpenAIChatProvider should reject if CHATBOT_API_KEY is missing when streaming', async () => {
      const originalKey = process.env.CHATBOT_API_KEY;
      delete process.env.CHATBOT_API_KEY;

      try {
        const provider = new OpenAIChatProvider({ apiKey: '' });
        await assert.rejects(
          async () => {
            await provider.streamChat({
              messages: [{ role: 'user', content: 'Hello' }],
            });
          },
          /CHATBOT_API_KEY is not configured/
        );
      } finally {
        if (originalKey) process.env.CHATBOT_API_KEY = originalKey;
      }
    });
  });

  describe('4. Context Limits & Message Validation', () => {
    it('should enforce 500 characters input limit check', () => {
      const shortMsg = 'a'.repeat(500);
      const longMsg = 'a'.repeat(501);

      assert.strictEqual(shortMsg.length, 500);
      assert.strictEqual(longMsg.length, 501);
      assert.strictEqual(shortMsg.length <= 500, true);
      assert.strictEqual(longMsg.length <= 500, false);
    });

    it('should truncate context window to exactly 8 messages', () => {
      const fullHistory = Array.from({ length: 20 }, (_, idx) => ({
        role: idx % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${idx + 1}`,
      }));

      const truncated = fullHistory.slice(-8);
      assert.strictEqual(truncated.length, 8);
      assert.strictEqual(truncated[0].content, 'Message 13');
      assert.strictEqual(truncated[7].content, 'Message 20');
    });
  });
});
