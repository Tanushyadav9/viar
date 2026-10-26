'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  Award,
  BookOpen,
  MessageCircle,
  Plus,
  Copy,
  Check,
  AlertCircle,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import type { StudentSessionRecord } from '@/lib/sessions/types';
import { formatSessionIST, formatInTimezone } from '@/lib/timezones';

interface StudentData {
  student: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    timezone?: string | null;
    createdAt?: string;
  };
  enrollment?: {
    id: string;
    courseId: string;
    courseTitle: string;
    enrolledAt: string;
    status: string;
    amountPaid?: number;
  };
  progress: {
    completedLessons: number;
    totalLessons: number;
    percentage: number;
  };
  quizResults: Array<{
    id: string;
    quizTitle: string;
    score: number;
    totalQuestions: number;
    scorePercentage: number;
    passed: boolean;
    attemptedAt: string;
  }>;
  sessions: {
    all: StudentSessionRecord[];
    upcoming: StudentSessionRecord[];
    past: StudentSessionRecord[];
  };
  sessionsIncluded: number | null; // Null by default, only shown if Owner set it!
  sessionsUsed: number;
}

interface StudentProfileViewProps {
  studentId: string;
  onBack: () => void;
  onScheduleSession: (student: { id: string; name: string; email: string; phone?: string | null; timezone?: string }) => void;
  onOpenAttendanceModal: (session: StudentSessionRecord) => void;
  isOwner?: boolean;
}

