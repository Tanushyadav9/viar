'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Clock,
  Video,
  User,
  Plus,
  Search,
  Copy,
  AlertCircle,
  MessageCircle,
  Check,
  X,
  Calendar as CalendarIcon,
  RotateCcw,
  ShieldCheck,
  Inbox,
  Send,
  RefreshCw,
  Key,
  Mail,
  Settings,
  AlertTriangle,
} from 'lucide-react';
import type { StudentSessionRecord, SessionRequestRecord, CourseSessionSettings } from '@/lib/sessions/types';
import { formatSessionIST, formatInTimezone } from '@/lib/timezones';

interface OutboxFailureItem {
  id: string;
  sessionId?: string | null;
  recipientEmail: string;
  recipientName?: string | null;
  emailType: string;
  subject: string;
  lastError?: string | null;
  attempts: number;
  maxAttempts: number;
  updatedAt: string;
}

interface StudentOption {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  timezone?: string;
  enrolledAt?: string;
  courseTitle?: string;
}

type ExtendedSession = StudentSessionRecord & {
  whatsAppShareUrl?: string;
};

// 23 Modules of the Ultimate Vedic Astrology Course for quick topic selection
import { FLAGSHIP_23_MODULES } from '@/lib/courseModules';
export { FLAGSHIP_23_MODULES };

interface SessionsManagerProps {
  initialStudentId?: string;
  initialScheduleOpen?: boolean;
  isOwner?: boolean;
}

