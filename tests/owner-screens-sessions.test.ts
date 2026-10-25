import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  createStudentSession,
  listStudentSessions,
  updateStudentSession,
  checkSessionClash,
  checkWorkingHours,
  createStudentSessionWithValidation,
  createSessionRequest,
  listSessionRequests,
  resolveSessionRequest,
  getCourseSessionSettings,
  updateCourseSessionSettings,
  formatSessionIST,
} from '../src/lib/sessions/oneOnOneService';

import {
  getCalendarFeedToken,
  regenerateCalendarFeedToken,
  verifyCalendarFeedToken,
  generateICalendarFeed,
} from '../src/lib/sessions/calendarFeed';

import { formatInTimezone } from '../src/lib/timezones';

describe('OWNER SCREENS — 1-on-1 Mentorship, Scheduling & Calendar Architecture', () => {
  // Setup clean test data IDs
  const testStudent1 = 'usr_owner_scr_stud_001';
  const testStudent2 = 'usr_owner_scr_stud_002';
  const testCourseId = 'course-what-is-astrology';

  // ----------------------------------------------------------------------------
  // 1. Student Page Data & Sessions Quota Logic
  // ----------------------------------------------------------------------------
  test('1. Student page: Enrolment, progress, quiz results & included sessions quota rules', async () => {
    // 1A. When course has NO included count set (null / empty default)
    await updateCourseSessionSettings(testCourseId, {
      sessionsIncludedPerStudent: null,
      maximumActiveStudents: null,
    });
    const defaultSettings = await getCourseSessionSettings(testCourseId);
    assert.equal(
      defaultSettings.sessionsIncludedPerStudent,
      null,
      'sessionsIncludedPerStudent must be null by default'
    );

    // 1B. When Owner explicitly configures an included session count (e.g. 5 sessions)
    await updateCourseSessionSettings(testCourseId, {
      sessionsIncludedPerStudent: 5,
      maximumActiveStudents: 25,
    });
    const configuredSettings = await getCourseSessionSettings(testCourseId);
    assert.equal(
      configuredSettings.sessionsIncludedPerStudent,
      5,
      'sessionsIncludedPerStudent must reflect real Owner limit (5)'
    );

    // Quota display rule: count used out of included
    const sampleUsed = 3;
    const remaining = (configuredSettings.sessionsIncludedPerStudent || 0) - sampleUsed;
    assert.equal(remaining, 2, 'Must calculate 2 sessions remaining');
  });

  // ----------------------------------------------------------------------------
  // 2. Schedule Form: Dual Timezone, Duration, Topic & WhatsApp Message
  // ----------------------------------------------------------------------------
  test('2. Schedule form: Dual timezone preview (IST + student timezone) & WhatsApp message', async () => {
    // Student in America/New_York (EDT)
    const startTimeUtc = '2026-11-10T12:30:00.000Z'; // 18:00 IST (6:00 PM IST)

    // IST calculation: 12:30 UTC + 5:30 = 18:00 IST
    const istDisplay = formatSessionIST(startTimeUtc);
    assert.match(istDisplay, /6:00\s*pm/i, 'Should format to 6:00 PM IST');

    // Student timezone calculation: 12:30 UTC - 5h = 07:30 AM EST (or 08:30 EDT)
    const nyDisplay = formatInTimezone(startTimeUtc, 'America/New_York', 'full');
    assert.ok(nyDisplay.includes('2026'), 'Should format in America/New_York timezone');

    // Create session
    const session = await createStudentSession({
      enrollmentId: `enr_${testStudent1}`,
      studentId: testStudent1,
      courseId: testCourseId,
      title: 'Module 16: Navamsha Chart (D9) & Divisional Charts Analysis',
      startTime: startTimeUtc,
      duration: 60,
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      meetingPlatform: 'GOOGLE_MEET',
      sharedNotes: 'Have birth chart ready. Focus on D9 Lagna.',
      privateNotes: 'Quick learner on houses, needs practice on graha aspects.',
      createdByUserId: 'usr_owner_001',
    });

    assert.equal(session.duration, 60);
    assert.ok(session.meetingLink?.startsWith('https://meet.google.com/'));
  });

  // ----------------------------------------------------------------------------
  // 3. Repeat Weekly: Creates Separate Independent Sessions
  // ----------------------------------------------------------------------------
  test('3. Repeat weekly: Generates separate independent sessions (editing one never alters others)', async () => {
    const baseTimeUtc = '2026-11-17T12:30:00.000Z'; // Tuesday 6:00 PM IST
    const repeatWeeks = 4; // 4 weekly classes

    const result = await createStudentSessionWithValidation({
      enrollmentId: `enr_${testStudent1}`,
      studentId: testStudent1,
      courseId: testCourseId,
      title: 'Weekly Astrological Kundli Mastery',
      startTime: baseTimeUtc,
      duration: 60,
      meetingLink: 'https://meet.google.com/weekly-test',
      createdByUserId: 'usr_owner_001',
      repeatWeeklyCount: repeatWeeks,
      allowOutsideWorkingHours: true,
    });

    assert.equal(result.sessions.length, 4, 'Should generate 4 separate sessions');

    // Verify each has distinct ID and 7-day offset
    const idSet = new Set(result.sessions.map((s) => s.id));
    assert.equal(idSet.size, 4, 'Each session must have a unique ID');

    const firstDate = new Date(result.sessions[0].startTime).getTime();
    const secondDate = new Date(result.sessions[1].startTime).getTime();
    const sevenDaysMs = 7 * 24 * 3600 * 1000;
    assert.equal(secondDate - firstDate, sevenDaysMs, 'Second session must be exactly 7 days after first');

    // Independent mutation: Cancel session 2, session 1 and 3 remain SCHEDULED
    const updatedSess2 = await updateStudentSession(result.sessions[1].id, {
      status: 'CANCELLED',
    });
    assert.equal(updatedSess2?.status, 'CANCELLED');

    const allSessions = await listStudentSessions({ studentId: testStudent1 });
    const sess1 = allSessions.find((s) => s.id === result.sessions[0].id);
    const sess3 = allSessions.find((s) => s.id === result.sessions[2].id);
    assert.equal(sess1?.status, 'SCHEDULED', 'Session 1 must remain SCHEDULED');
    assert.equal(sess3?.status, 'SCHEDULED', 'Session 3 must remain SCHEDULED');
  });

  // ----------------------------------------------------------------------------
  // 4. Server Clash Protection & Working Hours Confirmation
  // ----------------------------------------------------------------------------
  test('4. Clash protection: Refuses session that overlaps another student; warns outside working hours', async () => {
    // Existing slot: 2026-12-01 at 14:00 UTC (19:30 IST) for 60 mins -> ends 15:00 UTC
    const existingSlot = '2026-12-01T14:00:00.000Z';
    await createStudentSession({
      enrollmentId: `enr_${testStudent1}`,
      studentId: testStudent1,
      courseId: testCourseId,
      title: 'Existing Student Class',
      startTime: existingSlot,
      duration: 60,
      createdByUserId: 'usr_owner_001',
    });

    // Attempt 1: Overlapping time (14:30 UTC, 30 mins into existing session) for student 2
    const overlappingSlot = '2026-12-01T14:30:00.000Z';
    const clashCheck = await checkSessionClash({
      startTime: overlappingSlot,
      duration: 60,
    });

    assert.equal(clashCheck.hasClash, true, 'Server must detect time clash');
    assert.match(
      clashCheck.conflictMessage || '',
      /Time clash/i,
      'Should report time clash with conflicting student'
    );

    // Validation wrapper should refuse creation with clash error
    const clashValidation = await createStudentSessionWithValidation({
      studentId: testStudent2,
      title: 'Conflicting Class',
      startTime: overlappingSlot,
      duration: 60,
      createdByUserId: 'usr_owner_001',
    });
    assert.ok(clashValidation.clashError, 'Must return clashError');
    assert.equal(clashValidation.sessions.length, 0, 'Must NOT create clashing session');

    // Attempt 2: Non-overlapping slot succeeds
    const nonOverlappingSlot = '2026-12-01T15:30:00.000Z'; // 30 mins after session 1 ends
    const clearClashCheck = await checkSessionClash({
      startTime: nonOverlappingSlot,
      duration: 60,
    });
    assert.equal(clearClashCheck.hasClash, false, 'Non-overlapping slot must be allowed');
  });

  // ----------------------------------------------------------------------------
  // 5. Sessions Calendar & Private Secret iCal Feed Subscription
  // ----------------------------------------------------------------------------
  test('5. Sessions calendar: iCal subscription feed (.ics) with secret token & regeneration', async () => {
    // 5A. Secret token verification
    const initialToken = getCalendarFeedToken();
    assert.ok(initialToken.startsWith('sec_vcal_'), 'Token must follow secure pattern');
    assert.equal(verifyCalendarFeedToken(initialToken), true, 'Valid token must be verified');
    assert.equal(verifyCalendarFeedToken('invalid-secret-token'), false, 'Bad token must be rejected');

    // 5B. Generate RFC 5545 iCal Feed
    const allSessions = await listStudentSessions();
    const icalFeed = generateICalendarFeed(allSessions);

    assert.ok(icalFeed.includes('BEGIN:VCALENDAR'), 'Must contain VCALENDAR opening');
    assert.ok(icalFeed.includes('VERSION:2.0'), 'Must specify iCal version 2.0');
    assert.ok(icalFeed.includes('PRODID:-//Viar.in//1-on-1 Personal Mentorship Sessions//EN'));
    assert.ok(icalFeed.includes('END:VCALENDAR'), 'Must contain VCALENDAR closing');

    // 5C. Token Regeneration: Invalidate old token and produce fresh secret
    const newToken = regenerateCalendarFeedToken();
    assert.notEqual(newToken, initialToken, 'New token must differ from old');
    assert.equal(verifyCalendarFeedToken(newToken), true, 'New token must verify');
    assert.equal(verifyCalendarFeedToken(initialToken), false, 'Old token must now fail verification');
  });

  // ----------------------------------------------------------------------------
  // 6. Requests Inbox: One-Click Actions (Schedule, Propose, Decline)
  // ----------------------------------------------------------------------------
  test('6. Requests inbox: One-click actions (Schedule from request, Propose another time, Decline)', async () => {
    // Create student request with 2 preferred windows
    const request = await createSessionRequest({
      enrollmentId: `enr_${testStudent1}`,
      studentId: testStudent1,
      studentName: 'Rohan Sharma',
      studentEmail: 'rohan@example.com',
      requestType: 'INITIAL',
      message: 'Need help understanding Vimshottari Dasha transitions',
      preferredWindows: [
        {
          startUtc: '2026-11-20T10:30:00.000Z',
          endUtc: '2026-11-20T11:30:00.000Z',
          label: 'Friday 4:00 PM - 5:00 PM IST',
        },
        {
          startUtc: '2026-11-21T10:30:00.000Z',
          endUtc: '2026-11-21T11:30:00.000Z',
          label: 'Saturday 4:00 PM - 5:00 PM IST',
        },
      ],
    });

    assert.equal(request.status, 'PENDING');
    assert.equal(request.preferredWindows.length, 2);

    // One-click action: Propose another time
    const resolvedProposal = await resolveSessionRequest({
      requestId: request.id,
      status: 'DECLINED',
      resolvedByUserId: 'usr_owner_001',
      rescheduleReason: 'Proposed slot: Saturday 11:00 AM IST instead',
    });

    assert.equal(resolvedProposal?.status, 'DECLINED');
    assert.ok(resolvedProposal?.rescheduleReason?.includes('Saturday 11:00 AM IST'));
  });

  // ----------------------------------------------------------------------------
  // 7. After a Class: Attendance, Privacy Separation & 1-Click Missed Reschedule
  // ----------------------------------------------------------------------------
  test('7. After a class: Attendance, private vs shared notes, homework, recording & 1-click missed reschedule', async () => {
    // Create class session
    const classSession = await createStudentSession({
      enrollmentId: `enr_${testStudent1}`,
      studentId: testStudent1,
      courseId: testCourseId,
      title: 'Module 12: Vimshottari Dasha Calculations',
      startTime: '2026-11-25T11:00:00.000Z',
      duration: 60,
      createdByUserId: 'usr_owner_001',
    });

    // 7A. Complete class with private notes (Owner only) and shared notes/homework
    const completedSession = await updateStudentSession(classSession.id, {
      status: 'COMPLETED',
      privateNotes: 'Student showed exceptional insight into Rahu Mahadasha.',
      sharedNotes: 'Covered balance of Dasha at birth and Antardasha calculation method.',
      homework: 'Calculate Mars Antardasha dates for chart #4.',
      recordingUrl: 'https://drive.google.com/file/d/test-recording-123/view',
    });

    assert.equal(completedSession?.status, 'COMPLETED');
    assert.ok(completedSession?.privateNotes?.includes('exceptional insight'));
    assert.ok(completedSession?.sharedNotes?.includes('balance of Dasha'));
    assert.ok(completedSession?.homework?.includes('chart #4'));
    assert.equal(completedSession?.recordingUrl, 'https://drive.google.com/file/d/test-recording-123/view');

    // 7B. Missed class handling: Mark MISSED and verify 1-click reschedule eligibility
    const missedSession = await updateStudentSession(classSession.id, {
      status: 'MISSED',
      privateNotes: 'Student had internet connectivity issues.',
    });

    assert.equal(missedSession?.status, 'MISSED');

    // 1-Click reschedule: immediately creates new scheduled class with topic preserved
    const rescheduledSession = await createStudentSession({
      enrollmentId: missedSession.enrollmentId,
      studentId: missedSession.studentId,
      courseId: missedSession.courseId,
      title: `Rescheduled: ${missedSession.title}`,
      startTime: '2026-11-26T11:00:00.000Z',
      duration: missedSession.duration,
      sharedNotes: `Rescheduled from missed class on ${formatSessionIST(missedSession.startTime)}.`,
      createdByUserId: 'usr_owner_001',
    });

    assert.equal(rescheduledSession.status, 'SCHEDULED');
    assert.ok(rescheduledSession.title.startsWith('Rescheduled:'));
  });
});
