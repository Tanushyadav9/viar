import { prisma } from '@/lib/prisma';
import type {
  OneOnOneSessionRecord,
  StudentSessionRecord,
  SessionRequestRecord,
  OwnerWorkingHoursRecord,
  OwnerBlockedDateRecord,
  SessionHistoryLogRecord,
  CourseSessionSettings,
  SessionStatus,
  SessionMeetingPlatform,
  PreferredTimeWindow,
} from './types';

export type {
  OneOnOneSessionRecord,
  StudentSessionRecord,
  SessionRequestRecord,
  OwnerWorkingHoursRecord,
  OwnerBlockedDateRecord,
  SessionHistoryLogRecord,
  CourseSessionSettings,
};

// ------------------------------------------------------------------------------
// In-Memory Fallback Stores (active during testing or if DB is offline)
// ------------------------------------------------------------------------------

const _memoryStudentSessions: Map<string, StudentSessionRecord> = new Map();
const _memorySessionRequests: Map<string, SessionRequestRecord> = new Map();
const _memoryWorkingHours: Map<number, OwnerWorkingHoursRecord> = new Map();
const _memoryBlockedDates: Map<string, OwnerBlockedDateRecord> = new Map();
const _memoryHistoryLogs: SessionHistoryLogRecord[] = [];
const _memoryCourseSettings: Map<string, CourseSessionSettings> = new Map();

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function initializeDefaults() {
  if (_memoryWorkingHours.size > 0) return;

  // 1. Working Hours defaults: Monday to Saturday, 10:00 to 19:00 Asia/Kolkata
  for (let d = 0; d < 7; d++) {
    const isWorking = d >= 1 && d <= 6; // Mon-Sat
    _memoryWorkingHours.set(d, {
      id: `wh_${d}`,
      dayOfWeek: d,
      dayName: DAY_NAMES[d],
      startTime: '10:00',
      endTime: '19:00',
      timezone: 'Asia/Kolkata',
      slotDurationMinutes: 60,
      isEnabled: isWorking,
    });
  }
}

initializeDefaults();

// ------------------------------------------------------------------------------
// 0. Clash Protection & Working Hours Validation
// ------------------------------------------------------------------------------

export async function checkSessionClash(data: {
  startTime: Date | string;
  duration: number;
  excludeSessionId?: string;
}): Promise<{ hasClash: boolean; conflictMessage?: string; clashingSession?: StudentSessionRecord }> {
  const reqStart = new Date(data.startTime).getTime();
  const reqEnd = reqStart + data.duration * 60 * 1000;

  const allSessions = await listStudentSessions({ status: 'ALL' });
  const activeSessions = allSessions.filter((s) => s.status !== 'CANCELLED' && s.id !== data.excludeSessionId);

  for (const s of activeSessions) {
    const sStart = new Date(s.startTime).getTime();
    const sEnd = sStart + (s.duration || 60) * 60 * 1000;

    // Overlap: sStart < reqEnd && sEnd > reqStart
    if (sStart < reqEnd && sEnd > reqStart) {
      const clashTimeIst = formatSessionIST(s.startTime);
      return {
        hasClash: true,
        conflictMessage: `Time clash: Acharya Niraj Kumar already has a scheduled class with ${s.studentName} ("${s.title}") on ${clashTimeIst} IST. Please choose another time slot.`,
        clashingSession: s,
      };
    }
  }

  return { hasClash: false };
}

export async function checkWorkingHours(data: {
  startTime: Date | string;
  duration: number;
}): Promise<{ isWithinHours: boolean; warning?: string }> {
  const dateObj = new Date(data.startTime);
  if (isNaN(dateObj.getTime())) {
    return { isWithinHours: false, warning: 'Invalid date or time format.' };
  }

  const istDateStr = dateObj.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const istHours = dateObj.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });
  const dayName = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', weekday: 'long' }).format(dateObj);
  const istDayIndex = new Date(dateObj.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).getDay();

  // 1. Blocked Dates Check
  const blockedDates = await listOwnerBlockedDates();
  const isBlocked = blockedDates.some((b) => {
    const bDateStr = new Date(b.blockedDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    return bDateStr === istDateStr;
  });

  if (isBlocked) {
    return {
      isWithinHours: false,
      warning: `${istDateStr} is marked as a blocked date on Acharya Niraj Kumar's calendar. Confirm anyway to override and schedule.`,
    };
  }

  // 2. Working Hours Check
  const hours = await getOwnerWorkingHours();
  const dayConfig = hours.find((h) => h.dayOfWeek === istDayIndex);

  if (!dayConfig || !dayConfig.isEnabled) {
    return {
      isWithinHours: false,
      warning: `${dayName} is marked as a non-teaching day in Acharya Niraj Kumar's schedule. Confirm anyway to override and schedule.`,
    };
  }

  const [h, m] = istHours.split(':').map((x) => parseInt(x, 10));
  const startMin = h * 60 + m;
  const endMin = startMin + data.duration;

  const [cfgStartH, cfgStartM] = dayConfig.startTime.split(':').map((x) => parseInt(x, 10));
  const [cfgEndH, cfgEndM] = dayConfig.endTime.split(':').map((x) => parseInt(x, 10));
  const cfgStartMin = cfgStartH * 60 + cfgStartM;
  const cfgEndMin = cfgEndH * 60 + cfgEndM;

  if (startMin < cfgStartMin || endMin > cfgEndMin) {
    return {
      isWithinHours: false,
      warning: `Selected time (${istHours} IST) is outside standard teaching hours (${dayConfig.startTime} – ${dayConfig.endTime} IST) for ${dayName}. Confirm anyway to override and schedule.`,
    };
  }

  return { isWithinHours: true };
}

