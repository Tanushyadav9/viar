import 'server-only';
import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.ts';

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

const DEFAULT_NEON_DB_URL =
  'postgresql://neondb_owner:npg_GU0YIPlXe3ia@ep-orange-poetry-b4cupwem.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';

const rawUrl = (
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  env.database?.url ||
  DEFAULT_NEON_DB_URL
).trim();

// Ensure process.env.DATABASE_URL and DIRECT_URL are populated so Prisma and schema.prisma don't throw empty env error
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = rawUrl;
}
if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = rawUrl;
}

// In Neon serverless environments, if -pooler endpoint is unreachable and DIRECT_URL is provided, use DIRECT_URL
const dbUrl = rawUrl.includes('-pooler.') && process.env.DIRECT_URL
  ? process.env.DIRECT_URL.trim()
  : rawUrl;

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    datasources: { db: { url: dbUrl } },
    log: (process.env.NODE_ENV || env.nodeEnv) === 'development' ? ['warn', 'error'] : ['error'],
  });

globalThis.prismaGlobal = prisma;
