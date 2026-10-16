import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== DATABASE INVENTORY & TEST DATA AUDIT ===');
  
  const tables = [
    'user',
    'enrollment',
    'order',
    'payment',
    'activityLog',
    'clerkWebhookEvent',
    'sessionProgress',
    'lessonProgress',
    'quizAttempt',
    'certificate',
    'staffPermission',
    'notifyMeLead',
    'testimonial',
    'paymentSettings',
    'cohort',
    'classSession',
    'course',
    'module',
    'lesson',
    'quiz',
    'question',
    'option',
    'courseBundle'
  ];

  for (const t of tables) {
    if (prisma[t]) {
      try {
        const count = await prisma[t].count();
        console.log(`[TABLE] ${t}: ${count} rows`);
      } catch (err) {
        console.log(`[TABLE] ${t}: ERROR - ${err.message}`);
      }
    }
  }

  console.log('\n--- USERS DETAIL ---');
  const users = await prisma.user.findMany();
  for (const u of users) {
    console.log(`User: id=${u.id}, email=${u.email}, name="${u.name}", role=${u.role}, isOwner=${u.isOwner}, clerkId=${u.clerkId}, createdAt=${u.createdAt.toISOString()}`);
  }

  console.log('\n--- ENROLLMENTS DETAIL ---');
  const enrollments = await prisma.enrollment.findMany({
    include: { user: true, course: true }
  });
  for (const e of enrollments) {
    console.log(`Enrollment: id=${e.id}, user=${e.user?.email}, course=${e.course?.slug}, status=${e.status}, createdAt=${e.createdAt.toISOString()}`);
  }

  console.log('\n--- ORDERS DETAIL ---');
  const orders = await prisma.order.findMany({
    include: { user: true, course: true }
  });
  for (const o of orders) {
    console.log(`Order: id=${o.id}, user=${o.user?.email}, course=${o.course?.slug}, amount=${o.amount}, status=${o.status}, utr=${o.utr}, createdAt=${o.createdAt.toISOString()}`);
  }

  console.log('\n--- ACTIVITY LOGS DETAIL ---');
  const logs = await prisma.activityLog.findMany({ take: 20, orderBy: { createdAt: 'desc' } });
  for (const l of logs) {
    console.log(`Log: action=${l.action}, entityType=${l.entityType}, entityId=${l.entityId}, reason=${l.reason}, email=${l.userEmail}, createdAt=${l.createdAt.toISOString()}`);
  }

  console.log('\n--- CLERK WEBHOOK EVENTS ---');
  const webhooks = await prisma.clerkWebhookEvent.findMany({ take: 10, orderBy: { receivedAt: 'desc' } });
  for (const w of webhooks) {
    console.log(`WebhookEvent: id=${w.id}, eventId=${w.eventId}, eventType=${w.eventType}, status=${w.status}, receivedAt=${w.receivedAt.toISOString()}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
