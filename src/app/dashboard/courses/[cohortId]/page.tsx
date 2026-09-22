'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  Clock,
  Video,
  CheckCircle2,
  Lock,
  ArrowLeft,
  ExternalLink,
  BookOpen,
  Award,
  Play,
  Calendar
} from 'lucide-react';
import { ViarStore } from '@/lib/store';
import { Course, Cohort, ScheduledClass } from '@/lib/types';
import { formatInTimezone, getUserLocalTimezone, getJoinWindowStatus, generateGoogleCalendarUrl } from '@/lib/timezones';

export default function CohortClassByClassPage() {
  const params = useParams();
  const cohortId = (params?.cohortId as string) || 'cohort-wia-batch-1';

  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [classes, setClasses] = useState<ScheduledClass[]>([]);
  const [activeClass, setActiveClass] = useState<ScheduledClass | null>(null);
  const [watchedSet, setWatchedSet] = useState<Set<string>>(new Set());
  const [userTz, setUserTz] = useState<string>('Asia/Kolkata');

  useEffect(() => {
    const c = ViarStore.getCohortById(cohortId) || ViarStore.getCohorts()[0];
    if (c) {
      setCohort(c);
      const crs = ViarStore.getCourseById(c.courseId);
      if (crs) setCourse(crs);

      const clsList = ViarStore.getClasses(c.id);
      setClasses(clsList);
      if (clsList.length > 0) setActiveClass(clsList[0]);
    }

    const watched = new Set(ViarStore.getWatchedClassIds());
    setWatchedSet(watched);

    const tz = ViarStore.getTimezone() || getUserLocalTimezone();
    setUserTz(tz);
  }, [cohortId]);

  const [, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleWatched = (classId: string) => {
    const isWatched = ViarStore.toggleClassWatched(classId);
    const updated = new Set(ViarStore.getWatchedClassIds());
    setWatchedSet(updated);

    const currentUser = ViarStore.getCurrentUser();
    if (currentUser) {
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          classSessionId: classId,
          watched: isWatched,
        }),
      }).catch((err) => console.warn('Progress API sync failed:', err));
    }
  };

  const handleAttendedLive = (classId: string) => {
    ViarStore.markClassAttended(classId);
    const updated = new Set(ViarStore.getWatchedClassIds());
    setWatchedSet(updated);

    const currentUser = ViarStore.getCurrentUser();
    if (currentUser) {
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          classSessionId: classId,
          watched: true,
        }),
      }).catch((err) => console.warn('Progress API sync failed:', err));
    }
  };

  const progress = ViarStore.getCourseProgress(cohortId);

  if (!cohort || !course) {
    return (
      <div className="min-h-screen cosmic-bg flex items-center justify-center p-4">
        <Sparkles className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="cosmic-bg min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            href="/dashboard"
            className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Student Dashboard</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/certificates"
              className="text-xs text-amber-300 hover:text-white transition flex items-center gap-1"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Certificates</span>
            </Link>
            <span className="text-slate-600">•</span>
            <Link
              href="/dashboard/payments"
              className="text-xs text-slate-400 hover:text-white transition"
            >
              Payment History
            </Link>
          </div>
        </div>

        {/* Top Header Card */}
        <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-white/10 mb-8 bg-gradient-to-r from-[#111827] to-[#090d16]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {cohort.batchName}
                </span>
                <span className="text-xs text-slate-400">
                  Timezone: <strong className="text-white">{userTz}</strong>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                {course.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Taught by {course.instructor.name} • 18 Live Classes (~60–90 mins each)
              </p>
            </div>

            {/* Progress & Final Quiz Unlock CTA */}
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 min-w-[280px]">
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-300">Course Completion</span>
                <span className="text-amber-300">{progress.completedClasses} / {progress.totalClasses} ({progress.percentage}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
                  style={{ width: `${progress.percentage}%` }}
                ></div>
              </div>

              {progress.canTakeQuiz ? (
                <Link
                  href={`/dashboard/courses/${cohort.id}/quiz`}
                  className="gold-button w-full py-2.5 rounded-xl text-xs font-bold text-center block shadow-lg shadow-amber-500/20"
                >
                  Unlock Final Certification Exam &rarr;
                </Link>
              ) : (
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Mark all 18 classes watched or completed to unlock quiz.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Grid: Active Session Player (Left) + Class Playlist (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Active Class Focus / Video Player */}
          <div className="lg:col-span-7 cosmic-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
            {activeClass ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Class {activeClass.classNumber} of 18
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
                      {activeClass.title}
                    </h2>
                  </div>

                  {/* Watched Checkbox */}
                  <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-amber-400/40 cursor-pointer transition select-none">
                    <input
                      type="checkbox"
                      checked={watchedSet.has(activeClass.id) || activeClass.status === 'COMPLETED'}
                      onChange={() => handleToggleWatched(activeClass.id)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 accent-amber-500 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-200">
                      {watchedSet.has(activeClass.id) || activeClass.status === 'COMPLETED'
                        ? 'Completed / Watched'
                        : 'Mark as Watched'}
                    </span>
                  </label>
                </div>

                {/* Scheduled Time In User Timezone */}
                <div className="flex items-center gap-4 text-xs text-slate-300 bg-white/[0.03] p-3 rounded-xl border border-white/5">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Scheduled: <strong className="text-white">{formatInTimezone(activeClass.scheduledStartTime, userTz, 'full')}</strong> ({userTz})
                  </span>
                </div>

                {/* Video / Join Link Container (Requirement 6.1 & 6.2) */}
                {activeClass.recording ? (
                  <div className="space-y-4">
                    <div className="relative rounded-2xl overflow-hidden border-2 border-amber-500/30 shadow-2xl bg-black aspect-video">
                      <iframe
                        src={activeClass.recording.videoUrl}
                        title={activeClass.title}
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full object-cover"
                      ></iframe>
                    </div>
                    <div className="text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
                      <span>Duration: {activeClass.recording.durationMinutes} mins</span>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          HD Replay Ready
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleWatched(activeClass.id)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10"
                        >
                          {watchedSet.has(activeClass.id) ? 'Watched ✓' : 'Mark as Watched'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (() => {
                  const joinStatus = getJoinWindowStatus(activeClass.scheduledStartTime, 15, activeClass.durationMinutes);
                  const isWatched = watchedSet.has(activeClass.id) || activeClass.status === 'COMPLETED';

                  if (joinStatus.canJoin) {
                    return (
                      <div className="p-8 rounded-2xl bg-gradient-to-b from-[#101726] to-[#0a0f1a] border border-emerald-500/40 text-center space-y-5">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                          <span>LIVE CLASSROOM IN SESSION</span>
                        </div>

                        <div>
                          <h3 className="text-xl font-bold text-white">Join Acharya Niraj Kumar Live</h3>
                          <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
                            The live broadcast is underway on {activeClass.meetingPlatform || 'Zoom'}. Click below to join the session.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-3">
                          <a
                            href={activeClass.joinUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="gold-button px-6 py-3.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-amber-500/20"
                          >
                            <Video className="w-4 h-4" />
                            <span>Launch Live Classroom</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <button
                            type="button"
                            onClick={() => handleAttendedLive(activeClass.id)}
                            className={`px-4 py-3 rounded-xl text-xs font-semibold transition border flex items-center gap-1.5 ${
                              isWatched
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>{isWatched ? 'Attended Live ✓' : 'I Attended Live'}</span>
                          </button>
                        </div>

                        {activeClass.meetingId && (
                          <div className="text-[11px] text-slate-400 font-mono pt-2">
                            Meeting ID: <span className="text-amber-300 font-bold">{activeClass.meetingId}</span> • Passcode: <span className="text-amber-300 font-bold">{activeClass.passcode}</span>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Not yet within 15-minute window
                  const gcalUrl = generateGoogleCalendarUrl(
                    `Viar.in: Class ${activeClass.classNumber} - ${activeClass.title}`,
                    activeClass.description,
                    activeClass.joinUrl || 'https://viar.in',
                    activeClass.scheduledStartTime,
                    activeClass.durationMinutes
                  );

                  return (
                    <div className="p-8 rounded-2xl bg-gradient-to-b from-[#101726] to-[#0a0f1a] border border-amber-500/20 text-center space-y-4">
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
                        <Clock className="w-7 h-7" />
                      </div>

                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                          Upcoming Scheduled Class
                        </span>
                        <h3 className="text-2xl font-black text-white mt-1">
                          Starts in {joinStatus.formattedCountdown}
                        </h3>
                        <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
                          Join link unlocks <strong className="text-white">15 minutes before showtime</strong> at{' '}
                          <strong className="text-amber-300">{formatInTimezone(activeClass.scheduledStartTime, userTz, 'short')}</strong>.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <a
                          href={gcalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/10 inline-flex items-center gap-2 transition"
                        >
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          <span>Add to Google Calendar</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>

                        <button
                          type="button"
                          onClick={() => handleAttendedLive(activeClass.id)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                            isWatched
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{isWatched ? 'Marked Attended ✓' : 'I Attended Live'}</span>
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-500 italic">
                        Missed the live broadcast? The HD recording will appear here automatically once uploaded by Acharya Niraj Kumar.
                      </p>
                    </div>
                  );
                })()}

                {/* Description & Study Notes */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Session Description & Curriculum Notes
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {activeClass.description}
                  </p>

                  {activeClass.recording?.notesMarkdown && (
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                      {activeClass.recording.notesMarkdown}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-slate-400 text-xs">
                Select a class from the syllabus playlist on the right.
              </div>
            )}
          </div>

          {/* Right: 18-Class Playlist */}
          <div className="lg:col-span-5 cosmic-card p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>18-Class Syllabus Schedule</span>
              </h3>
              <span className="text-[11px] text-amber-300 font-semibold">
                {watchedSet.size} / {classes.length} done
              </span>
            </div>

            <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
              {classes.map((cls) => {
                const isSelected = activeClass?.id === cls.id;
                const isWatched = watchedSet.has(cls.id) || cls.status === 'COMPLETED';

                return (
                  <div
                    key={cls.id}
                    onClick={() => setActiveClass(cls)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/50 shadow-md'
                        : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleWatched(cls.id);
                        }}
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition ${
                          isWatched
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                            : 'border-white/20 hover:border-amber-400'
                        }`}
                      >
                        {isWatched && <CheckCircle2 className="w-4 h-4" />}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-amber-400">
                            Class {cls.classNumber}:
                          </span>
                          <h4 className="text-xs font-semibold text-white truncate">
                            {cls.title}
                          </h4>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {formatInTimezone(cls.scheduledStartTime, userTz, 'short')}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {cls.recording ? (
                        <span className="text-[10px] font-medium text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                          <Play className="w-2.5 h-2.5 fill-current" />
                          Replay
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-amber-300 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 flex items-center gap-1">
                          <Video className="w-2.5 h-2.5" />
                          Live
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Quiz Callout (Requirement 6.2) */}
            <div className="pt-4 border-t border-white/10 text-center">
              {(() => {
                const quizUnlock = ViarStore.isQuizUnlocked(cohort.id);
                if (quizUnlock.isUnlocked) {
                  return (
                    <Link
                      href={`/dashboard/courses/${cohort.id}/quiz`}
                      className="gold-button w-full py-3.5 rounded-xl text-xs font-bold block transition shadow-lg shadow-amber-500/20 text-center"
                    >
                      <span>Take Final Quiz & Earn Certificate &rarr;</span>
                    </Link>
                  );
                }
                return (
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-center space-y-2">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-300">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Certification Assessment Locked</span>
                    </div>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                      {quizUnlock.reason}
                    </p>
                  </div>
                );
              })()}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
