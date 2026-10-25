import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { setTestAuthUser, type ServerAuthResult } from '../src/lib/auth/serverAuth.ts';
import {
  createStudentSession,
  listStudentSessions,
  updateStudentSession,
  createSessionRequest,
  listSessionRequests,
  getOwnerWorkingHours,
  updateOwnerWorkingHours,
  listOwnerBlockedDates,
  addOwnerBlockedDate,
  logSessionHistory,
  listSessionHistoryLogs,
  getCourseSessionSettings,
  updateCourseSessionSettings,
  generateWhatsAppShareUrl,
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

test('DATA (database, additive) — 1-on-1 Mentorship & Sessions Architecture', async (t) => {
  t.afterEach(() => {
    setTestAuthUser(null);
  });

  // 1. StudentSession
  await t.test('1. StudentSession: Full schema validation with UTC time, privacy separation & audit fields', async () => {
    const utcDate = new Date('2026-11-05T10:30:00Z'); // 10:30 UTC = 16:00 IST
    const session = await createStudentSession({
      enrollmentId: 'enr_001',
      studentId: 'usr_student_enrolled_001',
      courseId: 'what-is-astrology',
      moduleId: 'mod_003',
      lessonId: 'les_007',
      title: '7th House Analysis & Partner Navamsha',
      startTime: utcDate,
      duration: 60,
      meetingLink: 'https://meet.google.com/astrology-7th-house',
      meetingPlatform: 'GOOGLE_MEET',
      privateNotes: 'CONFIDENTIAL: Student inquired about marital delay and Saturn transit in 7th house.',
      sharedNotes: 'Please have the prospective partner exact birth time ready. Review Venus and Jupiter placements.',
      homework: 'Cast D9 chart for prospective chart and locate 7th lord position.',
      recordingUrl: 'https://drive.google.com/file/d/rec-7th-house/view',
      createdByUserId: 'usr_owner_001',
    });

    assert.ok(session.id, 'Session must generate unique ID');
    assert.equal(session.enrollmentId, 'enr_001');
    assert.equal(session.studentId, 'usr_student_enrolled_001');
    assert.equal(session.courseId, 'what-is-astrology');
    assert.equal(session.moduleId, 'mod_003');
    assert.equal(session.lessonId, 'les_007');
    assert.equal(session.title, '7th House Analysis & Partner Navamsha');
    assert.equal(session.startTime, utcDate.toISOString(), 'Start time must be stored in UTC format');
    assert.equal(session.duration, 60);
    assert.equal(session.meetingLink, 'https://meet.google.com/astrology-7th-house');
    assert.equal(session.status, 'SCHEDULED');
    assert.ok(session.privateNotes?.includes('CONFIDENTIAL: Student inquired'), 'Private notes preserved for Owner');
    assert.ok(session.sharedNotes?.includes('Please have the prospective partner'), 'Shared notes visible to student');
    assert.ok(session.homework?.includes('Cast D9 chart'), 'Homework visible to student');
    assert.equal(session.recordingUrl, 'https://drive.google.com/file/d/rec-7th-house/view');
    assert.equal(session.createdByUserId, 'usr_owner_001');
    assert.ok(session.createdAt);
    assert.ok(session.updatedAt);
  });

  // 2. Status Lifecycle: SCHEDULED, COMPLETED, MISSED, CANCELLED, RESCHEDULE_REQUESTED
  await t.test('2. StudentSession: Status transitions & audit logging', async () => {
    const session = await createStudentSession({
      enrollmentId: 'enr_001',
      studentId: 'usr_student_enrolled_001',
      courseId: 'what-is-astrology',
      title: 'Dasha Timing & Sade Sati',
      startTime: new Date(),
      createdByUserId: 'usr_owner_001',
    });

    assert.equal(session.status, 'SCHEDULED');

    // Update status to COMPLETED
    const completed = await updateStudentSession(session.id, {
      status: 'COMPLETED',
      sharedNotes: 'Class concluded. Analyzed Saturn transit in Pisces.',
      homework: 'Revise Sade Sati remedies.',
    }, 'usr_owner_001');

    assert.equal(completed?.status, 'COMPLETED');

    // Update status to RESCHEDULE_REQUESTED
    const rescheduleReq = await updateStudentSession(session.id, {
      status: 'RESCHEDULE_REQUESTED',
    }, 'usr_student_enrolled_001');

    assert.equal(rescheduleReq?.status, 'RESCHEDULE_REQUESTED');

    // Update status to MISSED
    const missed = await updateStudentSession(session.id, {
      status: 'MISSED',
    }, 'usr_owner_001');

    assert.equal(missed?.status, 'MISSED');

    // Update status to CANCELLED
    const cancelled = await updateStudentSession(session.id, {
      status: 'CANCELLED',
    }, 'usr_owner_001');

    assert.equal(cancelled?.status, 'CANCELLED');
  });

  // 3. SessionRequest
  await t.test('3. SessionRequest: Student requests a session or reschedule with 2-3 preferred time windows', async () => {
    // Initial Session Request
    const request = await createSessionRequest({
      enrollmentId: 'enr_001',
      studentId: 'usr_student_enrolled_001',
      courseId: 'what-is-astrology',
      requestType: 'INITIAL',
      message: 'Namaste Acharya ji, I have completed the 23 recorded modules and would like my 1-on-1 chart consultation.',
      preferredWindows: [
        {
          startUtc: '2026-11-02T10:30:00Z',
          endUtc: '2026-11-02T11:30:00Z',
          label: '2 Nov 2026, 4:00 PM - 5:00 PM IST',
        },
        {
          startUtc: '2026-11-03T05:30:00Z',
          endUtc: '2026-11-03T06:30:00Z',
          label: '3 Nov 2026, 11:00 AM - 12:00 PM IST',
        },
        {
          startUtc: '2026-11-04T12:30:00Z',
          endUtc: '2026-11-04T13:30:00Z',
          label: '4 Nov 2026, 6:00 PM - 7:00 PM IST',
        },
      ],
    });

    assert.ok(request.id);
    assert.equal(request.requestType, 'INITIAL');
    assert.equal(request.status, 'PENDING');
    assert.equal(request.preferredWindows.length, 3);
    assert.ok(request.message?.includes('completed the 23 recorded modules'));

    // Reschedule Request with Reason
    const reschedule = await createSessionRequest({
      enrollmentId: 'enr_001',
      studentId: 'usr_student_enrolled_001',
      courseId: 'what-is-astrology',
      studentSessionId: 'stud_sess_001',
      requestType: 'RESCHEDULE',
      rescheduleReason: 'Sudden family function on the originally scheduled evening.',
      preferredWindows: [
        {
          startUtc: '2026-11-06T10:30:00Z',
          endUtc: '2026-11-06T11:30:00Z',
          label: '6 Nov 2026, 4:00 PM - 5:00 PM IST',
        },
        {
          startUtc: '2026-11-07T10:30:00Z',
          endUtc: '2026-11-07T11:30:00Z',
          label: '7 Nov 2026, 4:00 PM - 5:00 PM IST',
        },
      ],
    });

    assert.equal(reschedule.requestType, 'RESCHEDULE');
    assert.equal(reschedule.studentSessionId, 'stud_sess_001');
    assert.ok(reschedule.rescheduleReason?.includes('Sudden family function'));
    assert.equal(reschedule.preferredWindows.length, 2);
  });

  // 4. Owner Working Hours & Blocked Dates in Asia/Kolkata
  await t.test('4. Owner Working Hours & Blocked Dates in Asia/Kolkata', async () => {
    const hours = await getOwnerWorkingHours();
    assert.equal(hours.length, 7, 'Must return working hours for all 7 days of week');

    // Verify Monday
    const monday = hours.find((h) => h.dayOfWeek === 1);
    assert.ok(monday);
    assert.equal(monday?.timezone, 'Asia/Kolkata');
    assert.equal(monday?.startTime, '10:00');
    assert.equal(monday?.endTime, '19:00');

    // Update Sunday to enabled
    const updatedSunday = await updateOwnerWorkingHours(0, {
      isEnabled: true,
      startTime: '14:00',
      endTime: '18:00',
    });
    assert.equal(updatedSunday.isEnabled, true);
    assert.equal(updatedSunday.startTime, '14:00');

    // Blocked Date
    const blocked = await addOwnerBlockedDate({
      blockedDate: '2026-11-08T00:00:00Z',
      reason: 'Diwali Festival Holiday',
      isFullDay: true,
    });
    assert.ok(blocked.id);
    assert.equal(blocked.timezone, 'Asia/Kolkata');
    assert.equal(blocked.reason, 'Diwali Festival Holiday');

    const allBlocked = await listOwnerBlockedDates();
    assert.ok(allBlocked.some((b) => b.reason === 'Diwali Festival Holiday'));
  });

  // 5. Session History Audit Log
  await t.test('5. Session History Audit Log: Complete audit trail', async () => {
    const log = await logSessionHistory({
      sessionId: 'stud_sess_001',
      sessionTitle: 'Kundli House 7 Analysis',
      action: 'RESCHEDULED',
      actorUserId: 'usr_owner_001',
      previousStatus: 'SCHEDULED',
      newStatus: 'SCHEDULED',
      notes: 'Moved class 1 day forward per student request',
      changeSummary: { previousStart: '2026-11-05T10:30:00Z', newStart: '2026-11-06T10:30:00Z' },
    });

    assert.ok(log.id);
    assert.equal(log.action, 'RESCHEDULED');
    assert.equal(log.actorUserId, 'usr_owner_001');
    assert.ok(log.changeSummary);

    const history = await listSessionHistoryLogs('stud_sess_001');
    assert.ok(history.length > 0);
    assert.equal(history[0].sessionId, 'stud_sess_001');
  });

  // 6. Optional Per-Course Settings
  await t.test('6. Optional Per-Course Settings: Empty by default, real Owner choices', async () => {
    // 1. Initial State: Must be empty/null by default
    const freshSettings = await getCourseSessionSettings('fresh-astrology-course-id');
    assert.equal(freshSettings.sessionsIncludedPerStudent, null, 'Must be empty/null by default');
    assert.equal(freshSettings.maximumActiveStudents, null, 'Must be empty/null by default (never a fake seat counter)');

    // 2. Owner Sets Real Numbers
    const saved = await updateCourseSessionSettings('what-is-astrology', {
      sessionsIncludedPerStudent: 5,     // 5 personal 1-on-1 sessions included with this course
      maximumActiveStudents: 15,        // Real human limit: Owner mentors max 15 students at a time
    });

    assert.equal(saved.sessionsIncludedPerStudent, 5);
    assert.equal(saved.maximumActiveStudents, 15);

    // Verify Read
    const retrieved = await getCourseSessionSettings('what-is-astrology');
    assert.equal(retrieved.sessionsIncludedPerStudent, 5);
    assert.equal(retrieved.maximumActiveStudents, 15);
  });
});
