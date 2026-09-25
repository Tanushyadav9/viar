/**
 * Cross-platform runner for Prisma Client generation
 * Silences update prompts, telemetry, and hints in CI / Vercel builds.
 */
import { execSync } from 'child_process';

process.env.PRISMA_HIDE_UPDATE_MESSAGE = 'true';
process.env.NEXT_TELEMETRY_DISABLED = '1';

try {
  execSync('npx prisma generate --no-hints', { stdio: 'inherit' });
} catch (err) {
  console.error('Prisma generation failed:', err);
  process.exit(1);
}