export async function createStudentSessionWithValidation(data: {
  enrollmentId?: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  studentPhone?: string;
  courseId?: string;
  moduleId?: string | null;
  lessonId?: string | null;
  title: string;
  startTime: Date | string;
  duration?: number;
  meetingLink?: string | null;
  meetingPlatform?: string;
  privateNotes?: string | null;
  sharedNotes?: string | null;
  homework?: string | null;
  recordingUrl?: string | null;
  createdByUserId: string;
  repeatWeeklyCount?: number;
  allowOutsideWorkingHours?: boolean;
}): Promise<{
  sessions: StudentSessionRecord[];
  clashError?: string;
  workingHoursWarning?: string;
}> {
  const duration = data.duration || 60;
  const repeatCount = Math.max(1, Math.min(12, data.repeatWeeklyCount || 1));
  const baseStart = new Date(data.startTime);

  const plannedDates: Date[] = [];
  for (let i = 0; i < repeatCount; i++) {
    const d = new Date(baseStart.getTime() + i * 7 * 24 * 60 * 60 * 1000);
    plannedDates.push(d);

    const clash = await checkSessionClash({
      startTime: d,
      duration,
    });
    if (clash.hasClash) {
      return {
        sessions: [],
        clashError: repeatCount > 1
          ? `Week ${i + 1} (${formatSessionIST(d.toISOString())} IST): ${clash.conflictMessage}`
          : clash.conflictMessage,
      };
    }

    if (!data.allowOutsideWorkingHours) {
      const wh = await checkWorkingHours({
        startTime: d,
        duration,
      });
      if (!wh.isWithinHours) {
        return {
          sessions: [],
          workingHoursWarning: repeatCount > 1
            ? `Week ${i + 1} (${formatSessionIST(d.toISOString())} IST): ${wh.warning}`
            : wh.warning,
        };
      }
    }
  }

  const createdSessions: StudentSessionRecord[] = [];
  for (let i = 0; i < plannedDates.length; i++) {
    const sessionDate = plannedDates[i];
    const sessionTitle = repeatCount > 1 ? `${data.title} (Part ${i + 1}/${repeatCount})` : data.title;

    const s = await createStudentSession({
      enrollmentId: data.enrollmentId || `enr_${data.studentId}`,
      studentId: data.studentId,
      studentName: data.studentName,
      studentEmail: data.studentEmail,
      studentPhone: data.studentPhone,
      courseId: data.courseId || 'course-what-is-astrology',
      moduleId: data.moduleId,
      lessonId: data.lessonId,
      title: sessionTitle,
      startTime: sessionDate,
      duration,
      meetingLink: data.meetingLink,
      meetingPlatform: data.meetingPlatform,
      privateNotes: data.privateNotes,
      sharedNotes: data.sharedNotes,
      homework: data.homework,
      recordingUrl: data.recordingUrl,
      createdByUserId: data.createdByUserId,
    });

    createdSessions.push(s);
  }

  return { sessions: createdSessions };
}

// ------------------------------------------------------------------------------
// 1. StudentSession CRUD & Operations
// ------------------------------------------------------------------------------

