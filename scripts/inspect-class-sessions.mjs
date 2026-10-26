import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const count = await prisma.classSession.count();
  console.log('ClassSession count:', count);
  const rows = await prisma.classSession.findMany({
    select: {
      id: true,
      cohortId: true,
      sessionNumber: true,
      title: true,
      scheduledAt: true,
      status: true,
    },
    take: 30,
  });
  console.log('Rows:', JSON.stringify(rows, null, 2));
}

run()
  .catch((err) => console.error(err))
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
