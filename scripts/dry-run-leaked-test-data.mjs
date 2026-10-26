import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('=== COMPREHENSIVE SCAN FOR DEMO & TEST DATA IN DATABASE ===\n');

  // 1. Contact Leads (NotifyMeLead)
  const leads = await prisma.notifyMeLead.findMany({
    where: {
      OR: [
        { email: { contains: 'example.com' } },
        { name: { contains: 'User ' } },
        { name: { contains: 'Quiet Lead' } },
        { name: { contains: 'Test' } },
        { phone: { contains: 'Simulated' } },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });
  console.log(`[NotifyMeLead] Total matching rows: ${leads.length}`);
  leads.slice(0, 10).forEach((l) =>
    console.log(`  - [${l.id}] ${l.name} (${l.email}) | Course: ${l.courseSlug} | ${l.createdAt.toISOString()}`)
  );
  if (leads.length > 10) {
    console.log(`  ... and ${leads.length - 10} more NotifyMeLead entries.`);
  }

  // 2. Audit Logs (ActivityLog)
  const auditLogs = await prisma.activityLog.findMany({
    where: {
      OR: [
        { action: { contains: 'CRASH' } },
        { action: { contains: 'CONTACT' } },
        { action: { contains: 'TEST' } },
        { reason: { contains: 'Simulated' } },
        { reason: { contains: 'example.com' } },
        { reason: { contains: 'WALKTHROUGH' } },
        { userEmail: { contains: 'example.com' } },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });
  console.log(`\n[ActivityLog] Total matching rows: ${auditLogs.length}`);
  auditLogs.slice(0, 10).forEach((l) =>
    console.log(`  - [${l.id}] ${l.action} | ${l.userEmail} | "${l.reason}" | ${l.createdAt.toISOString()}`)
  );
  if (auditLogs.length > 10) {
    console.log(`  ... and ${auditLogs.length - 10} more ActivityLog entries.`);
  }

  // 3. Student Sessions (StudentSession)
  const sessions = await prisma.studentSession.findMany({
    where: {
      OR: [
        { student: { email: { contains: 'example.com' } } },
        { student: { name: { contains: 'Rohan' } } },
        { meetingLink: { contains: 'jyotish-mentorship-01' } },
        { meetingLink: { contains: 'meet.google.com' } },
        { title: { contains: 'Test' } },
      ],
    },
    include: { student: true },
  });
  console.log(`\n[StudentSession] Total matching rows: ${sessions.length}`);
  sessions.forEach((s) =>
    console.log(`  - [${s.id}] "${s.title}" | Student: ${s.student?.name} (${s.student?.email}) | Link: ${s.meetingLink} | Status: ${s.status}`)
  );

  // 4. OneOnOneSession
  const oneOnOne = await prisma.oneOnOneSession.findMany({
    where: {
      OR: [
        { student: { email: { contains: 'example.com' } } },
        { student: { name: { contains: 'Rohan' } } },
        { meetingLink: { contains: 'jyotish-mentorship-01' } },
      ],
    },
    include: { student: true },
  });
  console.log(`\n[OneOnOneSession] Total matching rows: ${oneOnOne.length}`);
  oneOnOne.forEach((s) =>
    console.log(`  - [${s.id}] "${s.title}" | Student: ${s.student?.name} (${s.student?.email}) | Link: ${s.meetingLink}`)
  );

  // 5. Session Requests (SessionRequest)
  const sessionRequests = await prisma.sessionRequest.findMany({
    where: {
      OR: [
        { student: { email: { contains: 'example.com' } } },
        { student: { name: { contains: 'Rohan' } } },
      ],
    },
    include: { student: true },
  });
  console.log(`\n[SessionRequest] Total matching rows: ${sessionRequests.length}`);
  sessionRequests.forEach((r) =>
    console.log(`  - [${r.id}] Student: ${r.student?.name} (${r.student?.email}) | Status: ${r.status}`)
  );

  // 6. Orders
  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { orderReference: { contains: 'WALKTHROUGH' } },
        { orderReference: { contains: 'TANISH' } },
        { orderReference: { contains: 'TEST' } },
        { studentEmail: { contains: 'example.com' } },
        { studentName: { contains: 'Rohan' } },
        { notes: { contains: 'Simulated' } },
        { notes: { contains: 'WALKTHROUGH' } },
        { notes: { contains: 'TEST' } },
      ],
    },
  });
  console.log(`\n[Order] Total matching rows: ${orders.length}`);
  orders.forEach((o) =>
    console.log(`  - [${o.id}] Ref: ${o.orderReference} | ${o.studentName} (${o.studentEmail}) | ₹${o.amount} | Notes: "${o.notes}"`)
  );

  // 7. Enrollments
  const enrollments = await prisma.enrollment.findMany({
    where: {
      OR: [
        { paymentReference: { contains: 'WALKTHROUGH' } },
        { paymentReference: { contains: 'TANISH' } },
        { paymentReference: { contains: 'TEST' } },
        { user: { email: { contains: 'example.com' } } },
        { user: { name: { contains: 'Rohan' } } },
        { user: { name: { contains: 'Walkthrough' } } },
      ],
    },
    include: { user: true, order: true },
  });
  console.log(`\n[Enrollment] Total matching rows: ${enrollments.length}`);
  enrollments.forEach((e) =>
    console.log(`  - [${e.id}] User: ${e.user?.name} (${e.user?.email}) | PayRef: ${e.paymentReference} | OrderRef: ${e.order?.orderReference} | Course: ${e.courseId}`)
  );

  // 8. Users
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: 'example.com' } },
        { name: { contains: 'Rohan Sharma' } },
        { name: { contains: 'Walkthrough' } },
      ],
    },
  });
  console.log(`\n[User] Total matching rows: ${users.length}`);
  users.forEach((u) =>
    console.log(`  - [${u.id}] ${u.name} (${u.email}) | Role: ${u.role} | Owner: ${u.isOwner}`)
  );

  // 9. Questions (Question)
  const questions = await prisma.question.findMany({
    where: {
      OR: [
        { question: { contains: 'example.com' } },
        { question: { contains: 'WALKTHROUGH' } },
        { question: { contains: 'Simulated' } },
      ],
    },
  });
  console.log(`\n[Question] Total matching rows: ${questions.length}`);
  questions.forEach((q) =>
    console.log(`  - [${q.id}] ${q.question}`)
  );

  // 10. Summary of Protected Real Users
  const realUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, isOwner: true },
  });
  console.log('\n--- VERIFIED PROTECTED USERS IN DATABASE ---');
  realUsers.forEach((u) =>
    console.log(`  * ${u.name} (${u.email}) [Role: ${u.role}, isOwner: ${u.isOwner}]`)
  );

  await prisma.$disconnect();
}

main().catch(console.error);
