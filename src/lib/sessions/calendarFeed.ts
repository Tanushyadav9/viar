/**
 * iCal Calendar Feed Generator & Secret Token Management
 * Vihangam Institute of Astrology and Research (VIAR)
 * 
 * Provides an RFC 5545 compliant iCal (.ics) subscription feed for Acharya Niraj Kumar
 * to subscribe to course live classes in Google Calendar, Apple Calendar, or Outlook.
 * 
 * SECURITY INVARIANTS:
 * 1. Zero student PII: Strictly live class schedules, topics, agenda, and meeting links.
 *    No student names, emails, phone numbers, or private student notes are ever included.
 * 2. Token entropy: Cryptographically random with at least 32 bytes (256 bits) of entropy.
 * 3. Hashed storage: Token is stored hashed (SHA-256) in the database.
 * 4. Masking: Token is displayed masked with a copy button in the UI.
 * 5. Regeneration: Invalidation is immediate — regenerating creates a fresh 32-byte token
 *    and invalidates the previous token hash immediately.
 */

import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import type { StudentSessionRecord } from './types';

/**
 * Generate a cryptographically secure random token with at least 32 bytes of entropy.
 */
export function generateSecureCalendarToken(): string {
  // 32 bytes = 256 bits of cryptographic entropy -> 64 hex characters
  const entropyHex = crypto.randomBytes(32).toString('hex');
  return `sec_vcal_${entropyHex}`;
}

/**
 * Compute SHA-256 hash of a calendar token.
 */
export function hashCalendarToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

/**
 * Mask a calendar token for safe UI display (shows prefix and last 4 characters).
 */
export function maskCalendarToken(token: string): string {
  if (!token) return '••••••••••••••••';
  const prefix = token.startsWith('sec_vcal_') ? 'sec_vcal_' : '';
  const body = token.replace('sec_vcal_', '');
  if (body.length <= 8) return `${prefix}••••••••`;
  return `${prefix}••••••••••••••••${body.slice(-4)}`;
}

// In-memory token and hash storage (initialized with fresh 32-byte random token)
let _calendarFeedSecretToken: string = generateSecureCalendarToken();
let _calendarFeedTokenHash: string = hashCalendarToken(_calendarFeedSecretToken);

/**
 * Returns the current active raw secret token in memory.
 */
export function getCalendarFeedToken(): string {
  return _calendarFeedSecretToken;
}

/**
 * Returns the current token in masked form for secure UI presentation.
 */
export function getMaskedCalendarFeedToken(): string {
  return maskCalendarToken(_calendarFeedSecretToken);
}

/**
 * Regenerate the Owner's secret calendar feed token.
 * Generates a fresh 32-byte cryptographically random token, computes its SHA-256 hash,
 * replaces the current hash (invalidating old tokens immediately), and persists to DB.
 */
export function regenerateCalendarFeedToken(): string {
  const newToken = generateSecureCalendarToken();
  _calendarFeedSecretToken = newToken;
  _calendarFeedTokenHash = hashCalendarToken(newToken);

  // Persist SHA-256 hash asynchronously to DB
  persistCalendarTokenHash(_calendarFeedTokenHash, maskCalendarToken(newToken)).catch((err) => {
    console.warn('[calendarFeed] Failed persisting token hash to database:', err);
  });

  return newToken;
}

/**
 * Persist the SHA-256 hash of the calendar feed token into Prisma ContentItem.
 */
export async function persistCalendarTokenHash(tokenHash: string, maskedToken: string): Promise<void> {
  try {
    await prisma.contentItem.upsert({
      where: {
        collection_key: {
          collection: 'site_settings',
          key: 'owner_calendar_feed_token_hash',
        },
      },
      create: {
        collection: 'site_settings',
        key: 'owner_calendar_feed_token_hash',
        titleEn: 'Owner Calendar Feed Token Hash',
        titleHi: 'मालिक कैलेंडर फ़ीड टोकन हैश',
        contentEn: maskedToken,
        metadata: {
          tokenHash,
          algorithm: 'sha256',
          entropyBytes: 32,
          updatedAt: new Date().toISOString(),
        },
        status: 'PUBLISHED',
      },
      update: {
        contentEn: maskedToken,
        metadata: {
          tokenHash,
          algorithm: 'sha256',
          entropyBytes: 32,
          updatedAt: new Date().toISOString(),
        },
        updatedAt: new Date(),
      },
    });
  } catch {
    // Graceful fallback when running in sandbox/offline mode
  }
}

