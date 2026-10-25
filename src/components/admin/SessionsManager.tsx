'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Clock,
  Video,
  User,
  Plus,
  Search,
  CheckCircle2,
  ExternalLink,
  Copy,
  FileText,
  AlertCircle,
  MessageCircle,
  Check,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import type { OneOnOneSessionRecord } from '@/lib/sessions/types';

interface StudentOption {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

type ExtendedSession = OneOnOneSessionRecord & {
  whatsAppShareUrl?: string;
};

const TOPIC_SUGGESTIONS = [
  '1. Kundli Basics & 12 Houses (Bhavas)',
  '2. Planetary Aspects, Yogas & Strengths',
  '3. Vimshottari Dasha & Timing of Events',
  '4. Transit (Gochara) Analysis & Sade Sati',
  '5. Navamsha (D9) Chart Reading',
  '6. Personal Kundli Consultation & Remedies',
];

export default function SessionsManager() {
  const [sessions, setSessions] = useState<ExtendedSession[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UPCOMING' | 'TODAY' | 'COMPLETED'>('UPCOMING');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentFilter, setSelectedStudentFilter] = useState('ALL');

  // Modals
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isTaughtModalOpen, setIsTaughtModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ExtendedSession | null>(null);

  // Form State: Schedule
  const [formStudentId, setFormStudentId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('16:00');
  const [formDuration, setFormDuration] = useState(60);
  const [formPlatform, setFormPlatform] = useState('GOOGLE_MEET');
  const [formLink, setFormLink] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State: Record What Was Taught
  const [formTaughtRecord, setFormTaughtRecord] = useState('');
  const [formHomework, setFormHomework] = useState('');
  const [formRecordingUrl, setFormRecordingUrl] = useState('');
  const [formMarkCompleted, setFormMarkCompleted] = useState(true);

  // Expanded cards state
  const [expandedSessionIds, setExpandedSessionIds] = useState<Set<string>>(new Set());
  const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        setStudents(data.students || []);
        if (data.students?.length > 0 && !formStudentId) {
          setFormStudentId(data.students[0].id);
        }
      }
    } catch {
      // Offline fallback
    } finally {
      setIsLoading(false);
    }
  }, [formStudentId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

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

  const handleOpenScheduleModal = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setFormDate(tomorrow.toISOString().split('T')[0]);
    setFormTime('16:00');
    setFormTitle('');
    setFormLink('https://meet.google.com/new');
    setFormNotes('Please have your birth chart ready. Revise basic planetary significators.');
    setFeedbackMsg(null);
    setIsScheduleModalOpen(true);
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentId || !formTitle || !formDate || !formTime) {
      setFeedbackMsg({ type: 'error', text: 'Please fill all required fields: student, topic, date, and time.' });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedbackMsg(null);

      // Combine date and time in IST (+05:30)
      const scheduledAtIso = `${formDate}T${formTime}:00+05:30`;
      const selectedStudent = students.find((s) => s.id === formStudentId);

      const res = await fetch('/api/admin/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: formStudentId,
          studentName: selectedStudent?.name,
          studentEmail: selectedStudent?.email,
          studentPhone: selectedStudent?.phone,
          title: formTitle,
          scheduledAt: scheduledAtIso,
          durationMinutes: formDuration,
          meetingPlatform: formPlatform,
          meetingLink: formLink,
          notes: formNotes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create session');
      }

      await fetchSessions();
      setIsScheduleModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating session';
      setFeedbackMsg({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenTaughtModal = (session: ExtendedSession) => {
    setSelectedSession(session);
    setFormTaughtRecord(session.taughtRecord || '');
    setFormHomework(session.homework || '');
    setFormRecordingUrl(session.recordingUrl || '');
    setFormMarkCompleted(session.status !== 'COMPLETED');
    setFeedbackMsg(null);
    setIsTaughtModalOpen(true);
  };

  const handleSaveTaughtContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession || !formTaughtRecord.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Please enter what was taught in this class.' });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedbackMsg(null);

      const res = await fetch('/api/admin/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedSession.id,
          taughtRecord: formTaughtRecord,
          homework: formHomework,
          recordingUrl: formRecordingUrl,
          markCompleted: formMarkCompleted,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update record');
      }

      await fetchSessions();
      setIsTaughtModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving taught record';
      setFeedbackMsg({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = (session: ExtendedSession) => {
    if (!session.meetingLink) return;
    navigator.clipboard.writeText(session.meetingLink);
    setCopiedSessionId(session.id);
    setTimeout(() => setCopiedSessionId(null), 2500);
  };

  const toggleExpand = (id: string) => {
    setExpandedSessionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return sessions.filter((s) => {
      // Student Filter
      if (selectedStudentFilter !== 'ALL' && s.studentId !== selectedStudentFilter) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          s.title.toLowerCase().includes(q) ||
          s.studentName.toLowerCase().includes(q) ||
          s.studentEmail.toLowerCase().includes(q) ||
          (s.studentPhone && s.studentPhone.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Tab Filter
      if (activeFilter === 'UPCOMING') {
        return s.status === 'SCHEDULED' || s.status === 'LIVE';
      }
      if (activeFilter === 'TODAY') {
        return s.scheduledAt.startsWith(todayStr);
      }
      if (activeFilter === 'COMPLETED') {
        return s.status === 'COMPLETED';
      }

      return true;
    });
  }, [sessions, selectedStudentFilter, searchQuery, activeFilter]);

  // Statistics
  const stats = useMemo(() => {
    const upcoming = sessions.filter((s) => s.status === 'SCHEDULED' || s.status === 'LIVE').length;
    const completed = sessions.filter((s) => s.status === 'COMPLETED').length;
    const studentIds = new Set(sessions.map((s) => s.studentId));
    return { total: sessions.length, upcoming, completed, mentoredStudents: studentIds.size };
  }, [sessions]);

  return (
    <div className="space-y-6">
      {/* 1. Bilingual Guidance & Header Card */}
      <div className="p-6 rounded-3xl cosmic-card border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Personal 1-on-1 Mentorship
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-300 font-hindi">व्यक्तिगत लाइव कक्षाएं</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              1-on-1 Student Live Classes
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Schedule private astrology classes for each student at their convenient date and time. Send meeting links directly via WhatsApp in 1 click, and keep an ongoing record of what was taught in each class.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenScheduleModal}
            className="gold-button px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule 1-on-1 Class</span>
          </button>
        </div>

        {/* Telemetry Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-white/10">
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
            <span className="text-[11px] text-slate-400 block">Upcoming Classes</span>
            <span className="text-xl font-black text-amber-400">{stats.upcoming}</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
            <span className="text-[11px] text-slate-400 block">Classes Completed</span>
            <span className="text-xl font-black text-emerald-400">{stats.completed}</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
            <span className="text-[11px] text-slate-400 block">Students Mentored</span>
            <span className="text-xl font-black text-white">{stats.mentoredStudents}</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
            <span className="text-[11px] text-slate-400 block">Total Scheduled</span>
            <span className="text-xl font-black text-slate-300">{stats.total}</span>
          </div>
        </div>
      </div>

      {/* 2. Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-white/10 overflow-x-auto">
          {(['UPCOMING', 'TODAY', 'COMPLETED', 'ALL'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeFilter === filter
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {filter === 'UPCOMING'
                ? 'Upcoming (आगामी)'
                : filter === 'TODAY'
                ? 'Today (आज)'
                : filter === 'COMPLETED'
                ? 'Completed (पूर्ण)'
                : 'All Classes'}
            </button>
          ))}
        </div>

        {/* Search & Student Filter */}
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Student Dropdown */}
          <select
            value={selectedStudentFilter}
            onChange={(e) => setSelectedStudentFilter(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Students</option>
            {students.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Sessions List */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400 text-xs">
          Loading 1-on-1 mentorship sessions...
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl cosmic-card border border-white/10 space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">No 1-on-1 Sessions Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery || selectedStudentFilter !== 'ALL'
                ? 'No classes match your current search or filter criteria.'
                : 'You have not scheduled any personal 1-on-1 classes for this filter yet.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenScheduleModal}
            className="gold-button px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule First 1-on-1 Class</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => {
            const isExpanded = expandedSessionIds.has(session.id);
            const isCopied = copiedSessionId === session.id;
            const scheduledDate = new Date(session.scheduledAt);
            const formattedDate = scheduledDate.toLocaleString('en-IN', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'Asia/Kolkata',
              hour12: true,
            });

            // Status Styling
            const isCompleted = session.status === 'COMPLETED';

            return (
              <div
                key={session.id}
                className={`p-5 rounded-3xl cosmic-card border transition ${
                  isCompleted
                    ? 'border-emerald-500/20 bg-slate-900/60'
                    : 'border-amber-500/30 bg-slate-900/90 shadow-lg'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Info */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isCompleted
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {isCompleted ? 'Completed • पूर्ण' : 'Scheduled • आगामी'}
                      </span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>{formattedDate} (IST)</span>
                      </span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs text-slate-400">{session.durationMinutes} mins</span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <span>{session.title}</span>
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                        <User className="w-3.5 h-3.5 text-amber-400" />
                        <span>Student: <strong className="text-white">{session.studentName}</strong></span>
                      </span>
                      {session.studentPhone && (
                        <span>Phone: <strong className="text-slate-300 font-mono">{session.studentPhone}</strong></span>
                      )}
                      <span>Email: <strong className="text-slate-300">{session.studentEmail}</strong></span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* Send on WhatsApp Button */}
                    {session.whatsAppShareUrl && (
                      <a
                        href={session.whatsAppShareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-emerald-900/30"
                        title="Send class schedule and join link to student on WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Send on WhatsApp</span>
                      </a>
                    )}

                    {/* Copy Link Button */}
                    {session.meetingLink && (
                      <button
                        type="button"
                        onClick={() => handleCopyLink(session)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 font-medium text-xs flex items-center gap-1.5 transition"
                        title="Copy meeting link"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                        <span>{isCopied ? 'Copied' : 'Copy Link'}</span>
                      </button>
                    )}

                    {/* Record Taught Content Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenTaughtModal(session)}
                      className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-1.5 transition"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>{session.taughtRecord ? 'Edit Taught Record' : 'Record What Was Taught'}</span>
                    </button>

                    {/* Expand Details */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(session.id)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
                      aria-label="Toggle details"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-white/10 text-xs space-y-3">
                    {/* Meeting Link */}
                    {session.meetingLink && (
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-2">
                        <span className="text-slate-400">Meeting Link:</span>
                        <a
                          href={session.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-300 font-mono underline hover:text-amber-200 truncate max-w-md flex items-center gap-1"
                        >
                          <span>{session.meetingLink}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    )}

                    {/* Pre-class Preparation Notes */}
                    {session.notes && (
                      <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-slate-300 space-y-1">
                        <span className="font-bold text-amber-300 block">Pre-Class Preparation Notes:</span>
                        <p className="leading-relaxed">{session.notes}</p>
                      </div>
                    )}

                    {/* Record of What Was Taught */}
                    {session.taughtRecord ? (
                      <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-slate-200 space-y-2">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Record of What Was Taught (पढ़ाए गए विषय):</span>
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap">{session.taughtRecord}</p>

                        {session.homework && (
                          <div className="pt-2 border-t border-emerald-500/20">
                            <span className="font-bold text-amber-300 block">Homework / Practice Assigned:</span>
                            <p className="leading-relaxed text-slate-300">{session.homework}</p>
                          </div>
                        )}

                        {session.recordingUrl && (
                          <div className="pt-2">
                            <a
                              href={session.recordingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-300 font-medium underline flex items-center gap-1 hover:text-amber-200"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>View Lecture Recording / Notes Document</span>
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-slate-400 flex items-center justify-between">
                        <span>No taught record logged yet. Click &quot;Record What Was Taught&quot; after conducting the class.</span>
                        <button
                          type="button"
                          onClick={() => handleOpenTaughtModal(session)}
                          className="text-amber-400 hover:underline font-semibold"
                        >
                          Log Record Now →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Schedule 1-on-1 Class Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-xl w-full text-white shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Schedule 1-on-1 Live Class</h3>
                  <p className="text-xs text-slate-400">व्यक्तिगत ज्योतिष कक्षा निर्धारित करें</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {feedbackMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  feedbackMsg.type === 'error'
                    ? 'bg-red-500/20 border border-red-500/40 text-red-300'
                    : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{feedbackMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleCreateSession} className="space-y-4 text-xs">
              {/* Select Student */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Select Enrolled Student (छात्र चुनें) *
                </label>
                <select
                  value={formStudentId}
                  onChange={(e) => setFormStudentId(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                >
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.phone ? `${st.phone} • ` : ''}{st.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Topic / Class Title */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Class Topic / Title (कक्षा का विषय) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Personal Chart Reading & Planetary Aspects"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                />

                {/* Suggested Topics Chips */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  <span className="text-[10px] text-slate-400 self-center">Suggestions:</span>
                  {TOPIC_SUGGESTIONS.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => setFormTitle(topic)}
                      className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 text-[10px] text-slate-400 border border-white/5 transition"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Time Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Class Date (दिनांक) *
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Start Time (IST समय) *
                  </label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              {/* Quick Time Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-slate-400">Quick presets:</span>
                <button
                  type="button"
                  onClick={() => setQuickTime('TODAY_4PM')}
                  className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-amber-500/20 text-[10px] text-slate-300"
                >
                  Today 4:00 PM
                </button>
                <button
                  type="button"
                  onClick={() => setQuickTime('TOMORROW_11AM')}
                  className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-amber-500/20 text-[10px] text-slate-300"
                >
                  Tomorrow 11:00 AM
                </button>
                <button
                  type="button"
                  onClick={() => setQuickTime('TOMORROW_4PM')}
                  className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-amber-500/20 text-[10px] text-slate-300"
                >
                  Tomorrow 4:00 PM
                </button>
              </div>

              {/* Duration & Platform */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Duration (अवधि)
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[30, 45, 60, 90].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setFormDuration(mins)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                          formDuration === mins
                            ? 'bg-amber-500 text-black border-amber-400'
                            : 'bg-slate-950 text-slate-400 border-white/10 hover:text-white'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Platform (माध्यम)
                  </label>
                  <select
                    value={formPlatform}
                    onChange={(e) => setFormPlatform(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="GOOGLE_MEET">Google Meet</option>
                    <option value="ZOOM">Zoom</option>
                    <option value="WHATSAPP">WhatsApp Video Call</option>
                    <option value="CUSTOM">Custom Phone / Audio</option>
                  </select>
                </div>
              </div>

              {/* Meeting Link */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Meeting Link (मीटिंग लिंक)
                </label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/xyz-abcd-efg"
                  value={formLink}
                  onChange={(e) => setFormLink(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
                <div className="flex justify-between items-center pt-1 text-[11px] text-slate-400">
                  <span>Student will receive this link directly.</span>
                  <a
                    href="https://meet.google.com/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Create Instant Google Meet</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Pre-class Instructions */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Notes for Student (छात्र के लिए निर्देश)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Please keep your birth chart ready, revise Module 3 video."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="gold-button px-6 py-2.5 rounded-xl font-bold shadow-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? 'Scheduling...' : 'Save & Schedule Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Record What Was Taught Modal */}
      {isTaughtModalOpen && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-8 max-w-xl w-full text-white shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Record What Was Taught</h3>
                  <p className="text-xs text-slate-400">
                    Student: <strong className="text-amber-300">{selectedSession.studentName}</strong> • {selectedSession.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTaughtModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {feedbackMsg && (
              <div className="p-3 rounded-xl text-xs bg-red-500/20 border border-red-500/40 text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{feedbackMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveTaughtContent} className="space-y-4 text-xs">
              {/* Taught Record */}
              <div>
                <label className="block text-emerald-300 font-bold mb-1">
                  What was taught in this class? (पढ़ाए गए विषय) *
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g. Covered 7th house and Venus placements. Discussed Navamsha (D9) chart and partner compatibility. Analyzed student's own birth chart."
                  value={formTaughtRecord}
                  onChange={(e) => setFormTaughtRecord(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
                  required
                />
              </div>

              {/* Homework / Practice */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Homework / Practice Assigned (गृहकार्य / अभ्यास)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Practice identifying 7th lord in 3 family charts."
                  value={formHomework}
                  onChange={(e) => setFormHomework(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Recording Link */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Lecture Recording / Notes Link (वैकल्पिक रिकॉर्डिंग लिंक)
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/d/..."
                  value={formRecordingUrl}
                  onChange={(e) => setFormRecordingUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Mark Completed Checkbox */}
              <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/10 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formMarkCompleted}
                  onChange={(e) => setFormMarkCompleted(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
                <span className="text-slate-300 font-semibold">
                  Mark session status as <strong className="text-emerald-400">COMPLETED</strong>
                </span>
              </label>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsTaughtModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save & Preserve Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
