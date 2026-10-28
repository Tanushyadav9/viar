const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

// Helper to validate Google Meet or Zoom URLs
function isValidMeetingLink(link) {
  if (!link) return true; // empty link is fine for pending
  // Real Google meet: https://meet.google.com/abc-defg-hij (3-4-3 letters)
  const googleMeetRegex = /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/i;
  // Real Zoom meeting: https://(us02web|us04web|us05web|...)\.zoom\.us\/j\/\d{9,11}(\?pwd=[a-zA-Z0-9]+)?$
  const zoomRegex = /^https:\/\/([a-z0-9]+\.)?zoom\.us\/(j|my)\/[a-zA-Z0-9_.-]+(\?.*)?$/i;
  // Microsoft teams
  const teamsRegex = /^https:\/\/teams\.microsoft\.com\/l\/meetup-join\/.+/i;

  return googleMeetRegex.test(link) || zoomRegex.test(link) || teamsRegex.test(link);
}

async function main() {
  console.log('========================================================================');
  console.log('DRY RUN AUDIT: DEMO DATA, TEST ACCOUNTS, AND INVALID MEETING LINKS');
  console.log('========================================================================\n');

  const dryRunList = [];

  // 1. Scan Users
  const users = await prisma.user.findMany();
  for (const u of users) {
    const isOwner = u.email === 'aapkaastro1606@gmail.com' || u.role === 'OWNER';
    const isRohan = u.name?.toLowerCase().includes('rohan') || u.email?.toLowerCase().includes('rohan');
    const isExample = u.email?.toLowerCase().includes('example.com') || u.email?.toLowerCase().includes('test');
    
    if (isRohan) {
      dryRunList.push({
        table: 'User',
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        reason: 'Demo student persona (Rohan Sharma)',
        action: 'DELETE'
      });
    } else if (isExample && !isOwner) {
      dryRunList.push({
        table: 'User',
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        reason: `Test/demo email address (${u.email})`,
        action: 'DELETE'
      });
    }
  }

  // 2. Scan StudentSessions
  const studentSessions = await prisma.studentSession.findMany({
    include: { student: true }
  });
  for (const s of studentSessions) {
    const isDemoStudent = s.student?.name?.toLowerCase().includes('rohan') ||
                          s.student?.email?.toLowerCase().includes('example.com');
    const isInvalidLink = s.meetingLink && !isValidMeetingLink(s.meetingLink);
    const looksGenerated = s.meetingLink && (
      s.meetingLink.includes('jyotish-mentorship') ||
      s.meetingLink.includes('test') ||
      s.meetingLink.includes('viu-ast')
    );

    let reasons = [];
    if (isDemoStudent) reasons.push(`Linked to demo student: ${s.student?.name} (${s.student?.email})`);
    if (looksGenerated) reasons.push(`Generated/mock meeting link: "${s.meetingLink}"`);
    else if (isInvalidLink) reasons.push(`Malformed meeting link format: "${s.meetingLink}"`);

    if (reasons.length > 0) {
      dryRunList.push({
        table: 'StudentSession',
        id: s.id,
        title: s.title,
        studentId: s.studentId,
        studentName: s.student?.name,
        meetingLink: s.meetingLink,
        reason: reasons.join('; '),
        action: 'DELETE'
      });
    }
  }

  // 3. Scan ClassSessions
  const classSessions = await prisma.classSession.findMany();
  for (const cs of classSessions) {
    const isInvalidLink = cs.joinLink && !isValidMeetingLink(cs.joinLink);
    const looksGenerated = cs.joinLink && (
      cs.joinLink.includes('test') ||
      cs.joinLink.includes('fake') ||
      cs.joinLink.includes('batch1-class3') ||
      cs.joinLink.includes('abc-defg-hij') ||
      cs.joinLink.includes('9876543210')
    );

    let reasons = [];
    if (looksGenerated) reasons.push(`Auto-generated mock meeting link: "${cs.joinLink}"`);
    else if (isInvalidLink) reasons.push(`Malformed conference link: "${cs.joinLink}"`);

    if (reasons.length > 0) {
      dryRunList.push({
        table: 'ClassSession',
        id: cs.id,
        title: cs.title,
        joinLink: cs.joinLink,
        reason: reasons.join('; '),
        action: 'DELETE'
      });
    }
  }

  // 4. Scan SessionRequests
  const sessionRequests = await prisma.sessionRequest.findMany({
    include: { student: true }
  });
  for (const sr of sessionRequests) {
    const isDemoStudent = sr.student?.name?.toLowerCase().includes('rohan') ||
                          sr.student?.email?.toLowerCase().includes('example.com');
    let reasons = [];
    if (isDemoStudent) reasons.push(`Demo student request: ${sr.student?.name} (${sr.student?.email})`);
    if (sr.message && sr.message.toLowerCase().includes('demo')) reasons.push(`Demo request message: "${sr.message}"`);

    if (reasons.length > 0) {
      dryRunList.push({
        table: 'SessionRequest',
        id: sr.id,
        studentName: sr.student?.name,
        studentEmail: sr.student?.email,
        status: sr.status,
        reason: reasons.join('; '),
        action: 'DELETE'
      });
    }
  }

  // 5. Scan Lessons (check for fake/invalid live meeting links in curriculum lessons)
  const lessons = await prisma.lesson.findMany();
  for (const l of lessons) {
    const isInvalidLink = l.liveJoinLink && !isValidMeetingLink(l.liveJoinLink);
    const looksGenerated = l.liveJoinLink && (
      l.liveJoinLink.includes('abc-defg-hij') ||
      l.liveJoinLink.includes('test') ||
      l.liveJoinLink.includes('fake') ||
      l.liveJoinLink.includes('9876543210')
    );

    if (looksGenerated || isInvalidLink) {
      dryRunList.push({
        table: 'Lesson (Meeting Link Cleanup)',
        id: l.id,
        title: l.title,
        liveJoinLink: l.liveJoinLink,
        reason: looksGenerated ? `Generated dummy link ("${l.liveJoinLink}")` : `Invalid meeting link ("${l.liveJoinLink}")`,
        action: 'CLEAR_FIELD (liveJoinLink -> null)'
      });
    }
  }

  // 6. Scan SessionProgress
  const progressRows = await prisma.sessionProgress.findMany({
    include: { user: true }
  });
  for (const p of progressRows) {
    const isDemoUser = p.user?.name?.toLowerCase().includes('rohan') ||
                       p.user?.email?.toLowerCase().includes('example.com');
    if (isDemoUser) {
      dryRunList.push({
        table: 'SessionProgress',
        id: p.id,
        userName: p.user?.name,
        userEmail: p.user?.email,
        reason: `Progress recorded for demo user (${p.user?.email})`,
        action: 'DELETE'
      });
    }
  }

  // 7. Scan Enrollments
  const enrollments = await prisma.enrollment.findMany({
    include: { user: true }
  });
  for (const e of enrollments) {
    const isDemoUser = e.user?.name?.toLowerCase().includes('rohan') ||
                       e.user?.email?.toLowerCase().includes('example.com');
    if (isDemoUser) {
      dryRunList.push({
        table: 'Enrollment',
        id: e.id,
        userName: e.user?.name,
        userEmail: e.user?.email,
        reason: `Demo student enrollment (${e.user?.name} / ${e.user?.email})`,
        action: 'DELETE'
      });
    }
  }

  // 8. Scan Orders & Payments
  const orders = await prisma.order.findMany();
  for (const o of orders) {
    if (o.studentEmail?.toLowerCase().includes('example.com') || o.studentEmail?.toLowerCase().includes('rohan')) {
      dryRunList.push({
        table: 'Order',
        id: o.id,
        studentEmail: o.studentEmail,
        amount: o.amount,
        reason: `Test order for demo user (${o.studentEmail})`,
        action: 'DELETE'
      });
    }
  }

  // 9. Scan NotifyMeLeads
  const leads = await prisma.notifyMeLead.findMany();
  for (const ld of leads) {
    if (ld.email?.toLowerCase().includes('example.com') || ld.name?.toLowerCase().includes('user ') || ld.name?.toLowerCase().includes('lead')) {
      dryRunList.push({
        table: 'NotifyMeLead',
        id: ld.id,
        name: ld.name,
        email: ld.email,
        reason: `Generated lead persona (${ld.name} / ${ld.email})`,
        action: 'DELETE'
      });
    }
  }

  console.log(`Total Dry-Run Flagged Records: ${dryRunList.length}\n`);
  console.log(JSON.stringify(dryRunList, null, 2));

  // Also print all Users currently in the database to be 100% transparent
  console.log('\n--- ALL USERS IN DATABASE ---');
  for (const u of users) {
    console.log(`ID: ${u.id} | Name: "${u.name}" | Email: "${u.email}" | Role: ${u.role}`);
  }

  // Also print all Lessons with liveJoinLink
  console.log('\n--- ALL LESSONS WITH LIVE JOIN LINK ---');
  for (const l of lessons) {
    if (l.liveJoinLink) {
      console.log(`ID: ${l.id} | Title: "${l.title}" | JoinLink: "${l.liveJoinLink}"`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
