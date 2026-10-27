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
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const prisma = new PrismaClient();

async function main() {
  console.log('=== INSPECTING SESSIONS IN DATABASE ===');
  console.log('Connecting to host:', new URL(process.env.DATABASE_URL).hostname);
  
  const studentSessions = await prisma.studentSession.findMany({
    include: { student: true }
  });
  console.log(`\nFound ${studentSessions.length} StudentSession records:`);
  for (const s of studentSessions) {
    console.log(JSON.stringify({
      id: s.id,
      title: s.title,
      student: s.student ? `${s.student.name} (${s.student.email})` : s.studentId,
      startTime: s.startTime,
      meetingLink: s.meetingLink,
      status: s.status,
      sharedNotes: s.sharedNotes,
      privateNotes: s.privateNotes
    }, null, 2));
  }

  const oneOnOneSessions = await prisma.oneOnOneSession.findMany({
    include: { student: true }
  });
  console.log(`\nFound ${oneOnOneSessions.length} OneOnOneSession records:`);
  for (const s of oneOnOneSessions) {
    console.log(JSON.stringify({
      id: s.id,
      title: s.title,
      student: s.student ? `${s.student.name} (${s.student.email})` : s.studentId,
      scheduledAt: s.scheduledAt,
      meetingLink: s.meetingLink,
      status: s.status
    }, null, 2));
  }

  const sessionRequests = await prisma.sessionRequest.findMany({
    include: { student: true }
  });
  console.log(`\nFound ${sessionRequests.length} SessionRequest records:`);
  for (const r of sessionRequests) {
    console.log(JSON.stringify({
      id: r.id,
      student: r.student ? `${r.student.name} (${r.student.email})` : r.studentId,
      status: r.status,
      message: r.message,
      preferredWindows: r.preferredWindows
    }, null, 2));
  }

  const outbox = await prisma.sessionEmailOutbox.findMany();
  console.log(`\nFound ${outbox.length} SessionEmailOutbox records:`);
  for (const o of outbox) {
    console.log(JSON.stringify({
      id: o.id,
      recipientEmail: o.recipientEmail,
      emailType: o.emailType,
      subject: o.subject,
      status: o.status
    }, null, 2));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
