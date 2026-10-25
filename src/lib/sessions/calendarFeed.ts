/**
 * iCal Calendar Feed Generator & Secret Token Management
 * Vihangam Institute of Astrology and Research (VIAR)
 * 
 * Provides an RFC 5545 compliant iCal (.ics) subscription feed for Acharya Niraj Kumar
 * to subscribe to all 1-on-1 mentorship sessions in Google Calendar, Apple Calendar, or Outlook.
 */

import type { StudentSessionRecord } from './types';

// In-memory token store with persistent default
let _calendarFeedSecretToken = 'sec_vcal_acharyaniraj_8f3a92b1e7c4';

export function getCalendarFeedToken(): string {
  return _calendarFeedSecretToken;
}

export function regenerateCalendarFeedToken(): string {
  const randomPart = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
  _calendarFeedSecretToken = `sec_vcal_${Date.now()}_${randomPart}`;
  return _calendarFeedSecretToken;
}

export function verifyCalendarFeedToken(token: string): boolean {
  if (!token) return false;
  return token === _calendarFeedSecretToken;
}

/**
 * Format a Date object to iCal UTC timestamp format: YYYYMMDDTHHMMSSZ
 */
function formatToICalUtc(date: Date): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
}

/**
 * Clean & escape text for iCal fields (newlines escaped as \n, commas escaped as \,)
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Generate RFC 5545 VCALENDAR feed string
 */
export function generateICalendarFeed(
  sessions: StudentSessionRecord[],
  baseUrl: string = 'https://viar.in'
): string {
  const nowUtc = formatToICalUtc(new Date());

  const events = sessions
    .filter((s) => s.status !== 'CANCELLED')
    .map((s) => {
      const startDate = new Date(s.startTime);
      const endDate = new Date(startDate.getTime() + (s.duration || 60) * 60 * 1000);
      const dtStart = formatToICalUtc(startDate);
      const dtEnd = formatToICalUtc(endDate);

      const summary = `1-on-1 Vedic Astrology: ${s.studentName} — ${s.title}`;
      const descLines = [
        `Student: ${s.studentName} (${s.studentEmail})`,
        s.studentPhone ? `Phone: ${s.studentPhone}` : null,
        `Course: ${s.courseTitle || 'Vedic Astrology'}`,
        s.meetingLink ? `Meeting Link: ${s.meetingLink}` : `Meeting Platform: ${s.meetingPlatform}`,
        s.sharedNotes ? `Shared Notes: ${s.sharedNotes}` : null,
        s.homework ? `Homework: ${s.homework}` : null,
        s.privateNotes ? `Private Notes (Owner): ${s.privateNotes}` : null,
        `Status: ${s.status}`,
        `Manage on VIAR: ${baseUrl}/admin?tab=sessions`,
      ].filter(Boolean) as string[];

      const description = escapeICalText(descLines.join('\n'));
      const location = escapeICalText(s.meetingLink || s.meetingPlatform || 'Online Video Class');

      return [
        'BEGIN:VEVENT',
        `UID:${s.id}@viar.in`,
        `DTSTAMP:${nowUtc}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:${escapeICalText(summary)}`,
        `DESCRIPTION:${description}`,
        `LOCATION:${location}`,
        s.meetingLink ? `URL:${s.meetingLink}` : null,
        `STATUS:${s.status === 'COMPLETED' ? 'CONFIRMED' : 'TENTATIVE'}`,
        'END:VEVENT',
      ]
        .filter(Boolean)
        .join('\r\n');
    });

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Viar.in//1-on-1 Personal Mentorship Sessions//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:VIAR 1-on-1 Sessions (Acharya Niraj Kumar)',
    'X-WR-CALDESC:Personal live teaching classes with enrolled Vedic Astrology scholars.',
    'X-WR-TIMEZONE:Asia/Kolkata',
    ...events,
    'END:VCALENDAR',
  ];

  return lines.join('\r\n');
}

/**
 * Generate RFC 5545 single-event .ics file for a student
 * Strictly omits private notes for the Owner.
 */
export function generateStudentSessionICal(session: {
  id: string;
  title: string;
  startTime: string | Date;
  duration: number;
  meetingLink?: string | null;
  meetingPlatform?: string | null;
  sharedNotes?: string | null;
  homework?: string | null;
  courseTitle?: string | null;
  baseUrl?: string;
}): string {
  const nowUtc = formatToICalUtc(new Date());
  const startDate = session.startTime instanceof Date ? session.startTime : new Date(session.startTime);
  const endDate = new Date(startDate.getTime() + (session.duration || 60) * 60 * 1000);
  const dtStart = formatToICalUtc(startDate);
  const dtEnd = formatToICalUtc(endDate);

  const summary = `1-on-1 Class with Acharya Niraj Kumar: ${session.title}`;
  const descLines = [
    `Acharya Niraj Kumar — Personal Vedic Astrology Mentorship`,
    session.courseTitle ? `Course: ${session.courseTitle}` : `The Ultimate Astrology Course: Foundations to Chart Mastery`,
    session.meetingLink ? `Meeting Link: ${session.meetingLink}` : `Platform: ${session.meetingPlatform || 'Online'}`,
    session.sharedNotes ? `Pre-Class Notes: ${session.sharedNotes}` : null,
    session.homework ? `Homework & Exercises: ${session.homework}` : null,
    `VIAR Student Portal: ${session.baseUrl || 'https://viar.in'}/dashboard?tab=sessions`,
  ].filter(Boolean) as string[];

  const description = escapeICalText(descLines.join('\n'));
  const location = escapeICalText(session.meetingLink || session.meetingPlatform || 'Online Video Class');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Viar.in//1-on-1 Student Class//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:student-${session.id}@viar.in`,
    `DTSTAMP:${nowUtc}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeICalText(summary)}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    session.meetingLink ? `URL:${session.meetingLink}` : null,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  return lines.join('\r\n');
}
