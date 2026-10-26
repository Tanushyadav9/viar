import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const classes = await prisma.classSession.findMany();
  console.log('CLASS SESSIONS:', classes.map(c => ({ id: c.id, title: c.title, studentName: c.studentName, scheduledAt: c.scheduledAt })));
  const orders = await prisma.order.findMany();
  console.log('ORDERS:', orders.map(o => ({ id: o.id, orderRef: o.orderReference, status: o.status, metadata: o.metadata, customerEmail: o.customerEmail })));
  await prisma.$disconnect();
}

main().catch(console.error);
