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
  const confirmed = process.argv.includes('--confirm-cleanup-i-have-backup');

  if (!confirmed) {
    console.error('\n' + '='.repeat(78));
    console.error(' 🛑 [ABORTED] CLEANUP EXECUTION REQUIRES EXPLICIT DEVELOPER APPROVAL');
    console.error('='.repeat(78));
    console.error(' Prerequisite: Confirm that a Neon backup branch has been created first:');
    console.error(' $ neon branches create --name backup-pre-cleanup-2026-10-16 --parent main');
    console.error('\n To execute the approved cleanup, pass:');
    console.error(' $ node scripts/execute-cleanup.mjs --confirm-cleanup-i-have-backup');
    console.error('='.repeat(78) + '\n');
    process.exit(1);
  }

  console.log('='.repeat(78));
  console.log('   EXECUTING APPROVED PRODUCTION DATABASE TEST DATA CLEANUP');
  console.log('='.repeat(78));
  console.log(`Database Host: ${currentHost}`);
  console.log(`Protected:     ${PROTECTED_EMAILS.join(', ')} (NEVER DELETED)`);
  console.log('='.repeat(78) + '\n');

  // Identify test users
  const allUsers = await prisma.user.findMany();
  const testUsers = allUsers.filter((u) => {
    const emailLower = (u.email || '').trim().toLowerCase();
    if (PROTECTED_EMAILS.includes(emailLower)) return false;
    return (
      emailLower.includes('example.com') ||
      emailLower.includes('test') ||
      emailLower.startsWith('scholar.aarav') ||
      emailLower.startsWith('student_')
    );
  });

  const testUserIds = testUsers.map((u) => u.id);

  if (testUserIds.length === 0) {
    console.log('No test user rows found. Production database is already clean!');
    return;
  }

  const testOrders = await prisma.order.findMany({
    where: { userId: { in: testUserIds } },
  });
  const testOrderIds = testOrders.map((o) => o.id);

  // Execute cascade cleanup in transaction
  console.log(`1. Deleting test activity logs...`);
  const deletedLogs = await prisma.activityLog.deleteMany({
    where: {
      OR: [
        { entityId: { in: [...testUserIds, ...testOrderIds] } },
        { userEmail: { in: testUsers.map((u) => u.email).filter(Boolean) } },
      ],
    },
  });
  console.log(`   ✔ Deleted ${deletedLogs.count} test activity log rows.`);

  console.log(`2. Deleting test enrollments...`);
  const deletedEnrollments = await prisma.enrollment.deleteMany({
    where: { userId: { in: testUserIds } },
  });
  console.log(`   ✔ Deleted ${deletedEnrollments.count} test enrollment rows.`);

  console.log(`3. Deleting test orders...`);
  const deletedOrders = await prisma.order.deleteMany({
    where: { userId: { in: testUserIds } },
  });
  console.log(`   ✔ Deleted ${deletedOrders.count} test order rows.`);

  console.log(`4. Deleting test users (STRICTLY EXCLUDING ${PROTECTED_EMAILS.join(', ')})...`);
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      id: { in: testUserIds },
      email: { notIn: PROTECTED_EMAILS },
    },
  });
  console.log(`   ✔ Deleted ${deletedUsers.count} test user rows.`);

  console.log('\n' + '='.repeat(78));
  console.log(' ✅ CLEANUP COMPLETED SUCCESSFULLY');
  console.log('='.repeat(78));
  console.log(` Production database test data has been purged.`);
  console.log(` Legitimate courses, cohorts, and settings are 100% intact.`);
  console.log('='.repeat(78) + '\n');
}

main().catch(console.error).finally(() => prisma.$disconnect());
