import { prisma } from '@/lib/prisma';
import { sendSessionChangedEmail, sendSessionCancelledEmail } from '@/lib/sessions/outboxService';
import { formatInTimezone } from '@/lib/timezones';
import type { MeetingPlatform } from '@prisma/client';

export interface LiveClassInput {
  moduleId: string;
  title: string;
  titleHi?: string | null;
  agenda?: string | null;
  date: string; // YYYY-MM-DD (entered in IST)
  startTime: string; // HH:mm (entered in IST)
  durationMinutes: number;
  provider: 'GOOGLE_MEET' | 'ZOOM';
  meetingLink?: string | null;
  zoomPasscode?: string | null;
  privateHostNotes?: string | null;
  notesPdf?: string | null;
  documentUrl?: string | null;
  status: 'DRAFT' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  recordingUrl?: string | null;
  recordingStreamId?: string | null;
}

export {
  isValidMeetingLink,
  INVALID_LINK_MESSAGE_EN,
  INVALID_LINK_MESSAGE_HI,
  REJECTED_WORDS,
  type MeetingLinkValidationResult,
} from './meetingLinkValidation';
export {
  computeLiveClassJoinWindow,
  gateMeetingLinkForStudent,
  formatStartsInCountdown,
  DEFAULT_REVEAL_MINUTES,
  POST_CLASS_WINDOW_HOURS,
  type LiveClassButtonState,
  type JoinWindowComputation,
} from './liveClassJoinWindow';
import { isValidMeetingLink, INVALID_LINK_MESSAGE_EN } from './meetingLinkValidation';
import { DEFAULT_REVEAL_MINUTES } from './liveClassJoinWindow';

/**
 * Converts IST date string ("YYYY-MM-DD") and time string ("HH:mm") into a UTC Date.
 */
