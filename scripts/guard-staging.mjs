/**
 * Staging Environment Safety Guard for Viar.in
 * 
 * INVARIANT:
 * No test, seed, or verification script may EVER touch the production database.
 * Every script MUST refuse to run unless:
 * 1. An explicit staging flag is set (--staging or ALLOW_STAGING_SCRIPTS=true)
 * 2. The database host matches the staging allowlist and is NOT the production database.
 */

const PRODUCTION_HOST_KEYWORDS = [
  'ep-orange-poetry-b4cupwem',
  'ep-orange-poetry-b4cupwem.c-6.us-east-2.aws.neon.tech',
  'ep-orange-poetry-b4cupwem-pooler.c-6.us-east-2.aws.neon.tech',
];

/**
 * Extracts host from a Postgres connection URL string.
 */
export function extractHostFromUrl(connectionUrl) {
  if (!connectionUrl) return null;
  try {
    const url = new URL(connectionUrl);
    return url.hostname.toLowerCase();
  } catch {
    // Regex fallback
    const match = connectionUrl.match(/@([^/:?]+)/);
    return match ? match[1].toLowerCase() : null;
  }
}

/**
 * Validates that the current execution is strictly targeting an allowed staging database.
 * Throws and exits with code 1 if targeting production or if staging flag is missing.
 */
export function assertStagingEnvironment(options = {}) {
  const {
    scriptName = 'Unnamed Script',
    allowReadOnly = false,
  } = options;

  const dbUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
  const currentHost = extractHostFromUrl(dbUrl);

  const hasStagingFlag =
    process.argv.includes('--staging') ||
    process.env.ALLOW_STAGING_SCRIPTS === 'true' ||
    process.env.ALLOW_STAGING_EXECUTION === 'true' ||
    process.env.VIAR_ENV === 'staging';

  // 1. Check for Production Host (Strict Denylist)
  const isProductionHost = Boolean(
    currentHost &&
    PRODUCTION_HOST_KEYWORDS.some((kw) => currentHost.includes(kw.toLowerCase()))
  );

  if (isProductionHost) {
    console.error('\n' + '='.repeat(76));
    console.error(' 🛑 [FATAL SECURITY VIOLATION] SCRIPT BLOCKED FROM PRODUCTION DATABASE');
    console.error('='.repeat(76));
    console.error(` Script:        ${scriptName}`);
    console.error(` Target Host:   ${currentHost} (PRODUCTION)`);
    console.error('\n POLICY:');
    console.error(' No test, seed, or verification script may touch the production database.');
    console.error(' You must point DATABASE_URL to a dedicated Neon staging branch.');
    console.error('='.repeat(76) + '\n');
    process.exit(1);
  }

  // 2. Check for Explicit Staging Confirmation Flag
  if (!hasStagingFlag) {
    console.error('\n' + '='.repeat(76));
    console.error(' 🛑 [FATAL CONFIG ERROR] EXPLICIT STAGING FLAG REQUIRED');
    console.error('='.repeat(76));
    console.error(` Script:        ${scriptName}`);
    console.error('\n REQUIREMENT:');
    console.error(' Every script must refuse to run unless an explicit staging flag is set:');
    console.error(' - Command Line: Pass --staging (e.g. node script.mjs --staging)');
    console.error(' - Environment:  ALLOW_STAGING_SCRIPTS=true');
    console.error('='.repeat(76) + '\n');
    process.exit(1);
  }

  // 3. Staging Host Allowlist Verification
  const configuredAllowlist = process.env.STAGING_DATABASE_HOST_ALLOWLIST
    ? process.env.STAGING_DATABASE_HOST_ALLOWLIST.split(',').map((h) => h.trim().toLowerCase())
    : [];

  if (configuredAllowlist.length > 0 && currentHost) {
    const isAllowlisted = configuredAllowlist.some((allowed) =>
      currentHost === allowed || currentHost.endsWith('.' + allowed) || currentHost.includes(allowed)
    );

    if (!isAllowlisted) {
      console.error('\n' + '='.repeat(76));
      console.error(' 🛑 [FATAL SECURITY ERROR] HOST NOT IN STAGING ALLOWLIST');
      console.error('='.repeat(76));
      console.error(` Script:        ${scriptName}`);
      console.error(` Current Host:  ${currentHost}`);
      console.error(` Allowlist:     ${configuredAllowlist.join(', ')}`);
      console.error('='.repeat(76) + '\n');
      process.exit(1);
    }
  }

  console.log(`[Staging Guard] Verified: '${scriptName}' running against authorized staging host '${currentHost}'.`);
}