export default function SessionsManager({
  initialStudentId,
  initialScheduleOpen = false,
  isOwner: initialIsOwner = true,
}: SessionsManagerProps) {
  // Main Navigation within Sessions
  const [activeMainTab, setActiveMainTab] = useState<'CALENDAR' | 'REQUESTS'>('CALENDAR');

  // Calendar View Mode: List vs Week View
  const [calendarViewMode, setCalendarViewMode] = useState<'LIST' | 'WEEK'>('LIST');

  // State
  const [isOwner, setIsOwner] = useState(initialIsOwner);
  const [sessions, setSessions] = useState<ExtendedSession[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [requests, setRequests] = useState<SessionRequestRecord[]>([]);
  const [courseSettings, setCourseSettings] = useState<CourseSessionSettings>({
    sessionsIncludedPerStudent: null,
    maximumActiveStudents: null,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'TODAY' | 'TOMORROW' | 'THIS_WEEK' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentFilter, setSelectedStudentFilter] = useState('ALL');

  // Secret iCal calendar feed token
  const [calendarFeedUrl, setCalendarFeedUrl] = useState<string>('');
  const [isRegeneratingToken, setIsRegeneratingToken] = useState(false);
  const [feedCopySuccess, setFeedCopySuccess] = useState(false);

  // Modals
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(initialScheduleOpen);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [selectedSessionForAttendance, setSelectedSessionForAttendance] = useState<ExtendedSession | null>(null);

  // Requests action modal
  const [activeRequestAction, setActiveRequestAction] = useState<{
    request: SessionRequestRecord;
    type: 'PROPOSE' | 'DECLINE';
  } | null>(null);
  const [proposalTimeInput, setProposalTimeInput] = useState('');
  const [requestActionNote, setRequestActionNote] = useState('');

  // Form State: Schedule
  const [formStudentId, setFormStudentId] = useState(initialStudentId || '');
  const [formTopicMode, setFormTopicMode] = useState<'MODULE' | 'CUSTOM'>('MODULE');
  const [formSelectedModule, setFormSelectedModule] = useState(FLAGSHIP_23_MODULES[0]);
  const [formCustomTitle, setFormCustomTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('16:00');
  const [formDuration, setFormDuration] = useState(60);
  const [formPlatform, setFormPlatform] = useState('GOOGLE_MEET');
  const [formLink, setFormLink] = useState('https://meet.google.com/new');
  const [formSharedNotes, setFormSharedNotes] = useState('Please have your natal birth details and chart ready.');
  const [formPrivateNotes, setFormPrivateNotes] = useState('');
  const [formRepeatWeekly, setFormRepeatWeekly] = useState(false);
  const [formRepeatWeeks, setFormRepeatWeeks] = useState(8);
  const [formAllowOutsideWorkingHours, setFormAllowOutsideWorkingHours] = useState(false);

  // Submission & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clashError, setClashError] = useState<string | null>(null);
  const [workingHoursWarning, setWorkingHoursWarning] = useState<string | null>(null);
  const [scheduleSuccessResult, setScheduleSuccessResult] = useState<{
    countCreated: number;
    whatsAppShareUrl: string;
    studentName: string;
    title: string;
  } | null>(null);

  // Attendance & Taught Form
  const [attStatus, setAttStatus] = useState<'COMPLETED' | 'MISSED' | 'CANCELLED'>('COMPLETED');
  const [attPrivateNotes, setAttPrivateNotes] = useState('');
  const [attSharedNotes, setAttSharedNotes] = useState('');
  const [attHomework, setAttHomework] = useState('');
  const [attRecordingUrl, setAttRecordingUrl] = useState('');

  // Expanded cards state & clipboard
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Outbox Failures State
  const [outboxFailures, setOutboxFailures] = useState<OutboxFailureItem[]>([]);
  const [showOutboxModal, setShowOutboxModal] = useState(false);
  const [retryingEmailId, setRetryingEmailId] = useState<string | null>(null);
  const [outboxActionMessage, setOutboxActionMessage] = useState<string | null>(null);

  // Course Policies & Reschedule Notice State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsNoticeHours, setSettingsNoticeHours] = useState(24);
  const [settingsIncludedCount, setSettingsIncludedCount] = useState<number | ''>('');
  const [settingsMaxStudents, setSettingsMaxStudents] = useState<number | ''>('');
  const [settingsSessionLength, setSettingsSessionLength] = useState<number>(60);
  const [settingsMeetingPlatform, setSettingsMeetingPlatform] = useState<string>('GOOGLE_MEET');
  const [settingsWorkingHours, setSettingsWorkingHours] = useState<Array<{
    dayOfWeek: number;
    dayName: string;
    startTime: string;
    endTime: string;
    isEnabled: boolean;
  }>>([
    { dayOfWeek: 0, dayName: 'Sunday', startTime: '10:00', endTime: '19:00', isEnabled: false },
    { dayOfWeek: 1, dayName: 'Monday', startTime: '10:00', endTime: '19:00', isEnabled: true },
    { dayOfWeek: 2, dayName: 'Tuesday', startTime: '10:00', endTime: '19:00', isEnabled: true },
    { dayOfWeek: 3, dayName: 'Wednesday', startTime: '10:00', endTime: '19:00', isEnabled: true },
    { dayOfWeek: 4, dayName: 'Thursday', startTime: '10:00', endTime: '19:00', isEnabled: true },
    { dayOfWeek: 5, dayName: 'Friday', startTime: '10:00', endTime: '19:00', isEnabled: true },
    { dayOfWeek: 6, dayName: 'Saturday', startTime: '10:00', endTime: '19:00', isEnabled: true },
  ]);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSaveSuccess, setSettingsSaveSuccess] = useState(false);

  // Fetch Data
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      // 1. Sessions & Students
      const res = await fetch('/api/admin/sessions');
      if (res.ok) {
        const data = await res.json();
        if (typeof data.isOwner === 'boolean') {
          setIsOwner(data.isOwner);
        }
        setSessions(data.sessions || []);
        setStudents(data.students || []);
        if (data.courseSettings) {
          setCourseSettings(data.courseSettings);
          setSettingsNoticeHours(data.courseSettings.minimumRescheduleNoticeHours ?? 24);
          setSettingsIncludedCount(data.courseSettings.sessionsIncludedPerStudent ?? '');
          setSettingsMaxStudents(data.courseSettings.maximumActiveStudents ?? '');
          setSettingsSessionLength(data.courseSettings.defaultSessionDurationMinutes ?? 60);
          setSettingsMeetingPlatform(data.courseSettings.defaultMeetingPlatform ?? 'GOOGLE_MEET');
          if (Array.isArray(data.courseSettings.workingHours) && data.courseSettings.workingHours.length > 0) {
            setSettingsWorkingHours(data.courseSettings.workingHours.map((wh: {
              dayOfWeek: number;
              dayName?: string;
              startTime: string;
              endTime: string;
              isEnabled: boolean;
            }) => ({
              dayOfWeek: wh.dayOfWeek,
              dayName: wh.dayName || ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][wh.dayOfWeek],
              startTime: wh.startTime,
              endTime: wh.endTime,
              isEnabled: wh.isEnabled,
            })));
          }
        }
        if (data.students?.length > 0 && !formStudentId) {
          setFormStudentId(data.students[0].id);
        }
      }

      // 2. Requests
      const reqRes = await fetch('/api/admin/sessions/requests');
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setRequests(reqData.requests || []);
      }

      // 3. Calendar Feed Token
      const feedRes = await fetch('/api/admin/sessions/calendar-feed');
      if (feedRes.ok) {
        const feedData = await feedRes.json();
        setCalendarFeedUrl(feedData.feedUrl || '');
      }

      // 4. Outbox Failures
      const outboxRes = await fetch('/api/admin/sessions/outbox/failures');
      if (outboxRes.ok) {
        const outboxData = await outboxRes.json();
        setOutboxFailures(outboxData.failures || []);
      }
    } catch {
      // offline / test fallback
    } finally {
      setIsLoading(false);
    }
  }, [formStudentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Selected student object for schedule modal
  const selectedStudentObj = useMemo(() => {
    return students.find((s) => s.id === formStudentId) || null;
  }, [students, formStudentId]);

  const studentTz = selectedStudentObj?.timezone || 'Asia/Kolkata';

  // Compute local time for student preview
  const scheduledTimePreview = useMemo(() => {
    if (!formDate || !formTime) return null;
    const dateObj = new Date(`${formDate}T${formTime}:00+05:30`);
    if (isNaN(dateObj.getTime())) return null;

    const istTime = dateObj.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });

    const studentTime =
      studentTz !== 'Asia/Kolkata'
        ? dateObj.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: studentTz,
            timeZoneName: 'short',
          })
        : null;

    return {
      istTime,
      studentTime,
    };
  }, [formDate, formTime, studentTz]);

  // Quick Time preset helper
  const setQuickTime = (type: 'TODAY_4PM' | 'TOMORROW_11AM' | 'TOMORROW_4PM' | 'TOMORROW_6PM') => {
    const d = new Date();
    if (type === 'TODAY_4PM') {
      setFormDate(d.toISOString().split('T')[0]);
      setFormTime('16:00');
    } else {
      d.setDate(d.getDate() + 1);
      setFormDate(d.toISOString().split('T')[0]);
      if (type === 'TOMORROW_11AM') setFormTime('11:00');
      if (type === 'TOMORROW_4PM') setFormTime('16:00');
      if (type === 'TOMORROW_6PM') setFormTime('18:00');
    }
  };

  const handleOpenScheduleModal = (prefillStudentId?: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setFormDate(tomorrow.toISOString().split('T')[0]);
    setFormTime('16:00');
    if (prefillStudentId) {
      setFormStudentId(prefillStudentId);
    }
    setFormTopicMode('MODULE');
    setFormSelectedModule(FLAGSHIP_23_MODULES[0]);
    setFormCustomTitle('');
    setFormDuration(courseSettings.defaultSessionDurationMinutes || 60);
    setFormPlatform(courseSettings.defaultMeetingPlatform || 'GOOGLE_MEET');
    setFormLink(
      (courseSettings.defaultMeetingPlatform || 'GOOGLE_MEET') === 'WHATSAPP_CALL'
        ? 'WhatsApp Video Call'
        : (courseSettings.defaultMeetingPlatform || 'GOOGLE_MEET') === 'ZOOM'
        ? 'https://zoom.us/j/your-meeting-id'
        : 'https://meet.google.com/new'
    );
    setFormSharedNotes('Please have your birth chart ready. Revise basic planetary significators.');
    setFormPrivateNotes('');
    setFormRepeatWeekly(false);
    setFormRepeatWeeks(8);
    setFormAllowOutsideWorkingHours(false);
    setClashError(null);
    setWorkingHoursWarning(null);
    setScheduleSuccessResult(null);
    setIsScheduleModalOpen(true);
  };

  // Schedule Session Submit
  const handleScheduleSubmit = async (e?: React.FormEvent, forceOverrideWorkingHours = false) => {
    if (e) e.preventDefault();

    if (!formStudentId || !formDate || !formTime) {
      setClashError('Please fill in student, date, and time.');
      return;
    }

    const finalTitle = formTopicMode === 'MODULE' ? formSelectedModule : formCustomTitle.trim();
    if (!finalTitle) {
      setClashError('Please specify the topic or select a module.');
      return;
    }

    try {
      setIsSubmitting(true);
      setClashError(null);
      setWorkingHoursWarning(null);

      // Stored in UTC (ISO 8601) calculated from input IST (+05:30)
      const scheduledAtIso = `${formDate}T${formTime}:00+05:30`;

      const payload = {
        studentId: formStudentId,
        studentName: selectedStudentObj?.name,
        studentEmail: selectedStudentObj?.email,
        studentPhone: selectedStudentObj?.phone,
        studentTimezone: studentTz,
        title: finalTitle,
        scheduledAt: scheduledAtIso,
        durationMinutes: formDuration,
        meetingPlatform: formPlatform,
        meetingLink: formLink,
        sharedNotes: formSharedNotes,
        privateNotes: formPrivateNotes,
        repeatWeeklyCount: formRepeatWeekly ? formRepeatWeeks : 1,
        allowOutsideWorkingHours: forceOverrideWorkingHours || formAllowOutsideWorkingHours,
      };

      const res = await fetch('/api/admin/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 && data.isClash) {
          // Clash Protection: Server refused overlapping session
          setClashError(data.error || 'Schedule Conflict: Overlaps another student session.');
          return;
        }
        if (res.status === 422 && data.requiresConfirmation) {
          // Outside Working Hours: Requires Owner confirmation
          setWorkingHoursWarning(data.error || 'Outside working hours.');
          return;
        }
        throw new Error(data.error || 'Failed to schedule session');
      }

      await fetchData();

      setScheduleSuccessResult({
        countCreated: data.countCreated || 1,
        whatsAppShareUrl: data.session?.whatsAppShareUrl || '',
        studentName: selectedStudentObj?.name || 'Student',
        title: finalTitle,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating session';
      setClashError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Attendance & Post-Class Modal
  const handleOpenAttendanceModal = (session: ExtendedSession) => {
    setSelectedSessionForAttendance(session);
    setAttStatus(session.status === 'CANCELLED' ? 'CANCELLED' : session.status === 'MISSED' ? 'MISSED' : 'COMPLETED');
    setAttPrivateNotes(session.privateNotes || '');
    setAttSharedNotes(session.sharedNotes || '');
    setAttHomework(session.homework || '');
    setAttRecordingUrl(session.recordingUrl || '');
    setIsAttendanceModalOpen(true);
  };

  // Save Attendance & Post-Class Notes
  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionForAttendance) return;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/admin/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedSessionForAttendance.id,
          status: attStatus,
          privateNotes: attPrivateNotes,
          sharedNotes: attSharedNotes,
          homework: attHomework,
          recordingUrl: attRecordingUrl,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update session record');
      }

      await fetchData();
      setIsAttendanceModalOpen(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error updating session');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Requests: One-click actions
  const handleScheduleFromRequest = (req: SessionRequestRecord) => {
    handleOpenScheduleModal(req.studentId);
    if (req.preferredWindows && req.preferredWindows.length > 0) {
      const firstWin = req.preferredWindows[0];
      const winDate = new Date(firstWin.startUtc);
      if (!isNaN(winDate.getTime())) {
        const istDate = winDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        const istTime = winDate.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });
        setFormDate(istDate);
        setFormTime(istTime);
      }
    }
    if (req.message) {
      setFormSharedNotes(`Student Request: "${req.message}"`);
    }
  };

  const handleExecuteRequestAction = async () => {
    if (!activeRequestAction) return;

    try {
      setIsSubmitting(true);
      const { request, type } = activeRequestAction;

      const payload = {
        action: type,
        studentEmail: request.studentEmail,
        studentName: request.studentName,
        proposedTimeText: proposalTimeInput,
        note: requestActionNote,
        reason: requestActionNote,
      };

      const res = await fetch(`/api/admin/sessions/requests/${request.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update request');
      }

      await fetchData();
      setActiveRequestAction(null);
      setProposalTimeInput('');
      setRequestActionNote('');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error processing request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calendar feed token regeneration
  const handleRegenerateFeedToken = async () => {
    if (!confirm('Are you sure you want to regenerate your private calendar feed token? Your old Google Calendar subscription URL will stop receiving updates.')) {
      return;
    }

    try {
      setIsRegeneratingToken(true);
      const res = await fetch('/api/admin/sessions/calendar-feed', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setCalendarFeedUrl(data.feedUrl || '');
        alert('Secret calendar subscription feed URL regenerated successfully.');
      }
    } catch {
      alert('Error regenerating calendar token.');
    } finally {
      setIsRegeneratingToken(false);
    }
  };

  const handleCopyFeedUrl = () => {
    if (!calendarFeedUrl) return;
    navigator.clipboard.writeText(calendarFeedUrl);
    setFeedCopySuccess(true);
    setTimeout(() => setFeedCopySuccess(false), 2500);
  };

  const handleCopyLink = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  // Filtering Sessions
  const filteredSessions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
    const tomorrowStr = tomorrow.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    // Week boundaries in IST
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    return sessions.filter((s) => {
      if (selectedStudentFilter !== 'ALL' && s.studentId !== selectedStudentFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          s.title.toLowerCase().includes(q) ||
          s.studentName.toLowerCase().includes(q) ||
          s.studentEmail.toLowerCase().includes(q);
        if (!matches) return false;
      }

      const sDateObj = new Date(s.startTime);
      const sDateStr = sDateObj.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

      if (activeFilter === 'TODAY') {
        return sDateStr === todayStr && s.status !== 'CANCELLED';
      }
      if (activeFilter === 'TOMORROW') {
        return sDateStr === tomorrowStr && s.status !== 'CANCELLED';
      }
      if (activeFilter === 'THIS_WEEK') {
        return sDateObj >= startOfWeek && sDateObj < endOfWeek && s.status !== 'CANCELLED';
      }
      if (activeFilter === 'COMPLETED') {
        return s.status === 'COMPLETED';
      }

      return true;
    });
  }, [sessions, selectedStudentFilter, searchQuery, activeFilter]);

  // Pending requests count
  const pendingRequestsCount = useMemo(() => {
    return requests.filter((r) => r.status === 'PENDING').length;
  }, [requests]);

  // Grouped sessions for Week View (Monday to Sunday)
  const weekGroupedSessions = useMemo(() => {
    const days: Record<string, ExtendedSession[]> = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    };

    filteredSessions.forEach((s) => {
      const d = new Date(s.startTime);
      const dayName = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', weekday: 'long' }).format(d);
      if (days[dayName]) {
        days[dayName].push(s);
      }
    });

    return days;
  }, [filteredSessions]);

  // Outbox Retry Handler
  const handleRetryOutboxEmail = async (emailId: string) => {
    setRetryingEmailId(emailId);
    setOutboxActionMessage(null);
    try {
      const res = await fetch('/api/admin/sessions/outbox/failures/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOutboxActionMessage('Delivery retry dispatched successfully!');
        fetchData();
      } else {
        setOutboxActionMessage(data.error || 'Retry failed');
      }
    } catch {
      setOutboxActionMessage('Failed to trigger retry');
    } finally {
      setRetryingEmailId(null);
    }
  };

  // Save Course Policy Settings Handler
  const handleSaveCourseSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsSaveSuccess(false);
    try {
      const res = await fetch('/api/admin/sessions/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionsIncludedPerStudent: settingsIncludedCount === '' ? null : Number(settingsIncludedCount),
          maximumActiveStudents: settingsMaxStudents === '' ? null : Number(settingsMaxStudents),
          minimumRescheduleNoticeHours: Number(settingsNoticeHours) || 24,
          defaultSessionDurationMinutes: Number(settingsSessionLength) || 60,
          defaultMeetingPlatform: settingsMeetingPlatform || 'GOOGLE_MEET',
          workingHours: settingsWorkingHours,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCourseSettings(data.settings);
        setSettingsSaveSuccess(true);
        setTimeout(() => {
          setShowSettingsModal(false);
          setSettingsSaveSuccess(false);
        }, 1200);
      }
    } catch {} finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Navigation & Mode Toggles */}
      <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-white/10 bg-gradient-to-r from-[#0d121f] via-[#111728] to-[#0d121f]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-amber-400" />
                <span>Sessions & Personal Live Classes</span>
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-300 font-hindi">व्यक्तिगत लाइव ज्योतिष कक्षाएं</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
              <span>1-on-1 Mentorship & Sessions Console</span>
              {isLoading && <span className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Manage 1-on-1 personal classes, calendar sync, and clash protection for your students. Schedule weekly classes, answer student requests, and export your private calendar feed.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isOwner && (
              <button
                onClick={() => handleOpenScheduleModal()}
                className="gold-button px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule a session</span>
              </button>
            )}

            {isOwner && (
              <button
                onClick={() => setShowSettingsModal(true)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Session Policies</span>
              </button>
            )}

            <button
              onClick={() => setShowOutboxModal(true)}
              className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                outboxFailures.length > 0
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
              }`}
            >
              <Mail className="w-4 h-4 text-amber-400" />
              <span>Email Outbox</span>
              {outboxFailures.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                  {outboxFailures.length} failed
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Staff View Only Notice */}
        {!isOwner && (
          <div className="mt-4 p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center gap-3 text-xs text-blue-200">
            <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <p className="font-semibold text-blue-100">Staff View Mode</p>
              <p className="text-blue-300/90 text-[11px] mt-0.5">
                You have permission to view 1-on-1 sessions and requests. Only the Site Owner (Acharya Niraj Kumar) has authorization to create, change, or cancel sessions.
              </p>
            </div>
          </div>
        )}

        {/* Outbox Failures Alert Banner */}
        {outboxFailures.length > 0 && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2 text-rose-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>
                <strong>{outboxFailures.length} email delivery attempt(s) failed</strong> in the transactional outbox.
              </span>
            </div>
            <button
              onClick={() => setShowOutboxModal(true)}
              className="px-3 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition"
            >
              Review Failures &amp; Retry
            </button>
          </div>
        )}

        {/* Optional Course Settings: Sessions Included per Student (Shown ONLY when set!) */}
        {courseSettings.sessionsIncludedPerStudent !== null &&
          courseSettings.sessionsIncludedPerStudent !== undefined &&
          courseSettings.sessionsIncludedPerStudent > 0 && (
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-2 text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Course Policy:</span>
                <strong className="text-white">
                  {courseSettings.sessionsIncludedPerStudent} 1-on-1 sessions included per enrolled student
                </strong>
              </span>
              {courseSettings.maximumActiveStudents !== null && (
                <span className="text-slate-400">
                  Maximum Active Students Capacity:{' '}
                  <strong className="text-amber-300">{courseSettings.maximumActiveStudents}</strong>
                </span>
              )}
            </div>
          )}

        {/* Primary Tabs: Calendar vs Requests Inbox */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10">
          <button
            onClick={() => setActiveMainTab('CALENDAR')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeMainTab === 'CALENDAR'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Sessions Calendar ({sessions.length})</span>
          </button>

          <button
            onClick={() => setActiveMainTab('REQUESTS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 relative ${
              activeMainTab === 'REQUESTS'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Requests Inbox</span>
            {pendingRequestsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                {pendingRequestsCount} Waiting
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. TAB: CALENDAR */}
      {activeMainTab === 'CALENDAR' && (
        <div className="space-y-6">
          {/* Controls: Views, Filters, Student Filter, Search */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* View Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
              {(
                [
                  { id: 'ALL', label: 'All Sessions' },
                  { id: 'TODAY', label: 'Today' },
                  { id: 'TOMORROW', label: 'Tomorrow' },
                  { id: 'THIS_WEEK', label: 'This Week' },
                  { id: 'COMPLETED', label: 'Completed' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition ${
                    activeFilter === f.id
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-500/40'
                      : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search Bar */}
              <div className="relative w-44 sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="Search topic or student..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Filter by Student */}
              <div className="relative">
                <select
                  value={selectedStudentFilter}
                  onChange={(e) => setSelectedStudentFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="ALL" className="bg-slate-900 text-white">
                    Filter by Student: All ({students.length})
                  </option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id} className="bg-slate-900 text-white">
                      {st.name} ({st.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* View Mode Toggle: List vs Week */}
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
                <button
                  onClick={() => setCalendarViewMode('LIST')}
                  className={`px-3 py-1 rounded-lg font-semibold transition ${
                    calendarViewMode === 'LIST'
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  List View
                </button>
                <button
                  onClick={() => setCalendarViewMode('WEEK')}
                  className={`px-3 py-1 rounded-lg font-semibold transition ${
                    calendarViewMode === 'WEEK'
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Week View
                </button>
              </div>
            </div>
          </div>

          {/* Private iCal Subscription Box for Google Calendar (Owner Only) */}
          {isOwner && (
            <div className="cosmic-card p-4 sm:p-5 rounded-2xl border border-white/10 bg-slate-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Private iCal Calendar Feed (Secret Link)
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300">
                      Google Calendar Sync
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">
                    Add this secret URL to your Google Calendar or iPhone to automatically see all student live classes. Treat this link as a secret password.
                  </p>
                  <code className="text-[11px] text-amber-300 font-mono block mt-2 truncate max-w-md sm:max-w-xl bg-black/40 px-2 py-1 rounded border border-white/5">
                    {calendarFeedUrl || 'Loading calendar feed URL...'}
                  </code>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopyFeedUrl}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/10 transition flex items-center gap-1.5"
                >
                  {feedCopySuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{feedCopySuccess ? 'URL Copied!' : 'Copy Feed Link'}</span>
                </button>

                <button
                  onClick={handleRegenerateFeedToken}
                  disabled={isRegeneratingToken}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition flex items-center gap-1.5"
                  title="Invalidate current URL and generate a new secret token"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingToken ? 'animate-spin' : ''}`} />
                  <span>Regenerate URL</span>
                </button>
              </div>
            </div>
          )}

          {/* LIST VIEW */}
          {calendarViewMode === 'LIST' && (
            <div className="space-y-4">
              {filteredSessions.length === 0 ? (
                <div className="cosmic-card p-12 text-center text-slate-500 rounded-2xl border border-white/10 space-y-3">
                  <CalendarIcon className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm font-semibold text-slate-400">No sessions match the selected filter</p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Try changing the student filter or click &quot;Schedule a session&quot; to create a new 1-on-1 class.
                  </p>
                  <button
                    onClick={() => handleOpenScheduleModal()}
                    className="gold-button px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Schedule 1-on-1 Class</span>
                  </button>
                </div>
              ) : (
                filteredSessions.map((s) => {
                  const timeIst = formatSessionIST(s.startTime);
                  const st = students.find((x) => x.id === s.studentId);
                  const stTz = st?.timezone || 'Asia/Kolkata';
                  const timeLocal =
                    stTz !== 'Asia/Kolkata' ? formatInTimezone(s.startTime, stTz, 'full') : null;

                  return (
                    <div
                      key={s.id}
                      className="cosmic-card p-5 rounded-2xl border border-white/10 hover:border-amber-500/30 transition space-y-3 bg-slate-900/40"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-base">{s.title}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                s.status === 'COMPLETED'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : s.status === 'MISSED'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : s.status === 'CANCELLED'
                                  ? 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {s.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                            <span className="text-amber-300 font-bold flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {timeIst} (IST)
                            </span>
                            {timeLocal && (
                              <span className="text-sky-300 font-mono text-[11px]">
                                ({timeLocal} in {stTz})
                              </span>
                            )}
                            <span className="text-slate-500">• {s.duration} mins</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-white font-medium flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-purple-400" />
                              {s.studentName} ({s.studentEmail})
                            </span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {s.whatsAppShareUrl && (
                            <a
                              href={s.whatsAppShareUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition flex items-center gap-1"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>Message on WhatsApp</span>
                            </a>
                          )}

                          <button
                            onClick={() => handleOpenAttendanceModal(s)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/10 transition"
                          >
                            Attendance & Notes
                          </button>

                          {/* Missed session: Reschedule in 1 Click */}
                          {s.status === 'MISSED' && (
                            <button
                              onClick={() => handleOpenScheduleModal(s.studentId)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reschedule in 1 Click</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Class Join Link */}
                      {s.meetingLink && (
                        <div className="flex items-center gap-2 text-xs bg-slate-950/60 p-2.5 rounded-xl border border-white/5">
                          <span className="text-slate-400">Class Link:</span>
                          <a
                            href={s.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-amber-400 hover:underline font-mono truncate max-w-sm sm:max-w-md"
                          >
                            {s.meetingLink}
                          </a>
                          <button
                            onClick={() => handleCopyLink(s.meetingLink!, s.id)}
                            className="p-1 rounded text-slate-400 hover:text-white transition ml-auto"
                            title="Copy link"
                          >
                            {copiedLink === s.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}

                      {/* Notes / Homework / Private Notes preview */}
                      {(s.sharedNotes || s.homework || s.privateNotes) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                          {s.sharedNotes && (
                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                                Shared Notes / Syllabus Covered
                              </span>
                              <p className="text-slate-300 whitespace-pre-wrap">{s.sharedNotes}</p>
                            </div>
                          )}
                          {s.homework && (
                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                              <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">
                                Assigned Homework & Charts
                              </span>
                              <p className="text-slate-300 whitespace-pre-wrap">{s.homework}</p>
                            </div>
                          )}
                          {s.privateNotes && (
                            <div className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/20 sm:col-span-2">
                              <div className="flex items-center gap-1.5 text-rose-300 font-bold text-[10px] uppercase mb-1">
                                <ShieldCheck className="w-3 h-3" />
                                <span>Private Notes (Owner Only)</span>
                              </div>
                              <p className="text-slate-300 whitespace-pre-wrap">{s.privateNotes}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* WEEK VIEW */}
          {calendarViewMode === 'WEEK' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3">
              {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const).map(
                (dayName) => {
                  const daySessions = weekGroupedSessions[dayName] || [];

                  return (
                    <div
                      key={dayName}
                      className="cosmic-card p-3 rounded-2xl border border-white/10 bg-slate-900/50 flex flex-col min-h-[220px]"
                    >
                      <div className="pb-2 border-b border-white/10 flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{dayName}</span>
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-slate-400">
                          {daySessions.length}
                        </span>
                      </div>

                      <div className="space-y-2 pt-2 flex-1">
                        {daySessions.length === 0 ? (
                          <div className="text-center py-6 text-slate-600 text-[11px] italic">
                            No classes
                          </div>
                        ) : (
                          daySessions.map((s) => {
                            const timeIst = new Date(s.startTime).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                              timeZone: 'Asia/Kolkata',
                            });

                            return (
                              <div
                                key={s.id}
                                onClick={() => handleOpenAttendanceModal(s)}
                                className="p-2 rounded-xl bg-white/5 border border-white/5 hover:border-amber-400/50 transition cursor-pointer text-xs space-y-1"
                              >
                                <span className="text-amber-300 font-bold block text-[11px]">
                                  {timeIst} IST
                                </span>
                                <p className="font-semibold text-white truncate text-[11px]" title={s.title}>
                                  {s.title}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate">{s.studentName}</p>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. TAB: REQUESTS INBOX */}
      {activeMainTab === 'REQUESTS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">
              Student Session Requests ({requests.length})
            </h3>
            <span className="text-xs text-slate-400">
              Students request personal time windows or reschedules directly from their portal.
            </span>
          </div>

          {requests.length === 0 ? (
            <div className="cosmic-card p-12 text-center text-slate-500 rounded-2xl border border-white/10 space-y-2">
              <Inbox className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-400">No session requests in inbox</p>
              <p className="text-xs text-slate-500">
                When students request a 1-on-1 session or propose a reschedule, it will appear here for 1-click scheduling.
              </p>
            </div>
          ) : (
            requests.map((r) => (
              <div
                key={r.id}
                className="cosmic-card p-5 rounded-2xl border border-white/10 hover:border-amber-500/20 transition space-y-3 bg-slate-900/40"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-base">
                        {r.requestType === 'RESCHEDULE' ? 'Reschedule Request' : 'New Session Request'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'ACCEPTED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : r.status === 'DECLINED'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-1">
                      From: <strong className="text-white">{r.studentName}</strong> ({r.studentEmail})
                    </p>
                  </div>

                  {/* 3 One-Click Actions (Active when PENDING) */}
                  {r.status === 'PENDING' && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleScheduleFromRequest(r)}
                        className="gold-button px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1"
                      >
                        <CalendarIcon className="w-3.5 h-3.5" />
                        <span>Schedule from this request</span>
                      </button>

                      <button
                        onClick={() => setActiveRequestAction({ request: r, type: 'PROPOSE' })}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 transition flex items-center gap-1"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Propose another time</span>
                      </button>

                      <button
                        onClick={() => setActiveRequestAction({ request: r, type: 'DECLINE' })}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Message / Reason */}
                {r.message && (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-300">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                      Student Message / Reason:
                    </span>
                    <p>{r.message}</p>
                  </div>
                )}

                {/* Preferred Time Windows */}
                {r.preferredWindows && r.preferredWindows.length > 0 && (
                  <div className="space-y-1 text-xs">
                    <span className="text-[10px] uppercase font-bold text-amber-400 block">
                      Preferred Time Windows (2-3 Slots Selected by Student):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      {r.preferredWindows.map((win, idx) => {
                        const winStart = formatSessionIST(win.startUtc);
                        return (
                          <div
                            key={idx}
                            className="p-2 rounded-xl bg-black/40 border border-white/10 text-[11px] text-slate-300"
                          >
                            <span className="font-bold text-amber-300 block">Slot #{idx + 1}</span>
                            <span>{win.label || winStart} (IST)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. MODAL: SCHEDULE SESSION */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="cosmic-card w-full max-w-2xl p-6 sm:p-8 rounded-3xl border border-white/20 bg-slate-950 space-y-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Schedule 1-on-1 Class</h3>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success View with Ready WhatsApp Button */}
            {scheduleSuccessResult ? (
              <div className="space-y-4 py-4 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
                  <Check className="w-7 h-7" />
                </div>
                <h4 className="text-xl font-bold text-white">Session Successfully Scheduled!</h4>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  {scheduleSuccessResult.countCreated > 1
                    ? `${scheduleSuccessResult.countCreated} weekly sessions have been added to the calendar.`
                    : 'The class is confirmed. A transactional confirmation email has been sent to the student.'}
                </p>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  {scheduleSuccessResult.whatsAppShareUrl && (
                    <a
                      href={scheduleSuccessResult.whatsAppShareUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-lg shadow-emerald-600/30"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Message on WhatsApp</span>
                    </a>
                  )}

                  <button
                    onClick={() => {
                      setIsScheduleModalOpen(false);
                      setScheduleSuccessResult(null);
                    }}
                    className="gold-button px-5 py-2.5 rounded-xl text-xs font-bold"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => handleScheduleSubmit(e)} className="space-y-4 text-xs">
                {/* Clash Error Alert */}
                {clashError && (
                  <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-white">Clash Protection Alert:</strong>
                      <p>{clashError}</p>
                    </div>
                  </div>
                )}

                {/* Working Hours Warning with Confirm Anyway */}
                {workingHoursWarning && (
                  <div className="p-3.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 space-y-2">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-white">Outside Working Hours Notice:</strong>
                        <p>{workingHoursWarning}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleScheduleSubmit(undefined, true)}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition"
                    >
                      Confirm & Schedule Anyway
                    </button>
                  </div>
                )}

                {/* 1. Student Selector */}
                <div>
                  <label className="text-slate-300 font-bold block mb-1.5">
                    Select Student / Enrolled Student:
                  </label>
                  <select
                    value={formStudentId}
                    onChange={(e) => setFormStudentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  >
                    {students.map((st) => (
                      <option key={st.id} value={st.id} className="bg-slate-900 text-white">
                        {st.name} ({st.email}) {st.timezone ? `• ${st.timezone}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Topic Selector: Pick Module or Custom */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-300 font-bold">Topic for this Class:</label>
                    <div className="flex items-center gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setFormTopicMode('MODULE')}
                        className={`px-2 py-0.5 rounded font-semibold ${
                          formTopicMode === 'MODULE' ? 'bg-amber-400 text-slate-950' : 'text-slate-400'
                        }`}
                      >
                        Pick 23-Module
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormTopicMode('CUSTOM')}
                        className={`px-2 py-0.5 rounded font-semibold ${
                          formTopicMode === 'CUSTOM' ? 'bg-amber-400 text-slate-950' : 'text-slate-400'
                        }`}
                      >
                        Custom Topic
                      </button>
                    </div>
                  </div>

                  {formTopicMode === 'MODULE' ? (
                    <select
                      value={formSelectedModule}
                      onChange={(e) => setFormSelectedModule(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                    >
                      {FLAGSHIP_23_MODULES.map((mod, idx) => (
                        <option key={idx} value={mod} className="bg-slate-900 text-white">
                          {mod}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. Navamsha D9 Chart Reading & Career Consultation"
                      value={formCustomTitle}
                      onChange={(e) => setFormCustomTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                    />
                  )}
                </div>

                {/* 3. Date & Time Picker with dual IST + Student Timezone live preview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Class Date:</label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Class Time (IST):</label>
                    <input
                      type="time"
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Dual Timezone Live Preview Card */}
                {scheduledTimePreview && (
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-between text-xs">
                    <span className="text-amber-300 font-bold">
                      🇮🇳 Time in IST: {scheduledTimePreview.istTime}
                    </span>
                    {scheduledTimePreview.studentTime ? (
                      <span className="text-sky-300 font-mono">
                        Student Time ({studentTz}): {scheduledTimePreview.studentTime}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Student is in India Standard Time</span>
                    )}
                  </div>
                )}

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-400">Quick presets:</span>
                  <button
                    type="button"
                    onClick={() => setQuickTime('TODAY_4PM')}
                    className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-[10px]"
                  >
                    Today 4 PM
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickTime('TOMORROW_11AM')}
                    className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-[10px]"
                  >
                    Tomorrow 11 AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickTime('TOMORROW_4PM')}
                    className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-[10px]"
                  >
                    Tomorrow 4 PM
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickTime('TOMORROW_6PM')}
                    className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-[10px]"
                  >
                    Tomorrow 6 PM
                  </button>
                </div>

                {/* 4. Duration & Meeting Link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Duration:</label>
                    <select
                      value={formDuration}
                      onChange={(e) => setFormDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value={30} className="bg-slate-900">30 Minutes</option>
                      <option value={45} className="bg-slate-900">45 Minutes</option>
                      <option value={60} className="bg-slate-900">60 Minutes (Standard)</option>
                      <option value={90} className="bg-slate-900">90 Minutes</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Meeting Platform:</label>
                    <select
                      value={formPlatform}
                      onChange={(e) => setFormPlatform(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="GOOGLE_MEET" className="bg-slate-900">Google Meet</option>
                      <option value="ZOOM" className="bg-slate-900">Zoom Meeting</option>
                      <option value="WHATSAPP_CALL" className="bg-slate-900">WhatsApp Video Call</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Meeting Link:</label>
                  <input
                    type="text"
                    value={formLink}
                    onChange={(e) => setFormLink(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* 5. Repeat Weekly Option */}
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formRepeatWeekly}
                      onChange={(e) => setFormRepeatWeekly(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-400 bg-white/5 border-white/20"
                    />
                    <span className="font-bold text-white text-xs">
                      Repeat weekly (create a scheduled set of classes)
                    </span>
                  </label>

                  {formRepeatWeekly && (
                    <div className="pl-6 space-y-2 pt-1">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-300">Repeat for:</span>
                        <select
                          value={formRepeatWeeks}
                          onChange={(e) => setFormRepeatWeeks(Number(e.target.value))}
                          className="px-3 py-1 rounded-lg bg-slate-900 border border-white/20 text-amber-300 font-bold text-xs"
                        >
                          <option value={2}>2 weeks (2 classes)</option>
                          <option value={4}>4 weeks (4 classes)</option>
                          <option value={6}>6 weeks (6 classes)</option>
                          <option value={8}>8 weeks (8 classes - Recommended)</option>
                          <option value={12}>12 weeks (12 classes)</option>
                        </select>
                      </div>
                      <p className="text-[11px] text-amber-300/80">
                        Notice: Each class is created as an independent session in the database. Editing or cancelling one never modifies the others.
                      </p>
                    </div>
                  )}
                </div>

                {/* 6. Note for Student & Private Notes */}
                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    Note for Student (included in email & WhatsApp message):
                  </label>
                  <textarea
                    rows={2}
                    value={formSharedNotes}
                    onChange={(e) => setFormSharedNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">
                    Private Notes for Acharya Niraj Kumar (strictly private, student never sees):
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Needs extra practice on Dasha calculation. Astrological aptitude high."
                    value={formPrivateNotes}
                    onChange={(e) => setFormPrivateNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-rose-500/5 border border-rose-500/20 text-white focus:outline-none focus:border-rose-400"
                  />
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsScheduleModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="gold-button px-5 py-2.5 rounded-xl font-bold flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <span>Validating & Scheduling...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Schedule & Send Email</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 5. MODAL: ATTENDANCE & POST-CLASS SUMMARY */}
      {isAttendanceModalOpen && selectedSessionForAttendance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="cosmic-card w-full max-w-xl p-6 sm:p-8 rounded-3xl border border-white/20 bg-slate-950 space-y-5 my-8 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-base font-bold text-white">
                  Post-Class Attendance & Notes
                </h3>
                <p className="text-slate-400 text-[11px]">
                  {selectedSessionForAttendance.title} with {selectedSessionForAttendance.studentName}
                </p>
              </div>
              <button
                onClick={() => setIsAttendanceModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAttendance} className="space-y-4">
              {/* Status Radio Group */}
              <div>
                <label className="text-slate-300 font-bold block mb-1.5">Class Status:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['COMPLETED', 'MISSED', 'CANCELLED'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setAttStatus(st)}
                      className={`p-2.5 rounded-xl border text-center font-bold transition ${
                        attStatus === st
                          ? st === 'COMPLETED'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : st === 'MISSED'
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                            : 'bg-slate-500/20 border-slate-400 text-slate-300'
                          : 'bg-white/5 border-white/10 text-slate-400'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shared Notes (What was taught) */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Shared Notes & Summary (Visible to Student):
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Covered Navamsha Lagna calculation, D9 house placements, and chart interpretation rules."
                  value={attSharedNotes}
                  onChange={(e) => setAttSharedNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Homework */}
              <div>
                <label className="text-amber-300 font-bold block mb-1">
                  Assigned Homework / Chart Analysis (Visible to Student):
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Analyze 3 sample kundlis for Gajakesari Yoga and calculate D9 Lagna for each."
                  value={attHomework}
                  onChange={(e) => setAttHomework(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Private Notes strictly for Owner */}
              <div>
                <label className="text-rose-300 font-bold block mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Private Observations (Strictly for Acharya Niraj Kumar):</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Student grasped Kendras quickly. Struggled with retrograde planetary aspects."
                  value={attPrivateNotes}
                  onChange={(e) => setAttPrivateNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-rose-500/5 border border-rose-500/20 text-white focus:outline-none focus:border-rose-400"
                />
              </div>

              {/* Recording URL */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Class Recording URL (Google Drive, Zoom Cloud, or YouTube Unlisted):
                </label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/..."
                  value={attRecordingUrl}
                  onChange={(e) => setAttRecordingUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAttendanceModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="gold-button px-5 py-2 rounded-xl font-bold"
                >
                  {isSubmitting ? 'Saving Record...' : 'Save Attendance Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: PROPOSE OR DECLINE REQUEST */}
      {activeRequestAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="cosmic-card w-full max-w-md p-6 rounded-3xl border border-white/20 bg-slate-950 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold text-white">
                {activeRequestAction.type === 'PROPOSE' ? 'Propose Alternate Time' : 'Decline Session Request'}
              </h3>
              <button
                onClick={() => setActiveRequestAction(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-300">
              For student: <strong className="text-white">{activeRequestAction.request.studentName}</strong>
            </p>

            {activeRequestAction.type === 'PROPOSE' ? (
              <div className="space-y-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Proposed Alternate Slot:</label>
                  <input
                    type="text"
                    placeholder="e.g. Thursday at 5:00 PM IST or Saturday 11:00 AM IST"
                    value={proposalTimeInput}
                    onChange={(e) => setProposalTimeInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Note for Student:</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Thursday works best for an in-depth chart reading."
                    value={requestActionNote}
                    onChange={(e) => setRequestActionNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="text-slate-300 font-bold block mb-1">Reason for Declining:</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Fully booked this week. Please propose a date next week."
                  value={requestActionNote}
                  onChange={(e) => setRequestActionNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveRequestAction(null)}
                className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRequestAction}
                disabled={isSubmitting}
                className="gold-button px-4 py-1.5 rounded-xl font-bold"
              >
                {isSubmitting ? 'Sending...' : 'Confirm & Email Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------ */}
      {/* MODAL 5: EMAIL OUTBOX FAILURES & MANUAL RETRY                           */}
      {/* ------------------------------------------------------------------------ */}
      {showOutboxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-white/10 p-6 sm:p-7 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-bold text-white">Transactional Email Outbox</h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Automatic retry queue and delivery status for scheduled sessions, schedule adjustments, cancellations, and 24h / 1h pre-class reminders.
                </p>
              </div>
              <button
                onClick={() => setShowOutboxModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {outboxActionMessage && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
                <span>{outboxActionMessage}</span>
                <button
                  onClick={() => setOutboxActionMessage(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {outboxFailures.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-2">
                <Check className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">All Emails Delivered Successfully</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  There are no failed email dispatches. Scheduled confirmations, update notices, cancellations, and pre-class reminders are delivering without errors.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                <p className="text-xs font-semibold text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{outboxFailures.length} failed delivery attempt(s) requiring attention:</span>
                </p>

                <div className="space-y-2.5">
                  {outboxFailures.map((failure) => (
                    <div
                      key={failure.id}
                      className="p-4 rounded-2xl bg-slate-950 border border-rose-500/30 space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              {failure.emailType}
                            </span>
                            <span className="text-xs font-bold text-white">
                              {failure.recipientEmail}
                            </span>
                            {failure.recipientName && (
                              <span className="text-xs text-slate-400">({failure.recipientName})</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 font-semibold mt-1">
                            {failure.subject}
                          </p>
                        </div>

                        <button
                          onClick={() => handleRetryOutboxEmail(failure.id)}
                          disabled={retryingEmailId === failure.id}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 self-start sm:self-center transition disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${retryingEmailId === failure.id ? 'animate-spin' : ''}`} />
                          <span>{retryingEmailId === failure.id ? 'Retrying...' : 'Retry Now'}</span>
                        </button>
                      </div>

                      <div className="text-[11px] text-slate-400 space-y-1">
                        {failure.lastError && (
                          <p className="text-rose-400 font-mono text-[10px] bg-rose-950/40 p-2 rounded border border-rose-900/30">
                            Error: {failure.lastError}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-slate-500 text-[10px]">
                          <span>Attempts exhausted: {failure.attempts} / {failure.maxAttempts}</span>
                          <span>Last attempted: {new Date(failure.updatedAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
              <span className="text-[11px] text-slate-500">
                Processed every 15 minutes by GitHub Actions workflow
              </span>
              <button
                type="button"
                onClick={() => setShowOutboxModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------ */}
      {/* MODAL 6: COURSE POLICIES & RESCHEDULE NOTICE PERIOD                     */}
      {/* ------------------------------------------------------------------------ */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-white/10 p-6 sm:p-7 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-bold text-white">1-on-1 Session Policies</h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Configure reschedule advance notice periods and optional per-student included session counts.
                </p>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {settingsSaveSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                <Check className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-xs font-bold text-emerald-300">Session policies updated successfully!</p>
              </div>
            ) : (
              <form onSubmit={handleSaveCourseSettings} className="space-y-4 text-xs">
                {/* 1. Reschedule Notice Period */}
                <div className="space-y-1">
                  <label className="font-bold text-white flex items-center justify-between">
                    <span>Reschedule Notice Period (Hours)</span>
                    <span className="text-[10px] text-amber-400 font-normal">Default: 24 Hours</span>
                  </label>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Students must submit online reschedule requests at least this many hours in advance of the session. Within this window, they are directed to contact Acharya ji on WhatsApp.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="number"
                      min={1}
                      max={168}
                      value={settingsNoticeHours}
                      onChange={(e) => setSettingsNoticeHours(Number(e.target.value))}
                      required
                      className="w-32 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm focus:outline-none focus:border-amber-400"
                    />
                    <span className="text-xs text-slate-300 font-medium">Hours before class</span>
                  </div>
                </div>

                {/* 2. Optional Sessions Included */}
                <div className="space-y-1 pt-3 border-t border-white/10">
                  <label className="font-bold text-white flex items-center justify-between">
                    <span>Sessions Included Per Student</span>
                    <span className="text-[10px] text-slate-400 font-normal">Optional / Empty by default</span>
                  </label>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Leave blank to hide quota counters. If set, students and admins will see usage progress (e.g. &quot;2 of 5 sessions used&quot;).
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="number"
                      min={1}
                      placeholder="e.g. 5 (or leave empty)"
                      value={settingsIncludedCount}
                      onChange={(e) => setSettingsIncludedCount(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-48 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => setSettingsIncludedCount('')}
                      className="text-[11px] text-slate-400 hover:text-white"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* 3. Maximum Active Students Capacity */}
                <div className="space-y-1 pt-3 border-t border-white/10">
                  <label className="font-bold text-white flex items-center justify-between">
                    <span>Maximum Active Students Capacity</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {settingsMaxStudents === '' ? 'Currently: Unlimited' : `Cap: ${settingsMaxStudents} Students`}
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Set a real limit on concurrent active 1-on-1 students to prevent overload. Leave empty for no hard limit.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="number"
                      min={1}
                      max={500}
                      placeholder="e.g. 25 (or leave empty)"
                      value={settingsMaxStudents}
                      onChange={(e) => setSettingsMaxStudents(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-48 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => setSettingsMaxStudents('')}
                      className="text-[11px] text-slate-400 hover:text-white"
                    >
                      Clear Limit
                    </button>
                  </div>
                </div>

                {/* 4. Usual Session Length */}
                <div className="space-y-2 pt-3 border-t border-white/10">
                  <label className="font-bold text-white flex items-center justify-between">
                    <span>Usual Session Length</span>
                    <span className="text-[10px] text-amber-400 font-normal">{settingsSessionLength} Minutes Default</span>
                  </label>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Standard duration pre-filled when scheduling new 1-on-1 classes.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {[30, 45, 60, 90, 120].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setSettingsSessionLength(mins)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                          settingsSessionLength === mins
                            ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold'
                            : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                        }`}
                      >
                        {mins} Mins
                      </button>
                    ))}
                    <div className="flex items-center gap-1.5 ml-2">
                      <input
                        type="number"
                        min={15}
                        max={240}
                        step={5}
                        value={settingsSessionLength}
                        onChange={(e) => setSettingsSessionLength(Number(e.target.value))}
                        className="w-24 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                      />
                      <span className="text-slate-400 text-xs">minutes</span>
                    </div>
                  </div>
                </div>

                {/* 5. Default Meeting Platform */}
                <div className="space-y-2 pt-3 border-t border-white/10">
                  <label className="font-bold text-white flex items-center justify-between">
                    <span>Default Live Meeting Platform</span>
                    <span className="text-[10px] text-amber-400 font-normal">
                      {settingsMeetingPlatform === 'GOOGLE_MEET' ? 'Google Meet' : settingsMeetingPlatform === 'ZOOM' ? 'Zoom' : 'WhatsApp Call'}
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Preferred platform pre-selected when creating live sessions.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    {[
                      { id: 'GOOGLE_MEET', title: 'Google Meet', desc: 'Web link, 0 install' },
                      { id: 'ZOOM', title: 'Zoom', desc: 'Meeting ID & passcode' },
                      { id: 'WHATSAPP_CALL', title: 'WhatsApp Call', desc: 'Direct phone video call' },
                    ].map((plat) => (
                      <button
                        key={plat.id}
                        type="button"
                        onClick={() => setSettingsMeetingPlatform(plat.id)}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          settingsMeetingPlatform === plat.id
                            ? 'bg-amber-500/10 border-amber-500/50 text-white'
                            : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-0.5">
                          <span className="font-bold text-xs">{plat.title}</span>
                          {settingsMeetingPlatform === plat.id && (
                            <Check className="w-3.5 h-3.5 text-amber-400" />
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block">{plat.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 6. Weekly Working Hours (Asia/Kolkata) */}
                <div className="space-y-2 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-white flex items-center gap-1.5">
                      <span>Weekly Working Hours (Asia/Kolkata)</span>
                    </label>
                    <span className="text-[10px] text-slate-400">IST Timezone</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Available teaching days & time slots for clash detection and booking warnings.
                  </p>
                  <div className="space-y-1.5 pt-1 bg-black/30 p-2.5 rounded-2xl border border-white/5">
                    {settingsWorkingHours.map((day, idx) => (
                      <div key={day.dayOfWeek} className="flex items-center justify-between gap-2 py-1 border-b border-white/5 last:border-0 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer w-28">
                          <input
                            type="checkbox"
                            checked={day.isEnabled}
                            onChange={(e) => {
                              const updated = [...settingsWorkingHours];
                              updated[idx] = { ...updated[idx], isEnabled: e.target.checked };
                              setSettingsWorkingHours(updated);
                            }}
                            className="rounded border-white/20 text-amber-400 focus:ring-amber-400"
                          />
                          <span className={day.isEnabled ? 'text-white font-semibold' : 'text-slate-500 line-through'}>
                            {day.dayName}
                          </span>
                        </label>

                        {day.isEnabled ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="time"
                              value={day.startTime}
                              onChange={(e) => {
                                const updated = [...settingsWorkingHours];
                                updated[idx] = { ...updated[idx], startTime: e.target.value };
                                setSettingsWorkingHours(updated);
                              }}
                              className="px-2 py-0.5 rounded-lg bg-white/10 border border-white/10 text-white font-mono text-xs"
                            />
                            <span className="text-slate-500 text-[10px]">to</span>
                            <input
                              type="time"
                              value={day.endTime}
                              onChange={(e) => {
                                const updated = [...settingsWorkingHours];
                                updated[idx] = { ...updated[idx], endTime: e.target.value };
                                setSettingsWorkingHours(updated);
                              }}
                              className="px-2 py-0.5 rounded-lg bg-white/10 border border-white/10 text-white font-mono text-xs"
                            />
                            <span className="text-[10px] text-slate-400">IST</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Day Off (No Classes)</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="gold-button px-5 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-lg"
                  >
                    <span>{isSavingSettings ? 'Saving...' : 'Save Policies'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
