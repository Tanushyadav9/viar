const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function createBackup() {
  console.log('--- CREATING FRESH NEON DATABASE BACKUP ---');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'prisma', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupFile = path.join(backupDir, `neon_backup_main_${timestamp}.json`);

  const snapshot = {
    timestamp: new Date().toISOString(),
    databaseHost: 'ep-orange-poetry-b4cupwem.c-6.us-east-2.aws.neon.tech',
    models: {}
  };

  const modelList = [
    'user',
    'course',
    'module',
    'lesson',
    'cohort',
    'enrollment',
    'classSession',
    'oneOnOneSession',
    'studentSession',
    'sessionRequest',
    'ownerWorkingHours',
    'ownerBlockedDate',
    'sessionHistoryLog',
    'sessionEmailOutbox',
    'sessionProgress',
    'lessonProgress',
    'order',
    'payment',
    'paymentSettings',
    'activityLog',
    'notifyMeLead',
    'knowledgeEntry'
  ];

  for (const m of modelList) {
    try {
      if (prisma[m]) {
        const rows = await prisma[m].findMany();
        snapshot.models[m] = {
          count: rows.length,
          data: rows
        };
        console.log(`✓ Backed up ${m}: ${rows.length} rows`);
      }
    } catch (e) {
      console.log(`! Skipped ${m}: ${e.message}`);
    }
  }

  fs.writeFileSync(backupFile, JSON.stringify(snapshot, null, 2), 'utf8');
  console.log(`\n✅ Backup successfully written to:\n${backupFile}`);
  console.log(`Size: ${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB`);

  return backupFile;
}

createBackup()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
