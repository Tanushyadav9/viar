import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const models = [
    { name: 'Course', accessor: 'course' },
    { name: 'Module', accessor: 'module' },
    { name: 'Lesson', accessor: 'lesson' },
    { name: 'Cohort', accessor: 'cohort' },
    { name: 'ClassSession', accessor: 'classSession' },
    { name: 'User', accessor: 'user' },
    { name: 'Enrollment', accessor: 'enrollment' },
    { name: 'Order', accessor: 'order' },
    { name: 'Payment', accessor: 'payment' },
    { name: 'PaymentSettings', accessor: 'paymentSettings' },
    { name: 'LessonProgress', accessor: 'lessonProgress' },
    { name: 'SessionProgress', accessor: 'sessionProgress' },
    { name: 'Quiz', accessor: 'quiz' },
    { name: 'Question', accessor: 'question' },
    { name: 'Option', accessor: 'option' },
    { name: 'QuizAttempt', accessor: 'quizAttempt' },
    { name: 'Certificate', accessor: 'certificate' },
    { name: 'NotifyMeLead', accessor: 'notifyMeLead' },
    { name: 'StaffPermission', accessor: 'staffPermission' },
    { name: 'ActivityLog', accessor: 'activityLog' },
    { name: 'ClerkWebhookEvent', accessor: 'clerkWebhookEvent' },
    { name: 'KnowledgeEntry', accessor: 'knowledgeEntry' },
    { name: 'UnansweredQuestion', accessor: 'unansweredQuestion' },
    { name: 'ContentItem', accessor: 'contentItem' },
    { name: 'ContentRevision', accessor: 'contentRevision' },
    { name: 'MediaAsset', accessor: 'mediaAsset' },
  ];

  console.log('=== NEON POSTGRESQL ROW COUNTS ===');
  const counts = {};
  for (const m of models) {
    try {
      const count = await prisma[m.accessor].count();
      counts[m.name] = count;
      console.log(`${m.name.padEnd(20)}: ${count}`);
    } catch (e) {
      counts[m.name] = `ERROR: ${e.message}`;
      console.error(`Error counting ${m.name}:`, e.message);
    }
  }

  console.log('\n=== USERS IN DB ===');
  const users = await prisma.user.findMany();
  console.log(JSON.stringify(users, null, 2));

  console.log('\n=== COURSES IN DB ===');
  const courses = await prisma.course.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      priceInr: true,
      priceUsd: true,
      createdAt: true,
      _count: {
        select: {
          modules: true,
          cohorts: true,
          enrollments: true,
          orders: true
        }
      }
    }
  });
  console.log(JSON.stringify(courses, null, 2));

  console.log('\n=== ORDERS IN DB ===');
  const orders = await prisma.order.findMany();
  console.log(JSON.stringify(orders, null, 2));

  console.log('\n=== ENROLLMENTS IN DB ===');
  const enrollments = await prisma.enrollment.findMany({
    include: {
      user: { select: { email: true, name: true } },
      course: { select: { title: true, slug: true } }
    }
  });
  console.log(JSON.stringify(enrollments, null, 2));

  console.log('\n=== CERTIFICATES IN DB ===');
  const certificates = await prisma.certificate.findMany();
  console.log(JSON.stringify(certificates, null, 2));

  console.log('\n=== QUIZ ATTEMPTS IN DB ===');
  const quizAttempts = await prisma.quizAttempt.findMany();
  console.log(JSON.stringify(quizAttempts, null, 2));

  console.log('\n=== KNOWLEDGE ENTRIES IN DB ===');
  const knowledgeEntries = await prisma.knowledgeEntry.findMany();
  console.log(JSON.stringify(knowledgeEntries, null, 2));

  console.log('\n=== UNANSWERED QUESTIONS IN DB ===');
  const unanswered = await prisma.unansweredQuestion.findMany();
  console.log(JSON.stringify(unanswered, null, 2));

  console.log('\n=== NOTIFY ME LEADS IN DB ===');
  const leads = await prisma.notifyMeLead.findMany();
  console.log(JSON.stringify(leads, null, 2));

  console.log('\n=== COHORTS IN DB ===');
  const cohorts = await prisma.cohort.findMany();
  console.log(JSON.stringify(cohorts, null, 2));

  console.log('\n=== ACTIVITY LOGS IN DB (last 10) ===');
  const activityLogs = await prisma.activityLog.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' }
  });
  console.log(JSON.stringify(activityLogs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
