/**
 * Cross-platform runner for Prisma Migrations & Client Generation
 * Runs prisma migrate deploy (using DIRECT_URL) before next build,
 * followed by prisma generate.
 * Silences update prompts, telemetry, and hints in CI / Vercel builds.
 */
import { execSync } from 'child_process';
import fs from 'fs';

process.env.PRISMA_HIDE_UPDATE_MESSAGE = 'true';
process.env.NEXT_TELEMETRY_DISABLED = '1';

// If running locally without preloaded env, load .env file into process.env
if (!process.env.DATABASE_URL && fs.existsSync('.env')) {
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    for (const line of envContent.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq > 0) {
        const key = trimmed.slice(0, eq).trim();
        let val = trimmed.slice(eq + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  } catch {}
}

// Run migrations deploy if connection credentials are present
const hasDbUrl = Boolean(process.env.DIRECT_URL || process.env.DATABASE_URL);

if (hasDbUrl) {
  let migrated = false;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`[Prisma] Running prisma migrate deploy before next build (attempt ${attempt}/2)...`);
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      console.log('[Prisma] Database migrations verified & up to date.');
      migrated = true;
      break;
    } catch (err) {
      console.warn(`[Prisma] Migration deployment attempt ${attempt} notice:`, err.message);
      if (attempt < 2) {
        // Short pause before retry
        try {
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2000);
        } catch {}
      }
    }
  }
  if (!migrated && (process.env.VERCEL || process.env.NODE_ENV === 'production')) {
    console.error('[Prisma] Critical: Migration deployment failed on production build.');
    process.exit(1);
  }
} else {
  console.warn('[Prisma] Neither DIRECT_URL nor DATABASE_URL found. Skipping migration deploy.');
}

try {
  console.log('[Prisma] Generating Prisma Client...');
  execSync('npx prisma generate --no-hints', { stdio: 'inherit' });
} catch (err) {
  console.error('[Prisma] Client generation failed:', err.message);
  process.exit(1);
}