export default function StudentProfileView({
  studentId,
  onBack,
  onScheduleSession,
  onOpenAttendanceModal,
  isOwner = true,
}: StudentProfileViewProps) {
  const [data, setData] = useState<StudentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [activeSessionTab, setActiveSessionTab] = useState<'UPCOMING' | 'PAST'>('UPCOMING');

  const fetchStudentDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/students/${studentId}`);
      if (!res.ok) {
        throw new Error('Failed to load student details');
      }
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading student profile');
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchStudentDetails();
  }, [fetchStudentDetails]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs">Loading student profile, enrollment details &amp; 1-on-1 personal classes...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 cosmic-card rounded-2xl border border-red-500/20 text-center text-slate-300">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="font-bold text-white mb-1">Failed to load student profile</p>
        <p className="text-xs text-slate-400 mb-4">{error}</p>
        <button
          onClick={onBack}
          className="gold-button px-4 py-1.5 rounded-lg text-xs font-bold"
        >
          Back to Students Roster
        </button>
      </div>
    );
  }

  const { student, enrollment, progress, quizResults, sessions, sessionsIncluded, sessionsUsed } = data;
  const studentTz = student.timezone || 'Asia/Kolkata';

  const currentList = activeSessionTab === 'UPCOMING' ? sessions.upcoming : sessions.past;

  return (
    <div className="space-y-6">
      {/* 1. Header Navigation & Student Identity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition w-fit"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span>Back to Students Roster / छात्र सूची</span>
        </button>

        {isOwner && (
          <button
            onClick={() =>
              onScheduleSession({
                id: student.id,
                name: student.name,
                email: student.email,
                phone: student.phone,
                timezone: studentTz,
              })
            }
            className="gold-button px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule a session / व्यक्तिगत सत्र तय करें</span>
          </button>
        )}
      </div>

      {/* 2. Student Profile Card */}
      <div className="cosmic-card p-6 rounded-2xl border border-white/10 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold text-xl flex-shrink-0">
              {student.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-white">{student.name}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {enrollment?.status || 'ACTIVE'}
                </span>
                {student.phone && (
                  <a
                    href={`https://wa.me/${student.phone.replace(/[^\d]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 hover:bg-emerald-600/40 flex items-center gap-1"
                  >
                    <MessageCircle className="w-3 h-3 text-emerald-400" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">{student.email}</p>
              {student.phone && <p className="text-xs text-slate-500 font-mono">{student.phone}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-white/10 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Enrolment Date:</span>
              <span className="text-white font-medium">
                {enrollment?.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString('en-IN') : '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Enrolled Course:</span>
              <span className="text-amber-300 font-medium line-clamp-1" title={enrollment?.courseTitle}>
                {enrollment?.courseTitle || 'Vedic Astrology Masterclass'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Timezone:</span>
              <span className="text-sky-300 font-mono text-[11px]">{studentTz}</span>
            </div>
          </div>
        </div>

        {/* Optional Included Sessions Quota Banner (Shown ONLY when Owner set an included count!) */}
        {sessionsIncluded !== null && sessionsIncluded !== undefined && sessionsIncluded > 0 && (
          <div className="mt-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-200">
                1-on-1 Sessions Quota Included:
              </span>
            </div>
            <div className="text-xs font-semibold text-white">
              <span className="text-amber-300 font-bold">{sessionsUsed}</span> of{' '}
              <span className="text-amber-300 font-bold">{sessionsIncluded}</span> used
              <span className="text-slate-400 ml-2">
                ({Math.max(0, sessionsIncluded - sessionsUsed)} remaining)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Learning Progress & Quiz Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module Progress */}
        <div className="cosmic-card p-5 rounded-2xl border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Self-Paced Curriculum Progress
              </h3>
            </div>
            <span className="text-xs font-bold text-purple-300">{progress.percentage}%</span>
          </div>

          <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-amber-400 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>{progress.completedLessons} of {progress.totalLessons} modules completed</span>
            <span>23-Module Flagship Syllabus</span>
          </div>
        </div>

        {/* Quiz Results */}
        <div className="cosmic-card p-5 rounded-2xl border border-white/10 space-y-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Certification Assessment & Quizzes
            </h3>
          </div>

          {quizResults.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">
              No quiz attempts recorded yet. Student is currently reviewing video lessons.
            </p>
          ) : (
            <div className="space-y-2">
              {quizResults.map((q) => (
                <div
                  key={q.id}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-semibold text-white">{q.quizTitle}</p>
                    <p className="text-[10px] text-slate-400">
                      Attempted on {new Date(q.attemptedAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        q.passed
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}
                    >
                      {q.passed ? 'PASSED' : 'NEEDS RETAKE'} ({q.scorePercentage}%)
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      {q.score} / {q.totalQuestions}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. 1-on-1 Sessions for this Student */}
      <div className="cosmic-card rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              Personal 1-on-1 Sessions ({sessions.all.length})
            </h3>
          </div>

          {/* Sub-tabs */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setActiveSessionTab('UPCOMING')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                activeSessionTab === 'UPCOMING'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Upcoming ({sessions.upcoming.length})
            </button>
            <button
              onClick={() => setActiveSessionTab('PAST')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                activeSessionTab === 'PAST'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Past / Completed ({sessions.past.length})
            </button>
          </div>
        </div>

        {/* Sessions List */}
        <div className="p-4 sm:p-6 space-y-4">
          {currentList.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs space-y-3">
              <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
              <p>No {activeSessionTab.toLowerCase()} 1-on-1 sessions found for {student.name}.</p>
              {isOwner && activeSessionTab === 'UPCOMING' && (
                <button
                  onClick={() =>
                    onScheduleSession({
                      id: student.id,
                      name: student.name,
                      email: student.email,
                      phone: student.phone,
                      timezone: studentTz,
                    })
                  }
                  className="gold-button px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Schedule First Session</span>
                </button>
              )}
            </div>
          ) : (
            currentList.map((session) => {
              const timeIst = formatSessionIST(session.startTime);
              const timeLocal =
                studentTz !== 'Asia/Kolkata'
                  ? formatInTimezone(session.startTime, studentTz, 'full')
                  : null;

              return (
                <div
                  key={session.id}
                  className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:border-white/20 transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-white">{session.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-amber-300 font-semibold">
                          <Clock className="w-3.5 h-3.5" />
                          {timeIst} (IST)
                        </span>
                        {timeLocal && (
                          <span className="text-sky-300 font-mono text-[11px]">
                            ({timeLocal} in {studentTz})
                          </span>
                        )}
                        <span className="text-slate-500">• {session.duration} mins</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          session.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : session.status === 'MISSED'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : session.status === 'CANCELLED'
                            ? 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {session.status}
                      </span>

                      {/* Attendance / Record Button */}
                      <button
                        onClick={() => onOpenAttendanceModal(session)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 transition"
                      >
                        Attendance & Notes
                      </button>

                      {/* Missed session: Reschedule in 1 Click */}
                      {session.status === 'MISSED' && (
                        <button
                          onClick={() =>
                            onScheduleSession({
                              id: student.id,
                              name: student.name,
                              email: student.email,
                              phone: student.phone,
                              timezone: studentTz,
                            })
                          }
                          className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reschedule in 1 Click</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Meeting link */}
                  {session.meetingLink && (
                    <div className="flex items-center gap-2 text-xs bg-slate-900/60 p-2.5 rounded-lg border border-white/5">
                      <span className="text-slate-400">Class Link:</span>
                      <a
                        href={session.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-400 hover:underline font-mono truncate max-w-xs sm:max-w-md"
                      >
                        {session.meetingLink}
                      </a>
                      <button
                        onClick={() => handleCopy(session.meetingLink!, session.id)}
                        className="p-1 rounded text-slate-400 hover:text-white transition ml-auto flex-shrink-0"
                        title="Copy link"
                      >
                        {copiedLink === session.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Notes & Homework preview */}
                  {(session.sharedNotes || session.homework || session.privateNotes) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                      {session.sharedNotes && (
                        <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                            Shared Notes & Topics
                          </span>
                          <p className="text-slate-300 whitespace-pre-wrap">{session.sharedNotes}</p>
                        </div>
                      )}
                      {session.homework && (
                        <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                          <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">
                            Assigned Homework / Charts
                          </span>
                          <p className="text-slate-300 whitespace-pre-wrap">{session.homework}</p>
                        </div>
                      )}
                      {session.privateNotes && (
                        <div className="p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/20 sm:col-span-2">
                          <div className="flex items-center gap-1.5 text-rose-300 font-bold text-[10px] uppercase mb-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Private Notes (Acharya Niraj Kumar Only)</span>
                          </div>
                          <p className="text-slate-300 whitespace-pre-wrap">{session.privateNotes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
