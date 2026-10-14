import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateSignedPlaybackToken,
  verifySignedPlaybackToken,
  generateSignedDocumentToken,
  verifySignedDocumentToken,
} from '../src/lib/auth/token-crypto.ts';

describe('Server-Side Content Gating & Token Verification', () => {
  it('should generate and verify a valid playback token', () => {
    const { token } = generateSignedPlaybackToken('lesson-123', 'user-456', 300);
    const result = verifySignedPlaybackToken(token);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.lessonId, 'lesson-123');
    assert.strictEqual(result.userId, 'user-456');
  });

  it('should reject a tampered playback token', () => {
    const { token } = generateSignedPlaybackToken('lesson-123', 'user-456', 300);
    const tampered = token.slice(0, -4) + '0000';
    const result = verifySignedPlaybackToken(tampered);
    assert.strictEqual(result.valid, false);
  });

  it('should reject an expired playback token', () => {
    // Generate a token that expired 10 seconds ago
    const { token: expiredToken } = generateSignedPlaybackToken('lesson-123', 'user-456', -10);
    const result = verifySignedPlaybackToken(expiredToken);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.reason, 'TOKEN_EXPIRED');
  });

  it('should generate and verify a valid document token', () => {
    const { token } = generateSignedDocumentToken('lesson-123', 'docs/guide.pdf', 'user-456', 300);
    const result = verifySignedDocumentToken(token);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.lessonId, 'lesson-123');
    assert.strictEqual(result.documentKey, 'docs/guide.pdf');
    assert.strictEqual(result.userId, 'user-456');
  });

  it('should reject a tampered document token', () => {
    const { token } = generateSignedDocumentToken('lesson-123', 'docs/guide.pdf', 'user-456', 300);
    const tampered = token.slice(0, -5) + 'abcde';
    const result = verifySignedDocumentToken(tampered);
    assert.strictEqual(result.valid, false);
  });

  it('should accurately calculate >= 90% video completion threshold', () => {
    const duration = 1800; // 30 minutes
    const at89Percent = 1619; // 1619 / 1800 = 89.94%
    const at90Percent = 1620; // 1620 / 1800 = 90%
    const at95Percent = 1710; // 95%

    assert.strictEqual(at89Percent >= 0.9 * duration, false);
    assert.strictEqual(at90Percent >= 0.9 * duration, true);
    assert.strictEqual(at95Percent >= 0.9 * duration, true);
  });
});
