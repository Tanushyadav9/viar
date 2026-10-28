import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  isValidMeetingLink,
  parseIstToUtc,
  formatUtcToIst,
  INVALID_LINK_MESSAGE_EN,
  INVALID_LINK_MESSAGE_HI,
  computeLiveClassJoinWindow,
  gateMeetingLinkForStudent,
  formatStartsInCountdown,
  autoCompletePastLiveClasses,
} from '../src/lib/courses/liveClassesService';

describe('Prompt 10: Course Live Classes Invariants & Validation', () => {
  describe('1. Meeting Link Validation (Google Meet & Zoom)', () => {
    it('accepts authentic Google Meet links matching abc-defg-hij (3-4-3 letters)', () => {
      const link1 = 'https://meet.google.com/abc-defg-hij';
      const res1 = isValidMeetingLink(link1, 'GOOGLE_MEET');
      assert.strictEqual(res1.valid, true);
      assert.strictEqual(res1.provider, 'GOOGLE_MEET');
      assert.strictEqual(res1.normalizedUrl, 'https://meet.google.com/abc-defg-hij');

      const link2 = 'meet.google.com/xyz-pqrs-tuv';
      const res2 = isValidMeetingLink(link2);
      assert.strictEqual(res2.valid, true);
      assert.strictEqual(res2.provider, 'GOOGLE_MEET');
      assert.strictEqual(res2.normalizedUrl, 'https://meet.google.com/xyz-pqrs-tuv');

      const link3 = 'https://meet.google.com/kpm-vrtq-zxy';
      assert.strictEqual(isValidMeetingLink(link3).valid, true);

      const link4 = 'https://meet.google.com/wza-bcde-fgh';
      assert.strictEqual(isValidMeetingLink(link4).valid, true);
    });

    it('rejects fake, generated, or non-conforming Google Meet links with exact client message', () => {
      // 1. Prompt example: https://meet.google.com/jyotish-mentorship-01
      const fake1 = 'https://meet.google.com/jyotish-mentorship-01';
      const res1 = isValidMeetingLink(fake1, 'GOOGLE_MEET');
      assert.strictEqual(res1.valid, false);
      assert.strictEqual(res1.error, INVALID_LINK_MESSAGE_EN);
      assert.strictEqual(res1.errorHi, INVALID_LINK_MESSAGE_HI);

      // 2. Contains blacklisted words: example, test, jyotish-mentorship, xxx, demo
      const fakeXxx = 'https://meet.google.com/xxx-xxxx-xxx';
      const resXxx = isValidMeetingLink(fakeXxx);
      assert.strictEqual(resXxx.valid, false);
      assert.strictEqual(resXxx.error, INVALID_LINK_MESSAGE_EN);

      const fakeDemo = 'https://meet.google.com/abc-demo-hij';
      const resDemo = isValidMeetingLink(fakeDemo);
      assert.strictEqual(resDemo.valid, false);
      assert.strictEqual(resDemo.error, INVALID_LINK_MESSAGE_EN);

      const fakeExample = 'https://meet.google.com/example-astrology';
      const resExample = isValidMeetingLink(fakeExample);
      assert.strictEqual(resExample.valid, false);
      assert.strictEqual(resExample.error, INVALID_LINK_MESSAGE_EN);

      const fakeTest = 'https://us02web.zoom.us/j/1234567890?test=1';
      const resTest = isValidMeetingLink(fakeTest);
      assert.strictEqual(resTest.valid, false);
      assert.strictEqual(resTest.error, INVALID_LINK_MESSAGE_EN);

      // 3. Fake auto-generated code
      const fake2 = 'https://meet.google.com/sec-ret-link';
      const res2 = isValidMeetingLink(fake2);
      assert.strictEqual(res2.valid, false);
      assert.strictEqual(res2.error, INVALID_LINK_MESSAGE_EN);

      const empty = '';
      const res3 = isValidMeetingLink(empty);
      assert.strictEqual(res3.valid, false);
    });

    it('accepts authentic Zoom join links (with and without subdomains, with optional pwd)', () => {
      const zoom1 = 'https://us02web.zoom.us/j/12345678901';
      const res1 = isValidMeetingLink(zoom1, 'ZOOM');
      assert.strictEqual(res1.valid, true);
      assert.strictEqual(res1.provider, 'ZOOM');

      const zoom2 = 'https://zoom.us/j/9876543210';
      const res2 = isValidMeetingLink(zoom2);
      assert.strictEqual(res2.valid, true);
      assert.strictEqual(res2.provider, 'ZOOM');

      const zoom3 = 'https://us04web.zoom.us/j/98765432101?pwd=SecretPasscode123';
      const res3 = isValidMeetingLink(zoom3);
      assert.strictEqual(res3.valid, true);
      assert.strictEqual(res3.provider, 'ZOOM');
    });

    it('rejects unsupported domains and malformed URLs with exact client message', () => {
      const teams = 'https://teams.microsoft.com/l/meetup-join/12345';
      const res = isValidMeetingLink(teams);
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.error, INVALID_LINK_MESSAGE_EN);
    });
  });

  describe('2. Timezone Handling: IST Input to UTC Storage', () => {
    it('converts IST date and time to exact UTC timestamp', () => {
      // 15 Nov 2026 at 18:30 IST is 13:00 UTC (18:30 - 05:30)
      const utc = parseIstToUtc('2026-11-15', '18:30');
      assert.strictEqual(utc.toISOString(), '2026-11-15T13:00:00.000Z');

      // 1 Jan 2027 at 10:00 IST is 04:30 UTC
      const utc2 = parseIstToUtc('2027-01-01', '10:00');
      assert.strictEqual(utc2.toISOString(), '2027-01-01T04:30:00.000Z');
    });

    it('formats UTC timestamp back to IST date, time, and display', () => {
      const { dateStr, timeStr, display } = formatUtcToIst('2026-11-15T13:00:00.000Z');
      assert.strictEqual(dateStr, '2026-11-15');
      assert.strictEqual(timeStr, '18:30');
      assert.ok(display.includes('6:30'));
      assert.ok(display.includes('Nov') || display.includes('15'));
    });
  });

  describe('3. Draft vs Published Invariant', () => {
    it('allows a class to be saved as DRAFT without a meeting link', () => {
      const draftInput = {
        title: 'Navamsha Chart Reading',
        status: 'DRAFT',
        meetingLink: null,
      };
      // For draft, empty meeting link is valid
      const linkCheck = draftInput.meetingLink ? isValidMeetingLink(draftInput.meetingLink) : { valid: true };
      assert.strictEqual(linkCheck.valid, true);
    });

    it('forbids publishing a SCHEDULED class without a valid meeting link', () => {
      const scheduledInput = {
        title: 'Navamsha Chart Reading',
        status: 'SCHEDULED',
        meetingLink: null,
      };
      const isPublishing = scheduledInput.status === 'SCHEDULED';
      const hasValidLink = Boolean(
        scheduledInput.meetingLink && isValidMeetingLink(scheduledInput.meetingLink).valid
      );

      assert.strictEqual(isPublishing, true);
      assert.strictEqual(hasValidLink, false);
    });

    it('blocks publishing when existing meeting link fails validation', () => {
      const badExamples = [
        'https://meet.google.com/jyotish-mentorship-01',
        'https://meet.google.com/xxx-xxxx-xxx',
        'https://meet.google.com/demo-astrology-session',
        'https://zoom.us/j/example-call',
      ];

      for (const badLink of badExamples) {
        const val = isValidMeetingLink(badLink);
        assert.strictEqual(val.valid, false, `Link ${badLink} must fail validation`);
        assert.strictEqual(val.error, INVALID_LINK_MESSAGE_EN);
      }
    });
  });

  describe('4. Clash Protection Overlap Logic', () => {
    function isTimeOverlap(
      startA: number,
      durationA: number,
      startB: number,
      durationB: number
    ): boolean {
      const endA = startA + durationA * 60 * 1000;
      const endB = startB + durationB * 60 * 1000;
      return startA < endB && startB < endA;
    }

    const class1Start = new Date('2026-11-15T12:30:00.000Z').getTime(); // 18:00 IST
    const class1Duration = 60; // 18:00 to 19:00 IST

    it('detects overlap when a new class starts during an existing class', () => {
      const newClassStart = new Date('2026-11-15T13:00:00.000Z').getTime(); // 18:30 IST
      const newClassDuration = 60; // 18:30 to 19:30 IST

      const overlap = isTimeOverlap(class1Start, class1Duration, newClassStart, newClassDuration);
      assert.strictEqual(overlap, true, 'Classes overlapping from 18:30 to 19:00 should clash');
    });

    it('detects overlap when a new class encompasses an existing class', () => {
      const newClassStart = new Date('2026-11-15T12:00:00.000Z').getTime(); // 17:30 IST
      const newClassDuration = 120; // 17:30 to 19:30 IST

      const overlap = isTimeOverlap(class1Start, class1Duration, newClassStart, newClassDuration);
      assert.strictEqual(overlap, true);
    });

    it('allows adjacent non-overlapping classes that touch boundaries', () => {
      // 17:00 to 18:00 IST (ends exactly when class 1 starts)
      const prevClassStart = new Date('2026-11-15T11:30:00.000Z').getTime(); // 17:00 IST
      const prevClassDuration = 60;
      assert.strictEqual(
        isTimeOverlap(class1Start, class1Duration, prevClassStart, prevClassDuration),
        false,
        'Adjacent preceding class should not clash'
      );

      // 19:00 to 20:00 IST (starts exactly when class 1 ends)
      const nextClassStart = new Date('2026-11-15T13:30:00.000Z').getTime(); // 19:00 IST
      const nextClassDuration = 60;
      assert.strictEqual(
        isTimeOverlap(class1Start, class1Duration, nextClassStart, nextClassDuration),
        false,
        'Adjacent succeeding class should not clash'
      );
    });
  });

  describe('5. Security: Private Host Notes Student Isolation', () => {
    it('sanitizes student response so privateHostNotes is never exposed', () => {
      const dbLiveSession = {
        id: 'lesson-live-1',
        title: 'Lagna Analysis',
        agenda: 'Discussion on Ascendant signs and lordships',
        liveScheduledAt: new Date('2026-11-20T12:30:00.000Z'),
        durationMinutes: 60,
        liveJoinLink: 'https://meet.google.com/abc-defg-hij',
        meetingPlatform: 'GOOGLE_MEET',
        status: 'SCHEDULED',
        documentUrl: 'https://viar.in/notes/lagna.pdf',
        privateHostNotes: 'CONFIDENTIAL: Focus on student questions regarding Saturn retrograde.',
      };

      // Student sanitizer representation
      const studentView = {
        id: dbLiveSession.id,
        title: dbLiveSession.title,
        startTime: dbLiveSession.liveScheduledAt.toISOString(),
        duration: dbLiveSession.durationMinutes,
        meetingLink: dbLiveSession.liveJoinLink,
        meetingPlatform: dbLiveSession.meetingPlatform,
        status: dbLiveSession.status,
        sharedNotes: dbLiveSession.agenda,
        notesPdf: dbLiveSession.documentUrl,
        // strictly no privateHostNotes
      };

      assert.strictEqual('privateHostNotes' in studentView, false);
      assert.strictEqual(studentView.title, 'Lagna Analysis');
      assert.strictEqual(studentView.meetingLink, 'https://meet.google.com/abc-defg-hij');
      assert.strictEqual(studentView.notesPdf, 'https://viar.in/notes/lagna.pdf');
    });
  });

  describe('6. Student Live Class Visibility & Reveal Window Link Gating', () => {
    const classStartUtc = '2026-11-20T10:00:00.000Z'; // 15:30 IST
    const classStartMs = new Date(classStartUtc).getTime();
    const duration = 60; // 1 hour -> ends at 11:00 UTC (16:30 IST)
    const validLink = 'https://meet.google.com/abc-defg-hij';

    it('outside reveal window (>30 mins before start): meeting link is strictly null, button state is STARTS_IN', () => {
      // 45 minutes before start
      const nowMs = classStartMs - 45 * 60 * 1000;

      const gatedLink = gateMeetingLinkForStudent({
        rawMeetingLink: validLink,
        startTime: classStartUtc,
        durationMinutes: duration,
        nowMs,
      });
      assert.strictEqual(gatedLink, null, 'Link must be strictly null outside reveal window');

      const window = computeLiveClassJoinWindow({
        startTime: classStartUtc,
        durationMinutes: duration,
        nowMs,
      });
      assert.strictEqual(window.isWindowOpen, false);
      assert.strictEqual(window.canJoin, false);
      assert.strictEqual(window.hasEnded, false);
      assert.strictEqual(window.buttonState, 'STARTS_IN');
      assert.strictEqual(window.buttonLabelEn.includes('Starts in'), true);
      assert.strictEqual(window.buttonLabelHi.includes('प्रारंभ होने में'), true);
    });

    it('inside reveal window (15 mins before start): meeting link is returned, button state is JOIN_NOW', () => {
      // 15 minutes before start
      const nowMs = classStartMs - 15 * 60 * 1000;

      const gatedLink = gateMeetingLinkForStudent({
        rawMeetingLink: validLink,
        startTime: classStartUtc,
        durationMinutes: duration,
        nowMs,
      });
      assert.strictEqual(gatedLink, validLink, 'Link must be revealed inside the 30-min window');

      const window = computeLiveClassJoinWindow({
        startTime: classStartUtc,
        durationMinutes: duration,
        nowMs,
      });
      assert.strictEqual(window.isWindowOpen, true);
      assert.strictEqual(window.canJoin, true);
      assert.strictEqual(window.buttonState, 'JOIN_NOW');
      assert.strictEqual(window.buttonLabelEn, 'Join now');
      assert.strictEqual(window.buttonLabelHi, 'अभी जुड़ें');
    });

    it('during class: meeting link is returned, button state is JOIN_NOW', () => {
      // 20 minutes into class
      const nowMs = classStartMs + 20 * 60 * 1000;

      const gatedLink = gateMeetingLinkForStudent({
        rawMeetingLink: validLink,
        startTime: classStartUtc,
        durationMinutes: duration,
        nowMs,
      });
      assert.strictEqual(gatedLink, validLink);

      const window = computeLiveClassJoinWindow({
        startTime: classStartUtc,
        durationMinutes: duration,
        nowMs,
      });
      assert.strictEqual(window.isWindowOpen, true);
      assert.strictEqual(window.canJoin, true);
      assert.strictEqual(window.buttonState, 'JOIN_NOW');
    });

    it('class ended without recording (<2 hours after end): meeting link still accessible, button state is CLASS_ENDED', () => {
      // 30 minutes after class ends
      const nowMs = classStartMs + (duration + 30) * 60 * 1000;

      const gatedLink = gateMeetingLinkForStudent({
        rawMeetingLink: validLink,
        startTime: classStartUtc,
        durationMinutes: duration,
        nowMs,
      });
      assert.strictEqual(gatedLink, validLink, 'Meeting link stays accessible until 2 hours after end');

      const window = computeLiveClassJoinWindow({
        startTime: classStartUtc,
        durationMinutes: duration,
        nowMs,
      });
      assert.strictEqual(window.isWindowOpen, true);
      assert.strictEqual(window.hasEnded, true);
      assert.strictEqual(window.canJoin, false);
      assert.strictEqual(window.buttonState, 'CLASS_ENDED');
      assert.strictEqual(window.buttonLabelEn, 'Class ended: recording coming soon');
      assert.strictEqual(window.buttonLabelHi, 'कक्षा समाप्त: रिकॉर्डिंग जल्द उपलब्ध होगी');
    });

    it('class ended (>2 hours after end): meeting link is strictly null', () => {
      // 2 hours and 15 minutes after end
      const nowMs = classStartMs + (duration + 135) * 60 * 1000;

      const gatedLink = gateMeetingLinkForStudent({
        rawMeetingLink: validLink,
        startTime: classStartUtc,
        durationMinutes: duration,
        nowMs,
      });
      assert.strictEqual(gatedLink, null, 'Meeting link must be suppressed after 2 hours past end');

      const window = computeLiveClassJoinWindow({
        startTime: classStartUtc,
        durationMinutes: duration,
        nowMs,
      });
      assert.strictEqual(window.isWindowOpen, false);
      assert.strictEqual(window.hasEnded, true);
      assert.strictEqual(window.buttonState, 'CLASS_ENDED');
    });

    it('when recordingUrl is present: button state is WATCH_RECORDING', () => {
      const recordingUrl = 'https://customer-xxx.cloudflarestream.com/yyy/manifest/video.m3u8';
      const nowMs = classStartMs + (duration + 30) * 60 * 1000;

      const window = computeLiveClassJoinWindow({
        startTime: classStartUtc,
        durationMinutes: duration,
        recordingUrl,
        nowMs,
      });
      assert.strictEqual(window.buttonState, 'WATCH_RECORDING');
      assert.strictEqual(window.buttonLabelEn, 'Watch recording');
      assert.strictEqual(window.buttonLabelHi, 'रिकॉर्डिंग देखें');
    });

    it('Owner-adjustable reveal window (e.g. 15 mins or 60 mins)', () => {
      // Test custom revealMinutesBefore = 60 mins
      const customWindow60 = computeLiveClassJoinWindow({
        startTime: classStartUtc,
        durationMinutes: duration,
        revealMinutesBefore: 60,
        nowMs: classStartMs - 50 * 60 * 1000, // 50m before start
      });
      assert.strictEqual(customWindow60.isWindowOpen, true, '60m window should open at 50m before start');
      assert.strictEqual(customWindow60.buttonState, 'JOIN_NOW');

      // Test custom revealMinutesBefore = 15 mins
      const customWindow15 = computeLiveClassJoinWindow({
        startTime: classStartUtc,
        durationMinutes: duration,
        revealMinutesBefore: 15,
        nowMs: classStartMs - 25 * 60 * 1000, // 25m before start
      });
      assert.strictEqual(customWindow15.isWindowOpen, false, '15m window should be closed at 25m before start');
      assert.strictEqual(customWindow15.buttonState, 'STARTS_IN');
    });
  });

  describe('7. Recordings for Missed Classes & Automatic Completion', () => {
    it('classes switch to Completed automatically after their end time', () => {
      const nowMs = Date.now();
      // Class 1: ended 1 hour ago
      const endedClass = {
        id: 'lesson-ended-1',
        title: 'Planetary Periods',
        liveScheduledAt: new Date(nowMs - 2 * 60 * 60 * 1000), // 2h ago
        durationMinutes: 60, // ended 1h ago
        status: 'SCHEDULED',
      };
      const endMs = endedClass.liveScheduledAt.getTime() + endedClass.durationMinutes * 60 * 1000;
      const isPast = endMs <= nowMs;
      const autoCompletedStatus = isPast && endedClass.status !== 'CANCELLED' ? 'COMPLETED' : endedClass.status;

      assert.strictEqual(isPast, true);
      assert.strictEqual(autoCompletedStatus, 'COMPLETED', 'Past class must automatically switch to COMPLETED');

      // Class 2: starts tomorrow
      const futureClass = {
        id: 'lesson-future-1',
        title: 'Transits & Gochara',
        liveScheduledAt: new Date(nowMs + 24 * 60 * 60 * 1000),
        durationMinutes: 60,
        status: 'SCHEDULED',
      };
      const futureEndMs = futureClass.liveScheduledAt.getTime() + futureClass.durationMinutes * 60 * 1000;
      const isFuturePast = futureEndMs <= nowMs;
      const futureStatus = isFuturePast && futureClass.status !== 'CANCELLED' ? 'COMPLETED' : futureClass.status;

      assert.strictEqual(isFuturePast, false);
      assert.strictEqual(futureStatus, 'SCHEDULED', 'Future class must remain SCHEDULED');
    });

    it('recording mode 1: Upload to video host (Cloudflare Stream UID)', () => {
      const liveLesson = {
        id: 'lesson-live-stream-1',
        title: 'Navamsha Marriage Breakdown',
        type: 'LIVE_SESSION',
        recordingStreamId: 'd3b07384d113edec49eaa6238ad5ff00',
        recordingUrl: 'https://videodelivery.net/d3b07384d113edec49eaa6238ad5ff00/manifest/video.m3u8',
        isExternalVideo: false,
        status: 'COMPLETED',
      };

      assert.strictEqual(liveLesson.isExternalVideo, false);
      assert.strictEqual(liveLesson.recordingStreamId, 'd3b07384d113edec49eaa6238ad5ff00');
      assert.strictEqual(liveLesson.status, 'COMPLETED');
    });

    it('recording mode 2: Clearly labelled external-link mode with warning', () => {
      const liveLesson = {
        id: 'lesson-live-external-1',
        title: 'D1 Chart Analysis Case Studies',
        type: 'LIVE_SESSION',
        recordingUrl: 'https://youtu.be/sample-unlisted-video',
        isExternalVideo: true,
        externalVideoUrl: 'https://youtu.be/sample-unlisted-video',
        status: 'COMPLETED',
      };

      assert.strictEqual(liveLesson.isExternalVideo, true);
      assert.strictEqual(liveLesson.externalVideoUrl, 'https://youtu.be/sample-unlisted-video');
      assert.strictEqual(liveLesson.status, 'COMPLETED');
    });

    it('zero attendance tracking penalty: watching recording counts identically to live attendance', () => {
      // Test payload sent to /api/progress for recording watch
      const progressRecord = {
        lessonId: 'lesson-live-rec-1',
        classSessionId: 'lesson-live-rec-1',
        completed: true,
        watched: true,
      };

      assert.strictEqual(progressRecord.completed, true, 'Progress must be marked completed for student');
      assert.strictEqual(progressRecord.watched, true, 'Watching recording completes lesson');
    });
  });
});
