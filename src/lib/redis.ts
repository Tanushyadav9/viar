import Redis from 'ioredis';
import { env } from '@/config/env';

/**
 * Viar.in Redis Cache & Scheduling Client
 * 
 * Includes an in-memory cache fallback to ensure development and SSR
 * build pipelines run without hard dependencies on an external Redis daemon.
 */

class MemoryCacheFallback {
  private store: Map<string, { value: string; expiresAt: number | null }> = new Map();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<'OK'> {
    let expiresAt: number | null = null;
    if (mode === 'EX' && duration) {
      expiresAt = Date.now() + duration * 1000;
    }
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const deleted = this.store.delete(key);
    return deleted ? 1 : 0;
  }
}

let redisClient: Redis | null = null;
const memoryFallback = new MemoryCacheFallback();
let isRedisConnected = false;

if (typeof window === 'undefined') {
  try {
    redisClient = new Redis(env.redis.url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    redisClient.on('connect', () => {
      isRedisConnected = true;
    });

    redisClient.on('error', () => {
      isRedisConnected = false;
    });
  } catch {
    isRedisConnected = false;
  }
}

export const cache = {
  /**
   * Retrieve item from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      let raw: string | null = null;
      if (redisClient && isRedisConnected) {
        raw = await redisClient.get(key);
      } else {
        raw = await memoryFallback.get(key);
      }
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  /**
   * Set item in cache with TTL in seconds
   */
  async set<T>(key: string, value: T, ttlSeconds: number = 3600): Promise<void> {
    try {
      const stringified = JSON.stringify(value);
      if (redisClient && isRedisConnected) {
        await redisClient.set(key, stringified, 'EX', ttlSeconds);
      } else {
        await memoryFallback.set(key, stringified, 'EX', ttlSeconds);
      }
    } catch (e) {
      console.warn(`Cache set failed for key ${key}:`, e);
    }
  },

  /**
   * Delete item from cache
   */
  async del(key: string): Promise<void> {
    try {
      if (redisClient && isRedisConnected) {
        await redisClient.del(key);
      } else {
        await memoryFallback.del(key);
      }
    } catch (e) {
      console.warn(`Cache del failed for key ${key}:`, e);
    }
  },

  /**
   * Rate limiting helper
   */
  async checkRateLimit(
    identifier: string,
    limit: number = 10,
    windowSeconds: number = 60
  ): Promise<{ allowed: boolean; remaining: number }> {
    const key = `ratelimit:${identifier}`;
    const current = await this.get<number>(key);
    if (current === null) {
      await this.set(key, 1, windowSeconds);
      return { allowed: true, remaining: limit - 1 };
    }
    if (current >= limit) {
      return { allowed: false, remaining: 0 };
    }
    await this.set(key, current + 1, windowSeconds);
    return { allowed: true, remaining: limit - current - 1 };
  },
};