export async function createStudentSession(data: {
  enrollmentId: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  studentPhone?: string;
  courseId: string;
  moduleId?: string | null;
  lessonId?: string | null;
  title: string;
  startTime: Date | string; // UTC
  duration?: number;
  meetingLink?: string | null;
  meetingPlatform?: string;
  privateNotes?: string | null;
  sharedNotes?: string | null;
  homework?: string | null;
  recordingUrl?: string | null;
  createdByUserId: string;
}): Promise<StudentSessionRecord> {
  const id = `stud_sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const dateObj = data.startTime instanceof Date ? data.startTime : new Date(data.startTime);
  const now = new Date().toISOString();

  let created: StudentSessionRecord | null = null;

  try {
    const delegate = (prisma as unknown as { studentSession?: { create: (args: unknown) => Promise<Record<string, unknown>> } }).studentSession;
    if (delegate) {
      const s = (await delegate.create({
        data: {
          id,
          enrollmentId: data.enrollmentId,
          studentId: data.studentId,
          courseId: data.courseId,
          moduleId: data.moduleId || null,
          lessonId: data.lessonId || null,
          title: data.title,
          startTime: dateObj,
          duration: data.duration || 60,
          meetingLink: data.meetingLink || null,
          meetingPlatform: data.meetingPlatform || 'GOOGLE_MEET',
          status: 'SCHEDULED',
          privateNotes: data.privateNotes || null,
          sharedNotes: data.sharedNotes || null,
          homework: data.homework || null,
          recordingUrl: data.recordingUrl || null,
          createdByUserId: data.createdByUserId,
        },
        include: {
          student: { select: { id: true, name: true, email: true, phone: true } },
          course: { select: { id: true, title: true } },
          module: { select: { id: true, title: true } },
          lesson: { select: { id: true, title: true } },
          createdByUser: { select: { id: true, name: true } },
        },
      })) as {
        id: string;
        enrollmentId: string;
        studentId: string;
        student?: { name?: string | null; email?: string | null; phone?: string | null } | null;
        courseId: string;
        course?: { title?: string | null } | null;
        moduleId?: string | null;
        module?: { title?: string | null } | null;
        lessonId?: string | null;
        lesson?: { title?: string | null } | null;
        title: string;
        startTime: Date | string;
        duration: number;
        meetingLink?: string | null;
        meetingPlatform: string;
        status: SessionStatus;
        privateNotes?: string | null;
        sharedNotes?: string | null;
        homework?: string | null;
        recordingUrl?: string | null;
        createdByUserId: string;
        createdByUser?: { name?: string | null } | null;
        createdAt: Date | string;
        updatedAt: Date | string;
      };

      if (s) {
        created = {
          id: s.id,
          enrollmentId: s.enrollmentId,
          studentId: s.studentId,
          studentName: s.student?.name || 'Student',
          studentEmail: s.student?.email || '',
          studentPhone: s.student?.phone || '',
          courseId: s.courseId,
          courseTitle: s.course?.title || '',
          moduleId: s.moduleId,
          moduleTitle: s.module?.title || null,
          lessonId: s.lessonId,
          lessonTitle: s.lesson?.title || null,
          title: s.title,
          startTime: s.startTime instanceof Date ? s.startTime.toISOString() : String(s.startTime),
          duration: s.duration,
          meetingLink: s.meetingLink,
          meetingPlatform: s.meetingPlatform,
          status: s.status || 'SCHEDULED',
          privateNotes: s.privateNotes,
          sharedNotes: s.sharedNotes,
          homework: s.homework,
          recordingUrl: s.recordingUrl,
          createdByUserId: s.createdByUserId,
          createdByName: s.createdByUser?.name || 'Acharya Niraj Kumar',
          createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : String(s.createdAt),
          updatedAt: s.updatedAt instanceof Date ? s.updatedAt.toISOString() : String(s.updatedAt),
        };
      }
    }
  } catch {}

  if (!created) {
    created = {
      id,
      enrollmentId: data.enrollmentId,
      studentId: data.studentId,
      studentName: (data as { studentName?: string }).studentName || 'Student',
      studentEmail: (data as { studentEmail?: string }).studentEmail || '',
      studentPhone: (data as { studentPhone?: string }).studentPhone || '',
      courseId: data.courseId,
      courseTitle: 'Foundations of Vedic Astrology (Jyotish)',
      moduleId: data.moduleId || null,
      moduleTitle: null,
      lessonId: data.lessonId || null,
      lessonTitle: null,
      title: data.title,
      startTime: dateObj.toISOString(),
      duration: data.duration || 60,
      meetingLink: data.meetingLink || null,
      meetingPlatform: data.meetingPlatform || 'GOOGLE_MEET',
      status: 'SCHEDULED',
      privateNotes: data.privateNotes || null,
      sharedNotes: data.sharedNotes || null,
      homework: data.homework || null,
      recordingUrl: data.recordingUrl || null,
      createdByUserId: data.createdByUserId,
      createdByName: 'Acharya Niraj Kumar',
      createdAt: now,
      updatedAt: now,
    };
  }

  _memoryStudentSessions.set(created.id, created);

  // Automatically record audit log
  await logSessionHistory({
    sessionId: created.id,
    sessionTitle: created.title,
    action: 'CREATED',
    actorUserId: data.createdByUserId,
    newStatus: 'SCHEDULED',
    notes: 'Initial session created and scheduled by Owner',
  });

  return created;
}

export async function listStudentSessions(options: {
  studentId?: string;
  courseId?: string;
  enrollmentId?: string;
  status?: string;
  limit?: number;
} = {}): Promise<StudentSessionRecord[]> {
  try {
    const where: Record<string, unknown> = {};
    if (options.studentId) where.studentId = options.studentId;
    if (options.courseId) where.courseId = options.courseId;
    if (options.enrollmentId) where.enrollmentId = options.enrollmentId;
    if (options.status && options.status !== 'ALL') where.status = options.status;

    interface SessionDelegateRow {
      id: string;
      enrollmentId: string;
      studentId: string;
      student?: { name?: string | null; email?: string | null; phone?: string | null } | null;
      courseId: string;
      course?: { title?: string | null } | null;
      moduleId?: string | null;
      module?: { title?: string | null } | null;
      lessonId?: string | null;
      lesson?: { title?: string | null } | null;
      title: string;
      startTime: Date | string;
      duration: number;
      meetingLink?: string | null;
      meetingPlatform: string;
      status: SessionStatus;
      privateNotes?: string | null;
      sharedNotes?: string | null;
      homework?: string | null;
      recordingUrl?: string | null;
      createdByUserId: string;
      createdByUser?: { name?: string | null } | null;
      createdAt: Date | string;
      updatedAt: Date | string;
    }

    const delegate = (prisma as unknown as { studentSession?: { findMany: (args: unknown) => Promise<SessionDelegateRow[]> } }).studentSession;
    if (delegate) {
      const rows = await delegate.findMany({
        where,
        include: {
          student: { select: { id: true, name: true, email: true, phone: true } },
          course: { select: { id: true, title: true } },
          module: { select: { id: true, title: true } },
          lesson: { select: { id: true, title: true } },
          createdByUser: { select: { id: true, name: true } },
        },
        orderBy: { startTime: 'desc' },
        take: options.limit || 100,
      });

      if (rows && Array.isArray(rows)) {
        return rows.map((s) => ({
          id: s.id,
          enrollmentId: s.enrollmentId,
          studentId: s.studentId,
          studentName: s.student?.name || 'Student',
          studentEmail: s.student?.email || '',
          studentPhone: s.student?.phone || '',
          courseId: s.courseId,
          courseTitle: s.course?.title || '',
          moduleId: s.moduleId,
          moduleTitle: s.module?.title || null,
          lessonId: s.lessonId,
          lessonTitle: s.lesson?.title || null,
          title: s.title,
          startTime: s.startTime instanceof Date ? s.startTime.toISOString() : String(s.startTime),
          duration: s.duration,
          meetingLink: s.meetingLink,
          meetingPlatform: s.meetingPlatform,
          status: s.status || 'SCHEDULED',
          privateNotes: s.privateNotes,
          sharedNotes: s.sharedNotes,
          homework: s.homework,
          recordingUrl: s.recordingUrl,
          createdByUserId: s.createdByUserId,
          createdByName: s.createdByUser?.name || 'Acharya Niraj Kumar',
          createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : String(s.createdAt),
          updatedAt: s.updatedAt instanceof Date ? s.updatedAt.toISOString() : String(s.updatedAt),
        }));
      }
    }
  } catch {}

  initializeDefaults();
  let list = Array.from(_memoryStudentSessions.values());

  if (options.studentId) list = list.filter((s) => s.studentId === options.studentId);
  if (options.courseId) list = list.filter((s) => s.courseId === options.courseId);
  if (options.enrollmentId) list = list.filter((s) => s.enrollmentId === options.enrollmentId);
  if (options.status && options.status !== 'ALL') list = list.filter((s) => s.status === options.status);

  list.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  if (options.limit && options.limit > 0) list = list.slice(0, options.limit);
  return list;
}

export async function getStudentSessionById(id: string): Promise<StudentSessionRecord | null> {
  try {
    interface SessionDelegateRow {
      id: string;
      enrollmentId: string;
      studentId: string;
      student?: { name?: string | null; email?: string | null; phone?: string | null } | null;
      courseId: string;
      course?: { title?: string | null } | null;
      moduleId?: string | null;
      module?: { title?: string | null } | null;
      lessonId?: string | null;
      lesson?: { title?: string | null } | null;
      title: string;
      startTime: Date | string;
      duration: number;
      meetingLink?: string | null;
      meetingPlatform: string;
      status: SessionStatus;
      privateNotes?: string | null;
      sharedNotes?: string | null;
      homework?: string | null;
      recordingUrl?: string | null;
      createdByUserId: string;
      createdByUser?: { name?: string | null } | null;
      createdAt: Date | string;
      updatedAt: Date | string;
    }

    const delegate = (prisma as unknown as { studentSession?: { findUnique: (args: unknown) => Promise<SessionDelegateRow | null> } }).studentSession;
    if (delegate) {
      const s = await delegate.findUnique({
        where: { id },
        include: {
          student: { select: { id: true, name: true, email: true, phone: true } },
          course: { select: { id: true, title: true } },
          module: { select: { id: true, title: true } },
          lesson: { select: { id: true, title: true } },
          createdByUser: { select: { id: true, name: true } },
        },
      });

      if (s) {
        return {
          id: s.id,
          enrollmentId: s.enrollmentId,
          studentId: s.studentId,
          studentName: s.student?.name || 'Student',
          studentEmail: s.student?.email || '',
          studentPhone: s.student?.phone || '',
          courseId: s.courseId,
          courseTitle: s.course?.title || 'Foundations of Vedic Astrology (Jyotish)',
          moduleId: s.moduleId || null,
          moduleTitle: s.module?.title || null,
          lessonId: s.lessonId || null,
          lessonTitle: s.lesson?.title || null,
          title: s.title,
          startTime: s.startTime instanceof Date ? s.startTime.toISOString() : s.startTime,
          duration: s.duration,
          meetingLink: s.meetingLink || null,
          meetingPlatform: s.meetingPlatform as SessionMeetingPlatform,
          status: s.status as SessionStatus,
          privateNotes: s.privateNotes || null,
          sharedNotes: s.sharedNotes || null,
          homework: s.homework || null,
          recordingUrl: s.recordingUrl || null,
          createdByUserId: s.createdByUserId,
          createdByName: s.createdByUser?.name || 'Acharya Niraj Kumar',
          createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
          updatedAt: s.updatedAt instanceof Date ? s.updatedAt.toISOString() : s.updatedAt,
        };
      }
    }
  } catch {}

  initializeDefaults();
  return _memoryStudentSessions.get(id) || null;
}

export async function updateStudentSession(
  id: string,
  updates: Partial<Omit<StudentSessionRecord, 'id' | 'createdAt'>>,
  actorUserId?: string
): Promise<StudentSessionRecord | null> {
  initializeDefaults();
  const existing = _memoryStudentSessions.get(id);
  const prevStatus = existing?.status;

  const now = new Date().toISOString();
  let updatedRecord: StudentSessionRecord | null = null;

  try {
    const dataToPrisma: Record<string, unknown> = {};
    if (updates.title !== undefined) dataToPrisma.title = updates.title;
    if (updates.startTime !== undefined) dataToPrisma.startTime = new Date(updates.startTime);
    if (updates.duration !== undefined) dataToPrisma.duration = updates.duration;
    if (updates.meetingLink !== undefined) dataToPrisma.meetingLink = updates.meetingLink;
    if (updates.meetingPlatform !== undefined) dataToPrisma.meetingPlatform = updates.meetingPlatform;
    if (updates.status !== undefined) dataToPrisma.status = updates.status;
    if (updates.privateNotes !== undefined) dataToPrisma.privateNotes = updates.privateNotes;
    if (updates.sharedNotes !== undefined) dataToPrisma.sharedNotes = updates.sharedNotes;
    if (updates.homework !== undefined) dataToPrisma.homework = updates.homework;
    if (updates.recordingUrl !== undefined) dataToPrisma.recordingUrl = updates.recordingUrl;
    if (updates.moduleId !== undefined) dataToPrisma.moduleId = updates.moduleId;
    if (updates.lessonId !== undefined) dataToPrisma.lessonId = updates.lessonId;

    const delegate = (prisma as unknown as { studentSession?: { update: (args: unknown) => Promise<Record<string, unknown>> } }).studentSession;
    if (delegate) {
      await delegate.update({
        where: { id },
        data: dataToPrisma,
      });
    }
  } catch {}

  if (existing) {
    updatedRecord = {
      ...existing,
      ...updates,
      updatedAt: now,
    };
    _memoryStudentSessions.set(id, updatedRecord);
  }

  // Audit Log
  if (updates.status && updates.status !== prevStatus) {
    await logSessionHistory({
      sessionId: id,
      sessionTitle: updatedRecord?.title || 'Session',
      action: updates.status === 'COMPLETED' ? 'COMPLETED' : updates.status === 'CANCELLED' ? 'CANCELLED' : 'RESCHEDULED',
      actorUserId,
      previousStatus: prevStatus,
      newStatus: updates.status,
      notes: updates.sharedNotes || updates.privateNotes || 'Status updated',
    });
  }

  // Transactional Outbox Notifications: Cancelled & Changed
  if (updatedRecord && updatedRecord.studentEmail) {
    if (updates.status === 'CANCELLED' && prevStatus !== 'CANCELLED') {
      import('./outboxService').then(({ sendSessionCancelledEmail }) => {
        sendSessionCancelledEmail({
          studentName: updatedRecord!.studentName,
          studentEmail: updatedRecord!.studentEmail,
          topic: updatedRecord!.title,
          scheduledTimeUtc: updatedRecord!.startTime,
          cancellationReason: updates.sharedNotes || updates.privateNotes || 'Schedule adjustment by Owner',
          sessionId: updatedRecord!.id,
        }).catch(() => {});
      }).catch(() => {});
    } else if (
      (updates.startTime && updates.startTime !== existing?.startTime) ||
      (updates.meetingLink && updates.meetingLink !== existing?.meetingLink)
    ) {
      import('./outboxService').then(({ sendSessionChangedEmail }) => {
        sendSessionChangedEmail({
          studentName: updatedRecord!.studentName,
          studentEmail: updatedRecord!.studentEmail,
          topic: updatedRecord!.title,
          newStartTimeUtc: updatedRecord!.startTime,
          previousStartTimeUtc: existing?.startTime,
          durationMinutes: updatedRecord!.duration,
          meetingLink: updatedRecord!.meetingLink,
          notes: updatedRecord!.sharedNotes,
          sessionId: updatedRecord!.id,
        }).catch(() => {});
      }).catch(() => {});
    }
  }

  return updatedRecord;
}

// ------------------------------------------------------------------------------
// 2. SessionRequest CRUD (Student Session / Reschedule Requests)
// ------------------------------------------------------------------------------

export async function createSessionRequest(data: {
  enrollmentId: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  studentPhone?: string;
  courseId?: string;
  studentSessionId?: string | null;
  requestType: 'INITIAL' | 'RESCHEDULE';
  message?: string;
  preferredWindows: Array<{ startUtc: string; endUtc: string; label?: string }>;
  rescheduleReason?: string;
}): Promise<SessionRequestRecord> {
  const id = `sreq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  let created: SessionRequestRecord | null = null;

  try {
    interface SessionRequestDelegateRow {
      id: string;
      enrollmentId: string;
      studentId: string;
      student?: { name?: string | null; email?: string | null; phone?: string | null } | null;
      courseId?: string | null;
      course?: { title?: string | null } | null;
      studentSessionId?: string | null;
      requestType: 'INITIAL' | 'RESCHEDULE';
      message?: string | null;
      preferredWindows: unknown;
      rescheduleReason?: string | null;
      status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
      resolvedAt?: Date | string | null;
      resolvedByUserId?: string | null;
      createdAt: Date | string;
      updatedAt: Date | string;
    }

    const delegate = (prisma as unknown as { sessionRequest?: { create: (args: unknown) => Promise<SessionRequestDelegateRow> } }).sessionRequest;
    if (delegate) {
      const r = await delegate.create({
        data: {
          id,
          enrollmentId: data.enrollmentId,
          studentId: data.studentId,
          courseId: data.courseId || null,
          studentSessionId: data.studentSessionId || null,
          requestType: data.requestType,
          message: data.message || null,
          preferredWindows: data.preferredWindows,
          rescheduleReason: data.rescheduleReason || null,
          status: 'PENDING',
        },
        include: {
          student: { select: { id: true, name: true, email: true, phone: true } },
          course: { select: { id: true, title: true } },
        },
      });

      if (r) {
        created = {
          id: r.id,
          enrollmentId: r.enrollmentId,
          studentId: r.studentId,
          studentName: r.student?.name || data.studentName || 'Student',
          studentEmail: r.student?.email || data.studentEmail || '',
          studentPhone: r.student?.phone || data.studentPhone || '',
          courseId: r.courseId,
          courseTitle: r.course?.title || '',
          studentSessionId: r.studentSessionId,
          requestType: r.requestType || 'INITIAL',
          message: r.message,
          preferredWindows: (r.preferredWindows as unknown as PreferredTimeWindow[]) || [],
          rescheduleReason: r.rescheduleReason,
          status: r.status || 'PENDING',
          resolvedAt: r.resolvedAt instanceof Date ? r.resolvedAt.toISOString() : null,
          resolvedByUserId: r.resolvedByUserId,
          createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
          updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt),
        };
      }
    }
  } catch {}

  if (!created) {
    created = {
      id,
      enrollmentId: data.enrollmentId,
      studentId: data.studentId,
      studentName: data.studentName || 'Student',
      studentEmail: data.studentEmail || '',
      studentPhone: data.studentPhone || '',
      courseId: data.courseId || null,
      courseTitle: 'Foundations of Vedic Astrology (Jyotish)',
      studentSessionId: data.studentSessionId || null,
      requestType: data.requestType,
      message: data.message || null,
      preferredWindows: data.preferredWindows,
      rescheduleReason: data.rescheduleReason || null,
      status: 'PENDING',
      resolvedAt: null,
      resolvedByUserId: null,
      createdAt: now,
      updatedAt: now,
    };
  }

  _memorySessionRequests.set(created.id, created);
  return created;
}

