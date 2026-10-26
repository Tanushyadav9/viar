'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Video,
  Clock,
  Calendar,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  PlusCircle,
  CalendarPlus,
  Send,
  X,
  Lock,
  MessageCircle,
  HelpCircle,
} from 'lucide-react';
import {
  getUserLocalTimezone,
  formatInTimezone,
  getJoinWindowStatus,
  formatSessionIST,
  generateGoogleCalendarUrl,
} from '@/lib/timezones';
import { FLAGSHIP_23_MODULES } from '@/lib/courseModules';

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
  courseTitle?: string | null;
  moduleTitle?: string | null;
  lessonTitle?: string | null;
}

interface SessionRequestItem {
  id: string;
  requestType: 'INITIAL' | 'RESCHEDULE';
  message: string | null;
  preferredWindows: Array<{ startUtc: string; endUtc: string; label?: string }>;
  rescheduleReason: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
  createdAt: string;
}

interface PreferredWindowInput {
  date: string;
  startTime: string;
  endTime: string;
}

export default function StudentPersonalSessions() {
  const [userTz, setUserTz] = useState<string>('Asia/Kolkata');
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [accessReason, setAccessReason] = useState<string>('');
  const [isRevoked, setIsRevoked] = useState(false);

  const [nextSession, setNextSession] = useState<StudentSessionItem | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<StudentSessionItem[]>([]);
  const [pastSessions, setPastSessions] = useState<StudentSessionItem[]>([]);
  const [requests, setRequests] = useState<SessionRequestItem[]>([]);

  // Ticker for join button 15-minute countdown
  const [, setTick] = useState(0);

  // Modals
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [targetRescheduleSession, setTargetRescheduleSession] = useState<StudentSessionItem | null>(null);

  // Request Form State
  const [reqTopicMode, setReqTopicMode] = useState<'MODULE' | 'CUSTOM'>('MODULE');
  const [reqSelectedModule, setReqSelectedModule] = useState<string>(FLAGSHIP_23_MODULES[0]);
  const [reqCustomTopic, setReqCustomTopic] = useState('');
  const [reqMessage, setReqMessage] = useState('');
  const [reqWindows, setReqWindows] = useState<PreferredWindowInput[]>([
    { date: '', startTime: '18:00', endTime: '19:00' },
    { date: '', startTime: '19:00', endTime: '20:00' },
  ]);
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);
  const [reqSuccessMessage, setReqSuccessMessage] = useState('');
  const [reqErrorMessage, setReqErrorMessage] = useState('');

  // Reschedule Form State
  const [reschedReason, setReschedReason] = useState('');
  const [reschedWindows, setReschedWindows] = useState<PreferredWindowInput[]>([
    { date: '', startTime: '18:00', endTime: '19:00' },
    { date: '', startTime: '19:00', endTime: '20:00' },
  ]);
  const [isSubmittingResched, setIsSubmittingResched] = useState(false);
  const [reschedSuccessMessage, setReschedSuccessMessage] = useState('');
  const [reschedErrorMessage, setReschedErrorMessage] = useState('');
  const [reschedWhatsAppUrl, setReschedWhatsAppUrl] = useState<string | null>(null);

  // Detect student timezone on mount
  useEffect(() => {
    const detectedTz = getUserLocalTimezone();
    setUserTz(detectedTz);
  }, []);

  // Periodic ticker to recalculate join window status every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/student/sessions');
      if (res.status === 401 || res.status === 403) {
        setIsEnrolled(false);
        const data = await res.json().catch(() => null);
        const reason = data?.reason || '';
        setAccessReason(reason);
        if (
          reason.toLowerCase().includes('revoked') ||
          reason.toLowerCase().includes('ended') ||
          reason.toLowerCase().includes('cancelled')
        ) {
          setIsRevoked(true);
        }
        return;
      }

      if (!res.ok) {
        setIsEnrolled(false);
        return;
      }

      const data = await res.json();
      if (data?.enrolled) {
        setIsEnrolled(true);
        setNextSession(data.nextSession || null);
        setUpcomingSessions(data.upcomingSessions || []);
        setPastSessions(data.pastSessions || []);
        setRequests(data.requests || []);
      } else {
        setIsEnrolled(false);
        setAccessReason(data?.reason || '');
      }
    } catch {
      setIsEnrolled(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Window helper: Convert local date & times into UTC strings
  const formatWindowsToUtc = (windows: PreferredWindowInput[], tz: string) => {
    return windows
      .filter((w) => w.date && w.startTime && w.endTime)
      .map((w, idx) => {
        const startLocalIso = `${w.date}T${w.startTime}:00`;
        const endLocalIso = `${w.date}T${w.endTime}:00`;
        const startUtc = new Date(startLocalIso).toISOString();
        const endUtc = new Date(endLocalIso).toISOString();
        const label = `Option ${idx + 1}: ${w.date} (${w.startTime} - ${w.endTime} ${tz})`;
        return { startUtc, endUtc, label };
      });
  };

  // Submit New Session Request
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReq(true);
    setReqErrorMessage('');
    setReqSuccessMessage('');

    try {
      const topic = reqTopicMode === 'MODULE' ? reqSelectedModule : reqCustomTopic.trim();
      if (!topic) {
        throw new Error('Please enter or select a topic for the session.');
      }

      const formattedWindows = formatWindowsToUtc(reqWindows, userTz);
      if (formattedWindows.length === 0) {
        throw new Error('Please select dates and times for at least one preferred time window.');
      }

      const res = await fetch('/api/student/sessions/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'INITIAL',
          message: `${topic}\n${reqMessage ? `\nStudent Notes: ${reqMessage}` : ''}`,
          preferredWindows: formattedWindows,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to submit session request');
      }

      setReqSuccessMessage('Your session request has been submitted to Acharya Niraj Kumar!');
      setTimeout(() => {
        setShowRequestModal(false);
        setReqSuccessMessage('');
        setReqMessage('');
        fetchSessions();
      }, 1500);
    } catch (err) {
      setReqErrorMessage(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setIsSubmittingReq(false);
    }
  };

  // Submit Reschedule Request
  const handleSubmitReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRescheduleSession) return;
    setIsSubmittingResched(true);
    setReschedErrorMessage('');
    setReschedSuccessMessage('');
    setReschedWhatsAppUrl(null);

    try {
      const formattedWindows = formatWindowsToUtc(reschedWindows, userTz);
      if (formattedWindows.length === 0) {
        throw new Error('Please provide at least one preferred time window for rescheduling.');
      }

      const res = await fetch('/api/student/sessions/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'RESCHEDULE',
          studentSessionId: targetRescheduleSession.id,
          rescheduleReason: reschedReason.trim() || 'Schedule conflict',
          preferredWindows: formattedWindows,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data?.whatsAppUrl) {
          setReschedWhatsAppUrl(data.whatsAppUrl);
        }
        throw new Error(data?.error || 'Failed to submit reschedule request');
      }

      setReschedSuccessMessage('Reschedule request sent to Acharya Niraj Kumar!');
      setTimeout(() => {
        setShowRescheduleModal(false);
        setReschedSuccessMessage('');
        setReschedReason('');
        setTargetRescheduleSession(null);
        fetchSessions();
      }, 1500);
    } catch (err) {
      setReschedErrorMessage(err instanceof Error ? err.message : 'Reschedule request failed');
    } finally {
      setIsSubmittingResched(false);
    }
  };

  // Helper: Trigger native .ics download
  const handleDownloadIcs = (session: StudentSessionItem) => {
    window.open(`/api/student/sessions/${session.id}/calendar.ics`, '_blank');
  };

  // ----------------------------------------------------------------------------
  // Gating States: Unapproved, Revoked, or Non-Enrolled
  // ----------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-white/10 text-center space-y-3">
        <div className="w-8 h-8 mx-auto border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-300 font-medium">
          Loading your personal 1-on-1 mentorship sessions...
        </p>
      </div>
    );
  }

  if (!isEnrolled) {
    if (isRevoked) {
      return (
        <div className="p-8 rounded-3xl bg-slate-900/90 border border-rose-500/30 text-center space-y-4 max-w-xl mx-auto shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-white">Access Ended</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your enrollment has ended or access has been revoked. If you believe this is in error or wish to renew your mentorship, please connect with us directly.
            </p>
          </div>
          <a
            href="https://wa.me/919311215564?text=Namaste%20Acharya%20ji%2C%20my%20course%20access%20ended%20and%20I%20would%20like%20to%20restore%20my%20mentorship."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg shadow-emerald-900/40"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Access ended. Contact us on WhatsApp</span>
          </a>
        </div>
      );
    }

    return (
      <div className="p-8 rounded-3xl bg-slate-900/90 border border-amber-500/30 text-center space-y-4 max-w-xl mx-auto shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
          <Lock className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-white">1-on-1 Personal Mentorship Area</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Personal live classes with Acharya Niraj Kumar are exclusive to actively enrolled students of{' '}
            <strong className="text-amber-300">The Ultimate Astrology Course: Foundations to Chart Mastery</strong>.
          </p>
          {accessReason && (
            <p className="text-[11px] text-slate-400 italic pt-1">
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
            href="https://wa.me/919311215564?text=Namaste%20Acharya%20ji%2C%20I%20am%20interested%20in%20the%201-on-1%20personal%20mentorship%20program."
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
      <div className="p-6 rounded-3xl cosmic-card border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                1-on-1 Personal Mentorship
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-300 font-hindi">व्यक्तिगत लाइव कक्षाएं</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              My 1-on-1 Personal Sessions
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Private live teaching with Acharya Niraj Kumar focused on your birth chart, queries, and deep mastery of the 23 modules.
            </p>
            <div className="pt-1 flex items-center gap-2 text-[11px] text-amber-300/90 font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>Times automatically rendered in your local timezone: <strong>{userTz}</strong></span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowRequestModal(true)}
              className="gold-button px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-900/20 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Request a Session</span>
            </button>
            <a
              href="https://wa.me/919311215564?text=Namaste%20Acharya%20ji%2C%20I%20am%20messaging%20regarding%20my%201-on-1%20Vedic%20Astrology%20class."
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 flex items-center gap-2 transition"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp Acharya ji</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. THE NEXT SESSION AS A CARD (Featured Next Class) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Video className="w-4 h-4 text-amber-400" />
            <span>Next Live Session (अगली लाइव कक्षा)</span>
          </h3>
          {nextSession && (
            <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Confirmed on Schedule</span>
            </span>
          )}
        </div>

        {!nextSession ? (
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-white/10 text-center space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">No Upcoming Sessions Scheduled Right Now</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Acharya Niraj Kumar conducts 1-on-1 classes individually. Click &quot;Request a Session&quot; to propose your preferred time windows.
              </p>
            </div>
            <button
              onClick={() => setShowRequestModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Request a Session with Acharya ji</span>
            </button>
          </div>
        ) : (
          (() => {
            const joinStatus = getJoinWindowStatus(
              nextSession.startTime,
              15,
              nextSession.duration || 60
            );

            const timeLocal = formatInTimezone(nextSession.startTime, userTz);
            const timeIst = formatSessionIST(nextSession.startTime);

            return (
              <div className="p-6 sm:p-7 rounded-3xl cosmic-card border-2 border-amber-500/50 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 shadow-2xl space-y-5">
                {/* Header Row */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        {nextSession.status === 'RESCHEDULE_REQUESTED' ? 'Reschedule Requested' : 'Confirmed 1-on-1'}
                      </span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs text-slate-300 font-medium">
                        Duration: {nextSession.duration || 60} minutes
                      </span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs text-slate-400">
                        Platform: {nextSession.meetingPlatform || 'Google Meet'}
                      </span>
                    </div>

                    <h4 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                      {nextSession.title}
                    </h4>

                    {/* Dual Timezone Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-300">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Your Time ({userTz}): {timeLocal}</span>
                      </div>
                      <div className="text-xs text-slate-400 font-medium px-1">
                        IST: {timeIst}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Join Button (appears 15 minutes before) */}
                  <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-2.5 shrink-0 pt-2 md:pt-0">
                    {joinStatus.canJoin ? (
                      <a
                        href={nextSession.meetingLink || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="gold-button px-6 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xl shadow-amber-900/40 animate-pulse"
                      >
                        <Video className="w-4 h-4" />
                        <span>Join Live Class Now</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-center space-y-1">
                        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-300">
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Join Link Unlocks 15 Mins Before</span>
                        </div>
                        <p className="text-[11px] font-mono text-amber-300">
                          {joinStatus.formattedCountdown} remaining
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {/* Add to calendar (.ics) */}
                      <button
                        onClick={() => handleDownloadIcs(nextSession)}
                        title="Download .ics calendar event"
                        className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition"
                      >
                        <CalendarPlus className="w-3.5 h-3.5 text-amber-400" />
                        <span>Add to Calendar (.ics)</span>
                      </button>

                      {/* Google Calendar Link */}
                      <a
                        href={generateGoogleCalendarUrl(
                          nextSession.title,
                          `1-on-1 Vedic Astrology Mentorship with Acharya Niraj Kumar\nCourse: ${nextSession.courseTitle || 'Astrology'}\nMeeting Link: ${nextSession.meetingLink || 'Shared via portal'}`,
                          nextSession.meetingLink || 'Online Video Class',
                          nextSession.startTime,
                          nextSession.duration || 60
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Add to Google Calendar"
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>

                      {/* Request a Reschedule */}
                      <button
                        onClick={() => {
                          setTargetRescheduleSession(nextSession);
                          setShowRescheduleModal(true);
                        }}
                        className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
                        <span>Request a Reschedule</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pre-Class Notes from Acharya ji */}
                {nextSession.sharedNotes && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-slate-200 space-y-1">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Pre-Class Preparation from Acharya Niraj Kumar:</span>
                    </span>
                    <p className="leading-relaxed pl-5 whitespace-pre-wrap">{nextSession.sharedNotes}</p>
                  </div>
                )}
              </div>
            );
          })()
        )}
      </div>

      {/* 2B. Additional Upcoming Sessions (if more than 1) */}
      {upcomingSessions.length > 1 && (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Additional Upcoming Classes ({upcomingSessions.length - 1})</span>
          </h4>
          <div className="grid grid-cols-1 gap-2.5">
            {upcomingSessions.slice(1).map((s) => {
              const timeLocal = formatInTimezone(s.startTime, userTz);
              return (
                <div
                  key={s.id}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-white">{s.title}</h5>
                    <p className="text-[11px] text-slate-400">
                      {timeLocal} ({userTz}) • Duration: {s.duration || 60} mins
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <button
                      onClick={() => handleDownloadIcs(s)}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-slate-200 border border-white/10 flex items-center gap-1 transition"
                    >
                      <CalendarPlus className="w-3 h-3 text-amber-400" />
                      <span>.ics</span>
                    </button>
                    <button
                      onClick={() => {
                        setTargetRescheduleSession(s);
                        setShowRescheduleModal(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 border border-white/10 flex items-center gap-1 transition"
                    >
                      <RotateCcw className="w-3 h-3 text-sky-400" />
                      <span>Reschedule</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Pending Student Requests (if any) */}
      {requests.filter((r) => r.status === 'PENDING').length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <span>My Pending Requests (विचाराधीन अनुरोध)</span>
          </h3>

          <div className="grid grid-cols-1 gap-2.5">
            {requests
              .filter((r) => r.status === 'PENDING')
              .map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-sky-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                        {req.requestType === 'RESCHEDULE' ? 'Reschedule Request' : 'Session Request'}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-400">
                        Submitted {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-white">
                      {req.message || req.rescheduleReason || 'Personal Mentorship Slot Request'}
                    </p>
                    {req.preferredWindows && req.preferredWindows.length > 0 && (
                      <div className="text-[11px] text-slate-400 pt-0.5">
                        Preferred Windows:{' '}
                        {req.preferredWindows.map((w, i) => (
                          <span key={i} className="inline-block mr-2 text-sky-200">
                            [{w.label || `${w.startUtc.slice(0, 10)}`}]
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 self-start sm:self-center shrink-0">
                    Awaiting Acharya ji confirmation
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 4. Past Sessions: Shared Notes, Homework & Recordings */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Past Sessions &amp; Taught Curriculum (पिछली कक्षाएं एवं नोट्स)</span>
        </h3>

        {pastSessions.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-xs text-slate-400">
            No completed sessions recorded yet. Completed classes with shared notes, homework, and recordings will appear here.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {pastSessions.map((session) => {
              const timeLocal = formatInTimezone(session.startTime, userTz);
              return (
                <div
                  key={session.id}
                  className="p-5 rounded-2xl cosmic-card border border-emerald-500/30 bg-slate-900/60 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                    <div>
                      <span className="text-[11px] font-semibold text-emerald-400 block mb-0.5">
                        Conducted on {timeLocal} ({userTz})
                      </span>
                      <h4 className="text-base font-bold text-white">{session.title}</h4>
                      <p className="text-xs text-slate-400">Duration: {session.duration || 60} mins</p>
                    </div>

                    {session.recordingUrl && (
                      <a
                        href={session.recordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition shrink-0"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Watch Class Recording</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {/* Shared Notes & Homework strictly for the student */}
                  <div className="space-y-3 text-xs">
                    {session.sharedNotes && (
                      <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                        <span className="font-bold text-emerald-300 block">Notes from Acharya Niraj Kumar:</span>
                        <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{session.sharedNotes}</p>
                      </div>
                    )}

                    {session.homework && (
                      <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1">
                        <span className="font-bold text-amber-300 block">Homework &amp; Practice Exercises:</span>
                        <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{session.homework}</p>
                      </div>
                    )}

                    {!session.sharedNotes && !session.homework && (
                      <p className="text-[11px] text-slate-500 italic">
                        Class concluded successfully. Detailed notes or chart observations will be appended by Acharya ji.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------------ */}
      {/* MODAL 1: REQUEST A 1-ON-1 SESSION                                       */}
      {/* ------------------------------------------------------------------------ */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-amber-500/40 p-6 sm:p-7 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Request a 1-on-1 Class</h3>
                <p className="text-xs text-slate-400">
                  Select your topic and propose 2 to 3 preferred time windows in your timezone.
                </p>
              </div>
              <button
                onClick={() => setShowRequestModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reqSuccessMessage ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-xs font-bold text-emerald-300">{reqSuccessMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitRequest} className="space-y-4 text-xs">
                {reqErrorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{reqErrorMessage}</span>
                  </div>
                )}

                {/* Topic Picker */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-white">Session Topic</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setReqTopicMode('MODULE')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                          reqTopicMode === 'MODULE'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'text-slate-400'
                        }`}
                      >
                        From Course Modules
                      </button>
                      <button
                        type="button"
                        onClick={() => setReqTopicMode('CUSTOM')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                          reqTopicMode === 'CUSTOM'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'text-slate-400'
                        }`}
                      >
                        Custom / Chart Query
                      </button>
                    </div>
                  </div>

                  {reqTopicMode === 'MODULE' ? (
                    <select
                      value={reqSelectedModule}
                      onChange={(e) => setReqSelectedModule(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-amber-400 text-xs"
                    >
                      {FLAGSHIP_23_MODULES.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. Navamsha D9 Chart Analysis & Marriage Timing"
                      value={reqCustomTopic}
                      onChange={(e) => setReqCustomTopic(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-xs"
                    />
                  )}
                </div>

                {/* Preferred Windows */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-white">
                      Preferred Time Windows ({userTz})
                    </label>
                    <span className="text-[10px] text-slate-400">Provide 2 to 3 slots</span>
                  </div>

                  {reqWindows.map((win, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-800/80 border border-white/5 space-y-2"
                    >
                      <span className="text-[11px] font-bold text-amber-300 block">
                        Window #{idx + 1}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Date</label>
                          <input
                            type="date"
                            value={win.date}
                            onChange={(e) => {
                              const updated = [...reqWindows];
                              updated[idx].date = e.target.value;
                              setReqWindows(updated);
                            }}
                            required
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Start Time</label>
                          <input
                            type="time"
                            value={win.startTime}
                            onChange={(e) => {
                              const updated = [...reqWindows];
                              updated[idx].startTime = e.target.value;
                              setReqWindows(updated);
                            }}
                            required
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">End Time</label>
                          <input
                            type="time"
                            value={win.endTime}
                            onChange={(e) => {
                              const updated = [...reqWindows];
                              updated[idx].endTime = e.target.value;
                              setReqWindows(updated);
                            }}
                            required
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {reqWindows.length < 3 && (
                    <button
                      type="button"
                      onClick={() =>
                        setReqWindows([
                          ...reqWindows,
                          { date: '', startTime: '18:00', endTime: '19:00' },
                        ])
                      }
                      className="text-amber-400 hover:text-amber-300 text-[11px] font-semibold flex items-center gap-1 pt-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Add 3rd Preferred Window</span>
                    </button>
                  )}
                </div>

                {/* Optional Message */}
                <div className="space-y-1">
                  <label className="font-bold text-white">Specific Questions / Chart Details (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Provide birth details (DOB, Time, Place) or specific concepts you want Acharya ji to cover..."
                    value={reqMessage}
                    onChange={(e) => setReqMessage(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-800 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReq}
                    className="gold-button px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmittingReq ? 'Submitting...' : 'Submit Request'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------ */}
      {/* MODAL 2: REQUEST A RESCHEDULE                                           */}
      {/* ------------------------------------------------------------------------ */}
      {showRescheduleModal && targetRescheduleSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-amber-500/40 p-6 sm:p-7 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Request a Reschedule</h3>
                <p className="text-xs text-slate-400">
                  Currently scheduled: {targetRescheduleSession.title}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowRescheduleModal(false);
                  setTargetRescheduleSession(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reschedSuccessMessage ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-xs font-bold text-emerald-300">{reschedSuccessMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReschedule} className="space-y-4 text-xs">
                {targetRescheduleSession && (() => {
                  const hoursRemaining = (new Date(targetRescheduleSession.startTime).getTime() - Date.now()) / (1000 * 3600);
                  if (hoursRemaining < 24) {
                    return (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1">
                        <span className="font-bold flex items-center gap-1.5 text-amber-300">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Notice Period: {Math.max(0, Math.round(hoursRemaining))} hours remaining</span>
                        </span>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          Standard reschedule requests require at least 24 hours advance notice. If you cannot attend, you may also message Acharya ji directly on WhatsApp.
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}

                {reschedErrorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{reschedErrorMessage}</span>
                    </div>
                    {reschedWhatsAppUrl && (
                      <div>
                        <a
                          href={reschedWhatsAppUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Message Acharya ji on WhatsApp</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Reason */}
                <div className="space-y-1">
                  <label className="font-bold text-white">Reason for Rescheduling</label>
                  <input
                    type="text"
                    placeholder="e.g. Work travel, family commitment, unwell..."
                    value={reschedReason}
                    onChange={(e) => setReschedReason(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-xs"
                  />
                </div>

                {/* New Preferred Windows */}
                <div className="space-y-2">
                  <label className="font-bold text-white">
                    New Preferred Windows ({userTz})
                  </label>

                  {reschedWindows.map((win, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-800/80 border border-white/5 space-y-2"
                    >
                      <span className="text-[11px] font-bold text-amber-300 block">
                        New Option #{idx + 1}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Date</label>
                          <input
                            type="date"
                            value={win.date}
                            onChange={(e) => {
                              const updated = [...reschedWindows];
                              updated[idx].date = e.target.value;
                              setReschedWindows(updated);
                            }}
                            required
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Start Time</label>
                          <input
                            type="time"
                            value={win.startTime}
                            onChange={(e) => {
                              const updated = [...reschedWindows];
                              updated[idx].startTime = e.target.value;
                              setReschedWindows(updated);
                            }}
                            required
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">End Time</label>
                          <input
                            type="time"
                            value={win.endTime}
                            onChange={(e) => {
                              const updated = [...reschedWindows];
                              updated[idx].endTime = e.target.value;
                              setReschedWindows(updated);
                            }}
                            required
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {reschedWindows.length < 3 && (
                    <button
                      type="button"
                      onClick={() =>
                        setReschedWindows([
                          ...reschedWindows,
                          { date: '', startTime: '18:00', endTime: '19:00' },
                        ])
                      }
                      className="text-amber-400 hover:text-amber-300 text-[11px] font-semibold flex items-center gap-1 pt-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Add 3rd Preferred Window</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRescheduleModal(false);
                      setTargetRescheduleSession(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingResched}
                    className="gold-button px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isSubmittingResched ? 'Sending Request...' : 'Submit Reschedule'}</span>
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
