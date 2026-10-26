import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const order = await prisma.order.findUnique({
    where: { id: 'cmvnno4ne00013ea6b0qx33ah' },
    include: { user: true },
  });
  console.log('ORDER cmvnno4ne00013ea6b0qx33ah:', {
    id: order?.id,
    orderReference: order?.orderReference,
    studentName: order?.studentName,
    studentEmail: order?.studentEmail,
    notes: order?.notes,
    userEmail: order?.user?.email,
    isOwner: order?.user?.isOwner,
  });

  if (!order?.notes?.includes('[TEST_PURCHASE]')) {
    await prisma.order.update({
      where: { id: 'cmvnno4ne00013ea6b0qx33ah' },
      data: {
        notes: (order?.notes || '') + ' [TEST_PURCHASE] Owner initial test verification',
        studentName: order?.studentName?.startsWith('[TEST]') ? order.studentName : `[TEST] ${order?.studentName || 'Owner Test'}`,
      },
    });
    console.log('Updated order with [TEST_PURCHASE] and [TEST] badge');
  }

  // Also check if any leftover fake classes cls-wia-02 and cls-wia-03 exist and what they are
  const fakeClasses = await prisma.classSession.findMany({
    where: { id: { in: ['cls-wia-02', 'cls-wia-03'] } }
  });
  console.log('Leftover fake classes:', fakeClasses.map(c => ({ id: c.id, title: c.title })));
  if (fakeClasses.length > 0) {
    await prisma.classSession.deleteMany({
      where: { id: { in: ['cls-wia-02', 'cls-wia-03'] } }
    });
    console.log('Deleted leftover fake classes cls-wia-02 and cls-wia-03!');
  }

  await prisma.$disconnect();
}

main().catch(console.error);
