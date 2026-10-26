import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- SYNCING HONEST DATABASE STATE ---');

  // 1. Course: acceptingEnrollments defaults to false
  const updatedCourse = await prisma.course.updateMany({
    where: { slug: 'course-what-is-astrology' },
    data: { acceptingEnrollments: false },
  });
  console.log(`✓ Updated acceptingEnrollments = false for ${updatedCourse.count} course(s).`);

  // 2. Video lessons with placeholder video: set to DRAFT and nullify videoProviderId
  const draftLessons = await prisma.lesson.updateMany({
    where: {
      type: 'VIDEO',
      OR: [
        { videoProviderId: { contains: 'dQw4w9WgXcQ' } },
        { videoProviderId: null },
      ],
    },
    data: {
      status: 'DRAFT',
      videoProviderId: null,
    },
  });
  console.log(`✓ Marked ${draftLessons.count} video lessons as DRAFT (missing real video).`);

  // 3. Mark test purchase & test user
  const updatedOrders = await prisma.order.updateMany({
    where: {
      OR: [
        { id: 'cmvnno4ne00013ea6b0qx33ah' },
        { studentEmail: 'aapkaastro1606@gmail.com' },
        { notes: { contains: 'TEST' } },
      ],
    },
    data: {
      notes: '[TEST_PURCHASE] Staging verification test order - excluded from live metrics',
    },
  });
  console.log(`✓ Tagged ${updatedOrders.count} order(s) as test orders.`);

  console.log('--- ALL HONEST DB STATE SYNCED CLEANLY ---');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
