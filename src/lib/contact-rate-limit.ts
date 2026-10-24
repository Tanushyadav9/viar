// Sliding window rate limit (5 requests per 10 minutes per IP)
const contactRateLimitMap = new Map<string, { count: number; resetTime: number }>();
const CONTACT_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_CONTACT_REQUESTS = 5;

export function isContactRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = contactRateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    contactRateLimitMap.set(ip, { count: 1, resetTime: now + CONTACT_RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (record.count >= MAX_CONTACT_REQUESTS) {
    return true;
  }

  record.count++;
  return false;
}

export function resetContactRateLimit(): void {
  contactRateLimitMap.clear();
}
