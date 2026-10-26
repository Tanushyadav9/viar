import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('--- 1. BACKUP & DRY RUN OF CLASS SESSIONS ---');
  const count = await prisma.classSession.count();
  console.log(`Found ${count} classSession rows in database.`);

  const rows = await prisma.classSession.findMany({
    orderBy: { sessionNumber: 'asc' },
  });

  const backupDir = path.resolve(process.cwd(), 'prisma', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupPath = path.join(backupDir, 'fake_class_sessions_backup_20261026.json');
  fs.writeFileSync(backupPath, JSON.stringify(rows, null, 2), 'utf8');
  console.log(`✓ Backup of ${rows.length} rows written safely to: ${backupPath}`);

  console.log('\n--- 2. DRY-RUN LIST OF ROWS TO BE DELETED ---');
  for (const r of rows) {
    console.log(`- ID: ${r.id} | Session #${r.sessionNumber}: "${r.title.slice(0, 40)}..." | Scheduled: ${r.scheduledAt.toISOString()} | Status: ${r.status}`);
  }

  // Check if any progress rows exist
  const progressCount = await prisma.sessionProgress.count();
  console.log(`\nAssociated session_progress count: ${progressCount}`);

  if (process.argv.includes('--execute')) {
    console.log('\n--- 3. EXECUTING DELETION (PRESERVING TABLES) ---');
    const deleteResult = await prisma.classSession.deleteMany({
      where: { cohortId: 'cohort-wia-batch-1' },
    });
    console.log(`✓ Successfully deleted ${deleteResult.count} fake classSession rows.`);
    const remaining = await prisma.classSession.count();
    console.log(`Remaining classSession count in database: ${remaining}`);
  } else {
    console.log('\nDry run complete. Run with --execute to perform deletion.');
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
