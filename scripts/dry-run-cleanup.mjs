import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { extractHostFromUrl } from './guard-staging.mjs';

// Load .env
if (!process.env.DATABASE_URL && fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq > 0) {
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const prisma = new PrismaClient();
const PROTECTED_EMAILS = ['aapkaastro1606@gmail.com'];

async function main() {
  const currentHost = extractHostFromUrl(process.env.DATABASE_URL || process.env.DIRECT_URL);

  console.log('='.repeat(78));
  console.log('   PRODUCTION DATABASE TEST DATA CLEANUP — DRY-RUN AUDIT & PLAN');
  console.log('='.repeat(78));
  console.log(`Database Host: ${currentHost}`);
  console.log(`Mode:          DRY-RUN (NO DATA WILL BE MODIFIED OR DELETED)`);
  console.log(`Protected:     ${PROTECTED_EMAILS.join(', ')} (STRICTLY IMMUTABLE)`);
  console.log('='.repeat(78) + '\n');

  // 1. Audit Users table
  const allUsers = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
  });

  const testUsers = [];
  const validUsers = [];

  for (const u of allUsers) {
    const emailLower = (u.email || '').trim().toLowerCase();
    const isProtected = PROTECTED_EMAILS.includes(emailLower);

    if (isProtected) {
      validUsers.push(u);
      continue;
    }

    const isTestEmail =
      emailLower.includes('example.com') ||
      emailLower.includes('test') ||
      emailLower.startsWith('scholar.aarav') ||
      emailLower.startsWith('student_');

    if (isTestEmail) {
      testUsers.push(u);
    } else {
      validUsers.push(u);
    }
  }

  console.log(`1. USERS AUDIT (Total: ${allUsers.length}):`);
  console.log(`   - Legitimate/Protected Users to KEEP: ${validUsers.length}`);
  for (const vu of validUsers) {
    console.log(`     ✔ KEEP: id=${vu.id}, email=${vu.email}, name="${vu.name}", role=${vu.role}`);
  }

  console.log(`\n   - Identified Test Users for CLEANUP: ${testUsers.length}`);
  const testUserIds = testUsers.map((u) => u.id);
  for (const tu of testUsers) {
    console.log(`     ❌ PROPOSED DELETE: id=${tu.id}, email=${tu.email}, name="${tu.name}", clerkId=${tu.clerkId}, createdAt=${tu.createdAt.toISOString()}`);
  }

  // 2. Audit Enrollments
  const testEnrollments = await prisma.enrollment.findMany({
    where: { userId: { in: testUserIds } },
    include: { user: true, course: true },
  });

  console.log(`\n2. ENROLLMENTS AUDIT:`);
  console.log(`   - Proposed for Cleanup: ${testEnrollments.length}`);
  for (const te of testEnrollments) {
    console.log(`     ❌ PROPOSED DELETE: id=${te.id}, user=${te.user?.email}, course=${te.course?.slug}, status=${te.status}`);
  }

  // 3. Audit Orders
  const testOrders = await prisma.order.findMany({
    where: { userId: { in: testUserIds } },
    include: { user: true, course: true },
  });

  console.log(`\n3. ORDERS AUDIT:`);
  console.log(`   - Proposed for Cleanup: ${testOrders.length}`);
  const testOrderIds = testOrders.map((o) => o.id);
  for (const to of testOrders) {
    console.log(`     ❌ PROPOSED DELETE: id=${to.id}, user=${to.user?.email}, amount=${to.amount}, utr=${to.utr}, status=${to.status}`);
  }

  // 4. Audit ActivityLogs
  const testActivityLogs = await prisma.activityLog.findMany({
    where: {
      OR: [
        { entityId: { in: [...testUserIds, ...testOrderIds] } },
        { userEmail: { in: testUsers.map((u) => u.email).filter(Boolean) } },
      ],
    },
  });

  console.log(`\n4. ACTIVITY LOGS AUDIT:`);
  console.log(`   - Proposed for Cleanup: ${testActivityLogs.length}`);
  for (const tl of testActivityLogs) {
    console.log(`     ❌ PROPOSED DELETE: id=${tl.id}, action=${tl.action}, entityType=${tl.entityType}, entityId=${tl.entityId}`);
  }

  // 5. Verification of Critical Content (Must be 100% Preserved)
  console.log(`\n5. CRITICAL CONTENT PRESERVATION VERIFICATION:`);
  const coursesCount = await prisma.course.count();
  const cohortsCount = await prisma.cohort.count();
  const modulesCount = await prisma.module.count();
  const lessonsCount = await prisma.lesson.count();
  const quizzesCount = await prisma.quiz.count();
  const paymentSettingsCount = await prisma.paymentSettings.count();

  console.log(`   ✔ Courses:          ${coursesCount} (100% PRESERVED, 0 to delete)`);
  console.log(`   ✔ Cohorts:          ${cohortsCount} (100% PRESERVED, 0 to delete)`);
  console.log(`   ✔ Course Modules:   ${modulesCount} (100% PRESERVED, 0 to delete)`);
  console.log(`   ✔ Lessons:          ${lessonsCount} (100% PRESERVED, 0 to delete)`);
  console.log(`   ✔ Quizzes & Exams:  ${quizzesCount} (100% PRESERVED, 0 to delete)`);
  console.log(`   ✔ Payment Settings: ${paymentSettingsCount} (100% PRESERVED, 0 to delete)`);

  console.log('\n' + '='.repeat(78));
  console.log('   PREREQUISITE ACTION BEFORE EXECUTING CLEANUP:');
  console.log('='.repeat(78));
  console.log(' 1. CREATE BACKUP BRANCH ON NEON:');
  console.log('    Run via Neon CLI or Neon Console:');
  console.log('    $ neon branches create --name backup-pre-cleanup-2026-10-16 --parent main');
  console.log('\n 2. CREATE STAGING BRANCH FOR FUTURE TESTS:');
  console.log('    $ neon branches create --name staging --parent main');
  console.log('\n 3. DEVELOPER APPROVAL REQUIRED:');
  console.log('    Review the list above. To execute cleanup after backup creation,');
  console.log('    run: node scripts/execute-cleanup.mjs --confirm-cleanup-i-have-backup');
  console.log('='.repeat(78));
  console.log('\n[DRY RUN FINISHED] Zero database rows were modified or deleted.\n');
}

main().catch(console.error).finally(() => prisma.$disconnect());
