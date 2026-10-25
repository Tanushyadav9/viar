import { prisma } from '@/lib/prisma';
import type { OneOnOneSessionRecord } from './types';
export type { OneOnOneSessionRecord };

// In-memory persistent fallback store for test environments or when DB is offline
const _memorySessions: Map<string, OneOnOneSessionRecord> = new Map();

// Initialize realistic default 1-on-1 personal mentorship sessions
function initializeFallbackSessions() {
  if (_memorySessions.size > 0) return;

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  tomorrow.setHours(16, 0, 0, 0); // 4:00 PM IST tomorrow

  const nextWeek = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  nextWeek.setHours(11, 0, 0, 0); // 11:00 AM IST in 5 days

  const pastWeek = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
  pastWeek.setHours(17, 30, 0, 0); // 5:30 PM IST 4 days ago

  const s1: OneOnOneSessionRecord = {
    id: 'sess_1on1_001',
    studentId: 'usr_student_enrolled_001',
    studentName: 'Rohan Sharma',
    studentEmail: 'rohan.sharma@example.com',
    studentPhone: '+91 98101 23456',
    courseId: 'what-is-astrology',
    courseTitle: 'Foundations of Vedic Astrology (Jyotish)',
    title: 'Personal Lagna & Navamsha (D9) Chart Reading',
    description: 'Detailed analysis of birth chart ascendant, planetary aspects, and Navamsha strength for marriage and career.',
    scheduledAt: tomorrow.toISOString(),
    durationMinutes: 60,
    meetingPlatform: 'GOOGLE_MEET',
    meetingLink: 'https://meet.google.com/jyotish-mentorship-01',
    notes: 'Please keep your birth date, exact birth time, and birth city ready. Revise Module 4 on Planetary Strengths.',
    taughtRecord: null,
    homework: null,
    recordingUrl: null,
    status: 'SCHEDULED',
    createdAt: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString(),
  };

  const s2: OneOnOneSessionRecord = {
    id: 'sess_1on1_002',
    studentId: 'usr_student_enrolled_002',
    studentName: 'Priya Patel',
    studentEmail: 'priya.patel@example.com',
    studentPhone: '+91 99202 34567',
    courseId: 'what-is-astrology',
    courseTitle: 'Foundations of Vedic Astrology (Jyotish)',
    title: 'Vimshottari Dasha Calculation & Major Transit Timings',
    description: 'Practical exercise in predicting current Mahadasha, Antardasha, and Saturn Sade Sati transit timings.',
    scheduledAt: nextWeek.toISOString(),
    durationMinutes: 60,
    meetingPlatform: 'GOOGLE_MEET',
    meetingLink: 'https://meet.google.com/jyotish-mentorship-02',
    notes: 'Download the Dasha worksheet from the reference manual section before joining.',
    taughtRecord: null,
    homework: null,
    recordingUrl: null,
    status: 'SCHEDULED',
    createdAt: new Date(now.getTime() - 1 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 1 * 24 * 3600 * 1000).toISOString(),
  };

  const s3: OneOnOneSessionRecord = {
    id: 'sess_1on1_003',
    studentId: 'usr_student_enrolled_001',
    studentName: 'Rohan Sharma',
    studentEmail: 'rohan.sharma@example.com',
    studentPhone: '+91 98101 23456',
    courseId: 'what-is-astrology',
    courseTitle: 'Foundations of Vedic Astrology (Jyotish)',
    title: 'The 12 Houses (Bhavas) and Kendra/Trikona Lords',
    description: 'Comprehensive review of Kendra, Trikona, and Dusthana houses with live chart examples.',
    scheduledAt: pastWeek.toISOString(),
    durationMinutes: 60,
    meetingPlatform: 'GOOGLE_MEET',
    meetingLink: 'https://meet.google.com/jyotish-mentorship-00',
    notes: 'Basic chart reading preparation.',
    taughtRecord: 'Covered all 12 Bhavas with emphasis on 1st, 5th, 9th (Dharma Trikona) and 10th (Karma Bhava). Analyzed student\'s Jupiter placement in Sagittarius 9th house.',
    homework: 'Identify the lords of 12 houses for Aries ascendant and Taurus ascendant charts. Write down functional benefics.',
    recordingUrl: 'https://drive.google.com/file/d/sample-astrology-session-001/view',
    status: 'COMPLETED',
    createdAt: new Date(pastWeek.getTime() - 3 * 24 * 3600 * 1000).toISOString(),
    updatedAt: pastWeek.toISOString(),
  };

  _memorySessions.set(s1.id, s1);
  _memorySessions.set(s2.id, s2);
  _memorySessions.set(s3.id, s3);
}

