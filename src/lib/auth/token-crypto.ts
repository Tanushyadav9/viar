import crypto from 'crypto';

const TOKEN_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET || 'viar-secure-media-secret-key-2026';

export interface VerifyPlaybackTokenResult {
  valid: boolean;
  lessonId?: string;
  userId?: string;
  reason?: 'MALFORMED' | 'TOKEN_EXPIRED' | 'INVALID_SIGNATURE';
}

export interface VerifyDocumentTokenResult {
  valid: boolean;
  lessonId?: string;
  documentKey?: string;
  userId?: string;
  reason?: 'MALFORMED' | 'TOKEN_EXPIRED' | 'INVALID_SIGNATURE';
}

/**
 * Generates a cryptographically signed, short-lived playback token (30-minute expiry).
 * Ensures no raw permanent stream URLs are exposed to the client.
 */
export function generateSignedPlaybackToken(
  lessonId: string,
  userId: string = 'anon',
  expiresInSeconds: number = 1800
): { token: string; expiresAt: number } {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const payload = `${lessonId}:${userId}:${expiresAt}`;
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payload)
    .digest('hex');

  const token = Buffer.from(JSON.stringify({ lessonId, userId, expiresAt, signature })).toString('base64url');
  return { token, expiresAt };
}

/**
 * Validates a signed playback token against expiration and cryptographic signature.
 */
export function verifySignedPlaybackToken(token: string): VerifyPlaybackTokenResult {
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf-8');
    const data = JSON.parse(raw);
    const { lessonId, userId, expiresAt, signature } = data;

    if (!lessonId || !expiresAt || !signature) {
      return { valid: false, reason: 'MALFORMED' };
    }

    if (Math.floor(Date.now() / 1000) > expiresAt) {
      return { valid: false, reason: 'TOKEN_EXPIRED' };
    }

    const payload = `${lessonId}:${userId}:${expiresAt}`;
    const expectedSig = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(payload)
      .digest('hex');

    if (
      signature.length === expectedSig.length &&
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))
    ) {
      return { valid: true, lessonId, userId };
    }

    return { valid: false, reason: 'INVALID_SIGNATURE' };
  } catch {
    return { valid: false, reason: 'MALFORMED' };
  }
}

/**
 * Generates a secure, short-lived signed document download token (15-minute expiry).
 */
export function generateSignedDocumentToken(
  lessonId: string,
  documentKey: string,
  userId: string = 'anon',
  expiresInSeconds: number = 900
): { token: string; downloadPath: string; expiresAt: number } {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const payload = `doc:${lessonId}:${documentKey}:${userId}:${expiresAt}`;
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payload)
    .digest('hex');

  const token = Buffer.from(
    JSON.stringify({ lessonId, documentKey, userId, expiresAt, signature })
  ).toString('base64url');

  const downloadPath = `/api/courses/documents/download?token=${token}`;
  return { token, downloadPath, expiresAt };
}

/**
 * Verifies a signed document download token.
 */
export function verifySignedDocumentToken(token: string): VerifyDocumentTokenResult {
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf-8');
    const data = JSON.parse(raw);
    const { lessonId, documentKey, userId, expiresAt, signature } = data;

    if (!lessonId || !documentKey || !expiresAt || !signature) {
      return { valid: false, reason: 'MALFORMED' };
    }

    if (Math.floor(Date.now() / 1000) > expiresAt) {
      return { valid: false, reason: 'TOKEN_EXPIRED' };
    }

    const payload = `doc:${lessonId}:${documentKey}:${userId}:${expiresAt}`;
    const expectedSig = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(payload)
      .digest('hex');

    if (
      signature.length === expectedSig.length &&
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))
    ) {
      return { valid: true, lessonId, documentKey, userId };
    }

    return { valid: false, reason: 'INVALID_SIGNATURE' };
  } catch {
    return { valid: false, reason: 'MALFORMED' };
  }
}
