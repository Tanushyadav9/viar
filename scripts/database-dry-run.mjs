import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function run() {
  console.log('Connecting to Neon PostgreSQL to audit and snapshot tables...');

  // 1. Fetch all records across all relevant tables
  const courses = await prisma.course.findMany({
    include: {
      modules: {
        include: {
          lessons: true,
        },
      },
      cohorts: true,
      quizzes: true,
    },
  });

  const users = await prisma.user.findMany();
  const enrollments = await prisma.enrollment.findMany();
  const orders = await prisma.order.findMany();
  const payments = await prisma.payment.findMany();
  const lessonProgress = await prisma.lessonProgress.findMany();
  const sessionProgress = await prisma.sessionProgress.findMany();
  const quizAttempts = await prisma.quizAttempt.findMany();
  const certificates = await prisma.certificate.findMany();
  const knowledgeEntries = await prisma.knowledgeEntry.findMany();
  const leads = await prisma.notifyMeLead.findMany();
  const unansweredQuestions = await prisma.unansweredQuestion.findMany();
  const staffPermissions = await prisma.staffPermission.findMany();
  const activityLogs = await prisma.activityLog.findMany();

  // Create full snapshot backup directory and file
  const backupDir = path.resolve('backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `neon_backup_snapshot_${timestamp}.json`);

  const fullSnapshot = {
    timestamp: new Date().toISOString(),
    databaseHost: process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).hostname : 'unknown',
    tables: {
      courses,
      users,
      enrollments,
      orders,
      payments,
      lessonProgress,
      sessionProgress,
      quizAttempts,
      certificates,
      knowledgeEntries,
      leads,
      unansweredQuestions,
      staffPermissions,
      activityLogs,
    },
  };

  fs.writeFileSync(backupFile, JSON.stringify(fullSnapshot, null, 2), 'utf8');
  console.log(`\n✅ Full database backup snapshot written to: ${backupFile}`);

  // 2. Classify rows for Dry Run Report
  const flaggedForDeletion = [];
  const protectedRows = [];

  // Flagship Course Slug
  const FLAGSHIP_SLUG = 'what-is-astrology';

  // Check Courses
  for (const c of courses) {
    if (c.slug === FLAGSHIP_SLUG) {
      protectedRows.push({
        table: 'Course',
        id: c.id,
        identifier: `${c.title} (${c.slug})`,
        reason: 'Protected: Flagship Masterclass Course (₹5,100, 23 modules, 20-question exam, self-paced).',
      });
    } else {
      flaggedForDeletion.push({
        table: 'Course',
        id: c.id,
        identifier: `${c.title} (${c.slug})`,
        reason: 'Flagged: Non-existent dummy course; client has launched only the Flagship Astrology course.',
        cascade: {
          modules: c.modules?.length || 0,
          lessons: c.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0,
        },
      });
    }
  }

  // Check Users
  const ownerEmail = (process.env.OWNER_EMAIL || 'aapkaastro1606@gmail.com').toLowerCase().trim();
  for (const u of users) {
    const isOwner = u.email.toLowerCase().trim() === ownerEmail || u.role === 'OWNER' || u.isOwner;
    if (isOwner) {
      protectedRows.push({
        table: 'User',
        id: u.id,
        identifier: `${u.name || 'Unnamed'} <${u.email}> (${u.role})`,
        reason: "Protected: Primary Platform Owner Account (OWNER_EMAIL matched).",
      });
    } else {
      // Check if student has real approved payment
      const userOrders = orders.filter((o) => o.userId === u.id);
      const approvedOrder = userOrders.find((o) => o.status === 'APPROVED');
      const hasRealPayment = payments.some((p) => p.userId === u.id && p.status === 'VERIFIED');

      if (approvedOrder || hasRealPayment) {
        protectedRows.push({
          table: 'User',
          id: u.id,
          identifier: `${u.name || 'Student'} <${u.email}>`,
          reason: 'Protected: Real student with verified payment and approved enrollment.',
        });
      } else {
        // Did they register through Clerk or is it a test/seed account?
        if (u.clerkId && !u.email.includes('test') && !u.email.includes('example.com')) {
          protectedRows.push({
            table: 'User',
            id: u.id,
            identifier: `${u.name || 'Registered User'} <${u.email}> (${u.clerkId})`,
            reason: 'Protected: Real registered Clerk user account (zero fake/mock markers).',
          });
        } else {
          flaggedForDeletion.push({
            table: 'User',
            id: u.id,
            identifier: `${u.name || 'User'} <${u.email}>`,
            reason: 'Flagged: Test/mock user account created during test execution.',
          });
        }
      }
    }
  }

  // Check Enrollments
  for (const e of enrollments) {
    const isFlagship = e.courseId === 'course-what-is-astrology' || e.courseId === courses.find(c => c.slug === FLAGSHIP_SLUG)?.id;
    const isRealUser = protectedRows.some(p => p.table === 'User' && p.id === e.userId);
    if (isFlagship && isRealUser) {
      protectedRows.push({
        table: 'Enrollment',
        id: e.id,
        identifier: `User ${e.userId} in Course ${e.courseId}`,
        reason: 'Protected: Valid enrollment in Flagship course for protected user.',
      });
    } else {
      flaggedForDeletion.push({
        table: 'Enrollment',
        id: e.id,
        identifier: `User ${e.userId} in Course ${e.courseId}`,
        reason: 'Flagged: Associated with test user or deleted course.',
      });
    }
  }

  // Check Orders
  for (const o of orders) {
    if (o.status === 'APPROVED') {
      protectedRows.push({
        table: 'Order',
        id: o.id,
        identifier: `Order #${o.orderNumber || o.id} (${o.currency} ${o.amount})`,
        reason: 'Protected: Real approved order with confirmed transaction.',
      });
    } else if (o.email?.includes('test') || o.studentEmail?.includes('test')) {
      flaggedForDeletion.push({
        table: 'Order',
        id: o.id,
        identifier: `Order #${o.orderNumber || o.id} (${o.status})`,
        reason: 'Flagged: Test order artifact created by automated test run.',
      });
    } else {
      protectedRows.push({
        table: 'Order',
        id: o.id,
        identifier: `Order #${o.orderNumber || o.id} (${o.status})`,
        reason: 'Protected: Real user checkout session.',
      });
    }
  }

  // Check Payments
  for (const p of payments) {
    if (p.status === 'VERIFIED') {
      protectedRows.push({
        table: 'Payment',
        id: p.id,
        identifier: `Payment UTR: ${p.utrNumber || p.id} (₹${p.amount})`,
        reason: 'Protected: Verified financial transaction record.',
      });
    } else if (p.studentEmail?.includes('test') || p.utrNumber?.startsWith('TEST')) {
      flaggedForDeletion.push({
        table: 'Payment',
        id: p.id,
        identifier: `Payment UTR: ${p.utrNumber || p.id}`,
        reason: 'Flagged: Test payment artifact generated during UPI verification test.',
      });
    } else {
      protectedRows.push({
        table: 'Payment',
        id: p.id,
        identifier: `Payment UTR: ${p.utrNumber || p.id}`,
        reason: 'Protected: Real pending payment claim awaiting review.',
      });
    }
  }

  // Check Progress (LessonProgress, SessionProgress)
  for (const lp of lessonProgress) {
    const isProtectedUser = protectedRows.some(p => p.table === 'User' && p.id === lp.userId);
    if (isProtectedUser) {
      protectedRows.push({
        table: 'LessonProgress',
        id: lp.id,
        identifier: `User ${lp.userId} - Lesson ${lp.lessonId}`,
        reason: 'Protected: Real student learning progress.',
      });
    } else {
      flaggedForDeletion.push({
        table: 'LessonProgress',
        id: lp.id,
        identifier: `User ${lp.userId} - Lesson ${lp.lessonId}`,
        reason: 'Flagged: Progress belonging to deleted test user.',
      });
    }
  }

  for (const sp of sessionProgress) {
    const isProtectedUser = protectedRows.some(p => p.table === 'User' && p.id === sp.userId);
    if (isProtectedUser) {
      protectedRows.push({
        table: 'SessionProgress',
        id: sp.id,
        identifier: `User ${sp.userId} - Session ${sp.sessionId}`,
        reason: 'Protected: Real student session progress.',
      });
    } else {
      flaggedForDeletion.push({
        table: 'SessionProgress',
        id: sp.id,
        identifier: `User ${sp.userId} - Session ${sp.sessionId}`,
        reason: 'Flagged: Session progress belonging to deleted test user.',
      });
    }
  }

  // Check Quiz Attempts
  for (const qa of quizAttempts) {
    const isProtectedUser = protectedRows.some(p => p.table === 'User' && p.id === qa.userId);
    if (isProtectedUser) {
      protectedRows.push({
        table: 'QuizAttempt',
        id: qa.id,
        identifier: `Attempt by User ${qa.userId} (Score: ${qa.score}%)`,
        reason: 'Protected: Real student assessment submission.',
      });
    } else {
      flaggedForDeletion.push({
        table: 'QuizAttempt',
        id: qa.id,
        identifier: `Attempt by User ${qa.userId} (Score: ${qa.score}%)`,
        reason: 'Flagged: Test assessment attempt created by automated test.',
      });
    }
  }

  // Check Certificates
  for (const cert of certificates) {
    const isProtectedUser = protectedRows.some(p => p.table === 'User' && p.id === cert.userId);
    if (isProtectedUser) {
      protectedRows.push({
        table: 'Certificate',
        id: cert.id,
        identifier: `Certificate #${cert.certificateNumber || cert.id} (${cert.studentName})`,
        reason: 'Protected: Legitimate student certificate of completion.',
      });
    } else {
      flaggedForDeletion.push({
        table: 'Certificate',
        id: cert.id,
        identifier: `Certificate #${cert.certificateNumber || cert.id} (${cert.studentName})`,
        reason: 'Flagged: Fake/test certificate generated during verification suite.',
      });
    }
  }

  // Check Knowledge Entries
  for (const ke of knowledgeEntries) {
    if (ke.question.includes('TEST') || ke.answer.includes('TEST_FIXTURE')) {
      flaggedForDeletion.push({
        table: 'KnowledgeEntry',
        id: ke.id,
        identifier: `Q: "${ke.question.slice(0, 40)}..."`,
        reason: 'Flagged: Automated test fixture knowledge entry.',
      });
    } else {
      protectedRows.push({
        table: 'KnowledgeEntry',
        id: ke.id,
        identifier: `Q: "${ke.question.slice(0, 40)}..."`,
        reason: 'Protected: Authentic administrative AI knowledge entry.',
      });
    }
  }

  // Check Unanswered Questions
  for (const uq of unansweredQuestions) {
    if (uq.question.includes('TEST_INQUIRY') || uq.question.includes('Puppeteer')) {
      flaggedForDeletion.push({
        table: 'UnansweredQuestion',
        id: uq.id,
        identifier: `Inquiry: "${uq.question.slice(0, 40)}..."`,
        reason: 'Flagged: Synthetic automated test question.',
      });
    } else {
      protectedRows.push({
        table: 'UnansweredQuestion',
        id: uq.id,
        identifier: `Inquiry: "${uq.question.slice(0, 40)}..."`,
        reason: 'Protected: Real visitor question logged for review.',
      });
    }
  }

  // Check Leads (NotifyMeLead)
  for (const lead of leads) {
    if (lead.email.includes('test') || lead.email.includes('example.com')) {
      flaggedForDeletion.push({
        table: 'NotifyMeLead',
        id: lead.id,
        identifier: `Lead: ${lead.email}`,
        reason: 'Flagged: Test lead from automated form testing.',
      });
    } else {
      protectedRows.push({
        table: 'NotifyMeLead',
        id: lead.id,
        identifier: `Lead: ${lead.email}`,
        reason: 'Protected: Real prospective student notification request.',
      });
    }
  }

  console.log('\n======================================================');
  console.log('              DRY RUN AUDIT SUMMARY                   ');
  console.log('======================================================');
  console.log(`Total Protected Rows:       ${protectedRows.length}`);
  console.log(`Total Flagged For Deletion: ${flaggedForDeletion.length}`);
  console.log('------------------------------------------------------');

  console.log('\nPROTECTED ROWS BREAKDOWN:');
  for (const p of protectedRows) {
    console.log(`  [PROTECTED] [${p.table}] ${p.identifier} -> ${p.reason}`);
  }

  console.log('\nFLAGGED ROWS BREAKDOWN:');
  if (flaggedForDeletion.length === 0) {
    console.log('  🎉 None! Database is already 100% clean with zero fake records.');
  } else {
    for (const f of flaggedForDeletion) {
      console.log(`  [FLAGGED] [${f.table}] ${f.identifier} -> ${f.reason}`);
    }
  }

  return { backupFile, protectedRows, flaggedForDeletion };
}

run()
  .catch((e) => {
    console.error('Audit failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
