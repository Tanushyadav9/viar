import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { setTestAuthUser, type ServerAuthResult } from '../src/lib/auth/serverAuth.ts';
import {
  listOneOnOneSessions,
  createOneOnOneSession,
  updateOneOnOneSession,
  recordTaughtContent,
  deleteOneOnOneSession,
  generateWhatsAppShareUrl,
  formatSessionIST,
} from '../src/lib/sessions/oneOnOneService.ts';

const OWNER_PERSONA: ServerAuthResult = {
  isAuthenticated: true,
  userId: 'usr_owner_001',
  clerkId: 'clerk_owner_001',
  email: 'acharyanirajkumar@gmail.com',
  isEmailVerified: true,
  isOwner: true,
  isStaff: true,
  staffSections: ['content', 'media', 'courses', 'sessions', 'students', 'quizzes', 'analytics', 'payments'],
  role: 'OWNER',
  dbUser: {
    id: 'usr_owner_001',
    name: 'Acharya Niraj Kumar',
    email: 'acharyanirajkumar@gmail.com',
    role: 'OWNER',
    isOwner: true,
  } as any,
};

const STUDENT_PERSONA: ServerAuthResult = {
  isAuthenticated: true,
  userId: 'usr_student_enrolled_001',
  clerkId: 'clerk_student_001',
  email: 'rohan.sharma@example.com',
  isEmailVerified: true,
  isOwner: false,
  isStaff: false,
  staffSections: [],
  role: 'STUDENT',
  dbUser: {
    id: 'usr_student_enrolled_001',
    name: 'Rohan Sharma',
    email: 'rohan.sharma@example.com',
    phone: '+91 98101 23456',
    role: 'STUDENT',
    isOwner: false,
  } as any,
};

const LOGGED_OUT_PERSONA: ServerAuthResult = {
  isAuthenticated: false,
  userId: null,
  clerkId: null,
  email: null,
  isEmailVerified: false,
  isOwner: false,
  isStaff: false,
  staffSections: [],
  role: 'STUDENT',
  dbUser: null,
};

