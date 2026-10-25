export type SessionStatus =
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'MISSED'
  | 'CANCELLED'
  | 'RESCHEDULE_REQUESTED';

export type SessionMeetingPlatform =
  | 'GOOGLE_MEET'
  | 'ZOOM'
  | 'WHATSAPP_CALL'
  | 'CUSTOM';

export interface OneOnOneSessionRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  courseId?: string | null;
  courseTitle?: string | null;
  title: string;
  description?: string | null;
  scheduledAt: string; // ISO String in UTC
  durationMinutes: number;
  meetingPlatform: string;
  meetingLink?: string | null;
  meetingId?: string | null;
  passcode?: string | null;
  notes?: string | null; // Pre-class instructions
  taughtRecord?: string | null; // Post-class record of what was taught
  homework?: string | null; // Assigned exercises/charts
  recordingUrl?: string | null;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface StudentSessionRecord {
  id: string;
  enrollmentId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  courseId: string;
  courseTitle?: string;
  moduleId?: string | null;
  moduleTitle?: string | null;
  lessonId?: string | null;
  lessonTitle?: string | null;
  title: string;
  startTime: string; // Stored in UTC (ISO 8601)
  duration: number; // in minutes
  meetingLink?: string | null; // Google Meet, Zoom, or "WhatsApp call"
  meetingPlatform: SessionMeetingPlatform | string;
  status: SessionStatus;
  privateNotes?: string | null; // Private notes strictly for the Owner
  sharedNotes?: string | null; // Shared notes the student can see
  homework?: string | null; // Homework the student can see
  recordingUrl?: string | null; // Optional recording URL
  createdByUserId: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PreferredTimeWindow {
  startUtc: string; // UTC ISO string
  endUtc: string;   // UTC ISO string
  label?: string;   // e.g. "Tomorrow 4:00 PM - 5:00 PM IST"
}

export interface SessionRequestRecord {
  id: string;
  enrollmentId: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  studentPhone?: string;
  courseId?: string | null;
  courseTitle?: string | null;
  studentSessionId?: string | null;
  requestType: 'INITIAL' | 'RESCHEDULE';
  message?: string | null;
  preferredWindows: PreferredTimeWindow[];
  rescheduleReason?: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
  resolvedAt?: string | null;
  resolvedByUserId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OwnerWorkingHoursRecord {
  id: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday ... 6 = Saturday
  dayName: string;
  startTime: string; // "10:00" in Asia/Kolkata
  endTime: string;   // "19:00" in Asia/Kolkata
  timezone: string;  // "Asia/Kolkata"
  slotDurationMinutes: number;
  isEnabled: boolean;
}

export interface OwnerBlockedDateRecord {
  id: string;
  blockedDate: string; // ISO String (Date only or full timestamp)
  reason?: string | null;
  isFullDay: boolean;
  startTime?: string | null; // "14:00"
  endTime?: string | null;   // "17:00"
  timezone: string;          // "Asia/Kolkata"
  createdAt: string;
}

export interface SessionHistoryLogRecord {
  id: string;
  sessionId: string;
  sessionTitle?: string;
  action:
    | 'CREATED'
    | 'RESCHEDULED'
    | 'COMPLETED'
    | 'MISSED'
    | 'CANCELLED'
    | 'NOTES_UPDATED'
    | 'REQUEST_ACCEPTED';
  actorUserId?: string | null;
  actorName?: string | null;
  previousStatus?: string | null;
  newStatus?: string | null;
  notes?: string | null;
  changeSummary?: Record<string, unknown> | null;
  createdAt: string;
}

export interface CourseSessionSettings {
  sessionsIncludedPerStudent?: number | null; // Count of sessions included, empty/null by default
  maximumActiveStudents?: number | null;      // Real maximum chosen by Owner, empty/null by default
  minimumRescheduleNoticeHours?: number | null; // Owner-configurable notice period (default 24h)
}
