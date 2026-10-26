import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const course = await prisma.course.findFirst({
    where: { slug: 'what-is-astrology' },
    include: { modules: { include: { lessons: true } } },
  });

  let totalLessons = 0;
  let lessonsWithVideo = 0;
  let lessonsWithoutVideo = 0;
  course?.modules.forEach((m) => {
    m.lessons.forEach((l) => {
      totalLessons++;
      if (l.videoProviderId && !l.videoProviderId.includes('dQw4w9WgXcQ')) {
        lessonsWithVideo++;
      } else {
        lessonsWithoutVideo++;
      }
    });
  });

  const classCount = await prisma.classSession.count();
  const allOrders = await prisma.order.findMany();
  const testOrders = allOrders.filter(
    (o) => o.orderReference?.includes('[TEST]') || JSON.stringify(o.metadata || {}).includes('[TEST]')
  );
  const realOrders = allOrders.filter(
    (o) => !o.orderReference?.includes('[TEST]') && !JSON.stringify(o.metadata || {}).includes('[TEST]')
  );
  const activityLogs = await prisma.activityLog.count();

  console.log(
    JSON.stringify(
      {
        courseSlug: course?.slug,
        acceptingEnrollments: course?.acceptingEnrollments,
        totalModules: course?.modules.length,
        totalLessons,
        lessonsWithVideo,
        lessonsWithoutVideo,
        classCount,
        totalOrders: allOrders.length,
        testOrders: testOrders.length,
        realOrders: realOrders.length,
        activityLogs,
      },
      null,
      2
    )
  );

  await prisma.$disconnect();
}

main().catch(console.error);