test('1-on-1 Personal Live Classes & Taught Content Logging Suite', async (t) => {
  t.afterEach(() => {
    setTestAuthUser(null);
  });

  await t.test('1. Core Service: Schedule personal 1-on-1 class for an individual student', async () => {
    const scheduledDate = new Date(Date.now() + 48 * 3600 * 1000); // 2 days from now
    const session = await createOneOnOneSession({
      studentId: 'usr_student_enrolled_001',
      studentName: 'Rohan Sharma',
      studentEmail: 'rohan.sharma@example.com',
      studentPhone: '+91 98101 23456',
      title: 'Kundli House 7 & Navamsha Compatibility',
      scheduledAt: scheduledDate,
      durationMinutes: 60,
      meetingPlatform: 'GOOGLE_MEET',
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      notes: 'Have birth details of prospective partner ready.',
    });

    assert.ok(session.id, 'Session must have a unique ID');
    assert.equal(session.studentId, 'usr_student_enrolled_001');
    assert.equal(session.title, 'Kundli House 7 & Navamsha Compatibility');
    assert.equal(session.durationMinutes, 60);
    assert.equal(session.meetingPlatform, 'GOOGLE_MEET');
    assert.equal(session.meetingLink, 'https://meet.google.com/abc-defg-hij');
    assert.equal(session.status, 'SCHEDULED');
    assert.equal(session.notes, 'Have birth details of prospective partner ready.');
  });

  await t.test('2. Core Service: Log "What was taught" and homework after class completion', async () => {
    // Create a temporary session
    const session = await createOneOnOneSession({
      studentId: 'usr_student_enrolled_001',
      studentName: 'Rohan Sharma',
      title: 'Planetary Aspects & Kendradhipati Dosha',
      scheduledAt: new Date(),
    });

    // Record taught content
    const updated = await recordTaughtContent(session.id, {
      taughtRecord: 'Detailed analysis of Jupiter aspect on 5th house. Discussed cancellation of Kendradhipati Dosha for benefic planets.',
      homework: 'Analyze 2 charts with Jupiter in 4th house and examine 10th house aspect.',
      recordingUrl: 'https://drive.google.com/file/d/astrology-lesson-aspects/view',
      markCompleted: true,
    });

    assert.ok(updated, 'Updated session record must exist');
    assert.equal(updated.status, 'COMPLETED');
    assert.ok(updated.taughtRecord?.includes('Detailed analysis of Jupiter aspect'));
    assert.ok(updated.homework?.includes('Analyze 2 charts'));
    assert.equal(updated.recordingUrl, 'https://drive.google.com/file/d/astrology-lesson-aspects/view');
  });

  await t.test('3. WhatsApp 1-Click Share: Generates pre-formatted invitation message', async () => {
    const session = await createOneOnOneSession({
      studentId: 'usr_student_enrolled_001',
      studentName: 'Rohan Sharma',
      studentPhone: '+91 98101 23456',
      title: 'Dasha Timing & Sade Sati Remedies',
      scheduledAt: '2026-10-30T16:00:00+05:30',
      durationMinutes: 60,
      meetingLink: 'https://meet.google.com/dasha-sade-sati',
      notes: 'Revise Saturn transit rules before joining.',
    });

    const shareUrl = generateWhatsAppShareUrl(session);
    assert.ok(shareUrl.startsWith('https://wa.me/919810123456?text='), 'Must target student cleaned phone number');
    assert.ok(shareUrl.includes(encodeURIComponent('Namaste Rohan Sharma ji')), 'Must contain respectful personalized greeting');
    assert.ok(shareUrl.includes(encodeURIComponent('Dasha Timing & Sade Sati Remedies')), 'Must contain class title');
    assert.ok(shareUrl.includes(encodeURIComponent('https://meet.google.com/dasha-sade-sati')), 'Must contain meeting link');
  });

  await t.test('4. Admin API (/api/admin/sessions): Owner permissions & scheduling flow', async () => {
    setTestAuthUser(OWNER_PERSONA);
    const { GET, POST, PATCH } = await import('../src/app/api/admin/sessions/route.ts');

    // GET
    const getReq = new NextRequest('http://localhost:3000/api/admin/sessions');
    const getRes = await GET(getReq);
    assert.equal(getRes.status, 200);
    const getData = await getRes.json();
    assert.ok(Array.isArray(getData.sessions), 'Must return sessions array');
    assert.ok(Array.isArray(getData.students), 'Must return student options array');

    // POST
    const postReq = new NextRequest('http://localhost:3000/api/admin/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: 'usr_student_enrolled_001',
        title: 'Career Analysis: 10th House & Dashamsha (D10)',
        scheduledAt: '2026-11-01T17:00:00+05:30',
        durationMinutes: 60,
        meetingPlatform: 'GOOGLE_MEET',
        meetingLink: 'https://meet.google.com/career-d10',
        notes: 'Review D10 chart rules.',
      }),
    });
    const postRes = await POST(postReq);
    assert.equal(postRes.status, 200);
    const postData = await postRes.json();
    assert.ok(postData.success);
    assert.equal(postData.session.title, 'Career Analysis: 10th House & Dashamsha (D10)');
    assert.ok(postData.session.whatsAppShareUrl, 'Must generate whatsapp share URL');

    // PATCH: Log what was taught
    const patchReq = new NextRequest('http://localhost:3000/api/admin/sessions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: postData.session.id,
        taughtRecord: 'Explored Sun and Mars in 10th house (Digbala). Discussed career change timings in Saturn Dasha.',
        homework: 'Find 3 charts with Digbala planets in 10th house.',
        markCompleted: true,
      }),
    });
    const patchRes = await PATCH(patchReq);
    assert.equal(patchRes.status, 200);
    const patchData = await patchRes.json();
    assert.equal(patchData.session.status, 'COMPLETED');
    assert.ok(patchData.session.taughtRecord.includes('Digbala'));
  });

  await t.test('5. Security: Logged-out and unauthorized access is blocked', async () => {
    setTestAuthUser(LOGGED_OUT_PERSONA);
    const { GET, POST } = await import('../src/app/api/admin/sessions/route.ts');

    const getReq = new NextRequest('http://localhost:3000/api/admin/sessions');
    const getRes = await GET(getReq);
    assert.equal(getRes.status, 403);

    const postReq = new NextRequest('http://localhost:3000/api/admin/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: 'usr_1', title: 'Test', scheduledAt: '2026-10-30T10:00:00Z' }),
    });
    const postRes = await POST(postReq);
    assert.equal(postRes.status, 403);
  });

  await t.test('6. Student API (/api/student/sessions): Student views their own 1-on-1 mentorship history', async () => {
    setTestAuthUser(STUDENT_PERSONA);
    const { GET } = await import('../src/app/api/student/sessions/route.ts');

    const getReq = new NextRequest('http://localhost:3000/api/student/sessions');
    const getRes = await GET(getReq);
    assert.equal(getRes.status, 200);
    const getData = await getRes.json();
    assert.ok(Array.isArray(getData.sessions));
    // Must return only sessions for usr_student_enrolled_001
    for (const sess of getData.sessions) {
      assert.equal(sess.studentId, 'usr_student_enrolled_001');
    }
  });
});
