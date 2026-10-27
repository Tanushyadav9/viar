import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const env = {};
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq !== -1) {
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
      process.env[key] = val;
    }
  }
}

const dbUrl = env.DATABASE_URL || process.env.DATABASE_URL;
console.log('Connecting to database:', new URL(dbUrl).hostname);

const prisma = new PrismaClient({
  datasources: {
    db: { url: dbUrl }
  }
});

async function main() {
  console.log('\n================================================================');
  console.log('PURGING ALL FAKE/MOCK SESSIONS, MEETING LINKS & TEST AUDITS');
  console.log('================================================================\n');

  // 1. Delete all fake StudentSession rows
  console.log('Deleting fake StudentSession rows...');
  const deletedStudentSessions = await prisma.studentSession.deleteMany({
    where: {
      OR: [
        { meetingLink: { contains: 'viu-ast-tanush' } },
        { meetingLink: { contains: 'astropriya' } },
        { meetingLink: { contains: 'jyotish-mentorship-01' } },
        { title: { contains: 'Personal Chart Analysis: Lagna & Navamsha' } },
        { title: { contains: 'Dasha Timing & Transit Analysis' } },
        { title: { contains: 'Planetary Dignities & Career Analysis' } },
      ]
    }
  });
  console.log(`✓ Deleted StudentSession rows: ${deletedStudentSessions.count}`);

  // 2. Delete all fake SessionRequest rows
  console.log('Deleting fake SessionRequest rows...');
  const deletedRequests = await prisma.sessionRequest.deleteMany({
    where: {
      OR: [
        { message: { contains: 'urgent office presentation' } },
        { student: { email: { contains: 'example.com' } } }
      ]
    }
  });
  console.log(`✓ Deleted SessionRequest rows: ${deletedRequests.count}`);

  // 3. Delete all fake SessionEmailOutbox rows
  console.log('Deleting fake SessionEmailOutbox rows...');
  const deletedOutbox = await prisma.sessionEmailOutbox.deleteMany({
    where: {
      OR: [
        { subject: { contains: 'Reminder: Personal 1-on-1 Mentorship Class Tomorrow' } },
        { recipientEmail: { contains: 'example.com' } }
      ]
    }
  });
  console.log(`✓ Deleted SessionEmailOutbox rows: ${deletedOutbox.count}`);

  // 4. Delete old dummy ClassSession rows if any
  let deletedClassSessions = { count: 0 };
  if (prisma.classSession) {
    console.log('Deleting dummy ClassSession rows...');
    deletedClassSessions = await prisma.classSession.deleteMany({
      where: {
        id: { in: ['cls-wia-02', 'cls-wia-03'] }
      }
    });
    console.log(`✓ Deleted ClassSession rows: ${deletedClassSessions.count}`);
  }

  // 5. Delete simulated ActivityLog crash & contact rows
  console.log('Deleting simulated ActivityLog rows...');
  const deletedAuditLogs = await prisma.activityLog.deleteMany({
    where: {
      OR: [
        { action: 'CLIENT_CRASH_REPORTED' },
        { reason: { contains: 'Simulated' } },
        { userEmail: { contains: 'example.com' } }
      ]
    }
  });
  console.log(`✓ Deleted simulated ActivityLog rows: ${deletedAuditLogs.count}`);

  // 6. Delete fake leads
  console.log('Deleting fake NotifyMeLead rows...');
  const deletedLeads = await prisma.notifyMeLead.deleteMany({
    where: {
      OR: [
        { email: { contains: 'example.com' } },
        { name: { contains: 'User ' } },
        { name: { contains: 'Quiet Lead' } }
      ]
    }
  });
  console.log(`✓ Deleted fake NotifyMeLead rows: ${deletedLeads.count}`);

  // 7. Delete invalid progress rows without real videos
  console.log('Deleting invalid LessonProgress rows...');
  const deletedProgress = await prisma.lessonProgress.deleteMany({
    where: {
      id: { in: ['cmvno9ku900017hni36nmi4hv', 'cmvno9wd200037hni3q4wkqix'] }
    }
  });
  console.log(`✓ Deleted invalid LessonProgress rows: ${deletedProgress.count}`);

  // Verification: Verify remaining counts in database
  const remainingSessions = await prisma.studentSession.count();
  const remainingRequests = await prisma.sessionRequest.count();
  const remainingOutbox = await prisma.sessionEmailOutbox.count();
  const remainingUsers = await prisma.user.findMany({ select: { name: true, email: true, role: true } });

  console.log('\n--- VERIFICATION POST-PURGE ---');
  console.log(`Remaining StudentSession rows: ${remainingSessions} (Expected: 0)`);
  console.log(`Remaining SessionRequest rows: ${remainingRequests} (Expected: 0)`);
  console.log(`Remaining SessionEmailOutbox rows: ${remainingOutbox} (Expected: 0)`);
  console.log('Protected Users in Database:');
  remainingUsers.forEach(u => console.log(`  - ${u.name} (${u.email}) [${u.role}]`));
}

main()
  .catch(err => {
    console.error('Purge execution failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
