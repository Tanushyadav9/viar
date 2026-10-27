import fs from 'fs';
import { PrismaClient } from '@prisma/client';

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
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const prisma = new PrismaClient();

async function run() {
  console.log('=== CHECKING ALL SESSION AND NOTIFICATION TABLES ===');
  
  if (prisma.classSession) {
    const cs = await prisma.classSession.findMany();
    console.log(`ClassSession count: ${cs.length}`);
    cs.forEach(c => console.log('  ClassSession:', c.id, c.title, c.scheduledStartTime));
  }

  if (prisma.oneOnOneSession) {
    const os = await prisma.oneOnOneSession.findMany();
    console.log(`OneOnOneSession count: ${os.length}`);
    os.forEach(o => console.log('  OneOnOneSession:', o.id, o.title));
  }

  if (prisma.studentSession) {
    const ss = await prisma.studentSession.findMany();
    console.log(`StudentSession count: ${ss.length}`);
    ss.forEach(s => console.log('  StudentSession:', s.id, s.title, s.meetingLink, s.startTime));
  }

  if (prisma.sessionRequest) {
    const sr = await prisma.sessionRequest.findMany();
    console.log(`SessionRequest count: ${sr.length}`);
    sr.forEach(r => console.log('  SessionRequest:', r.id, r.status, r.message));
  }

  if (prisma.sessionEmailOutbox) {
    const seo = await prisma.sessionEmailOutbox.findMany();
    console.log(`SessionEmailOutbox count: ${seo.length}`);
    seo.forEach(o => console.log('  SessionEmailOutbox:', o.id, o.emailType, o.recipientEmail, o.status));
  }

  if (prisma.ownerWorkingHours) {
    const owh = await prisma.ownerWorkingHours.findMany();
    console.log(`OwnerWorkingHours count: ${owh.length}`);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
