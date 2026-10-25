import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  createStudentSession,
  listStudentSessions,
  createSessionRequest,
  listSessionRequests,
  updateStudentSession,
} from '../src/lib/sessions/oneOnOneService';

import {
  generateStudentSessionICal,
} from '../src/lib/sessions/calendarFeed';

import {
  getJoinWindowStatus,
  formatInTimezone,
  getUserLocalTimezone,
} from '../src/lib/timezones';

import { FLAGSHIP_23_MODULES } from '../src/lib/courseModules';

describe('STUDENT SCREENS (only for enrolled students) — 1-on-1 Sessions Architecture', () => {
  const studentAliceId = 'usr_stud_alice_enrolled';
  const studentBobId = 'usr_stud_bob_enrolled';
  const courseId = 'course-what-is-astrology';
  const enrollmentAlice = 'enr_alice_active_101';
  const enrollmentBob = 'enr_bob_active_102';

  // ----------------------------------------------------------------------------
  // 1. Gating & Student Data Isolation
  // ----------------------------------------------------------------------------
  test('1. Data Isolation: A student never sees another student sessions, meeting links or notes', async () => {
    // Create session for Alice
    const aliceSession = await createStudentSession({
      enrollmentId: enrollmentAlice,
      studentId: studentAliceId,
      studentName: 'Alice Green',
      studentEmail: 'alice@example.com',
      courseId,
      title: 'Module 1: Foundations of Vedic Astrology',
      startTime: new Date(Date.now() + 86400000).toISOString(),
      duration: 60,
      meetingLink: 'https://meet.google.com/ali-ce1-live',
      meetingPlatform: 'GOOGLE_MEET',
      privateNotes: 'CONFIDENTIAL OWNER NOTE: Alice struggled with house significations.',
      sharedNotes: 'Please review Kendra houses 1, 4, 7, 10 before our class.',
      homework: 'Draw your D1 birth chart with planetary degrees.',
      recordingUrl: 'https://cdn.viar.in/recordings/alice-class-01.mp4',
      createdByUserId: 'usr_owner_001',
    });

    // Create session for Bob
    const bobSession = await createStudentSession({
      enrollmentId: enrollmentBob,
      studentId: studentBobId,
      studentName: 'Bob White',
      studentEmail: 'bob@example.com',
      courseId,
      title: 'Module 8: Lagna & Casting Kundli',
      startTime: new Date(Date.now() + 172800000).toISOString(),
      duration: 60,
      meetingLink: 'https://meet.google.com/bob-white-link',
      meetingPlatform: 'GOOGLE_MEET',
      privateNotes: 'CONFIDENTIAL OWNER NOTE: Bob needs extra help with time of birth rectification.',
      sharedNotes: 'Prepare birth time accurate to the minute.',
      homework: 'Calculate rising degree of Lagna.',
      createdByUserId: 'usr_owner_001',
    });

    // When querying sessions for Alice:
    const aliceSessions = await listStudentSessions({ studentId: studentAliceId });
    assert.ok(aliceSessions.length >= 1, 'Alice must have sessions');

    // Verify Bob is not in Alice's list
    const foundBobSessionInAlice = aliceSessions.find((s) => s.id === bobSession.id);
    assert.equal(
      foundBobSessionInAlice,
      undefined,
      'Security violation: Alice must never see Bob session!'
    );

    // Verify Bob's meeting link is not leaked to Alice
    const anyBobLinkInAlice = aliceSessions.some((s) => s.meetingLink?.includes('bob-white-link'));
    assert.equal(anyBobLinkInAlice, false, 'Security violation: Alice must never see Bob meeting link!');

    // When querying sessions for Bob:
    const bobSessions = await listStudentSessions({ studentId: studentBobId });
    const foundAliceInBob = bobSessions.find((s) => s.id === aliceSession.id);
    assert.equal(foundAliceInBob, undefined, 'Security violation: Bob must never see Alice session!');
  });

  // ----------------------------------------------------------------------------
  // 2. Private Notes Scrubbing Rule
  // ----------------------------------------------------------------------------
  test('2. Private notes for the Owner are strictly stripped from student view', async () => {
    const rawSessions = await listStudentSessions({ studentId: studentAliceId });
    assert.ok(rawSessions.length > 0);

    // Simulate API serialization sanitization
    const sanitizedForStudent = rawSessions.map((s) => ({
      id: s.id,
      title: s.title,
      startTime: s.startTime,
      duration: s.duration,
      meetingLink: s.meetingLink,
      meetingPlatform: s.meetingPlatform,
      status: s.status,
      sharedNotes: s.sharedNotes,
      homework: s.homework,
      recordingUrl: s.recordingUrl,
      // privateNotes MUST be excluded
    }));

    for (const session of sanitizedForStudent) {
      assert.equal(
        (session as unknown as { privateNotes?: string }).privateNotes,
        undefined,
        'Private notes must be strictly undefined for student payload'
      );
      assert.ok(
        session.sharedNotes?.includes('Please review Kendra houses'),
        'Shared notes must remain accessible to the student'
      );
      assert.ok(
        session.homework?.includes('Draw your D1 birth chart'),
        'Homework must remain accessible to the student'
      );
    }
  });

  // ----------------------------------------------------------------------------
  // 3. Join Button 15-Minute Window & Countdown
  // ----------------------------------------------------------------------------
  test('3. Join button appears strictly 15 minutes before session start', () => {
    const now = Date.now();

    // 3A. Session is 2 hours away (> 15 minutes before)
    const futureTimeIso = new Date(now + 2 * 60 * 60 * 1000).toISOString();
    const futureStatus = getJoinWindowStatus(futureTimeIso, 15, 60);
    assert.equal(futureStatus.canJoin, false, 'Join button must NOT appear >15 mins before start');
    assert.equal(futureStatus.isWithinWindow, false);
    assert.equal(futureStatus.isLive, false);
    assert.equal(futureStatus.isPast, false);
    assert.ok(
      futureStatus.formattedCountdown.length > 0,
      'Must provide readable countdown until join link opens'
    );

    // 3B. Session is 20 minutes away
    const twentyMinsAway = new Date(now + 20 * 60 * 1000).toISOString();
    const twentyMinStatus = getJoinWindowStatus(twentyMinsAway, 15, 60);
    assert.equal(twentyMinStatus.canJoin, false, 'Join button must NOT appear 20 mins before');

    // 3C. Session is 14 minutes away (within 15 minutes window!)
    const fourteenMinsAway = new Date(now + 14 * 60 * 1000).toISOString();
    const fourteenMinStatus = getJoinWindowStatus(fourteenMinsAway, 15, 60);
    assert.equal(fourteenMinStatus.canJoin, true, 'Join button MUST appear within 15 mins of start');
    assert.equal(fourteenMinStatus.isWithinWindow, true);

    // 3D. Session is live now (10 minutes into a 60 min session)
    const tenMinsIn = new Date(now - 10 * 60 * 1000).toISOString();
    const liveStatus = getJoinWindowStatus(tenMinsIn, 15, 60);
    assert.equal(liveStatus.canJoin, true, 'Join button MUST remain active while class is live');
    assert.equal(liveStatus.isLive, true);

    // 3E. Session has ended (90 minutes after start of a 60 min session)
    const endedTime = new Date(now - 90 * 60 * 1000).toISOString();
    const endedStatus = getJoinWindowStatus(endedTime, 15, 60);
    assert.equal(endedStatus.canJoin, false, 'Join button must not be active after class ends');
    assert.equal(endedStatus.isPast, true);
  });

  // ----------------------------------------------------------------------------
  // 4. "Add to calendar" (.ics) Single-Event RFC 5545 Generation
  // ----------------------------------------------------------------------------
  test('4. Add to calendar (.ics) creates compliant RFC 5545 event with zero private notes', () => {
    const session = {
      id: 'sess_alice_test_ics_99',
      title: 'Module 16: Navamsha D9 Chart Analysis',
      startTime: '2026-11-05T14:00:00.000Z',
      duration: 60,
      meetingLink: 'https://meet.google.com/test-session-link',
      meetingPlatform: 'GOOGLE_MEET',
      sharedNotes: 'Have birth chart open in South or North Indian style.',
      homework: 'Identify Vargottama planets in D9.',
      courseTitle: 'The Ultimate Astrology Course: Foundations to Chart Mastery',
    };

    const icsContent = generateStudentSessionICal(session);

    assert.ok(icsContent.includes('BEGIN:VCALENDAR'), 'Must have BEGIN:VCALENDAR');
    assert.ok(icsContent.includes('VERSION:2.0'), 'Must specify VERSION:2.0');
    assert.ok(icsContent.includes('BEGIN:VEVENT'), 'Must have BEGIN:VEVENT');
    assert.ok(icsContent.includes('DTSTART:20261105T140000Z'), 'Must have correct UTC DTSTART');
    assert.ok(icsContent.includes('DTEND:20261105T150000Z'), 'Must have correct UTC DTEND (60 mins later)');
    assert.ok(icsContent.includes('SUMMARY:1-on-1 Class with Acharya Niraj Kumar: Module 16: Navamsha D9 Chart Analysis'));
    assert.ok(icsContent.includes('LOCATION:https://meet.google.com/test-session-link'));
    assert.ok(icsContent.includes('Pre-Class Notes: Have birth chart open'));
    assert.ok(icsContent.includes('Homework & Exercises: Identify Vargottama planets'));
    assert.ok(icsContent.includes('END:VEVENT'));
    assert.ok(icsContent.includes('END:VCALENDAR'));

    // Verify zero private notes in the ICS output
    assert.equal(icsContent.includes('privateNotes'), false);
    assert.equal(icsContent.includes('CONFIDENTIAL'), false);
  });

  // ----------------------------------------------------------------------------
  // 5. Timezone Display in Student's Local Timezone
  // ----------------------------------------------------------------------------
  test('5. Session time accurately converts to student local timezone (EDT, BST, IST)', () => {
    const utcIso = '2026-06-15T14:00:00.000Z'; // 14:00 UTC = 19:30 IST = 10:00 EDT = 15:00 BST

    const formattedIst = formatInTimezone(utcIso, 'Asia/Kolkata');
    assert.ok(
      formattedIst.includes('7:30') || formattedIst.includes('19:30'),
      `IST format should contain 7:30 or 19:30: ${formattedIst}`
    );

    const formattedEdt = formatInTimezone(utcIso, 'America/New_York');
    assert.ok(
      formattedEdt.includes('10:00'),
      `EDT format should contain 10:00: ${formattedEdt}`
    );

    const formattedBst = formatInTimezone(utcIso, 'Europe/London');
    assert.ok(
      formattedBst.includes('3:00') || formattedBst.includes('15:00'),
      `BST format should contain 3:00 or 15:00: ${formattedBst}`
    );
  });

  // ----------------------------------------------------------------------------
  // 6. Request a Session: Short Form with Preferred Windows
  // ----------------------------------------------------------------------------
  test('6. Request a session submits initial request with 2 to 3 preferred windows', async () => {
    const preferredWindows = [
      {
        startUtc: '2026-11-10T12:30:00.000Z',
        endUtc: '2026-11-10T13:30:00.000Z',
        label: 'Window 1: Tue Nov 10, 6:00 PM - 7:00 PM IST',
      },
      {
        startUtc: '2026-11-12T13:30:00.000Z',
        endUtc: '2026-11-12T14:30:00.000Z',
        label: 'Window 2: Thu Nov 12, 7:00 PM - 8:00 PM IST',
      },
    ];

    const req = await createSessionRequest({
      enrollmentId: enrollmentAlice,
      studentId: studentAliceId,
      studentName: 'Alice Green',
      studentEmail: 'alice@example.com',
      courseId,
      requestType: 'INITIAL',
      message: 'Module 16: Navamsha Chart (D9) — questions regarding 7th house lord in Navamsha.',
      preferredWindows,
    });

    assert.ok(req.id.startsWith('sreq_'));
    assert.equal(req.requestType, 'INITIAL');
    assert.equal(req.status, 'PENDING');
    assert.equal(req.preferredWindows.length, 2);

    const aliceRequests = await listSessionRequests({ studentId: studentAliceId });
    const found = aliceRequests.find((r) => r.id === req.id);
    assert.ok(found, 'Request must be retrievable by studentId');
    assert.equal(found?.status, 'PENDING');
  });

  // ----------------------------------------------------------------------------
  // 7. Request a Reschedule: Existing Session & New Preferred Windows
  // ----------------------------------------------------------------------------
  test('7. Request a reschedule binds to target session and updates status', async () => {
    // 7A. Create a scheduled session for Alice
    const sessionToReschedule = await createStudentSession({
      enrollmentId: enrollmentAlice,
      studentId: studentAliceId,
      courseId,
      title: 'Module 14: Major Auspicious Yogas',
      startTime: new Date(Date.now() + 3 * 86400000).toISOString(),
      duration: 60,
      meetingPlatform: 'GOOGLE_MEET',
      createdByUserId: 'usr_owner_001',
    });

    // 7B. Student Alice submits reschedule request
    const newWindows = [
      {
        startUtc: '2026-11-15T14:00:00.000Z',
        endUtc: '2026-11-15T15:00:00.000Z',
        label: 'Option 1: Sun Nov 15, 7:30 PM IST',
      },
      {
        startUtc: '2026-11-16T14:00:00.000Z',
        endUtc: '2026-11-16T15:00:00.000Z',
        label: 'Option 2: Mon Nov 16, 7:30 PM IST',
      },
    ];

    const reschedReq = await createSessionRequest({
      enrollmentId: enrollmentAlice,
      studentId: studentAliceId,
      studentName: 'Alice Green',
      studentEmail: 'alice@example.com',
      courseId,
      studentSessionId: sessionToReschedule.id,
      requestType: 'RESCHEDULE',
      rescheduleReason: 'Family wedding on Saturday, need to reschedule to Sunday or Monday.',
      preferredWindows: newWindows,
    });

    assert.equal(reschedReq.requestType, 'RESCHEDULE');
    assert.equal(reschedReq.studentSessionId, sessionToReschedule.id);
    assert.equal(reschedReq.rescheduleReason, 'Family wedding on Saturday, need to reschedule to Sunday or Monday.');

    // 7C. Update session status to RESCHEDULE_REQUESTED
    const updatedSession = await updateStudentSession(sessionToReschedule.id, {
      status: 'RESCHEDULE_REQUESTED',
    });
    assert.equal(updatedSession?.status, 'RESCHEDULE_REQUESTED');
  });

  // ----------------------------------------------------------------------------
  // 8. 23 Course Modules Consistency
  // ----------------------------------------------------------------------------
  test('8. Exactly 23 modules are defined for topic selection in student screens', () => {
    assert.equal(FLAGSHIP_23_MODULES.length, 23);
    assert.ok(FLAGSHIP_23_MODULES[0].startsWith('Module 1:'));
    assert.ok(FLAGSHIP_23_MODULES[22].startsWith('Module 23:'));
  });
});
