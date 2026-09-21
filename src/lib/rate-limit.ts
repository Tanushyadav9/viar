import Redis from 'ioredis';

// Redis client initialization if REDIS_URL is provided, else fallback to memory
let redisClient: Redis | null = null;
if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
    });
    redisClient.on('error', (err) => {
      console.warn('[RateLimit] Redis connection error, falling back to memory:', err.message);
    });
  } catch (err) {
    console.warn('[RateLimit] Could not initialize Redis client:', err);
  }
}

// In-memory sliding window cache fallback
interface RateLimitRecord {
  timestamps: number[];
}
const memoryCache = new Map<string, RateLimitRecord>();

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/**
 * Check and record an attempt within a sliding time window.
 * 
 * @param identifier Unique key (e.g. `otp:9876543210` or `login:student@example.com`)
 * @param limit Maximum requests allowed within windowSeconds
 * @param windowSeconds Window duration in seconds
 */
export async function checkRateLimit(
  identifier: string,
  limit = 5,
  windowSeconds = 600 // 10 minutes default
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const cutoff = now - windowMs;

  // 1. If Redis is available, use atomic Redis sorted set (ZADD / ZREMRANGEBYSCORE / ZCARD)
  if (redisClient && redisClient.status === 'ready') {
    try {
      const key = `ratelimit:${identifier}`;
      const multi = redisClient.multi();
      multi.zremrangebyscore(key, 0, cutoff);
      multi.zadd(key, now, `${now}-${Math.random()}`);
      multi.zcard(key);
      multi.expire(key, windowSeconds);
      const results = await multi.exec();

      const count = (results?.[2]?.[1] as number) || 1;
      const success = count <= limit;
      const remaining = Math.max(0, limit - count);

      return {
        success,
        limit,
        remaining,
        resetSeconds: windowSeconds,
      };
    } catch (err) {
      console.warn('[RateLimit] Redis check failed, using memory:', err);
    }
  }

  // 2. In-memory sliding window fallback
  const record = memoryCache.get(identifier) || { timestamps: [] };
  // Filter out timestamps older than cutoff
  const recent = record.timestamps.filter((ts) => ts > cutoff);
  recent.push(now);
  memoryCache.set(identifier, { timestamps: recent });

  // Cleanup old memory keys periodically
  if (memoryCache.size > 5000) {
    memoryCache.forEach((rec, k) => {
      if (rec.timestamps.every((t) => t <= cutoff)) {
        memoryCache.delete(k);
      }
    });
  }

  const count = recent.length;
  const success = count <= limit;
  const remaining = Math.max(0, limit - count);
  const oldest = recent[0] || now;
  const resetSeconds = Math.ceil((oldest + windowMs - now) / 1000);

  return {
    success,
    limit,
    remaining,
    resetSeconds: Math.max(1, resetSeconds),
  };
}

/**
 * Pre-configured rate limit presets
 */
export const RateLimiters = {
  /** 5 attempts per 10 minutes for Phone OTP requests */
  otp: (phoneOrIp: string) => checkRateLimit(`otp:${phoneOrIp}`, 5, 600),

  /** 10 attempts per 15 minutes for Email/Password login */
  login: (emailOrIp: string) => checkRateLimit(`login:${emailOrIp}`, 10, 900),

  /** 20 attempts per hour for checkout order creation */
  checkout: (ip: string) => checkRateLimit(`checkout:${ip}`, 20, 3600),
};
