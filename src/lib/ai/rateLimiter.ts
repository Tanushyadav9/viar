import crypto from 'crypto';
import { getChatbotConfig } from './chatbotConfig.ts';

/**
 * Privacy-preserving rate limiter for VIAR AI Chatbot.
 * 
 * Strict Privacy Guarantee:
 * Never stores plain IP addresses or visitor personal identifiers.
 * Hashes client IP and session using SHA-256 before storing count records.
 */

interface UserRateRecord {
  // 10-minute sliding window
  count10m: number;
  reset10m: number;
  // 24-hour daily window
  countDay: number;
  resetDay: number;
}

interface GlobalDailyRecord {
  dateString: string;
  count: number;
}

// In-memory store keyed solely by hashed identifier
const rateStore = new Map<string, UserRateRecord>();

// Global daily counter (e.g. "2026-10-16")
let globalDailyRecord: GlobalDailyRecord = {
  dateString: new Date().toISOString().slice(0, 10),
  count: 0,
};

// Periodic garbage collection for expired entries (runs every 15 minutes)
const TEN_MINUTES_MS = 10 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Salt to prevent rainbow table attacks against hashed IPs
const HASH_SALT = process.env.CHATBOT_HASH_SALT || 'viar_ai_salt_2026_strict_privacy';

/**
 * Generates a one-way SHA-256 cryptographic hash of client IP and optional session.
 * Plaintext IP is immediately discarded and never saved.
 */
export function hashClientIdentifier(ip: string, session?: string): string {
  const normalizedIp = (ip || 'anonymous').trim().toLowerCase();
  const normalizedSession = (session || '').trim();
  return crypto
    .createHash('sha256')
    .update(`${normalizedIp}:${normalizedSession}:${HASH_SALT}`)
    .digest('hex');
}

export type RateLimitReason = 'ten_minute' | 'daily_user' | 'global_cap';

export interface RateLimitCheckResult {
  allowed: boolean;
  reason?: RateLimitReason;
  message?: string;
  retryAfterSeconds?: number;
}

/**
 * Validates whether the incoming request complies with rate limits:
 * 1. Global daily cap (CHATBOT_DAILY_MESSAGE_CAP)
 * 2. Per-user 10-minute window (default: 15 messages)
 * 3. Per-user daily window (default: 100 messages)
 */
export function checkChatRateLimit(
  hashedId: string,
  now: number = Date.now()
): RateLimitCheckResult {
  const config = getChatbotConfig();
  const todayStr = new Date(now).toISOString().slice(0, 10);

  // 1. Check Global Daily Cap
  if (globalDailyRecord.dateString !== todayStr) {
    globalDailyRecord = { dateString: todayStr, count: 0 };
  }

  if (globalDailyRecord.count >= config.dailyGlobalCap) {
    return {
      allowed: false,
      reason: 'global_cap',
      message:
        'The assistant has reached its daily conversation capacity. ' +
        'Please connect directly with our team on WhatsApp for immediate support.',
    };
  }

  // 2. Check Per-User Rate Record
  const record = rateStore.get(hashedId);

  if (!record) {
    return { allowed: true };
  }

  // Check 10-minute window limit (15 messages)
  if (now < record.reset10m && record.count10m >= config.tenMinuteRateLimit) {
    const retryAfter = Math.ceil((record.reset10m - now) / 1000);
    return {
      allowed: false,
      reason: 'ten_minute',
      message:
        `You have sent several messages in a short time. Please wait ${Math.max(1, Math.ceil(retryAfter / 60))} minute(s) ` +
        `or chat directly with Acharya Niraj Kumar on WhatsApp (+91 93112 15564).`,
      retryAfterSeconds: retryAfter,
    };
  }

  // Check 24-hour daily window limit (100 messages)
  if (now < record.resetDay && record.countDay >= config.dailyUserRateLimit) {
    const retryAfter = Math.ceil((record.resetDay - now) / 1000);
    return {
      allowed: false,
      reason: 'daily_user',
      message:
        'You have reached the daily message limit for this session. ' +
        'Please connect directly with Acharya Niraj Kumar on WhatsApp (+91 93112 15564) for personalized guidance.',
      retryAfterSeconds: retryAfter,
    };
  }

  return { allowed: true };
}

/**
 * Increments usage counts after a valid request is processed.
 */
export function recordChatUsage(hashedId: string, now: number = Date.now()): void {
  const todayStr = new Date(now).toISOString().slice(0, 10);

  // Increment global daily count
  if (globalDailyRecord.dateString !== todayStr) {
    globalDailyRecord = { dateString: todayStr, count: 1 };
  } else {
    globalDailyRecord.count++;
  }

  // Increment user record
  const record = rateStore.get(hashedId);

  if (!record) {
    rateStore.set(hashedId, {
      count10m: 1,
      reset10m: now + TEN_MINUTES_MS,
      countDay: 1,
      resetDay: now + ONE_DAY_MS,
    });
    return;
  }

  // Reset 10-minute bucket if expired
  if (now >= record.reset10m) {
    record.count10m = 1;
    record.reset10m = now + TEN_MINUTES_MS;
  } else {
    record.count10m++;
  }

  // Reset daily bucket if expired
  if (now >= record.resetDay) {
    record.countDay = 1;
    record.resetDay = now + ONE_DAY_MS;
  } else {
    record.countDay++;
  }
}

/**
 * Returns current store metrics for diagnostics / auditing.
 * Note: Only hashed identifiers and integers are exposed.
 */
export function getRateLimitMetrics(): {
  activeHashedUsersCount: number;
  globalDailyCount: number;
  globalDailyDate: string;
} {
  return {
    activeHashedUsersCount: rateStore.size,
    globalDailyCount: globalDailyRecord.count,
    globalDailyDate: globalDailyRecord.dateString,
  };
}

/**
 * Testing utility to reset stores between test suites
 */
export function _resetRateLimiterForTesting(): void {
  rateStore.clear();
  globalDailyRecord = {
    dateString: new Date().toISOString().slice(0, 10),
    count: 0,
  };
}
