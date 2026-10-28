'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Video,
  Clock,
  Calendar,
  ExternalLink,
  CheckCircle2,
  Lock,
  MessageCircle,
  Play,
  FileText,
  ChevronDown,
  ChevronUp,
  Download,
} from 'lucide-react';
import {
  formatInTimezone,
  formatSessionIST,
  generateGoogleCalendarUrl,
} from '@/lib/timezones';
import {
  computeLiveClassJoinWindow,
  type LiveClassButtonState,
} from '@/lib/courses/liveClassJoinWindow';

interface StudentSessionItem {
  id: string;
  title: string;
  startTime: string;
  duration: number;
  meetingLink: string | null;
  meetingPlatform: string;
  status: string;
  sharedNotes: string | null;
  homework: string | null;
  recordingUrl: string | null;
  documentUrl?: string | null;
  notesPdf?: string | null;
  courseTitle?: string | null;
  moduleTitle?: string | null;
  lessonTitle?: string | null;
  attendedLive?: boolean;
  watchedRecording?: boolean;
  isWindowOpen?: boolean;
  canJoin?: boolean;
  hasEnded?: boolean;
  buttonState?: LiveClassButtonState;
  buttonLabelEn?: string;
  buttonLabelHi?: string;
  startsInFormattedEn?: string;
  startsInFormattedHi?: string;
  revealMinutesBefore?: number;
}

