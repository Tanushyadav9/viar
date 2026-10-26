import 'server-only';
import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.ts';

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

const PRODUCTION_HOST_KEYWORDS = [
  'ep-orange-poetry-b4cupwem',
  'ep-orange-poetry-b4cupwem.c-6.us-east-2.aws.neon.tech',
  'ep-orange-poetry-b4cupwem-pooler.c-6.us-east-2.aws.neon.tech',
];

function extractHost(urlStr: string): string {
  if (!urlStr) return '';
  try {
    return new URL(urlStr).hostname.toLowerCase();
  } catch {
    const match = urlStr.match(/@([^/:?]+)/);
    return match ? match[1].toLowerCase() : urlStr.toLowerCase();
  }
}

const rawUrl = (
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  env.database?.url ||
  (process.env.NODE_ENV === 'test' ? 'postgresql://mock:mock@localhost:5432/mock_test_db' : '')
).trim();

// Security Guard: Prevent any test runner connection to production
if (process.env.NODE_ENV === 'test' && rawUrl) {
  const host = extractHost(rawUrl);
  const isProd = PRODUCTION_HOST_KEYWORDS.some((kw) => host.includes(kw.toLowerCase()));
  if (isProd) {
    throw new Error(
      `[SECURITY CRITICAL] prisma.ts refused to initialize: test runner attempted to connect to PRODUCTION database host: ${host}`
    );
  }
}

// Ensure process.env.DATABASE_URL and DIRECT_URL are populated so Prisma and schema.prisma don't throw empty env error
if (!process.env.DATABASE_URL && rawUrl) {
  process.env.DATABASE_URL = rawUrl;
}
if (!process.env.DIRECT_URL && rawUrl) {
  process.env.DIRECT_URL = rawUrl;
}

// In Neon serverless environments, if -pooler endpoint is unreachable and DIRECT_URL is provided, use DIRECT_URL
const dbUrl = rawUrl.includes('-pooler.') && process.env.DIRECT_URL
  ? process.env.DIRECT_URL.trim()
  : rawUrl;

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
    log: (process.env.NODE_ENV || env.nodeEnv) === 'development' ? ['warn', 'error'] : ['error'],
  });

globalThis.prismaGlobal = prisma;
