import fs from 'node:fs';
import path from 'node:path';

process.env.NODE_ENV = 'test';
process.env.VIAR_ENV = 'test';

// ------------------------------------------------------------------------------
// SHARED TEST SETUP DATABASE SECURITY GUARD (MAIN THREAD)
// Runs before any test suite or imported route handler is loaded.
// Invariant: Tests must NEVER touch production database host.
// ------------------------------------------------------------------------------
const PRODUCTION_HOST_KEYWORDS = [
  'ep-orange-poetry-b4cupwem',
  'ep-orange-poetry-b4cupwem.c-6.us-east-2.aws.neon.tech',
  'ep-orange-poetry-b4cupwem-pooler.c-6.us-east-2.aws.neon.tech',
];

function extractHost(urlStr) {
  if (!urlStr) return '';
  try {
    return new URL(urlStr).hostname.toLowerCase();
  } catch {
    const match = urlStr.match(/@([^/:?]+)/);
    return match ? match[1].toLowerCase() : urlStr.toLowerCase();
  }
}

// 1. Strict Check on process.env
const currentDbUrl = (process.env.DATABASE_URL || process.env.DIRECT_URL || '').trim();
const detectedHost = extractHost(currentDbUrl);

if (detectedHost) {
  const isProd = PRODUCTION_HOST_KEYWORDS.some((kw) => detectedHost.includes(kw.toLowerCase()));
  if (isProd) {
    console.error('\n' + '='.repeat(80));
    console.error('🛑 [SECURITY FATAL] TEST RUNNER BLOCKED FROM PRODUCTION DATABASE');
    console.error('='.repeat(80));
    console.error(`Target Host:  ${detectedHost} (PRODUCTION)`);
    console.error('Policy:       Tests may NEVER connect to the production database.');
    console.error('Action:       Set DATABASE_URL to a staging database on the allowlist or run offline.');
    console.error('='.repeat(80) + '\n');
    process.exit(1);
  }

  // Staging allowlist enforcement
  const stagingAllowlist = (process.env.STAGING_DATABASE_HOST_ALLOWLIST || '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);

  const isLocalOrMock =
    detectedHost.includes('localhost') ||
    detectedHost.includes('127.0.0.1') ||
    detectedHost.includes('mock');

  if (!isLocalOrMock && stagingAllowlist.length > 0) {
    const isAllowlisted = stagingAllowlist.some((allowed) => detectedHost.includes(allowed));
    if (!isAllowlisted && process.env.ALLOW_TEST_DB_WRITES !== 'true') {
      console.error('\n' + '='.repeat(80));
      console.error('🛑 [SECURITY FATAL] DATABASE HOST NOT IN STAGING ALLOWLIST');
      console.error('='.repeat(80));
      console.error(`Target Host:  ${detectedHost}`);
      console.error(`Allowlist:    ${stagingAllowlist.join(', ')}`);
      console.error('Policy:       External database hosts in tests must be on STAGING_DATABASE_HOST_ALLOWLIST.');
      console.error('='.repeat(80) + '\n');
      process.exit(1);
    }
  }
}

// 2. Strict Check on local .env file
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envText = fs.readFileSync(envPath, 'utf8');
  const prodMatch = PRODUCTION_HOST_KEYWORDS.some((kw) => envText.includes(kw));
  if (prodMatch) {
    // Isolate tests from production database in .env
    delete process.env.DATABASE_URL;
    delete process.env.DIRECT_URL;
    process.env.DATABASE_URL = 'postgresql://mock:mock@localhost:5432/mock_test_db';
    process.env.DIRECT_URL = 'postgresql://mock:mock@localhost:5432/mock_test_db';
  }
}