export default function StudentPersonalSessions() {
  const [userTz, setUserTz] = useState<string>('Asia/Kolkata');
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [accessReason, setAccessReason] = useState<string>('');
  const [isRevoked, setIsRevoked] = useState(false);
  const [revealMinutesBefore, setRevealMinutesBefore] = useState<number>(30);

  const [nextSession, setNextSession] = useState<StudentSessionItem | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<StudentSessionItem[]>([]);
  const [pastSessions, setPastSessions] = useState<StudentSessionItem[]>([]);
  const [expandedNotesId, setExpandedNotesId] = useState<string | null>(null);
  const [watchedSessionIds, setWatchedSessionIds] = useState<Set<string>>(new Set());

  // Ticker for live countdown updates (every 15 seconds)
  const [, setTick] = useState(0);

  useEffect(() => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) setUserTz(detected);
    } catch {}

    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Fetch live classes and timetable from API
  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/student/sessions');
      const data = await res.json();

      if (res.status === 401 || res.status === 403) {
        setIsEnrolled(false);
        setIsRevoked(data?.reason === 'Revoked');
        setAccessReason(data?.error || data?.reason || '');
        return;
      }

      if (data?.enrolled) {
        setIsEnrolled(true);
        if (data.timezone) setUserTz(data.timezone);
        if (data.revealMinutesBefore) setRevealMinutesBefore(data.revealMinutesBefore);
        setNextSession(data.nextSession || null);
        setUpcomingSessions(data.upcomingSessions || []);
        setPastSessions(data.pastSessions || []);
      } else {
        setIsEnrolled(false);
      }
    } catch (err) {
      console.warn('Failed to fetch class sessions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Mark session recording watched (watching recording counts the same as attending)
  const handleWatchRecording = async (session: StudentSessionItem) => {
    if (!session.recordingUrl) return;
    setWatchedSessionIds((prev) => new Set(prev).add(session.id));

    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classSessionId: session.id,
          completed: true,
          watched: true,
        }),
      });
    } catch (e) {
      console.warn('Could not record watch progress:', e);
    }

    window.open(session.recordingUrl, '_blank', 'noopener,noreferrer');
  };

  // Helper: Trigger native .ics download
  const handleDownloadIcs = (session: StudentSessionItem) => {
    window.open(`/api/student/sessions/${session.id}/calendar.ics`, '_blank');
  };

  // ----------------------------------------------------------------------------
  // Helper: Render the 4 explicit join button states
  // 1. "Starts in…" (countdown when outside reveal window)
  // 2. "Join now" (active clickable button with meeting link when window is open and class is live/starting)
  // 3. "Class ended: recording coming soon" (after class has ended and recording is not yet uploaded)
  // 4. "Watch recording" (clickable button when recording URL is present)
  // ----------------------------------------------------------------------------
  const renderJoinButton = (session: StudentSessionItem, isCompact = false) => {
    const windowStatus = computeLiveClassJoinWindow({
      startTime: session.startTime,
      durationMinutes: session.duration || 60,
      recordingUrl: session.recordingUrl,
      revealMinutesBefore: session.revealMinutesBefore || revealMinutesBefore || 30,
    });

    const state = session.buttonState || windowStatus.buttonState;

    if (state === 'WATCH_RECORDING') {
      return (
        <button
          onClick={() => handleWatchRecording(session)}
          className={`gold-button font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition ${
            isCompact ? 'px-4 py-2 rounded-xl' : 'px-6 py-3 rounded-xl'
          }`}
        >
          <Play className="w-4 h-4" />
          <span>Watch recording</span>
        </button>
      );
    }

    if (state === 'CLASS_ENDED') {
      return (
        <div
          className={`rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-center ${
            isCompact ? 'px-3 py-1.5' : 'px-4 py-2.5 space-y-0.5'
          }`}
        >
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Class ended: recording coming soon
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-hindi block">
            कक्षा समाप्त: रिकॉर्डिंग जल्द उपलब्ध होगी
          </span>
        </div>
      );
    }

    if (state === 'JOIN_NOW' && session.meetingLink) {
      return (
        <a
          href={session.meetingLink}
          target="_blank"
          rel="noopener noreferrer"
          className={`gold-button font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-amber-900/40 animate-pulse ${
            isCompact ? 'px-4 py-2 rounded-xl' : 'px-6 py-3 rounded-xl'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>Join now</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      );
    }

    // Default: STARTS_IN (outside reveal window)
    return (
      <div
        className={`rounded-xl bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/30 text-center ${
          isCompact ? 'px-3 py-1.5' : 'px-4 py-2 space-y-0.5'
        }`}
      >
        <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block">
          {windowStatus.buttonLabelEn || 'Starts in…'}
        </span>
        <span className="text-[10px] text-slate-600 dark:text-slate-400 block">
          Join link reveals {windowStatus.revealMinutesBefore}m before start
        </span>
      </div>
    );
  };

  // ----------------------------------------------------------------------------
  // Gating States: Unapproved, Revoked, or Non-Enrolled
  // ----------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="p-8 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-center space-y-3">
        <div className="w-8 h-8 mx-auto border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
          Loading course live classes and timetable...
        </p>
      </div>
    );
  }

  if (!isEnrolled) {
    if (isRevoked) {
      return (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900/90 border border-rose-500/30 text-center space-y-4 max-w-xl mx-auto shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-500 dark:text-rose-400">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Access Ended</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Your enrollment has ended or access has been revoked. If you believe this is in error or wish to restore your access, please connect with us directly.
            </p>
          </div>
          <a
            href="https://wa.me/919311215564?text=Namaste%20Acharya%20ji%2C%20my%20course%20access%20ended%20and%20I%20would%20like%20to%20restore%20my%20course%20enrollment."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg shadow-emerald-900/40"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Contact on WhatsApp</span>
          </a>
        </div>
      );
    }

    return (
      <div className="p-8 rounded-3xl bg-white dark:bg-slate-900/90 border border-amber-500/30 text-center space-y-4 max-w-xl mx-auto shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-500 dark:text-amber-400">
          <Lock className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Enrollment Approval Required</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Course live classes, meeting links, and the session timetable are visible only to approved enrolled students of{' '}
            <strong className="text-amber-700 dark:text-amber-300">The Ultimate Astrology Course: Foundations to Chart Mastery</strong>.
          </p>
          {accessReason && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1">
              Status: {accessReason}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/courses/what-is-astrology"
            className="gold-button px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg"
          >
            View Flagship Course &amp; Enroll
          </Link>
          <a
            href="https://wa.me/919311215564?text=Namaste%20Acharya%20ji%2C%20I%20am%20inquiring%20about%20admission%20and%20enrolment%20verification."
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-semibold transition flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>Inquire on WhatsApp</span>
          </a>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------------
  // Active Enrolled Student View
  // ----------------------------------------------------------------------------
  return (
    <div className="space-y-8">
      {/* 1. Header & Timezone Notification */}
      <div className="p-6 rounded-3xl cosmic-card border border-amber-500/30 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/40 dark:from-amber-500/10 dark:via-slate-900 dark:to-slate-900 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                Live Interactive Classes &amp; Timetable
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-600 dark:text-slate-300 font-hindi">लाइव ज्योतिष कक्षाएं एवं समय सारणी</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Course Live Classes &amp; Recordings
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Attend interactive group classes conducted by Acharya Niraj Kumar or watch full session recordings. Attending live or watching the recording counts equally towards your course completion.
            </p>
            <div className="pt-1 flex items-center gap-2 text-[11px] text-amber-700 dark:text-amber-300/90 font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>Times rendered in your local timezone: <strong>{userTz}</strong> (IST provided on schedule)</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/dashboard?tab=schedule"
              className="gold-button px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-900/20 transition"
            >
              <Play className="w-4 h-4" />
              <span>Curriculum Modules</span>
            </Link>
            <a
              href="https://wa.me/919311215564?text=Namaste%20Acharya%20ji%2C%20I%20am%20messaging%20regarding%20the%20Vedic%20Astrology%20live%20class."
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-300 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2 transition"
            >
              <MessageCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span>Admissions Desk</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. THE NEXT LIVE CLASS (Featured Next Class or Polished Branded Notice) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Video className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>Next Live Class (अगली लाइव कक्षा)</span>
          </h3>
          {nextSession && (
            <span className="text-[11px] font-semibold text-emerald-500 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Confirmed on Schedule</span>
            </span>
          )}
        </div>

        {!nextSession ? (
          /* ZERO grey placeholder panels: clean, branded cosmic card */
          <div className="p-8 sm:p-10 rounded-3xl cosmic-card border-2 border-amber-500/30 bg-gradient-to-br from-white via-amber-50/30 to-amber-100/20 dark:from-slate-900 dark:via-slate-900/90 dark:to-amber-950/20 text-center space-y-4 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
              <Calendar className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                No live class scheduled yet.
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-hindi">
                अभी कोई लाइव कक्षा निर्धारित नहीं है।
              </p>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed pt-1">
                Interactive live classes with Acharya Niraj Kumar will appear here as soon as scheduled. All approved students attend together with one meeting link. In the meantime, you can study all 23 self-paced video modules in the curriculum tab.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/dashboard?tab=schedule"
                className="gold-button inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition shadow-md shadow-amber-500/20"
              >
                <Play className="w-4 h-4" />
                <span>Go to Video Modules</span>
              </Link>
            </div>
          </div>
        ) : (
          (() => {
            const timeLocal = formatInTimezone(nextSession.startTime, userTz);
            const timeIst = formatSessionIST(nextSession.startTime);

            return (
              <div className="p-6 sm:p-7 rounded-3xl cosmic-card border-2 border-amber-500/50 bg-gradient-to-br from-white via-amber-50/40 to-amber-100/30 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20 shadow-2xl space-y-5">
                {/* Header Row */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                        Cohort Live Class
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        Duration: {nextSession.duration || 60} minutes
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Platform: {nextSession.meetingPlatform || 'Google Meet'}
                      </span>
                    </div>

                    <h4 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                      {nextSession.title}
                    </h4>

                    {/* Dual Timezone Badge: Student Local Time and IST */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-700 dark:text-amber-300">
                        <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                        <span>Your Time ({userTz}): {timeLocal}</span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium px-1">
                        IST: {timeIst}
                      </div>
                    </div>
                  </div>

                  {/* Actions: 4 Explicit Join Button States & Calendar */}
                  <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-2.5 shrink-0 pt-2 md:pt-0">
                    {renderJoinButton(nextSession)}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadIcs(nextSession)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold transition flex items-center gap-1.5"
                        title="Add to calendar (.ics download)"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Add to calendar</span>
                      </button>

                      <a
                        href={generateGoogleCalendarUrl(
                          `VIAR Live Class: ${nextSession.title}`,
                          `Vedic Astrology interactive live class with Acharya Niraj Kumar.\nAgenda: ${nextSession.sharedNotes || 'Live interactive class'}`,
                          nextSession.meetingLink || 'Google Meet',
                          nextSession.startTime,
                          nextSession.duration || 60
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-white/10 text-[11px] font-medium transition"
                        title="Add to Google Calendar"
                      >
                        <span>Google Cal</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Class Notes / Preparation Agenda (Appears immediately when scheduled) */}
                {nextSession.sharedNotes && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/5 dark:bg-black/30 border border-amber-500/20 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                    <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> Class Agenda &amp; Preparation:
                    </span>
                    <p className="leading-relaxed whitespace-pre-line pl-5">{nextSession.sharedNotes}</p>
                  </div>
                )}

                {/* Optional Handouts / PDF download */}
                {nextSession.notesPdf && (
                  <div className="pt-1 flex items-center gap-2">
                    <a
                      href={nextSession.notesPdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-300 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-500" />
                      <span>Download Class Handout (PDF)</span>
                    </a>
                  </div>
                )}
              </div>
            );
          })()
        )}
      </div>

      {/* 3. UPCOMING SESSIONS LIST */}
      {upcomingSessions.length > 1 && (
        <div className="space-y-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>Upcoming Schedule ({upcomingSessions.length - 1} further class{upcomingSessions.length - 1 === 1 ? '' : 'es'})</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingSessions.slice(1).map((s) => (
              <div
                key={s.id}
                className="p-5 rounded-2xl cosmic-card border border-slate-200 dark:border-white/10 hover:border-amber-500/30 transition space-y-3 bg-white dark:bg-slate-900/60 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                      Cohort Class
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">{s.duration || 60} mins</span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{s.title}</h4>

                  {/* Dual timezone */}
                  <div className="space-y-0.5">
                    <div className="text-xs text-amber-700 dark:text-amber-300 font-semibold">
                      {formatInTimezone(s.startTime, userTz)}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      IST: {formatSessionIST(s.startTime)}
                    </div>
                  </div>

                  {s.sharedNotes && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 pt-1 border-t border-slate-100 dark:border-white/5">
                      {s.sharedNotes}
                    </p>
                  )}
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-t border-slate-100 dark:border-white/5">
                  <div>{renderJoinButton(s, true)}</div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <button
                      onClick={() => handleDownloadIcs(s)}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold transition flex items-center gap-1"
                      title="Add to calendar (.ics download)"
                    >
                      <Calendar className="w-3 h-3" />
                      <span>Add to cal</span>
                    </button>
                    <a
                      href={generateGoogleCalendarUrl(
                        `VIAR Live Class: ${s.title}`,
                        `Vedic Astrology interactive live class with Acharya Niraj Kumar.\nAgenda: ${s.sharedNotes || 'Live interactive class'}`,
                        s.meetingLink || 'Google Meet',
                        s.startTime,
                        s.duration || 60
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-white/10 text-[10px] font-medium transition"
                      title="Google Calendar"
                    >
                      <span>Google Cal</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. PAST CLASSES & FULL SESSION RECORDINGS */}
      {pastSessions.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span>Past Classes &amp; Session Recordings ({pastSessions.length})</span>
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Watching recording counts equally as attending live
            </span>
          </div>

          <div className="space-y-3">
            {pastSessions.map((s) => {
              const isExpanded = expandedNotesId === s.id;
              const isWatched = watchedSessionIds.has(s.id) || s.watchedRecording || s.attendedLive;

              return (
                <div
                  key={s.id}
                  className="p-4 sm:p-5 rounded-2xl cosmic-card border border-slate-200 dark:border-white/10 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                          {s.attendedLive ? 'Attended Live' : isWatched ? 'Watched Recording' : 'Completed Class'}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Held on: {formatInTimezone(s.startTime, userTz)}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{s.title}</h4>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {s.recordingUrl ? (
                        <button
                          onClick={() => handleWatchRecording(s)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Watch recording</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500 dark:text-slate-400 italic">
                          Class ended: recording coming soon
                        </span>
                      )}

                      {s.sharedNotes && (
                        <button
                          onClick={() => setExpandedNotesId(isExpanded ? null : s.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                          title="View class notes"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && s.sharedNotes && (
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 space-y-1 mt-2">
                      <span className="font-bold text-amber-800 dark:text-amber-300">Class Agenda &amp; Handouts:</span>
                      <p className="leading-relaxed whitespace-pre-line">{s.sharedNotes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
