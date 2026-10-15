import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.ts';

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

const rawUrl = (
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  env.database?.url ||
  ''
).trim();

// In Neon serverless environments, if -pooler endpoint is unreachable and DIRECT_URL is provided, use DIRECT_URL
const dbUrl = rawUrl.includes('-pooler.') && process.env.DIRECT_URL
  ? process.env.DIRECT_URL.trim()
  : rawUrl;

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    ...(dbUrl ? { datasources: { db: { url: dbUrl } } } : {}),
    log: (process.env.NODE_ENV || env.nodeEnv) === 'development' ? ['warn', 'error'] : ['error'],
  });

globalThis.prismaGlobal = prisma;