export function parseIstToUtc(dateStr: string, timeStr: string): Date {
  const cleanDate = dateStr.trim();
  const cleanTime = timeStr.trim().slice(0, 5); // ensure HH:mm
  const iso = `${cleanDate}T${cleanTime}:00+05:30`;
  const parsed = new Date(iso);
  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid date or time: date="${dateStr}", time="${timeStr}"`);
  }
  return parsed;
}

/**
 * Converts a UTC Date into IST date, time, and display string.
 */
export function formatUtcToIst(utcDate: Date | string): {
  dateStr: string;
  timeStr: string;
  display: string;
} {
  const d = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  if (!d || isNaN(d.getTime())) {
    return { dateStr: '', timeStr: '', display: 'Unscheduled' };
  }

  // Format in Asia/Kolkata
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dateStr = formatter.format(d); // YYYY-MM-DD

  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const timeStr = timeFormatter.format(d); // HH:mm

  const display = formatInTimezone(d.toISOString(), 'Asia/Kolkata', 'short');
  return { dateStr, timeStr, display };
}

/**
 * Check for scheduling clashes. Two live classes cannot overlap in time.
 * Overlap formula: startA < endB && startB < endA.
 */
export async function checkLiveClassClash(params: {
  startUtc: Date;
  durationMinutes: number;
  excludeLessonId?: string | null;
}): Promise<{
  isClash: boolean;
  clashingLesson?: {
    id: string;
    title: string;
    startIst: string;
    endIst: string;
  };
  messageEn?: string;
  messageHi?: string;
}> {
  const { startUtc, durationMinutes, excludeLessonId } = params;
  const newStartMs = startUtc.getTime();
  const newEndMs = newStartMs + durationMinutes * 60 * 1000;

  try {
    const existingLiveLessons = await prisma.lesson.findMany({
      where: {
        type: 'LIVE_SESSION',
        status: { in: ['SCHEDULED', 'PUBLISHED'] },
        liveScheduledAt: { not: null },
        ...(excludeLessonId ? { id: { not: excludeLessonId } } : {}),
      },
      select: {
        id: true,
        title: true,
        liveScheduledAt: true,
        durationMinutes: true,
      },
    });

    for (const lesson of existingLiveLessons) {
      if (!lesson.liveScheduledAt) continue;
      const existStartMs = new Date(lesson.liveScheduledAt).getTime();
      const existEndMs = existStartMs + (lesson.durationMinutes || 60) * 60 * 1000;

      // Overlap condition
      if (newStartMs < existEndMs && existStartMs < newEndMs) {
        const startIst = formatInTimezone(lesson.liveScheduledAt.toISOString(), 'Asia/Kolkata', 'short');
        const endIst = formatInTimezone(new Date(existEndMs).toISOString(), 'Asia/Kolkata', 'timeOnly');
        return {
          isClash: true,
          clashingLesson: {
            id: lesson.id,
            title: lesson.title,
            startIst,
            endIst,
          },
          messageEn: `Scheduling conflict: The live class "${lesson.title}" is already scheduled from ${startIst} to ${endIst}. Two live classes cannot overlap.`,
          messageHi: `समय टकराव: "${lesson.title}" लाइव कक्षा पहले से ही ${startIst} से ${endIst} तक निर्धारित है। दो लाइव कक्षाएं एक ही समय पर नहीं हो सकतीं।`,
        };
      }
    }
  } catch (err) {
    console.warn('[checkLiveClassClash] Failed querying DB for clashes:', err);
  }

  return { isClash: false };
}

/**
 * List all live classes segregated into upcoming and past.
 */
export async function listLiveClasses(params?: {
  courseId?: string;
  includePrivateNotes?: boolean;
}) {
  const includePrivate = Boolean(params?.includePrivateNotes);

  let lessons: Array<{
    id: string;
    moduleId: string;
    order: number;
    title: string;
    titleHi: string | null;
    agenda: string | null;
    description: string | null;
    liveScheduledAt: Date | null;
    liveTimezone: string | null;
    durationMinutes: number | null;
    liveJoinLink: string | null;
    meetingPlatform: MeetingPlatform | null;
    zoomPasscode?: string | null;
    privateHostNotes?: string | null;
    documentUrl: string | null;
    status: string;
    recordingUrl: string | null;
    recordingStreamId: string | null;
    createdAt: Date;
    updatedAt: Date;
    module?: {
      id: string;
      title: string;
      order: number;
      courseId: string;
      course?: {
        id: string;
        title: string;
        slug: string;
      };
    };
  }> = [];

  try {
    lessons = await prisma.lesson.findMany({
      where: {
        type: 'LIVE_SESSION',
        ...(params?.courseId ? { module: { courseId: params.courseId } } : {}),
      },
      include: {
        module: {
          select: {
            id: true,
            title: true,
            order: true,
            courseId: true,
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: [
        { liveScheduledAt: 'asc' },
        { order: 'asc' },
      ],
    });
  } catch (err) {
    console.warn('[listLiveClasses] DB query error:', err);
  }

  const nowMs = Date.now();

  const formatted = lessons.map((l) => {
    const istInfo = l.liveScheduledAt ? formatUtcToIst(l.liveScheduledAt) : null;
    const linkValidation = l.liveJoinLink ? isValidMeetingLink(l.liveJoinLink, l.meetingPlatform) : null;
    return {
      id: l.id,
      moduleId: l.moduleId,
      moduleTitle: l.module?.title || `Module ${l.module?.order || 1}`,
      moduleOrder: l.module?.order || 1,
      courseId: l.module?.courseId || '',
      courseTitle: l.module?.course?.title || 'Foundations of Vedic Astrology',
      order: l.order,
      title: l.title,
      titleHi: l.titleHi,
      agenda: l.agenda || l.description || '',
      dateIst: istInfo?.dateStr || '',
      timeIst: istInfo?.timeStr || '',
      displayIst: istInfo?.display || 'Not scheduled',
      scheduledStartTimeUtc: l.liveScheduledAt ? l.liveScheduledAt.toISOString() : null,
      timezone: l.liveTimezone || 'Asia/Kolkata',
      durationMinutes: l.durationMinutes || 60,
      provider: (l.meetingPlatform || 'GOOGLE_MEET') as 'GOOGLE_MEET' | 'ZOOM',
      meetingLink: l.liveJoinLink || '',
      isLinkValid: linkValidation ? linkValidation.valid : false,
      linkValidationError: linkValidation && !linkValidation.valid ? linkValidation.error : null,
      zoomPasscode: l.zoomPasscode || null,
      notesPdf: l.documentUrl || null,
      status: l.status,
      recordingUrl: l.recordingUrl || null,
      recordingStreamId: l.recordingStreamId || null,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
      // Security: Only include privateHostNotes when strictly authorized (owner/staff)
      ...(includePrivate ? { privateHostNotes: l.privateHostNotes || null } : {}),
    };
  });

  const upcoming = formatted.filter((l) => {
    if (l.status === 'COMPLETED' || l.status === 'CANCELLED') return false;
    if (!l.scheduledStartTimeUtc) return true; // Unscheduled drafts appear in upcoming/drafts
    const endMs = new Date(l.scheduledStartTimeUtc).getTime() + (l.durationMinutes || 60) * 60 * 1000;
    return endMs >= nowMs;
  });

  const past = formatted.filter((l) => {
    if (l.status === 'COMPLETED') return true;
    if (l.status === 'CANCELLED') return true;
    if (!l.scheduledStartTimeUtc) return false;
    const endMs = new Date(l.scheduledStartTimeUtc).getTime() + (l.durationMinutes || 60) * 60 * 1000;
    return endMs < nowMs;
  });

  // Sort upcoming chronologically ascending
  upcoming.sort((a, b) => {
    if (!a.scheduledStartTimeUtc) return 1;
    if (!b.scheduledStartTimeUtc) return -1;
    return new Date(a.scheduledStartTimeUtc).getTime() - new Date(b.scheduledStartTimeUtc).getTime();
  });

  // Sort past chronologically descending
  past.sort((a, b) => {
    if (!a.scheduledStartTimeUtc) return 1;
    if (!b.scheduledStartTimeUtc) return -1;
    return new Date(b.scheduledStartTimeUtc).getTime() - new Date(a.scheduledStartTimeUtc).getTime();
  });

  return {
    all: formatted,
    upcoming,
    past,
    totalCount: formatted.length,
    upcomingCount: upcoming.length,
    pastCount: past.length,
  };
}

/**
 * Schedule a new course live class.
 * Enforces:
 * - Can be saved as DRAFT without a link.
 * - Cannot be published (SCHEDULED) without a valid meeting link.
 * - Server clash protection prevents overlapping classes.
 * - Action logged in ActivityLog.
 */
export async function createLiveClass(params: {
  userId?: string | null;
  userEmail?: string | null;
  data: LiveClassInput;
}) {
  const { data, userId, userEmail } = params;

  if (!data.title || !data.title.trim()) {
    throw new Error('Title is required.');
  }
  if (!data.moduleId) {
    throw new Error('Module selection is required.');
  }

  const duration = Number(data.durationMinutes) || 60;
  const startUtc = parseIstToUtc(data.date, data.startTime);
  const isPublishing = data.status === 'SCHEDULED';

  let normalizedLink: string | null = null;
  if (data.meetingLink && data.meetingLink.trim()) {
    const val = isValidMeetingLink(data.meetingLink, data.provider);
    if (!val.valid) {
      throw new Error(val.error || 'Invalid meeting link.');
    }
    normalizedLink = val.normalizedUrl || data.meetingLink.trim();
  } else if (isPublishing) {
    throw new Error(
      'A live class cannot be published without a valid meeting link. Save as Draft or paste a real Google Meet or Zoom link.'
    );
  }

  // Clash protection: check overlapping live classes
  if (isPublishing) {
    const clash = await checkLiveClassClash({
      startUtc,
      durationMinutes: duration,
    });
    if (clash.isClash) {
      const err = new Error(clash.messageEn || 'Scheduling conflict: another live class is already scheduled at this time.');
      (err as unknown as { status: number; clash: unknown }).status = 409;
      (err as unknown as { status: number; clash: unknown }).clash = clash;
      throw err;
    }
  }

  // Determine next order inside the module
  const existingCount = await prisma.lesson.count({
    where: { moduleId: data.moduleId },
  }).catch(() => 0);

  const lesson = await prisma.lesson.create({
    data: {
      moduleId: data.moduleId,
      order: existingCount + 1,
      type: 'LIVE_SESSION',
      status: data.status,
      title: data.title.trim(),
      titleHi: data.titleHi?.trim() || null,
      agenda: data.agenda?.trim() || null,
      description: data.agenda?.trim() || null,
      liveScheduledAt: startUtc,
      liveTimezone: 'Asia/Kolkata',
      durationMinutes: duration,
      meetingPlatform: data.provider,
      liveJoinLink: normalizedLink,
      zoomPasscode: data.zoomPasscode?.trim() || null,
      privateHostNotes: data.privateHostNotes?.trim() || null,
      documentUrl: data.notesPdf?.trim() || data.documentUrl?.trim() || null,
      recordingUrl: data.recordingUrl?.trim() || null,
      recordingStreamId: data.recordingStreamId?.trim() || null,
    },
    include: {
      module: {
        select: {
          id: true,
          title: true,
          order: true,
          courseId: true,
        },
      },
    },
  });

  const istDisplay = formatUtcToIst(startUtc).display;

  // Audit log
  await prisma.activityLog.create({
    data: {
      userId: userId || null,
      userEmail: userEmail || null,
      action: isPublishing ? 'LIVE_CLASS_SCHEDULED' : 'LIVE_CLASS_DRAFT_CREATED',
      entityType: 'LESSON',
      entityId: lesson.id,
      reason: isPublishing
        ? `Scheduled live class "${lesson.title}" for ${istDisplay} IST`
        : `Created draft live class "${lesson.title}"`,
      details: {
        lessonId: lesson.id,
        moduleId: lesson.moduleId,
        title: lesson.title,
        status: lesson.status,
        scheduledStartTimeUtc: startUtc.toISOString(),
        durationMinutes: duration,
        meetingPlatform: data.provider,
        hasMeetingLink: Boolean(normalizedLink),
      },
    },
  }).catch((e) => console.warn('[createLiveClass] ActivityLog creation failed:', e));

  return lesson;
}

/**
 * Update, reschedule, or cancel a live class.
 * Enforces:
 * - Link validation for scheduled status.
 * - Server clash protection when updating start time or duration.
 * - Transactional email notifications through outbox for active enrolled students upon reschedule or cancellation.
 * - Audit trail logging.
 */
export async function updateLiveClass(params: {
  lessonId: string;
  userId?: string | null;
  userEmail?: string | null;
  data: Partial<LiveClassInput>;
  cancellationReason?: string | null;
}) {
  const { lessonId, data, userId, userEmail, cancellationReason } = params;

  const existing = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        select: {
          id: true,
          title: true,
          courseId: true,
        },
      },
    },
  });

  if (!existing) {
    throw new Error('Live class lesson not found.');
  }

  const previousStartTimeUtc = existing.liveScheduledAt ? existing.liveScheduledAt.toISOString() : null;
  const previousStatus = existing.status;
  const previousLink = existing.liveJoinLink;
  const previousDuration = existing.durationMinutes || 60;

  const newStatus = data.status !== undefined ? data.status : existing.status;
  const isPublishing = newStatus === 'SCHEDULED';

  let startUtc = existing.liveScheduledAt;
  if (data.date && data.startTime) {
    startUtc = parseIstToUtc(data.date, data.startTime);
  }

  const duration = data.durationMinutes !== undefined ? Number(data.durationMinutes) : (existing.durationMinutes || 60);
  const provider = (data.provider || existing.meetingPlatform || 'GOOGLE_MEET') as 'GOOGLE_MEET' | 'ZOOM';

  let normalizedLink = existing.liveJoinLink;
  if (data.meetingLink !== undefined) {
    if (data.meetingLink && data.meetingLink.trim()) {
      const val = isValidMeetingLink(data.meetingLink, provider);
      if (!val.valid) {
        throw new Error(val.error || 'Invalid meeting link.');
      }
      normalizedLink = val.normalizedUrl || data.meetingLink.trim();
    } else {
      normalizedLink = null;
    }
  }

  if (isPublishing) {
    if (!normalizedLink || !normalizedLink.trim()) {
      throw new Error(
        'A live class cannot be published without a valid meeting link. Save as Draft or paste a real Google Meet or Zoom link.'
      );
    }
    const val = isValidMeetingLink(normalizedLink, provider);
    if (!val.valid) {
      throw new Error(val.error || INVALID_LINK_MESSAGE_EN);
    }
  }

  // Clash Protection: verify no overlapping active live class if scheduled
  if (isPublishing && startUtc) {
    const clash = await checkLiveClassClash({
      startUtc,
      durationMinutes: duration,
      excludeLessonId: lessonId,
    });
    if (clash.isClash) {
      const err = new Error(clash.messageEn || 'Scheduling conflict: another live class is already scheduled at this time.');
      (err as unknown as { status: number; clash: unknown }).status = 409;
      (err as unknown as { status: number; clash: unknown }).clash = clash;
      throw err;
    }
  }

  const updated = await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      title: data.title !== undefined ? data.title.trim() : existing.title,
      titleHi: data.titleHi !== undefined ? data.titleHi?.trim() || null : existing.titleHi,
      agenda: data.agenda !== undefined ? data.agenda?.trim() || null : existing.agenda,
      description: data.agenda !== undefined ? data.agenda?.trim() || null : existing.description,
      liveScheduledAt: startUtc,
      durationMinutes: duration,
      meetingPlatform: provider,
      liveJoinLink: normalizedLink,
      zoomPasscode: data.zoomPasscode !== undefined ? data.zoomPasscode?.trim() || null : existing.zoomPasscode,
      privateHostNotes: data.privateHostNotes !== undefined ? data.privateHostNotes?.trim() || null : existing.privateHostNotes,
      documentUrl: data.notesPdf !== undefined ? data.notesPdf?.trim() || null : (data.documentUrl !== undefined ? data.documentUrl?.trim() || null : existing.documentUrl),
      status: newStatus,
      recordingUrl: data.recordingUrl !== undefined ? data.recordingUrl?.trim() || null : existing.recordingUrl,
      recordingStreamId: data.recordingStreamId !== undefined ? data.recordingStreamId?.trim() || null : existing.recordingStreamId,
      ...(data.moduleId ? { moduleId: data.moduleId } : {}),
    },
    include: {
      module: {
        select: {
          id: true,
          title: true,
          courseId: true,
        },
      },
    },
  });

  const courseId = updated.module.courseId;

  // Determine if Rescheduled or Cancelled to notify students
  const isCancelled = newStatus === 'CANCELLED' && previousStatus !== 'CANCELLED';
  const isRescheduled =
    newStatus === 'SCHEDULED' &&
    previousStatus === 'SCHEDULED' &&
    ((startUtc && previousStartTimeUtc && startUtc.toISOString() !== previousStartTimeUtc) ||
      duration !== previousDuration ||
      normalizedLink !== previousLink);

  let notifiedCount = 0;
  if ((isCancelled || isRescheduled) && courseId) {
    notifiedCount = await notifyEnrolledStudentsForLiveClass({
      courseId,
      lessonTitle: updated.title,
      scheduledTimeUtc: updated.liveScheduledAt ? updated.liveScheduledAt.toISOString() : new Date().toISOString(),
      previousStartTimeUtc,
      durationMinutes: duration,
      meetingLink: updated.liveJoinLink,
      notes: updated.agenda,
      isCancelled,
      cancellationReason: cancellationReason || null,
      lessonId: updated.id,
    });
  }

  // Determine audit log action
  let auditAction = 'LIVE_CLASS_UPDATED';
  let auditReason = `Updated live class "${updated.title}"`;

  if (isCancelled) {
    auditAction = 'LIVE_CLASS_CANCELLED';
    auditReason = `Cancelled live class "${updated.title}" (${notifiedCount} students notified via outbox)`;
  } else if (isRescheduled) {
    auditAction = 'LIVE_CLASS_RESCHEDULED';
    auditReason = `Rescheduled live class "${updated.title}" to ${formatUtcToIst(startUtc!).display} IST (${notifiedCount} students notified via outbox)`;
  } else if (newStatus === 'COMPLETED' && previousStatus !== 'COMPLETED') {
    auditAction = 'LIVE_CLASS_COMPLETED';
    auditReason = `Marked live class "${updated.title}" as completed`;
  }

  await prisma.activityLog.create({
    data: {
      userId: userId || null,
      userEmail: userEmail || null,
      action: auditAction,
      entityType: 'LESSON',
      entityId: updated.id,
      reason: auditReason,
      details: {
        lessonId: updated.id,
        title: updated.title,
        previousStatus,
        newStatus,
        previousStartTimeUtc,
        newStartTimeUtc: startUtc ? startUtc.toISOString() : null,
        durationMinutes: duration,
        studentsNotified: notifiedCount,
        cancellationReason: cancellationReason || null,
      },
    },
  }).catch((e) => console.warn('[updateLiveClass] ActivityLog creation failed:', e));

  return {
    lesson: updated,
    notifiedCount,
    isRescheduled,
    isCancelled,
  };
}

/**
 * Notify all approved (ACTIVE) enrolled students of the course via outbox email.
 */
export async function notifyEnrolledStudentsForLiveClass(params: {
  courseId: string;
  lessonTitle: string;
  scheduledTimeUtc: string;
  previousStartTimeUtc?: string | null;
  durationMinutes: number;
  meetingLink?: string | null;
  notes?: string | null;
  isCancelled: boolean;
  cancellationReason?: string | null;
  lessonId: string;
}): Promise<number> {
  const {
    courseId,
    lessonTitle,
    scheduledTimeUtc,
    previousStartTimeUtc,
    durationMinutes,
    meetingLink,
    notes,
    isCancelled,
    cancellationReason,
    lessonId,
  } = params;

  try {
    const activeEnrollments = await prisma.enrollment.findMany({
      where: {
        courseId,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            timezone: true,
          },
        },
      },
    });

    let count = 0;
    for (const enrollment of activeEnrollments) {
      const student = enrollment.user;
      if (!student || !student.email) continue;

      if (isCancelled) {
        await sendSessionCancelledEmail({
          studentName: student.name || 'Student',
          studentEmail: student.email,
          topic: lessonTitle,
          scheduledTimeUtc,
          cancellationReason: cancellationReason || 'Scheduled session updated by the Institute.',
          sessionId: lessonId,
        });
        count++;
      } else {
        await sendSessionChangedEmail({
          studentName: student.name || 'Student',
          studentEmail: student.email,
          topic: lessonTitle,
          newStartTimeUtc: scheduledTimeUtc,
          previousStartTimeUtc,
          durationMinutes,
          meetingLink,
          notes,
          studentTimezone: student.timezone || 'Asia/Kolkata',
          sessionId: lessonId,
        });
        count++;
      }
    }

    return count;
  } catch (err) {
    console.warn('[notifyEnrolledStudentsForLiveClass] Error notifying students:', err);
    return 0;
  }
}

/**
 * Retrieve the Owner-adjustable reveal window (minutes before start time).
 * Defaults to 30 minutes. Range: [5, 120] minutes.
 */
export async function getLiveClassRevealMinutes(): Promise<number> {
  try {
    const item = await prisma.contentItem.findUnique({
      where: {
        collection_key: {
          collection: 'site_settings',
          key: 'live_class_reveal_minutes',
        },
      },
      select: { contentEn: true },
    });

    if (item && item.contentEn) {
      const parsed = parseInt(item.contentEn, 10);
      if (!isNaN(parsed) && parsed >= 5 && parsed <= 120) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[getLiveClassRevealMinutes] DB read error:', err);
  }

  return DEFAULT_REVEAL_MINUTES; // 30 minutes
}

/**
 * Updates the Owner-adjustable reveal window setting in database.
 */
export async function setLiveClassRevealMinutes(params: {
  minutes: number;
  userId?: string | null;
  userEmail?: string | null;
}): Promise<number> {
  const { minutes, userId, userEmail } = params;
  const clampedMinutes = Math.min(120, Math.max(5, Math.round(minutes)));

  try {
    await prisma.contentItem.upsert({
      where: {
        collection_key: {
          collection: 'site_settings',
          key: 'live_class_reveal_minutes',
        },
      },
      create: {
        collection: 'site_settings',
        key: 'live_class_reveal_minutes',
        titleEn: 'Live Class Meeting Link Reveal Window (Minutes Before Start)',
        titleHi: 'लाइव कक्षा मीटिंग लिंक प्रदर्शन समय (प्रारंभ से कितने मिनट पहले)',
        contentEn: String(clampedMinutes),
        contentHi: String(clampedMinutes),
        metadata: { minutes: clampedMinutes, min: 5, max: 120 },
        status: 'PUBLISHED',
        sortOrder: 8,
        updatedById: userId || undefined,
      },
      update: {
        contentEn: String(clampedMinutes),
        contentHi: String(clampedMinutes),
        metadata: { minutes: clampedMinutes, min: 5, max: 120 },
        updatedById: userId || undefined,
      },
    });

    try {
      await prisma.activityLog.create({
        data: {
          action: 'SETTINGS_UPDATE',
          entityType: 'SITE_SETTINGS',
          entityId: 'site_settings:live_class_reveal_minutes',
          userId: userId || null,
          userEmail: userEmail || null,
          details: {
            setting: 'live_class_reveal_minutes',
            minutes: clampedMinutes,
            updatedAt: new Date().toISOString(),
          },
        },
      });
    } catch {}

    return clampedMinutes;
  } catch (err) {
    console.error('[setLiveClassRevealMinutes] Error saving setting:', err);
    throw new Error('Failed to update live class reveal window setting.');
  }
}