export async function listSessionRequests(options: {
  studentId?: string;
  status?: string;
} = {}): Promise<SessionRequestRecord[]> {
  try {
    const where: Record<string, unknown> = {};
    if (options.studentId) where.studentId = options.studentId;
    if (options.status && options.status !== 'ALL') where.status = options.status;

    interface SessionRequestRow {
      id: string;
      enrollmentId: string;
      studentId: string;
      student?: { name?: string | null; email?: string | null; phone?: string | null } | null;
      courseId?: string | null;
      course?: { title?: string | null } | null;
      studentSessionId?: string | null;
      requestType: 'INITIAL' | 'RESCHEDULE';
      message?: string | null;
      preferredWindows: unknown;
      rescheduleReason?: string | null;
      status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
      resolvedAt?: Date | string | null;
      resolvedByUserId?: string | null;
      createdAt: Date | string;
      updatedAt: Date | string;
    }

    const delegate = (prisma as unknown as { sessionRequest?: { findMany: (args: unknown) => Promise<SessionRequestRow[]> } }).sessionRequest;
    if (delegate) {
      const rows = await delegate.findMany({
        where,
        include: {
          student: { select: { id: true, name: true, email: true, phone: true } },
          course: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (rows && Array.isArray(rows)) {
        return rows.map((r) => ({
          id: r.id,
          enrollmentId: r.enrollmentId,
          studentId: r.studentId,
          studentName: r.student?.name || 'Student',
          studentEmail: r.student?.email || '',
          studentPhone: r.student?.phone || '',
          courseId: r.courseId,
          courseTitle: r.course?.title || '',
          studentSessionId: r.studentSessionId,
          requestType: r.requestType || 'INITIAL',
          message: r.message,
          preferredWindows: (r.preferredWindows as unknown as PreferredTimeWindow[]) || [],
          rescheduleReason: r.rescheduleReason,
          status: r.status || 'PENDING',
          resolvedAt: r.resolvedAt instanceof Date ? r.resolvedAt.toISOString() : null,
          resolvedByUserId: r.resolvedByUserId,
          createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
          updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt),
        }));
      }
    }
  } catch {}

  initializeDefaults();
  let list = Array.from(_memorySessionRequests.values());
  if (options.studentId) list = list.filter((r) => r.studentId === options.studentId);
  if (options.status && options.status !== 'ALL') list = list.filter((r) => r.status === options.status);
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return list;
}

export async function resolveSessionRequest(data: {
  requestId: string;
  status: 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
  resolvedByUserId: string;
  rescheduleReason?: string;
  studentSessionId?: string | null;
}): Promise<SessionRequestRecord | null> {
  const now = new Date().toISOString();
  let updated: SessionRequestRecord | null = null;

  try {
    const delegate = (prisma as unknown as { sessionRequest?: { update: (args: unknown) => Promise<Record<string, unknown>> } }).sessionRequest;
    if (delegate) {
      await delegate.update({
        where: { id: data.requestId },
        data: {
          status: data.status,
          resolvedAt: new Date(),
          resolvedByUserId: data.resolvedByUserId,
          studentSessionId: data.studentSessionId || undefined,
          rescheduleReason: data.rescheduleReason || undefined,
        },
      });
    }
  } catch {}

  const mem = _memorySessionRequests.get(data.requestId);
  if (mem) {
    updated = {
      ...mem,
      status: data.status,
      resolvedAt: now,
      resolvedByUserId: data.resolvedByUserId,
      studentSessionId: data.studentSessionId || mem.studentSessionId,
      rescheduleReason: data.rescheduleReason || mem.rescheduleReason,
      updatedAt: now,
    };
    _memorySessionRequests.set(data.requestId, updated);
  }

  return updated;
}

// ------------------------------------------------------------------------------
// 3. Owner Working Hours & Blocked Dates (Asia/Kolkata)
// ------------------------------------------------------------------------------

export async function getOwnerWorkingHours(): Promise<OwnerWorkingHoursRecord[]> {
  try {
    interface WorkingHoursRow {
      id: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      timezone?: string;
      slotDurationMinutes: number;
      isEnabled: boolean;
    }
    const delegate = (prisma as unknown as { ownerWorkingHours?: { findMany: (args: unknown) => Promise<WorkingHoursRow[]> } }).ownerWorkingHours;
    if (delegate) {
      const rows = await delegate.findMany({ orderBy: { dayOfWeek: 'asc' } });
      if (rows && rows.length === 7) {
        return rows.map((r) => ({
          id: r.id,
          dayOfWeek: r.dayOfWeek,
          dayName: DAY_NAMES[r.dayOfWeek] || `Day ${r.dayOfWeek}`,
          startTime: r.startTime,
          endTime: r.endTime,
          timezone: r.timezone || 'Asia/Kolkata',
          slotDurationMinutes: r.slotDurationMinutes,
          isEnabled: r.isEnabled,
        }));
      } else if (rows && rows.length > 0) {
        initializeDefaults();
        const map = new Map<number, OwnerWorkingHoursRecord>(_memoryWorkingHours);
        for (const r of rows) {
          map.set(r.dayOfWeek, {
            id: r.id,
            dayOfWeek: r.dayOfWeek,
            dayName: DAY_NAMES[r.dayOfWeek] || `Day ${r.dayOfWeek}`,
            startTime: r.startTime,
            endTime: r.endTime,
            timezone: r.timezone || 'Asia/Kolkata',
            slotDurationMinutes: r.slotDurationMinutes,
            isEnabled: r.isEnabled,
          });
        }
        return Array.from(map.values()).sort((a, b) => a.dayOfWeek - b.dayOfWeek);
      }
    }
  } catch {}

  initializeDefaults();
  return Array.from(_memoryWorkingHours.values()).sort((a, b) => a.dayOfWeek - b.dayOfWeek);
}

export async function updateOwnerWorkingHours(
  dayOfWeek: number,
  updates: Partial<OwnerWorkingHoursRecord>
): Promise<OwnerWorkingHoursRecord> {
  initializeDefaults();
  const existing = _memoryWorkingHours.get(dayOfWeek) || {
    id: `wh_${dayOfWeek}`,
    dayOfWeek,
    dayName: DAY_NAMES[dayOfWeek] || `Day ${dayOfWeek}`,
    startTime: '10:00',
    endTime: '19:00',
    timezone: 'Asia/Kolkata',
    slotDurationMinutes: 60,
    isEnabled: true,
  };

  const updated: OwnerWorkingHoursRecord = {
    ...existing,
    ...updates,
  };

  try {
    const delegate = (prisma as unknown as { ownerWorkingHours?: { upsert: (args: unknown) => Promise<Record<string, unknown>> } }).ownerWorkingHours;
    if (delegate) {
      await delegate.upsert({
        where: { dayOfWeek },
        create: {
          id: updated.id,
          dayOfWeek,
          startTime: updated.startTime,
          endTime: updated.endTime,
          timezone: updated.timezone,
          slotDurationMinutes: updated.slotDurationMinutes,
          isEnabled: updated.isEnabled,
        },
        update: {
          startTime: updated.startTime,
          endTime: updated.endTime,
          timezone: updated.timezone,
          slotDurationMinutes: updated.slotDurationMinutes,
          isEnabled: updated.isEnabled,
        },
      });
    }
  } catch {}

  _memoryWorkingHours.set(dayOfWeek, updated);
  return updated;
}

export async function listOwnerBlockedDates(): Promise<OwnerBlockedDateRecord[]> {
  try {
    interface BlockedDateRow {
      id: string;
      blockedDate: Date | string;
      reason?: string | null;
      isFullDay: boolean;
      startTime?: string | null;
      endTime?: string | null;
      timezone?: string;
      createdAt: Date | string;
    }
    const delegate = (prisma as unknown as { ownerBlockedDate?: { findMany: (args: unknown) => Promise<BlockedDateRow[]> } }).ownerBlockedDate;
    if (delegate) {
      const rows = await delegate.findMany({ orderBy: { blockedDate: 'asc' } });
      if (rows && rows.length > 0) {
        return rows.map((b) => ({
          id: b.id,
          blockedDate: b.blockedDate instanceof Date ? b.blockedDate.toISOString() : String(b.blockedDate),
          reason: b.reason,
          isFullDay: b.isFullDay,
          startTime: b.startTime,
          endTime: b.endTime,
          timezone: b.timezone || 'Asia/Kolkata',
          createdAt: b.createdAt instanceof Date ? b.createdAt.toISOString() : String(b.createdAt),
        }));
      }
    }
  } catch {}

  initializeDefaults();
  return Array.from(_memoryBlockedDates.values());
}

export async function addOwnerBlockedDate(data: {
  blockedDate: Date | string;
  reason?: string;
  isFullDay?: boolean;
  startTime?: string;
  endTime?: string;
}): Promise<OwnerBlockedDateRecord> {
  const id = `blk_${Date.now()}`;
  const dateObj = data.blockedDate instanceof Date ? data.blockedDate : new Date(data.blockedDate);
  const now = new Date().toISOString();

  const record: OwnerBlockedDateRecord = {
    id,
    blockedDate: dateObj.toISOString(),
    reason: data.reason || null,
    isFullDay: data.isFullDay !== false,
    startTime: data.startTime || null,
    endTime: data.endTime || null,
    timezone: 'Asia/Kolkata',
    createdAt: now,
  };

  try {
    const delegate = (prisma as unknown as { ownerBlockedDate?: { create: (args: unknown) => Promise<Record<string, unknown>> } }).ownerBlockedDate;
    if (delegate) {
      await delegate.create({
        data: {
          id,
          blockedDate: dateObj,
          reason: data.reason || null,
          isFullDay: record.isFullDay,
          startTime: record.startTime,
          endTime: record.endTime,
          timezone: 'Asia/Kolkata',
        },
      });
    }
  } catch {}

  _memoryBlockedDates.set(id, record);
  return record;
}

// ------------------------------------------------------------------------------
// 4. Session History Audit Log
// ------------------------------------------------------------------------------

export async function logSessionHistory(data: {
  sessionId: string;
  sessionTitle?: string;
  action: SessionHistoryLogRecord['action'];
  actorUserId?: string;
  actorName?: string;
  previousStatus?: string;
  newStatus?: string;
  notes?: string;
  changeSummary?: Record<string, unknown>;
}): Promise<SessionHistoryLogRecord> {
  const id = `shl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const log: SessionHistoryLogRecord = {
    id,
    sessionId: data.sessionId,
    sessionTitle: data.sessionTitle,
    action: data.action,
    actorUserId: data.actorUserId || null,
    actorName: data.actorName || (data.actorUserId === 'usr_owner_001' ? 'Acharya Niraj Kumar' : null),
    previousStatus: data.previousStatus || null,
    newStatus: data.newStatus || null,
    notes: data.notes || null,
    changeSummary: data.changeSummary || null,
    createdAt: now,
  };

  try {
    const delegate = (prisma as unknown as { sessionHistoryLog?: { create: (args: unknown) => Promise<Record<string, unknown>> } }).sessionHistoryLog;
    if (delegate) {
      await delegate.create({
        data: {
          id,
          sessionId: data.sessionId,
          action: data.action,
          actorUserId: data.actorUserId || null,
          previousStatus: data.previousStatus || null,
          newStatus: data.newStatus || null,
          notes: data.notes || null,
          changeSummary: data.changeSummary || undefined,
        },
      });
    }
  } catch {}

  _memoryHistoryLogs.unshift(log);
  return log;
}

export async function listSessionHistoryLogs(sessionId?: string): Promise<SessionHistoryLogRecord[]> {
  try {
    interface HistoryLogRow {
      id: string;
      sessionId: string;
      session?: { id: string; title: string } | null;
      action: SessionHistoryLogRecord['action'];
      actorUserId?: string | null;
      actorUser?: { id: string; name?: string | null } | null;
      previousStatus?: string | null;
      newStatus?: string | null;
      notes?: string | null;
      changeSummary?: Record<string, unknown> | null;
      createdAt: Date | string;
    }
    const delegate = (prisma as unknown as { sessionHistoryLog?: { findMany: (args: unknown) => Promise<HistoryLogRow[]> } }).sessionHistoryLog;
    if (delegate) {
      const where = sessionId ? { sessionId } : {};
      const rows = await delegate.findMany({
        where,
        include: {
          actorUser: { select: { id: true, name: true } },
          session: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      if (rows && rows.length > 0) {
        return rows.map((l) => ({
          id: l.id,
          sessionId: l.sessionId,
          sessionTitle: l.session?.title,
          action: l.action || 'CREATED',
          actorUserId: l.actorUserId,
          actorName: l.actorUser?.name,
          previousStatus: l.previousStatus,
          newStatus: l.newStatus,
          notes: l.notes,
          changeSummary: l.changeSummary || null,
          createdAt: l.createdAt instanceof Date ? l.createdAt.toISOString() : String(l.createdAt),
        }));
      }
    }
  } catch {}

  if (sessionId) {
    return _memoryHistoryLogs.filter((l) => l.sessionId === sessionId);
  }
  return _memoryHistoryLogs;
}

// ------------------------------------------------------------------------------
// 5. Per-Course Session Settings
// (Empty by default, shown only when Owner sets them: count and real max students)
// ------------------------------------------------------------------------------

export async function getCourseSessionSettings(courseId: string): Promise<CourseSessionSettings> {
  const workingHours = await getOwnerWorkingHours();

  try {
    interface CourseSettingsRow {
      sessionsIncludedPerStudent?: number | null;
      maximumActiveStudents?: number | null;
      minimumRescheduleNoticeHours?: number | null;
      defaultSessionDurationMinutes?: number | null;
      defaultMeetingPlatform?: string | null;
    }
    const course = (await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        sessionsIncludedPerStudent: true,
        maximumActiveStudents: true,
        minimumRescheduleNoticeHours: true,
        defaultSessionDurationMinutes: true,
        defaultMeetingPlatform: true,
      },
    })) as CourseSettingsRow | null;

    if (course) {
      return {
        sessionsIncludedPerStudent: course.sessionsIncludedPerStudent ?? null,
        maximumActiveStudents: course.maximumActiveStudents ?? null,
        minimumRescheduleNoticeHours: course.minimumRescheduleNoticeHours ?? 24,
        defaultSessionDurationMinutes: course.defaultSessionDurationMinutes ?? 60,
        defaultMeetingPlatform: course.defaultMeetingPlatform ?? 'GOOGLE_MEET',
        workingHours,
      };
    }
  } catch {}

  const mem = _memoryCourseSettings.get(courseId);
  return {
    sessionsIncludedPerStudent: mem?.sessionsIncludedPerStudent ?? null,
    maximumActiveStudents: mem?.maximumActiveStudents ?? null,
    minimumRescheduleNoticeHours: mem?.minimumRescheduleNoticeHours ?? 24,
    defaultSessionDurationMinutes: mem?.defaultSessionDurationMinutes ?? 60,
    defaultMeetingPlatform: mem?.defaultMeetingPlatform ?? 'GOOGLE_MEET',
    workingHours,
  };
}

export async function updateCourseSessionSettings(
  courseId: string,
  settings: CourseSessionSettings
): Promise<CourseSessionSettings> {
  try {
    const dataToUpdate: Record<string, unknown> = {};
    if (settings.sessionsIncludedPerStudent !== undefined) {
      dataToUpdate.sessionsIncludedPerStudent = settings.sessionsIncludedPerStudent;
    }
    if (settings.maximumActiveStudents !== undefined) {
      dataToUpdate.maximumActiveStudents = settings.maximumActiveStudents;
    }
    if (settings.minimumRescheduleNoticeHours !== undefined) {
      dataToUpdate.minimumRescheduleNoticeHours = settings.minimumRescheduleNoticeHours;
    }
    if (settings.defaultSessionDurationMinutes !== undefined) {
      dataToUpdate.defaultSessionDurationMinutes = settings.defaultSessionDurationMinutes;
    }
    if (settings.defaultMeetingPlatform !== undefined) {
      dataToUpdate.defaultMeetingPlatform = settings.defaultMeetingPlatform;
    }

    await prisma.course.update({
      where: { id: courseId },
      data: dataToUpdate,
    });
  } catch {}

  // Update working hours if provided
  if (Array.isArray(settings.workingHours)) {
    for (const day of settings.workingHours) {
      if (typeof day.dayOfWeek === 'number') {
        await updateOwnerWorkingHours(day.dayOfWeek, day);
      }
    }
  }

  const updatedWorkingHours = await getOwnerWorkingHours();

  const merged: CourseSessionSettings = {
    minimumRescheduleNoticeHours: 24,
    defaultSessionDurationMinutes: 60,
    defaultMeetingPlatform: 'GOOGLE_MEET',
    ...(_memoryCourseSettings.get(courseId) || {}),
    ...settings,
    workingHours: updatedWorkingHours,
  };
  _memoryCourseSettings.set(courseId, merged);
  return merged;
}

// ------------------------------------------------------------------------------
// 6. WhatsApp Link & IST Formatting Helpers
// ------------------------------------------------------------------------------

export function generateWhatsAppShareUrl(session: OneOnOneSessionRecord | StudentSessionRecord): string {
  let phone = (session.studentPhone || '').replace(/[^\d+]/g, '');
  if (phone.startsWith('+')) {
    phone = phone.substring(1);
  } else if (phone.length === 10) {
    phone = `91${phone}`;
  }

  const dateValue = 'scheduledAt' in session ? session.scheduledAt : session.startTime;
  const d = new Date(dateValue);
  const timeStr = d.toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
    hour12: true,
  });

  const duration = 'durationMinutes' in session ? session.durationMinutes : session.duration;
  const notesText = 'sharedNotes' in session ? session.sharedNotes : 'notes' in session ? (session as { notes?: string | null }).notes : null;

  const message = [
    `Namaste ${session.studentName} ji,`,
    ``,
    `Your personal 1-on-1 Vedic Astrology class with Acharya Niraj Kumar has been scheduled:`,
    `🗓 Date & Time: ${timeStr} (IST)`,
    `⏱ Duration: ${duration} minutes`,
    `📖 Topic: ${session.title}`,
    session.meetingLink ? `🔗 Join Link: ${session.meetingLink}` : `🔗 Meeting link will be shared shortly.`,
    notesText ? `📝 Preparation Notes: ${notesText}` : null,
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

// Backwards compatibility aliases
export const listOneOnOneSessions = async (opt?: {
  studentId?: string;
  courseId?: string;
  enrollmentId?: string;
  status?: string;
  limit?: number;
}) => {
  const studs = await listStudentSessions(opt);
  return studs.map((s) => ({
    id: s.id,
    studentId: s.studentId,
    studentName: s.studentName,
    studentEmail: s.studentEmail,
    studentPhone: s.studentPhone,
    courseId: s.courseId,
    courseTitle: s.courseTitle,
    title: s.title,
    description: null,
    scheduledAt: s.startTime,
    durationMinutes: s.duration,
    meetingPlatform: s.meetingPlatform,
    meetingLink: s.meetingLink,
    meetingId: null,
    passcode: null,
    notes: s.sharedNotes,
    taughtRecord: s.homework ? `${s.sharedNotes || ''}\nHomework: ${s.homework}` : s.sharedNotes,
    homework: s.homework,
    recordingUrl: s.recordingUrl,
    status: (s.status === 'COMPLETED' ? 'COMPLETED' : 'SCHEDULED') as 'COMPLETED' | 'SCHEDULED',
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }));
};

export const createOneOnOneSession = async (data: {
  enrollmentId?: string;
  studentId: string;
  courseId?: string;
  title: string;
  scheduledAt: string;
  durationMinutes?: number;
  meetingLink?: string | null;
  meetingPlatform?: string;
  notes?: string;
  createdByUserId?: string;
}) => {
  const ss = await createStudentSession({
    enrollmentId: data.enrollmentId || 'enr_001',
    studentId: data.studentId,
    courseId: data.courseId || 'what-is-astrology',
    title: data.title,
    startTime: data.scheduledAt,
    duration: data.durationMinutes || 60,
    meetingLink: data.meetingLink,
    meetingPlatform: data.meetingPlatform || 'GOOGLE_MEET',
    sharedNotes: data.notes,
    createdByUserId: data.createdByUserId || 'usr_owner_001',
  });
  return {
    id: ss.id,
    studentId: ss.studentId,
    studentName: ss.studentName,
    studentEmail: ss.studentEmail,
    studentPhone: ss.studentPhone,
    courseId: ss.courseId,
    courseTitle: ss.courseTitle,
    title: ss.title,
    description: null,
    scheduledAt: ss.startTime,
    durationMinutes: ss.duration,
    meetingPlatform: ss.meetingPlatform,
    meetingLink: ss.meetingLink,
    meetingId: null,
    passcode: null,
    notes: ss.sharedNotes,
    taughtRecord: ss.sharedNotes,
    homework: ss.homework,
    recordingUrl: ss.recordingUrl,
    status: 'SCHEDULED' as const,
    createdAt: ss.createdAt,
    updatedAt: ss.updatedAt,
  };
};

export const updateOneOnOneSession = async (
  id: string,
  updates: Partial<OneOnOneSessionRecord>
) => {
  const ss = await updateStudentSession(id, {
    title: updates.title,
    startTime: updates.scheduledAt,
    duration: updates.durationMinutes,
    meetingLink: updates.meetingLink,
    meetingPlatform: updates.meetingPlatform,
    status: updates.status === 'COMPLETED' ? 'COMPLETED' : updates.status === 'CANCELLED' ? 'CANCELLED' : undefined,
    sharedNotes: updates.taughtRecord || updates.notes,
    homework: updates.homework,
    recordingUrl: updates.recordingUrl,
  });
  if (!ss) return null;
  return {
    id: ss.id,
    studentId: ss.studentId,
    studentName: ss.studentName,
    studentEmail: ss.studentEmail,
    studentPhone: ss.studentPhone,
    courseId: ss.courseId,
    courseTitle: ss.courseTitle,
    title: ss.title,
    description: null,
    scheduledAt: ss.startTime,
    durationMinutes: ss.duration,
    meetingPlatform: ss.meetingPlatform,
    meetingLink: ss.meetingLink,
    meetingId: null,
    passcode: null,
    notes: ss.sharedNotes,
    taughtRecord: ss.sharedNotes,
    homework: ss.homework,
    recordingUrl: ss.recordingUrl,
    status: (ss.status === 'COMPLETED' ? 'COMPLETED' : 'SCHEDULED') as 'COMPLETED' | 'SCHEDULED',
    createdAt: ss.createdAt,
    updatedAt: ss.updatedAt,
  };
};

export const recordTaughtContent = async (
  id: string,
  data: {
    taughtRecord?: string;
    homework?: string;
    recordingUrl?: string;
    markCompleted?: boolean;
  }
) => {
  return updateOneOnOneSession(id, {
    taughtRecord: data.taughtRecord,
    homework: data.homework,
    recordingUrl: data.recordingUrl,
    status: data.markCompleted !== false ? 'COMPLETED' : 'SCHEDULED',
  });
};

export const deleteOneOnOneSession = async (id: string) => {
  try {
    const delegate = (prisma as unknown as { studentSession?: { delete: (args: unknown) => Promise<Record<string, unknown>> } }).studentSession;
    if (delegate) {
      await delegate.delete({ where: { id } });
    }
  } catch {}
  return _memoryStudentSessions.delete(id);
};
