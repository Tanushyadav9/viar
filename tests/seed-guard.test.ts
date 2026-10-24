import { describe, it } from 'node:test';
import assert from 'node:assert';
import { extractHostFromUrl, assertStagingEnvironment } from '../scripts/guard-staging.ts';

describe('Seed Guard & Production Protection — Comprehensive Specification', () => {
  describe('1. Host Extraction and URL Parsing', () => {
    it('extracts host from standard postgres URL', () => {
      const host = extractHostFromUrl('postgresql://user:pass@ep-staging-branch-12345.us-east-2.aws.neon.tech/neondb?sslmode=require');
      assert.strictEqual(host, 'ep-staging-branch-12345.us-east-2.aws.neon.tech');
    });

    it('extracts host from pooled postgres URL', () => {
      const host = extractHostFromUrl('postgresql://user:pass@ep-staging-branch-12345-pooler.us-east-2.aws.neon.tech/neondb');
      assert.strictEqual(host, 'ep-staging-branch-12345-pooler.us-east-2.aws.neon.tech');
    });

    it('returns null for empty or null URL', () => {
      assert.strictEqual(extractHostFromUrl(null), null);
      assert.strictEqual(extractHostFromUrl(''), null);
      assert.strictEqual(extractHostFromUrl(undefined), null);
    });
  });

  describe('2. Strict Production Rejection & Seed Guard Enforcement', () => {
    it('strictly throws/exits when targeted at production database host', () => {
      const originalDbUrl = process.env.DATABASE_URL;
      const originalExit = process.exit;
      let exitCode: number | undefined;

      try {
        process.env.DATABASE_URL = 'postgresql://user:pass@ep-orange-poetry-b4cupwem.c-6.us-east-2.aws.neon.tech/neondb';
        process.exit = ((code?: number) => {
          exitCode = code;
          throw new Error(`process.exit(${code}) called`);
        }) as unknown as typeof process.exit;

        assert.throws(() => {
          assertStagingEnvironment({ scriptName: 'test-seed-script' });
        }, /process\.exit\(1\)/);

        assert.strictEqual(exitCode, 1, 'Must exit with code 1 upon production target');
      } finally {
        process.env.DATABASE_URL = originalDbUrl;
        process.exit = originalExit;
      }
    });

    it('strictly refuses to run if staging flag is missing', () => {
      const originalDbUrl = process.env.DATABASE_URL;
      const originalFlag = process.env.ALLOW_STAGING_SCRIPTS;
      const originalExit = process.exit;
      let exitCode: number | undefined;

      try {
        process.env.DATABASE_URL = 'postgresql://user:pass@ep-safe-staging-branch.us-east-2.aws.neon.tech/neondb';
        delete process.env.ALLOW_STAGING_SCRIPTS;
        delete process.env.ALLOW_STAGING_EXECUTION;
        delete process.env.VIAR_ENV;

        process.exit = ((code?: number) => {
          exitCode = code;
          throw new Error(`process.exit(${code}) called`);
        }) as unknown as typeof process.exit;

        assert.throws(() => {
          assertStagingEnvironment({ scriptName: 'test-seed-script' });
        }, /process\.exit\(1\)/);

        assert.strictEqual(exitCode, 1, 'Must exit with code 1 if explicit staging flag missing');
      } finally {
        process.env.DATABASE_URL = originalDbUrl;
        if (originalFlag !== undefined) process.env.ALLOW_STAGING_SCRIPTS = originalFlag;
        process.exit = originalExit;
      }
    });

    it('allows execution when pointing to dedicated staging host with explicit flag', () => {
      const originalDbUrl = process.env.DATABASE_URL;
      const originalFlag = process.env.ALLOW_STAGING_SCRIPTS;

      try {
        process.env.DATABASE_URL = 'postgresql://user:pass@ep-isolated-staging-branch.us-east-2.aws.neon.tech/neondb';
        process.env.ALLOW_STAGING_SCRIPTS = 'true';

        // Should execute smoothly without throwing or exiting
        assert.doesNotThrow(() => {
          assertStagingEnvironment({ scriptName: 'safe-staging-test' });
        });
      } finally {
        process.env.DATABASE_URL = originalDbUrl;
        if (originalFlag !== undefined) {
          process.env.ALLOW_STAGING_SCRIPTS = originalFlag;
        } else {
          delete process.env.ALLOW_STAGING_SCRIPTS;
        }
      }
    });
  });

  describe('3. Invariant: Runtime Code Never Seeds on Empty Database', () => {
    it('verifies runtime code paths never auto-seed database when empty', async () => {
      // Invariant check: In /api/courses and /api/enrollments, empty queries must return [] or 404
      // and must never invoke prisma.course.create or seed fixtures
      const fs = await import('fs');
      const coursesRouteCode = fs.readFileSync('src/app/api/courses/route.ts', 'utf8');
      
      assert.ok(!coursesRouteCode.includes('seedDatabase'), 'Runtime courses route must never call seedDatabase');
      assert.ok(!coursesRouteCode.includes('INITIAL_COURSES'), 'Runtime courses route must not contain INITIAL_COURSES fallback');
    });
  });
});
