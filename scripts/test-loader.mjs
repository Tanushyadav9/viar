import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

process.env.NODE_ENV = 'test';

// ------------------------------------------------------------------------------
// SHARED TEST RUNNER DATABASE SECURITY GUARD
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

  // Staging allowlist enforcement:
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

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'server-only') {
    const emptyFile = path.resolve('node_modules/server-only/empty.js').replace(/\\/g, '/');
    return nextResolve(new URL('file:///' + emptyFile).href, context);
  }
  if (specifier === 'next/server') {
    return nextResolve('next/server.js', context);
  }
  if (specifier === 'next/navigation') {
    return nextResolve('next/navigation.js', context);
  }
  if (specifier === 'next/cache') {
    return nextResolve('next/cache.js', context);
  }

  let target = specifier;
  if (target.startsWith('@/')) {
    target = path.resolve('src', target.slice(2));
  } else if (context.parentURL && (target.startsWith('./') || target.startsWith('../'))) {
    const parentDir = path.dirname(fileURLToPath(context.parentURL));
    target = path.resolve(parentDir, target);
  }

  if (target.startsWith('/') || target.match(/^[A-Za-z]:[\\/]/)) {
    // Try target as-is
    if (fs.existsSync(target) && fs.statSync(target).isFile()) {
      return nextResolve(new URL('file:///' + target.replace(/\\/g, '/')).href, context);
    }
    // Try adding extensions
    for (const ext of ['.ts', '.tsx', '.js', '.mjs', '/route.ts', '/index.ts', '/index.js']) {
      const candidate = target + ext;
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return nextResolve(new URL('file:///' + candidate.replace(/\\/g, '/')).href, context);
      }
    }
  }

  return nextResolve(specifier, context);
}
