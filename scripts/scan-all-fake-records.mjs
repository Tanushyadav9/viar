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
console.log('Target DB Host:', new URL(dbUrl).hostname);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});

async function run() {
  console.log('=== SCANNING ALL TABLES FOR FAKE / TEST / MOCK DATA ===\n');

  // 1. StudentSession
  const sessions = await prisma.studentSession.findMany({ include: { student: true } });
  console.log(`[StudentSession] Total rows: ${sessions.length}`);
  sessions.forEach(s => {
    console.log(`  - ID: ${s.id} | Title: "${s.title}" | Student: ${s.student?.name} (${s.student?.email}) | Link: ${s.meetingLink} | Time: ${s.startTime.toISOString()}`);
  });

  // 2. SessionRequest
  const requests = await prisma.sessionRequest.findMany({ include: { student: true } });
  console.log(`\n[SessionRequest] Total rows: ${requests.length}`);
  requests.forEach(r => {
    console.log(`  - ID: ${r.id} | Student: ${r.student?.name} (${r.student?.email}) | Status: ${r.status} | Msg: "${r.message}"`);
  });

  // 3. SessionEmailOutbox
  const outbox = await prisma.sessionEmailOutbox.findMany();
  console.log(`\n[SessionEmailOutbox] Total rows: ${outbox.length}`);
  outbox.forEach(o => {
    console.log(`  - ID: ${o.id} | To: ${o.recipientEmail} | Subject: "${o.subject}" | Type: ${o.emailType} | Status: ${o.status}`);
  });

  // 4. ActivityLog (Simulated / test audits)
  const testLogs = await prisma.activityLog.findMany({
    where: {
      OR: [
        { action: { contains: 'CRASH' } },
        { action: { contains: 'CONTACT' } },
        { reason: { contains: 'Simulated' } },
        { userEmail: { contains: 'example.com' } },
      ]
    }
  });
  console.log(`\n[ActivityLog - Simulated/Test] Total rows: ${testLogs.length}`);
  testLogs.forEach(l => {
    console.log(`  - ID: ${l.id} | Action: ${l.action} | User: ${l.userEmail} | Reason: "${l.reason}"`);
  });

  // 5. NotifyMeLead (Fake leads)
  const fakeLeads = await prisma.notifyMeLead.findMany({
    where: {
      OR: [
        { email: { contains: 'example.com' } },
        { name: { contains: 'User ' } },
        { name: { contains: 'Quiet Lead' } },
      ]
    }
  });
  console.log(`\n[NotifyMeLead - Fake] Total rows: ${fakeLeads.length}`);
  fakeLeads.forEach(l => {
    console.log(`  - ID: ${l.id} | Name: ${l.name} | Email: ${l.email}`);
  });

  // 6. Orders
  const testOrders = await prisma.order.findMany({
    where: {
      OR: [
        { orderReference: { contains: 'WALKTHROUGH' } },
        { studentEmail: { contains: 'example.com' } },
      ]
    }
  });
  console.log(`\n[Order - Test] Total rows: ${testOrders.length}`);
  testOrders.forEach(o => {
    console.log(`  - ID: ${o.id} | Ref: ${o.orderReference} | Email: ${o.studentEmail} | Amount: ${o.amount}`);
  });

  // 7. Users
  const testUsers = await prisma.user.findMany({
    where: {
      email: { contains: 'example.com' }
    }
  });
  console.log(`\n[User - Test] Total rows: ${testUsers.length}`);
  testUsers.forEach(u => {
    console.log(`  - ID: ${u.id} | Name: ${u.name} | Email: ${u.email} | Role: ${u.role}`);
  });
}

run().catch(console.error).finally(() => prisma.$disconnect());
