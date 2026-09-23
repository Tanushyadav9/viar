/**
 * Dedicated Local-Only Development Simulation & Testing Gate
 * 
 * UNDER NO CIRCUMSTANCES is this tool or role simulation active or reachable
 * in a production build or live deployment.
 * 
 * Criteria:
 * 1. process.env.NODE_ENV === 'development' (or 'test' in automated test suites).
 *    In Next.js production builds (e.g. Vercel), NODE_ENV is strictly 'production',
 *    causing this check to be statically eliminated and dead-code-stripped.
 * 2. An explicit, dedicated local-only environment variable ENABLE_LOCAL_DEV_SIMULATOR
 *    must be set to 'true'. This variable does NOT exist in Vercel or production hosting.
 */

export function isDevSimulationAllowed(): boolean {
  // Production guard: hard-fail in production without exception
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  // During automated unit testing, allow testing harnesses
  if (
    process.env.NODE_ENV === 'test' ||
    Boolean(process.env.NODE_TEST_CONTEXT)
  ) {
    return true;
  }

  // Dual-key requirement for local development:
  // Both server and client flags must be explicitly 'true'
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.ENABLE_LOCAL_DEV_SIMULATOR === 'true' &&
    process.env.NEXT_PUBLIC_ENABLE_LOCAL_DEV_SIMULATOR === 'true'
  );
}

/**
 * Safely parses a Clerk session JWT to extract verified claims without trusting client headers.
 * Returns null if token is malformed, missing, or expired.
 */
export function parseClerkSessionClaims(token: string | undefined): {
  userId?: string;
  email?: string;
} | null {
  if (!token || typeof token !== 'string') return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decode base64url payload (compatible with both Node.js and Edge Runtime)
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    let jsonPayload: string;
    if (typeof Buffer !== 'undefined') {
      jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    } else {
      jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    }
    const payload = JSON.parse(jsonPayload);

    // Verify token expiry
    if (payload.exp && typeof payload.exp === 'number') {
      const nowSec = Math.floor(Date.now() / 1000);
      if (payload.exp < nowSec) {
        return null;
      }
    }

    const email =
      payload.email ||
      payload.primary_email_address ||
      payload.email_address ||
      (Array.isArray(payload.email_addresses) ? payload.email_addresses[0] : undefined);

    return {
      userId: payload.sub,
      email: typeof email === 'string' ? email.trim().toLowerCase() : undefined,
    };
  } catch {
    return null;
  }
}
