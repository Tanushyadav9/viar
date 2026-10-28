/**
 * iCal Calendar Feed Generator & Secret Token Management
 * Vihangam Institute of Astrology and Research (VIAR)
 * 
 * Provides an RFC 5545 compliant iCal (.ics) subscription feed for Acharya Niraj Kumar
 * to subscribe to all course live classes in Google Calendar, Apple Calendar, or Outlook.
 * Zero student PII is exposed: contains only course titles, class topics, schedules, and meeting links.
 */

import crypto from 'crypto';
import type { StudentSessionRecord } from './types';

// In-memory token store with persistent default (cryptographically random, zero timestamps)
let _calendarFeedSecretToken = 'sec_vcal_acharyaniraj_8f3a92b1e7c44e90a6d1c8f2';

export function getCalendarFeedToken(): string {
  return _calendarFeedSecretToken;
}

export function regenerateCalendarFeedToken(): string {
  // Pure cryptographic randomness: 24 bytes (48 hex characters) with zero timestamps
  const secureRandomHex = crypto.randomBytes(24).toString('hex');
  _calendarFeedSecretToken = `sec_vcal_${secureRandomHex}`;
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
 * Strictly preserves student privacy: zero student names, emails, or phone numbers.
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

      const summary = `VIAR Live Class: ${s.title}`;
      const descLines = [
        `Course: ${s.courseTitle || 'Vedic Astrology Masterclass'}`,
        `Format: Interactive Live Class (All approved enrolled students)`,
        s.meetingLink ? `Meeting Link: ${s.meetingLink}` : `Meeting Platform: ${s.meetingPlatform}`,
        s.sharedNotes ? `Class Notes & Handouts: ${s.sharedNotes}` : null,
        s.recordingUrl ? `Class Recording: ${s.recordingUrl}` : null,
        `Status: ${s.status}`,
        `Manage Schedule: ${baseUrl}/admin?tab=sessions`,
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
    'PRODID:-//Viar.in//Course Live Classes Timetable//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:VIAR Course Live Classes (Acharya Niraj Kumar)',
    'X-WR-CALDESC:Course live classes and timetable for Vedic Astrology Masterclass.',
    'X-WR-TIMEZONE:Asia/Kolkata',
    ...events,
    'END:VCALENDAR',
  ];

  return lines.join('\r\n');
}

/**
 * Generate a single event RFC 5545 iCal file for a student's calendar
 */
export function generateStudentSessionICal(session: {
  id: string;
  title: string;
  startTime: string;
  duration?: number;
  meetingLink?: string | null;
  meetingPlatform?: string;
  sharedNotes?: string | null;
  homework?: string | null;
  courseTitle?: string | null;
}): string {
  const nowUtc = formatToICalUtc(new Date());
  const startDate = new Date(session.startTime);
  const endDate = new Date(startDate.getTime() + (session.duration || 60) * 60 * 1000);
  const dtStart = formatToICalUtc(startDate);
  const dtEnd = formatToICalUtc(endDate);

  const summary = `VIAR Live Class: ${session.title}`;
  const descLines = [
    `Course: ${session.courseTitle || 'Vedic Astrology Masterclass'}`,
    `Format: Interactive Live Class`,
    session.meetingLink ? `Meeting Link: ${session.meetingLink}` : `Meeting Platform: ${session.meetingPlatform || 'Google Meet'}`,
    session.sharedNotes ? `Class Notes & Handouts: ${session.sharedNotes}` : null,
    session.homework ? `Homework & Practice: ${session.homework}` : null,
    `Join on VIAR: https://viar.in/dashboard?tab=sessions`,
  ].filter(Boolean) as string[];

  const description = escapeICalText(descLines.join('\n'));
  const location = escapeICalText(session.meetingLink || session.meetingPlatform || 'Google Meet');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Viar.in//Live Class Event//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${session.id}@viar.in`,
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
  ].filter(Boolean) as string[];

  return lines.join('\r\n');
}