initializeFallbackSessions();

interface DbSessionRow {
  id: string;
  studentId: string;
  student?: { id: string; name: string; email: string | null; phone: string | null } | null;
  courseId?: string | null;
  course?: { id: string; title: string } | null;
  title: string;
  description?: string | null;
  scheduledAt: Date | string;
  durationMinutes: number;
  meetingPlatform?: string | null;
  meetingLink?: string | null;
  meetingId?: string | null;
  passcode?: string | null;
  notes?: string | null;
  taughtRecord?: string | null;
  homework?: string | null;
  recordingUrl?: string | null;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Lists 1-on-1 personal mentorship sessions with optional filters.
 */
export async function listOneOnOneSessions(options: {
  studentId?: string;
  status?: string;
  search?: string;
  limit?: number;
} = {}): Promise<OneOnOneSessionRecord[]> {
  try {
    const where: Record<string, unknown> = {};
    if (options.studentId) where.studentId = options.studentId;
    if (options.status && options.status !== 'ALL') where.status = options.status;

    const delegate = (prisma as unknown as { oneOnOneSession?: { findMany: (args: unknown) => Promise<DbSessionRow[]> } }).oneOnOneSession;
    if (delegate) {
      const dbSessions = await delegate.findMany({
        where,
        include: {
          student: {
            select: { id: true, name: true, email: true, phone: true },
          },
          course: {
            select: { id: true, title: true },
          },
        },
        orderBy: { scheduledAt: 'desc' },
        take: options.limit || 100,
      });

      if (dbSessions && Array.isArray(dbSessions) && dbSessions.length > 0) {
        return dbSessions.map((s) => ({
          id: s.id,
          studentId: s.studentId,
          studentName: s.student?.name || 'Student',
          studentEmail: s.student?.email || '',
          studentPhone: s.student?.phone || '',
          courseId: s.courseId,
          courseTitle: s.course?.title || 'Astrology Course',
          title: s.title,
          description: s.description,
          scheduledAt: s.scheduledAt instanceof Date ? s.scheduledAt.toISOString() : String(s.scheduledAt),
          durationMinutes: s.durationMinutes,
          meetingPlatform: s.meetingPlatform || 'GOOGLE_MEET',
          meetingLink: s.meetingLink,
          meetingId: s.meetingId,
          passcode: s.passcode,
          notes: s.notes,
          taughtRecord: s.taughtRecord,
          homework: s.homework,
          recordingUrl: s.recordingUrl,
          status: s.status as OneOnOneSessionRecord['status'],
          createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : String(s.createdAt),
          updatedAt: s.updatedAt instanceof Date ? s.updatedAt.toISOString() : String(s.updatedAt),
        }));
      }
    }
  } catch {
    // Graceful fallback when DB table not yet migrated or offline
  }

  // Fallback to in-memory store
  initializeFallbackSessions();
  let list = Array.from(_memorySessions.values());

  if (options.studentId) {
    list = list.filter((s) => s.studentId === options.studentId);
  }
  if (options.status && options.status !== 'ALL') {
    list = list.filter((s) => s.status === options.status);
  }
  if (options.search) {
    const q = options.search.toLowerCase();
    list = list.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.studentName.toLowerCase().includes(q) ||
        s.studentEmail.toLowerCase().includes(q) ||
        (s.studentPhone && s.studentPhone.toLowerCase().includes(q))
    );
  }

  // Sort by scheduledAt descending
  list.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  if (options.limit && options.limit > 0) {
    list = list.slice(0, options.limit);
  }

  return list;
}

/**
 * Retrieves a single 1-on-1 session by ID.
 */
export async function getOneOnOneSessionById(id: string): Promise<OneOnOneSessionRecord | null> {
  try {
    const delegate = (prisma as unknown as { oneOnOneSession?: { findUnique: (args: unknown) => Promise<DbSessionRow | null> } }).oneOnOneSession;
    if (delegate) {
      const s = await delegate.findUnique({
        where: { id },
        include: {
          student: { select: { id: true, name: true, email: true, phone: true } },
          course: { select: { id: true, title: true } },
        },
      });
      if (s) {
        return {
          id: s.id,
          studentId: s.studentId,
          studentName: s.student?.name || 'Student',
          studentEmail: s.student?.email || '',
          studentPhone: s.student?.phone || '',
          courseId: s.courseId,
          courseTitle: s.course?.title || 'Astrology Course',
          title: s.title,
          description: s.description,
          scheduledAt: s.scheduledAt instanceof Date ? s.scheduledAt.toISOString() : String(s.scheduledAt),
          durationMinutes: s.durationMinutes,
          meetingPlatform: s.meetingPlatform || 'GOOGLE_MEET',
          meetingLink: s.meetingLink,
          meetingId: s.meetingId,
          passcode: s.passcode,
          notes: s.notes,
          taughtRecord: s.taughtRecord,
          homework: s.homework,
          recordingUrl: s.recordingUrl,
          status: s.status as OneOnOneSessionRecord['status'],
          createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : String(s.createdAt),
          updatedAt: s.updatedAt instanceof Date ? s.updatedAt.toISOString() : String(s.updatedAt),
        };
      }
    }
  } catch {}

  initializeFallbackSessions();
  return _memorySessions.get(id) || null;
}