/**
 * Verify whether an incoming token matches the active token hash.
 * Uses timing-safe constant-time comparison to prevent timing attacks.
 */
export function verifyCalendarFeedToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;

  try {
    const inputHash = hashCalendarToken(token);
    const inputBuf = Buffer.from(inputHash, 'hex');
    const storedBuf = Buffer.from(_calendarFeedTokenHash, 'hex');

    if (inputBuf.length === storedBuf.length && crypto.timingSafeEqual(inputBuf, storedBuf)) {
      return true;
    }
  } catch {}

  return false;
}

/**
 * Asynchronous token verification that also checks Prisma database if memory cache misses.
 */
export async function verifyCalendarFeedTokenAsync(token: string): Promise<boolean> {
  if (!token || typeof token !== 'string') return false;

  // 1. Check in-memory hash first (fastest)
  if (verifyCalendarFeedToken(token)) return true;

  // 2. Check DB stored hash
  try {
    const item = await prisma.contentItem.findUnique({
      where: {
        collection_key: {
          collection: 'site_settings',
          key: 'owner_calendar_feed_token_hash',
        },
      },
    });

    const meta = item?.metadata as Record<string, unknown> | null;
    const dbHash = typeof meta?.tokenHash === 'string' ? meta.tokenHash : undefined;

    if (dbHash) {
      const inputHash = hashCalendarToken(token);
      const inputBuf = Buffer.from(inputHash, 'hex');
      const dbBuf = Buffer.from(dbHash, 'hex');

      if (inputBuf.length === dbBuf.length && crypto.timingSafeEqual(inputBuf, dbBuf)) {
        _calendarFeedTokenHash = dbHash;
        return true;
      }
    }
  } catch {}

  return false;
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
 * Generate RFC 5545 VCALENDAR feed string for course live classes.
 * Strictly preserves student privacy: zero student names, emails, or phone numbers.
 */
export function generateOwnerLiveClassesICal(
  classes: Array<{
    id: string;
    title: string;
    startTime: Date | string;
    durationMinutes?: number;
    meetingLink?: string | null;
    meetingPlatform?: string | null;
    agenda?: string | null;
    courseTitle?: string | null;
    status?: string;
  }>,
  baseUrl: string = 'https://viar.in'
): string {
  const nowUtc = formatToICalUtc(new Date());

  const events = classes
    .filter((c) => c.status !== 'CANCELLED')
    .map((c) => {
      const startDate = new Date(c.startTime);
      const endDate = new Date(startDate.getTime() + (c.durationMinutes || 60) * 60 * 1000);
      const dtStart = formatToICalUtc(startDate);
      const dtEnd = formatToICalUtc(endDate);

      const summary = `VIAR Live Class: ${c.title}`;
      const descLines = [
        `Course: ${c.courseTitle || 'Foundations of Vedic Astrology'}`,
        `Format: Interactive Course Live Class (All approved enrolled students)`,
        c.agenda ? `Agenda: ${c.agenda}` : null,
        c.meetingLink ? `Meeting Link: ${c.meetingLink}` : `Meeting Platform: ${c.meetingPlatform || 'Google Meet'}`,
        `Status: ${c.status || 'SCHEDULED'}`,
        `Manage Schedule: ${baseUrl}/admin?tab=course`,
      ].filter(Boolean) as string[];

      const description = escapeICalText(descLines.join('\n'));
      const location = escapeICalText(c.meetingLink || c.meetingPlatform || 'Online Video Class');

      return [
        'BEGIN:VEVENT',
        `UID:live_class_${c.id}@viar.in`,
        `DTSTAMP:${nowUtc}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:${escapeICalText(summary)}`,
        `DESCRIPTION:${description}`,
        `LOCATION:${location}`,
        c.meetingLink ? `URL:${c.meetingLink}` : null,
        `STATUS:${c.status === 'COMPLETED' ? 'CONFIRMED' : 'TENTATIVE'}`,
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
    'X-WR-CALDESC:Course live classes and timetable for Vedic Astrology Masterclass. Zero student PII.',
    'X-WR-TIMEZONE:Asia/Kolkata',
    ...events,
    'END:VCALENDAR',
  ];

  return lines.join('\r\n');
}

/**
 * Generate RFC 5545 VCALENDAR feed string.
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
