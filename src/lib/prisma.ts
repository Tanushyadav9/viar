import { PrismaClient } from '@prisma/client';
import { env } from '@/config/env';

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    datasources: {
      db: {
        url: env.database.url,
      },
    },
    log: env.nodeEnv === 'development' ? ['warn', 'error'] : ['error'],
  });

if (env.nodeEnv !== 'production') {
  globalThis.prismaGlobal = prisma;
}