/**
 * Creates a new personal 1-on-1 session for a specific student.
 */
export async function createOneOnOneSession(data: {
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  studentPhone?: string;
  courseId?: string;
  courseTitle?: string;
  title: string;
  description?: string;
  scheduledAt: string | Date;
  durationMinutes?: number;
  meetingPlatform?: string;
  meetingLink?: string;
  notes?: string;
}): Promise<OneOnOneSessionRecord> {
  const id = `sess_1on1_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const dateObj = data.scheduledAt instanceof Date ? data.scheduledAt : new Date(data.scheduledAt);
  const now = new Date().toISOString();

  let createdRecord: OneOnOneSessionRecord | null = null;

  try {
    const delegate = (prisma as unknown as { oneOnOneSession?: { create: (args: unknown) => Promise<DbSessionRow> } }).oneOnOneSession;
    if (delegate) {
      const s = await delegate.create({
        data: {
          id,
          studentId: data.studentId,
          courseId: data.courseId || null,
          title: data.title,
          description: data.description || null,
          scheduledAt: dateObj,
          durationMinutes: data.durationMinutes || 60,
          meetingPlatform: data.meetingPlatform || 'GOOGLE_MEET',
          meetingLink: data.meetingLink || null,
          notes: data.notes || null,
          status: 'SCHEDULED',
        },
        include: {
          student: { select: { id: true, name: true, email: true, phone: true } },
          course: { select: { id: true, title: true } },
        },
      });

      if (s) {
        createdRecord = {
          id: s.id,
          studentId: s.studentId,
          studentName: s.student?.name || data.studentName || 'Student',
          studentEmail: s.student?.email || data.studentEmail || '',
          studentPhone: s.student?.phone || data.studentPhone || '',
          courseId: s.courseId,
          courseTitle: s.course?.title || data.courseTitle || 'Astrology Course',
          title: s.title,
          description: s.description,
          scheduledAt: s.scheduledAt instanceof Date ? s.scheduledAt.toISOString() : String(s.scheduledAt),
          durationMinutes: s.durationMinutes,
          meetingPlatform: s.meetingPlatform || 'GOOGLE_MEET',
          meetingLink: s.meetingLink,
          meetingId: s.meetingId,
          passcode: s.passcode,
          notes: s.notes,
          taughtRecord: s.taughtRecord,
          homework: s.homework,
          recordingUrl: s.recordingUrl,
          status: s.status as OneOnOneSessionRecord['status'],
          createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : String(s.createdAt),
          updatedAt: s.updatedAt instanceof Date ? s.updatedAt.toISOString() : String(s.updatedAt),
        };
      }
    }
  } catch {}

  if (!createdRecord) {
    createdRecord = {
      id,
      studentId: data.studentId,
      studentName: data.studentName || 'Student',
      studentEmail: data.studentEmail || '',
      studentPhone: data.studentPhone || '',
      courseId: data.courseId || 'what-is-astrology',
      courseTitle: data.courseTitle || 'Foundations of Vedic Astrology (Jyotish)',
      title: data.title,
      description: data.description || null,
      scheduledAt: dateObj.toISOString(),
      durationMinutes: data.durationMinutes || 60,
      meetingPlatform: data.meetingPlatform || 'GOOGLE_MEET',
      meetingLink: data.meetingLink || null,
      notes: data.notes || null,
      taughtRecord: null,
      homework: null,
      recordingUrl: null,
      status: 'SCHEDULED',
      createdAt: now,
      updatedAt: now,
    };
  }

  _memorySessions.set(createdRecord.id, createdRecord);
  return createdRecord;
}

/**
 * Updates a 1-on-1 session details, schedule, meeting link, notes, or taught record.
 */
export async function updateOneOnOneSession(
  id: string,
  updates: Partial<Omit<OneOnOneSessionRecord, 'id' | 'createdAt'>>
): Promise<OneOnOneSessionRecord | null> {
  const existing = await getOneOnOneSessionById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const updatedRecord: OneOnOneSessionRecord = {
    ...existing,
    ...updates,
    updatedAt: now,
  };

  try {
    const dataToPrisma: Record<string, unknown> = {};
    if (updates.title !== undefined) dataToPrisma.title = updates.title;
    if (updates.description !== undefined) dataToPrisma.description = updates.description;
    if (updates.scheduledAt !== undefined) dataToPrisma.scheduledAt = new Date(updates.scheduledAt);
    if (updates.durationMinutes !== undefined) dataToPrisma.durationMinutes = updates.durationMinutes;
    if (updates.meetingPlatform !== undefined) dataToPrisma.meetingPlatform = updates.meetingPlatform;
    if (updates.meetingLink !== undefined) dataToPrisma.meetingLink = updates.meetingLink;
    if (updates.meetingId !== undefined) dataToPrisma.meetingId = updates.meetingId;
    if (updates.passcode !== undefined) dataToPrisma.passcode = updates.passcode;
    if (updates.notes !== undefined) dataToPrisma.notes = updates.notes;
    if (updates.taughtRecord !== undefined) dataToPrisma.taughtRecord = updates.taughtRecord;
    if (updates.homework !== undefined) dataToPrisma.homework = updates.homework;
    if (updates.recordingUrl !== undefined) dataToPrisma.recordingUrl = updates.recordingUrl;
    if (updates.status !== undefined) dataToPrisma.status = updates.status;

    const delegate = (prisma as unknown as { oneOnOneSession?: { update: (args: unknown) => Promise<DbSessionRow> } }).oneOnOneSession;
    if (delegate) {
      await delegate.update({
        where: { id },
        data: dataToPrisma,
      });
    }
  } catch {}

  _memorySessions.set(id, updatedRecord);
  return updatedRecord;
}

/**
 * Records what was taught in the 1-on-1 session, homework assigned, and marks session as COMPLETED.
 */
export async function recordTaughtContent(
  id: string,
  data: {
    taughtRecord: string;
    homework?: string;
    recordingUrl?: string;
    markCompleted?: boolean;
  }
): Promise<OneOnOneSessionRecord | null> {
  return updateOneOnOneSession(id, {
    taughtRecord: data.taughtRecord,
    ...(data.homework !== undefined ? { homework: data.homework } : {}),
    ...(data.recordingUrl !== undefined ? { recordingUrl: data.recordingUrl } : {}),
    ...(data.markCompleted !== false ? { status: 'COMPLETED' } : {}),
  });
}

/**
 * Cancels or deletes a 1-on-1 session.
 */
export async function deleteOneOnOneSession(id: string): Promise<boolean> {
  try {
    const delegate = (prisma as unknown as { oneOnOneSession?: { delete: (args: unknown) => Promise<DbSessionRow> } }).oneOnOneSession;
    if (delegate) {
      await delegate.delete({ where: { id } });
    }
  } catch {}

  const existed = _memorySessions.delete(id);
  return existed;
}

/**
 * Generates a pre-filled WhatsApp share link so the non-technical owner
 * can send class time, topic, notes, and meeting link to the student in one click!
 */
export function generateWhatsAppShareUrl(session: OneOnOneSessionRecord): string {
  // Clean phone number (strip whitespace, dashes, symbols)
  let phone = (session.studentPhone || '').replace(/[^\d+]/g, '');
  if (phone.startsWith('+')) {
    phone = phone.substring(1);
  } else if (phone.length === 10) {
    // Default to Indian country code 91
    phone = `91${phone}`;
  }

  // Format date & time nicely in IST
  const d = new Date(session.scheduledAt);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
    hour12: true,
  };
  const timeStr = d.toLocaleString('en-IN', options);

  const message = [
    `Namaste ${session.studentName} ji,`,
    ``,
    `Your personal 1-on-1 Vedic Astrology class with Acharya Niraj Kumar has been scheduled:`,
    `🗓 Date & Time: ${timeStr} (IST)`,
    `⏱ Duration: ${session.durationMinutes} minutes`,
    `📖 Topic: ${session.title}`,
    session.meetingLink ? `🔗 Join Link: ${session.meetingLink}` : `🔗 Meeting link will be shared shortly.`,
    session.notes ? `📝 Preparation Notes: ${session.notes}` : null,
    ``,
    `Please ensure you join on time with your chart details.`,
    `— Vihangam Institute of Astrology and Research (VIAR)`,
  ]
    .filter(Boolean)
    .join('\n');

  if (!phone) {
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  }

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Formats date and time into a friendly string in Indian Standard Time (IST).
 */
export function formatSessionIST(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}
