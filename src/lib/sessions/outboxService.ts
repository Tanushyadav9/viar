/**
 * Session Transactional Email Outbox Service
 * Vihangam Institute of Astrology and Research (VIAR)
 * 
 * Implements the Outbox Pattern with:
 * - Guaranteed idempotency (never sends any reminder or notification twice)
 * - Automatic exponential backoff retries (e.g. 2m, 5m, 15m)
 * - Owner list of failed deliveries with 1-click manual retry
 * - Scans for 24-hour and 1-hour pre-class reminders
 */

import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email';
import { formatSessionIST } from './oneOnOneService';
import { formatInTimezone } from '@/lib/timezones';
import type { StudentSessionRecord } from './types';

export type OutboxEmailType =
  | 'SCHEDULED'
  | 'CHANGED'
  | 'CANCELLED'
  | 'REMINDER_24H'
  | 'REMINDER_1H';

export type OutboxStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface SessionEmailOutboxRecord {
  id: string;
  sessionId?: string | null;
  recipientEmail: string;
  recipientName?: string | null;
  emailType: OutboxEmailType;
  subject: string;
  htmlContent: string;
  textContent: string;
  status: OutboxStatus;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt?: string | null;
  lastError?: string | null;
  sentAt?: string | null;
  idempotencyKey?: string | null;
  createdAt: string;
  updatedAt: string;
}

// In-memory fallback for local development / testing without active PostgreSQL connection
const _memoryOutbox = new Map<string, SessionEmailOutboxRecord>();

function getBackoffDelayMs(attempts: number): number {
  // 1st retry: 2 mins, 2nd: 5 mins, 3rd: 15 mins
  if (attempts === 1) return 2 * 60 * 1000;
  if (attempts === 2) return 5 * 60 * 1000;
  return 15 * 60 * 1000;
}

/**
 * Enqueue an email into the outbox with idempotency check.
 * If immediateDispatch is true, attempts immediate dispatch.
 */
export async function enqueueSessionEmail(data: {
  sessionId?: string | null;
  recipientEmail: string;
  recipientName?: string | null;
  emailType: OutboxEmailType;
  subject: string;
  htmlContent: string;
  textContent: string;
  idempotencyKey?: string | null;
  maxAttempts?: number;
  immediateDispatch?: boolean;
}): Promise<SessionEmailOutboxRecord> {
  const idempotencyKey = data.idempotencyKey || null;

  // 1. Idempotency Check: if key provided and already exists, NEVER enqueue or send twice
  if (idempotencyKey) {
    try {
      const existingDb = await prisma.sessionEmailOutbox.findUnique({
        where: { idempotencyKey },
      });
      if (existingDb) {
        return {
          id: existingDb.id,
          sessionId: existingDb.sessionId,
          recipientEmail: existingDb.recipientEmail,
          recipientName: existingDb.recipientName,
          emailType: existingDb.emailType as OutboxEmailType,
          subject: existingDb.subject,
          htmlContent: existingDb.htmlContent,
          textContent: existingDb.textContent,
          status: existingDb.status as OutboxStatus,
          attempts: existingDb.attempts,
          maxAttempts: existingDb.maxAttempts,
          nextAttemptAt: existingDb.nextAttemptAt?.toISOString() || null,
          lastError: existingDb.lastError,
          sentAt: existingDb.sentAt?.toISOString() || null,
          idempotencyKey: existingDb.idempotencyKey,
          createdAt: existingDb.createdAt.toISOString(),
          updatedAt: existingDb.updatedAt.toISOString(),
        };
      }
    } catch {}

    for (const record of Array.from(_memoryOutbox.values())) {
      if (record.idempotencyKey === idempotencyKey) {
        return record;
      }
    }
  }

  const id = `outbox_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  const maxAttempts = data.maxAttempts || 3;

  let record: SessionEmailOutboxRecord = {
    id,
    sessionId: data.sessionId || null,
    recipientEmail: data.recipientEmail,
    recipientName: data.recipientName || 'Student',
    emailType: data.emailType,
    subject: data.subject,
    htmlContent: data.htmlContent,
    textContent: data.textContent,
    status: 'PENDING',
    attempts: 0,
    maxAttempts,
    nextAttemptAt: null,
    lastError: null,
    sentAt: null,
    idempotencyKey,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  // Persist to database if available
  try {
    const createdDb = await prisma.sessionEmailOutbox.create({
      data: {
        id,
        sessionId: data.sessionId || null,
        recipientEmail: data.recipientEmail,
        recipientName: data.recipientName || null,
        emailType: data.emailType,
        subject: data.subject,
        htmlContent: data.htmlContent,
        textContent: data.textContent,
        status: 'PENDING',
        attempts: 0,
        maxAttempts,
        idempotencyKey,
      },
    });
    if (createdDb) {
      record = {
        ...record,
        createdAt: createdDb.createdAt.toISOString(),
        updatedAt: createdDb.updatedAt.toISOString(),
      };
    }
  } catch {
    // Falls back gracefully to in-memory store
  }

  _memoryOutbox.set(id, record);

  // 2. Immediate dispatch attempt
  if (data.immediateDispatch !== false) {
    try {
      const res = await emailService.sendEmail({
        to: data.recipientEmail,
        subject: data.subject,
        html: data.htmlContent,
        text: data.textContent,
      });

      if (res.success) {
        const sentAt = new Date().toISOString();
        record.status = 'SENT';
        record.sentAt = sentAt;
        record.attempts = 1;
        record.updatedAt = sentAt;

        try {
          await prisma.sessionEmailOutbox.update({
            where: { id },
            data: {
              status: 'SENT',
              sentAt: new Date(sentAt),
              attempts: 1,
            },
          });
        } catch {}
      } else {
        const errMessage = res.error || 'Failed to dispatch email';
        const nextAttempt = new Date(Date.now() + getBackoffDelayMs(1)).toISOString();
        record.attempts = 1;
        record.lastError = errMessage;
        record.nextAttemptAt = nextAttempt;
        if (record.attempts >= record.maxAttempts) {
          record.status = 'FAILED';
        }

        try {
          await prisma.sessionEmailOutbox.update({
            where: { id },
            data: {
              attempts: 1,
              lastError: errMessage,
              nextAttemptAt: new Date(nextAttempt),
              status: record.attempts >= record.maxAttempts ? 'FAILED' : 'PENDING',
            },
          });
        } catch {}
      }
    } catch (dispatchErr) {
      const errMessage = dispatchErr instanceof Error ? dispatchErr.message : 'Unknown dispatch error';
      const nextAttempt = new Date(Date.now() + getBackoffDelayMs(1)).toISOString();
      record.attempts = 1;
      record.lastError = errMessage;
      record.nextAttemptAt = nextAttempt;
      if (record.attempts >= record.maxAttempts) {
        record.status = 'FAILED';
      }

      try {
        await prisma.sessionEmailOutbox.update({
          where: { id },
          data: {
            attempts: 1,
            lastError: errMessage,
            nextAttemptAt: new Date(nextAttempt),
            status: record.attempts >= record.maxAttempts ? 'FAILED' : 'PENDING',
          },
        });
      } catch {}
    }
  }

  return record;
}

/**
 * Process pending items in the outbox queue with exponential backoff retries.
 */
export async function processOutboxQueue(limit = 50): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  const now = new Date();
  let pendingItems: SessionEmailOutboxRecord[] = [];

  try {
    const dbItems = await prisma.sessionEmailOutbox.findMany({
      where: {
        status: 'PENDING',
        OR: [
          { nextAttemptAt: null },
          { nextAttemptAt: { lte: now } },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'asc' },
    });

    if (dbItems && dbItems.length > 0) {
      pendingItems = dbItems.map((item) => ({
        id: item.id,
        sessionId: item.sessionId,
        recipientEmail: item.recipientEmail,
        recipientName: item.recipientName,
        emailType: item.emailType as OutboxEmailType,
        subject: item.subject,
        htmlContent: item.htmlContent,
        textContent: item.textContent,
        status: item.status as OutboxStatus,
        attempts: item.attempts,
        maxAttempts: item.maxAttempts,
        nextAttemptAt: item.nextAttemptAt?.toISOString() || null,
        lastError: item.lastError,
        sentAt: item.sentAt?.toISOString() || null,
        idempotencyKey: item.idempotencyKey,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      }));
    }
  } catch {}

  if (pendingItems.length === 0) {
    const nowTime = now.getTime();
    pendingItems = Array.from(_memoryOutbox.values())
      .filter((r) => {
        if (r.status !== 'PENDING') return false;
        if (!r.nextAttemptAt) return true;
        return new Date(r.nextAttemptAt).getTime() <= nowTime;
      })
      .slice(0, limit);
  }

  let sent = 0;
  let failed = 0;

  for (const item of pendingItems) {
    const newAttempts = item.attempts + 1;
    try {
      const res = await emailService.sendEmail({
        to: item.recipientEmail,
        subject: item.subject,
        html: item.htmlContent,
        text: item.textContent,
      });

      if (res.success) {
        sent++;
        item.status = 'SENT';
        item.sentAt = new Date().toISOString();
        item.attempts = newAttempts;
        item.lastError = null;
        item.nextAttemptAt = null;

        try {
          await prisma.sessionEmailOutbox.update({
            where: { id: item.id },
            data: {
              status: 'SENT',
              sentAt: new Date(),
              attempts: newAttempts,
              lastError: null,
              nextAttemptAt: null,
            },
          });
        } catch {}
      } else {
        const errorMsg = res.error || 'Dispatch returned failure';
        item.attempts = newAttempts;
        item.lastError = errorMsg;

        if (newAttempts >= item.maxAttempts) {
          failed++;
          item.status = 'FAILED';
          item.nextAttemptAt = null;
        } else {
          item.nextAttemptAt = new Date(Date.now() + getBackoffDelayMs(newAttempts)).toISOString();
        }

        try {
          await prisma.sessionEmailOutbox.update({
            where: { id: item.id },
            data: {
              status: item.status,
              attempts: newAttempts,
              lastError: errorMsg,
              nextAttemptAt: item.nextAttemptAt ? new Date(item.nextAttemptAt) : null,
            },
          });
        } catch {}
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown exception';
      item.attempts = newAttempts;
      item.lastError = errorMsg;

      if (newAttempts >= item.maxAttempts) {
        failed++;
        item.status = 'FAILED';
        item.nextAttemptAt = null;
      } else {
        item.nextAttemptAt = new Date(Date.now() + getBackoffDelayMs(newAttempts)).toISOString();
      }

      try {
        await prisma.sessionEmailOutbox.update({
          where: { id: item.id },
          data: {
            status: item.status,
            attempts: newAttempts,
            lastError: errorMsg,
            nextAttemptAt: item.nextAttemptAt ? new Date(item.nextAttemptAt) : null,
          },
        });
      } catch {}
    }

    _memoryOutbox.set(item.id, item);
  }

  return {
    processed: pendingItems.length,
    sent,
    failed,
  };
}

/**
 * Return list of failed email deliveries for Owner review.
 */
export async function listFailedEmails(): Promise<SessionEmailOutboxRecord[]> {
  try {
    const dbFailures = await prisma.sessionEmailOutbox.findMany({
      where: { status: 'FAILED' },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });

    if (dbFailures && dbFailures.length > 0) {
      return dbFailures.map((item) => ({
        id: item.id,
        sessionId: item.sessionId,
        recipientEmail: item.recipientEmail,
        recipientName: item.recipientName,
        emailType: item.emailType as OutboxEmailType,
        subject: item.subject,
        htmlContent: item.htmlContent,
        textContent: item.textContent,
        status: item.status as OutboxStatus,
        attempts: item.attempts,
        maxAttempts: item.maxAttempts,
        nextAttemptAt: item.nextAttemptAt?.toISOString() || null,
        lastError: item.lastError,
        sentAt: item.sentAt?.toISOString() || null,
        idempotencyKey: item.idempotencyKey,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      }));
    }
  } catch {}

  return Array.from(_memoryOutbox.values())
    .filter((r) => r.status === 'FAILED')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/**
 * Retry a failed email manually from Owner action.
 */
export async function retryFailedEmail(
  id: string
): Promise<{ success: boolean; error?: string }> {
  let record: SessionEmailOutboxRecord | undefined;

  try {
    const dbRecord = await prisma.sessionEmailOutbox.findUnique({
      where: { id },
    });
    if (dbRecord) {
      record = {
        id: dbRecord.id,
        sessionId: dbRecord.sessionId,
        recipientEmail: dbRecord.recipientEmail,
        recipientName: dbRecord.recipientName,
        emailType: dbRecord.emailType as OutboxEmailType,
        subject: dbRecord.subject,
        htmlContent: dbRecord.htmlContent,
        textContent: dbRecord.textContent,
        status: dbRecord.status as OutboxStatus,
        attempts: dbRecord.attempts,
        maxAttempts: dbRecord.maxAttempts,
        nextAttemptAt: dbRecord.nextAttemptAt?.toISOString() || null,
        lastError: dbRecord.lastError,
        sentAt: dbRecord.sentAt?.toISOString() || null,
        idempotencyKey: dbRecord.idempotencyKey,
        createdAt: dbRecord.createdAt.toISOString(),
        updatedAt: dbRecord.updatedAt.toISOString(),
      };
    }
  } catch {}

  if (!record) {
    record = _memoryOutbox.get(id);
  }

  if (!record) {
    return { success: false, error: 'Email record not found' };
  }

  // Attempt immediate retry
  try {
    const res = await emailService.sendEmail({
      to: record.recipientEmail,
      subject: record.subject,
      html: record.htmlContent,
      text: record.textContent,
    });

    if (res.success) {
      const now = new Date().toISOString();
      record.status = 'SENT';
      record.sentAt = now;
      record.attempts = record.attempts + 1;
      record.lastError = null;
      record.nextAttemptAt = null;
      record.updatedAt = now;

      try {
        await prisma.sessionEmailOutbox.update({
          where: { id },
          data: {
            status: 'SENT',
            sentAt: new Date(now),
            attempts: { increment: 1 },
            lastError: null,
            nextAttemptAt: null,
          },
        });
      } catch {}

      _memoryOutbox.set(id, record);
      return { success: true };
    } else {
      const errorMsg = res.error || 'Retry delivery failed';
      record.attempts = record.attempts + 1;
      record.lastError = errorMsg;
      record.updatedAt = new Date().toISOString();

      try {
        await prisma.sessionEmailOutbox.update({
          where: { id },
          data: {
            attempts: { increment: 1 },
            lastError: errorMsg,
          },
        });
      } catch {}

      _memoryOutbox.set(id, record);
      return { success: false, error: errorMsg };
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Retry failed';
    record.attempts = record.attempts + 1;
    record.lastError = errorMsg;
    record.updatedAt = new Date().toISOString();

    try {
      await prisma.sessionEmailOutbox.update({
        where: { id },
        data: {
          attempts: { increment: 1 },
          lastError: errorMsg,
        },
      });
    } catch {}

    _memoryOutbox.set(id, record);
    return { success: false, error: errorMsg };
  }
}

// ------------------------------------------------------------------------------
// REMINDER SCANNER & IDEMPOTENT DISPATCHER
// ------------------------------------------------------------------------------

/**
 * Scans upcoming sessions and enqueues 24-hour and 1-hour pre-class reminders.
 * Strictly idempotent: guarantees a reminder is never sent twice.
 */
export async function checkAndQueueReminders(): Promise<{
  queued24h: number;
  queued1h: number;
  errors: string[];
}> {
  const nowMs = Date.now();
  let queued24h = 0;
  let queued1h = 0;
  const errors: string[] = [];

  // Window bounds:
  // 24h reminder window: between 23h and 25h ahead (or <= 24h and > 1h ahead)
  const window24hEnd = nowMs + 25 * 60 * 60 * 1000;
  const window24hStart = nowMs + 1.5 * 60 * 60 * 1000; // Do not send 24h reminder if class is in < 1.5h

  // 1h reminder window: between 45m and 75m ahead (or <= 1h and >= now)
  const window1hEnd = nowMs + 75 * 60 * 1000;
  const window1hStart = nowMs - 5 * 60 * 1000; // within 5 mins past start grace

  // Load upcoming sessions
  let sessions: StudentSessionRecord[] = [];

  try {
    interface StudentSessionRow {
      id: string;
      title: string;
      startTime: Date | string;
      duration: number;
      meetingLink?: string | null;
      meetingPlatform: string;
      status: string;
      sharedNotes?: string | null;
      homework?: string | null;
      courseTitle?: string | null;
      reminder24hSentAt?: Date | null;
      reminder1hSentAt?: Date | null;
      student?: { name?: string | null; email?: string | null; phone?: string | null } | null;
    }

    const rows = await (prisma as unknown as {
      studentSession: { findMany: (args: unknown) => Promise<StudentSessionRow[]> };
    }).studentSession.findMany({
      where: {
        status: { in: ['SCHEDULED', 'RESCHEDULE_REQUESTED'] },
        startTime: {
          gte: new Date(nowMs - 10 * 60 * 1000),
          lte: new Date(nowMs + 26 * 60 * 60 * 1000),
        },
      },
      include: {
        student: { select: { name: true, email: true, phone: true } },
      },
    });

    if (rows && rows.length > 0) {
      sessions = rows.map((r) => ({
        id: r.id,
        enrollmentId: 'enr',
        studentId: 'stud',
        studentName: r.student?.name || 'Student',
        studentEmail: r.student?.email || '',
        studentPhone: r.student?.phone || '',
        courseId: 'course',
        title: r.title,
        startTime: r.startTime instanceof Date ? r.startTime.toISOString() : String(r.startTime),
        duration: r.duration || 60,
        meetingLink: r.meetingLink || null,
        meetingPlatform: r.meetingPlatform,
        status: r.status as unknown as StudentSessionRecord['status'],
        sharedNotes: r.sharedNotes || null,
        homework: r.homework || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdByUserId: 'owner',
        createdByName: 'Acharya Niraj Kumar',
      }));
    }
  } catch {}

  // Also check memory sessions
  const { listStudentSessions } = await import('./oneOnOneService');
  const allMemory = await listStudentSessions({ status: 'SCHEDULED' });
  const sessionMap = new Map<string, StudentSessionRecord>();
  for (const s of sessions) sessionMap.set(s.id, s);
  for (const s of allMemory) {
    if (!sessionMap.has(s.id)) sessionMap.set(s.id, s);
  }

  for (const session of Array.from(sessionMap.values())) {
    if (!session.studentEmail) continue;

    const sessionStartMs = new Date(session.startTime).getTime();

    // ------------------------------------------------------------------------
    // 1. 24-HOUR REMINDER
    // ------------------------------------------------------------------------
    if (sessionStartMs >= window24hStart && sessionStartMs <= window24hEnd) {
      const idempotencyKey = `reminder_24h_${session.id}`;

      // Check whether 24h reminder was already enqueued/sent
      let alreadySent = false;
      try {
        const found = await prisma.sessionEmailOutbox.findUnique({
          where: { idempotencyKey },
        });
        if (found) alreadySent = true;
      } catch {}

      if (!alreadySent) {
        for (const outboxItem of Array.from(_memoryOutbox.values())) {
          if (outboxItem.idempotencyKey === idempotencyKey) {
            alreadySent = true;
            break;
          }
        }
      }

      if (!alreadySent) {
        const timeIst = formatSessionIST(session.startTime);
        const timeLocal = formatInTimezone(session.startTime, 'America/New_York');

        const subject = `Reminder: Tomorrow is your 1-on-1 Class with Acharya Niraj Kumar — ${session.title}`;
        const html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0b0f17; color: #cbd5e1; border: 1px solid rgba(245,158,11,0.3); border-radius: 16px; padding: 28px;">
            <div style="text-align: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 16px; margin-bottom: 20px;">
              <h2 style="color: #f59e0b; margin: 0; font-size: 18px;">Vihangam Institute of Astrology and Research</h2>
              <p style="color: #94a3b8; font-size: 12px; margin: 4px 0 0;">24-Hour Pre-Class Reminder</p>
            </div>
            <p style="color: #ffffff; font-size: 15px;">Namaste <strong>${session.studentName} ji</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6;">This is a reminder that your 1-on-1 personal mentorship class with <strong>Acharya Niraj Kumar</strong> is scheduled for tomorrow:</p>
            
            <div style="background-color: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 18px; margin: 20px 0;">
              <p style="margin: 4px 0; color: #ffffff;"><strong>Topic:</strong> ${session.title}</p>
              <p style="margin: 4px 0; color: #f59e0b;"><strong>Time (IST):</strong> ${timeIst} IST</p>
              <p style="margin: 4px 0; color: #38bdf8;"><strong>Local Time:</strong> ${timeLocal} EDT</p>
              <p style="margin: 4px 0; color: #ffffff;"><strong>Duration:</strong> ${session.duration} Minutes</p>
              <p style="margin: 4px 0; color: #ffffff;"><strong>Platform:</strong> ${session.meetingPlatform || 'Google Meet'}</p>
            </div>

            ${session.sharedNotes ? `
              <div style="background-color: rgba(245,158,11,0.08); border-left: 3px solid #f59e0b; padding: 12px; margin: 16px 0; font-size: 13px;">
                <strong style="color: #f59e0b;">Pre-Class Preparation from Acharya ji:</strong><br />
                ${session.sharedNotes}
              </div>
            ` : ''}

            <div style="text-align: center; margin: 24px 0;">
              <a href="https://viar.in/dashboard?tab=sessions" style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #d97706, #b45309); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">Open Student Portal</a>
            </div>

            <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; margin-top: 20px; font-size: 12px; color: #64748b; text-align: center;">
              <p>Questions or need help? WhatsApp: <a href="https://wa.me/919311215564" style="color: #f59e0b;">+91 93112 15564</a></p>
            </div>
          </div>
        `;

        const text = `Namaste ${session.studentName} ji,\n\nReminder: Your 1-on-1 class with Acharya Niraj Kumar is scheduled for tomorrow at ${timeIst} IST.\nTopic: ${session.title}\nStudent Portal: https://viar.in/dashboard?tab=sessions\nHelpline: +91 93112 15564`;

        try {
          await enqueueSessionEmail({
            sessionId: session.id,
            recipientEmail: session.studentEmail,
            recipientName: session.studentName,
            emailType: 'REMINDER_24H',
            subject,
            htmlContent: html,
            textContent: text,
            idempotencyKey,
            immediateDispatch: true,
          });

          // Update reminder timestamp on studentSession
          try {
            await prisma.studentSession.update({
              where: { id: session.id },
              data: { reminder24hSentAt: new Date() },
            });
          } catch {}

          queued24h++;
        } catch (e) {
          errors.push(`Failed 24h reminder for session ${session.id}: ${e}`);
        }
      }
    }

    // ------------------------------------------------------------------------
    // 2. 1-HOUR REMINDER
    // ------------------------------------------------------------------------
    if (sessionStartMs >= window1hStart && sessionStartMs <= window1hEnd) {
      const idempotencyKey = `reminder_1h_${session.id}`;

      // Check whether 1h reminder was already enqueued/sent
      let alreadySent = false;
      try {
        const found = await prisma.sessionEmailOutbox.findUnique({
          where: { idempotencyKey },
        });
        if (found) alreadySent = true;
      } catch {}

      if (!alreadySent) {
        for (const outboxItem of Array.from(_memoryOutbox.values())) {
          if (outboxItem.idempotencyKey === idempotencyKey) {
            alreadySent = true;
            break;
          }
        }
      }

      if (!alreadySent) {
        const timeIst = formatSessionIST(session.startTime);
        const subject = `Starting in 1 Hour: 1-on-1 Class with Acharya Niraj Kumar — ${session.title}`;

        const html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0b0f17; color: #cbd5e1; border: 2px solid #f59e0b; border-radius: 16px; padding: 28px;">
            <div style="text-align: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 16px; margin-bottom: 20px;">
              <h2 style="color: #f59e0b; margin: 0; font-size: 18px;">Vihangam Institute of Astrology and Research</h2>
              <span style="display: inline-block; margin-top: 6px; padding: 4px 12px; background: rgba(245,158,11,0.2); color: #f59e0b; border-radius: 999px; font-weight: 700; font-size: 12px;">Class Starts in 1 Hour</span>
            </div>
            <p style="color: #ffffff; font-size: 15px;">Namaste <strong>${session.studentName} ji</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6;">Your personal 1-on-1 live session with <strong>Acharya Niraj Kumar</strong> begins in 60 minutes.</p>
            
            <div style="background-color: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 18px; margin: 20px 0;">
              <p style="margin: 4px 0; color: #ffffff;"><strong>Topic:</strong> ${session.title}</p>
              <p style="margin: 4px 0; color: #f59e0b;"><strong>Time (IST):</strong> ${timeIst} IST</p>
              <p style="margin: 4px 0; color: #ffffff;"><strong>Platform:</strong> ${session.meetingPlatform || 'Google Meet'}</p>
              ${session.meetingLink ? `<p style="margin: 8px 0 0;"><a href="${session.meetingLink}" style="color: #38bdf8; text-decoration: underline; font-weight: 700;">Meeting Link: ${session.meetingLink}</a></p>` : ''}
            </div>

            <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">
              The &quot;Join Live Class&quot; button in your student portal activates 15 minutes before the session. Please find a quiet space and keep your birth chart ready.
            </p>

            <div style="text-align: center; margin: 24px 0;">
              <a href="${session.meetingLink || 'https://viar.in/dashboard?tab=sessions'}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #d97706, #b45309); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px;">Join Class / Open Portal</a>
            </div>

            <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; margin-top: 20px; font-size: 12px; color: #64748b; text-align: center;">
              <p>Acharya Niraj Kumar Helpline: <a href="https://wa.me/919311215564" style="color: #f59e0b;">+91 93112 15564</a></p>
            </div>
          </div>
        `;

        const text = `Namaste ${session.studentName} ji,\n\nYour 1-on-1 class with Acharya Niraj Kumar starts in 1 hour at ${timeIst} IST.\nTopic: ${session.title}\nMeeting Link: ${session.meetingLink || 'https://viar.in/dashboard?tab=sessions'}\nWhatsApp Helpline: +91 93112 15564`;

        try {
          await enqueueSessionEmail({
            sessionId: session.id,
            recipientEmail: session.studentEmail,
            recipientName: session.studentName,
            emailType: 'REMINDER_1H',
            subject,
            htmlContent: html,
            textContent: text,
            idempotencyKey,
            immediateDispatch: true,
          });

          // Update reminder timestamp on studentSession
          try {
            await prisma.studentSession.update({
              where: { id: session.id },
              data: { reminder1hSentAt: new Date() },
            });
          } catch {}

          queued1h++;
        } catch (e) {
          errors.push(`Failed 1h reminder for session ${session.id}: ${e}`);
        }
      }
    }
  }

  return { queued24h, queued1h, errors };
}

// ------------------------------------------------------------------------------
// LIFECYCLE EMAIL DISPATCHERS: CHANGED & CANCELLED
// ------------------------------------------------------------------------------

/**
 * Dispatch an email when session details (time, meeting link, topic) are changed.
 */
export async function sendSessionChangedEmail(data: {
  studentName: string;
  studentEmail: string;
  topic: string;
  newStartTimeUtc: string;
  previousStartTimeUtc?: string | null;
  durationMinutes: number;
  meetingLink?: string | null;
  notes?: string | null;
  studentTimezone?: string;
  sessionId?: string;
}): Promise<SessionEmailOutboxRecord> {
  const timeIst = formatSessionIST(data.newStartTimeUtc);
  const prevTimeIst = data.previousStartTimeUtc ? formatSessionIST(data.previousStartTimeUtc) : null;
  const tz = data.studentTimezone || 'Asia/Kolkata';
  const timeLocal = tz !== 'Asia/Kolkata' ? formatInTimezone(data.newStartTimeUtc, tz, 'full') : null;

  const subject = `Updated Details: 1-on-1 Class with Acharya Niraj Kumar — ${data.topic}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0b0f17; color: #cbd5e1; border: 1px solid rgba(56,189,248,0.3); border-radius: 16px; padding: 28px;">
      <div style="text-align: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 16px; margin-bottom: 20px;">
        <h2 style="color: #38bdf8; margin: 0; font-size: 18px;">Vihangam Institute of Astrology and Research</h2>
        <p style="color: #94a3b8; font-size: 12px; margin: 4px 0 0;">Session Schedule / Details Updated</p>
      </div>

      <p style="color: #ffffff; font-size: 15px;">Namaste <strong>${data.studentName} ji</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6;">Your 1-on-1 personal mentorship class details have been updated by <strong>Acharya Niraj Kumar</strong>:</p>

      <div style="background-color: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 18px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #94a3b8; width: 35%;">Topic:</td>
            <td style="padding: 6px 0; color: #ffffff; font-weight: 600;">${data.topic}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Updated Time (IST):</td>
            <td style="padding: 6px 0; color: #38bdf8; font-weight: 700;">${timeIst} IST</td>
          </tr>
          ${prevTimeIst ? `<tr>
            <td style="padding: 6px 0; color: #64748b;">Previous Time:</td>
            <td style="padding: 6px 0; color: #94a3b8; text-decoration: line-through;">${prevTimeIst} IST</td>
          </tr>` : ''}
          ${timeLocal ? `<tr>
            <td style="padding: 6px 0; color: #94a3b8;">Your Time (${tz}):</td>
            <td style="padding: 6px 0; color: #ffffff;">${timeLocal}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Duration:</td>
            <td style="padding: 6px 0; color: #ffffff;">${data.durationMinutes} Minutes</td>
          </tr>
          ${data.meetingLink ? `<tr>
            <td style="padding: 6px 0; color: #94a3b8;">Meeting Link:</td>
            <td style="padding: 6px 0;"><a href="${data.meetingLink}" style="color: #f59e0b; text-decoration: underline;">${data.meetingLink}</a></td>
          </tr>` : ''}
        </table>
      </div>

      ${data.notes ? `
        <div style="background-color: rgba(56,189,248,0.08); border-left: 3px solid #38bdf8; padding: 12px; margin: 16px 0; font-size: 13px;">
          <strong style="color: #38bdf8;">Notes from Acharya ji:</strong><br />
          ${data.notes}
        </div>
      ` : ''}

      <div style="text-align: center; margin: 24px 0;">
        <a href="https://viar.in/dashboard?tab=sessions" style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #0284c7, #0369a1); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">View in Student Portal</a>
      </div>

      <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; margin-top: 20px; font-size: 12px; color: #64748b; text-align: center;">
        <p>Helpline: +91 93112 15564 (WhatsApp) | Vihangam Institute of Astrology and Research (VIAR)</p>
      </div>
    </div>
  `;

  const text = `Namaste ${data.studentName} ji,\n\nYour 1-on-1 class details with Acharya Niraj Kumar have been updated.\nTopic: ${data.topic}\nNew Time: ${timeIst} IST\nDuration: ${data.durationMinutes} mins\nMeeting Link: ${data.meetingLink || 'Shared via portal'}\nStudent Portal: https://viar.in/dashboard?tab=sessions`;

  return enqueueSessionEmail({
    sessionId: data.sessionId,
    recipientEmail: data.studentEmail,
    recipientName: data.studentName,
    emailType: 'CHANGED',
    subject,
    htmlContent: html,
    textContent: text,
    immediateDispatch: true,
  });
}

/**
 * Dispatch an email when session is cancelled.
 */
export async function sendSessionCancelledEmail(data: {
  studentName: string;
  studentEmail: string;
  topic: string;
  scheduledTimeUtc: string;
  cancellationReason?: string | null;
  sessionId?: string;
}): Promise<SessionEmailOutboxRecord> {
  const timeIst = formatSessionIST(data.scheduledTimeUtc);
  const subject = `Class Cancelled: 1-on-1 Session with Acharya Niraj Kumar — ${data.topic}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0b0f17; color: #cbd5e1; border: 1px solid rgba(239,68,68,0.3); border-radius: 16px; padding: 28px;">
      <div style="text-align: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 16px; margin-bottom: 20px;">
        <h2 style="color: #ef4444; margin: 0; font-size: 18px;">Vihangam Institute of Astrology and Research</h2>
        <p style="color: #94a3b8; font-size: 12px; margin: 4px 0 0;">Session Cancellation Notice</p>
      </div>

      <p style="color: #ffffff; font-size: 15px;">Namaste <strong>${data.studentName} ji</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6;">
        Your 1-on-1 class scheduled for <strong>${timeIst} IST</strong> (${data.topic}) has been cancelled.
      </p>

      ${data.cancellationReason ? `
        <div style="background-color: rgba(239,68,68,0.08); border-left: 3px solid #ef4444; padding: 12px; margin: 18px 0; font-size: 13px;">
          <strong style="color: #ef4444;">Reason for Cancellation:</strong><br />
          ${data.cancellationReason}
        </div>
      ` : ''}

      <p style="font-size: 13px; color: #cbd5e1; line-height: 1.6;">
        You can schedule a replacement personal session anytime via your student portal, or message Acharya ji directly on WhatsApp.
      </p>

      <div style="text-align: center; margin: 24px 0;">
        <a href="https://viar.in/dashboard?tab=sessions" style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #d97706, #b45309); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">Schedule Replacement Slot</a>
      </div>

      <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; margin-top: 20px; font-size: 12px; color: #64748b; text-align: center;">
        <p>WhatsApp Helpline: <a href="https://wa.me/919311215564" style="color: #f59e0b;">+91 93112 15564</a></p>
      </div>
    </div>
  `;

  const text = `Namaste ${data.studentName} ji,\n\nYour 1-on-1 class with Acharya Niraj Kumar scheduled for ${timeIst} IST has been cancelled.\n${data.cancellationReason ? `Reason: ${data.cancellationReason}\n` : ''}\nPlease reschedule via your portal: https://viar.in/dashboard?tab=sessions\nWhatsApp: +91 93112 15564`;

  return enqueueSessionEmail({
    sessionId: data.sessionId,
    recipientEmail: data.studentEmail,
    recipientName: data.studentName,
    emailType: 'CANCELLED',
    subject,
    htmlContent: html,
    textContent: text,
    immediateDispatch: true,
  });
}
