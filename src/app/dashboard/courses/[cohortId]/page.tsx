'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  Clock,
  CheckCircle2,
  Lock,
  ArrowLeft,
  BookOpen,
  Award,
  Play,
  MessageSquare,
  Send
} from 'lucide-react';
import { ViarStore } from '@/lib/store';
import { Course, Cohort, ScheduledClass, ClassDiscussionComment } from '@/lib/types';
import { getUserLocalTimezone } from '@/lib/timezones';

export default function CohortClassByClassPage() {
  const params = useParams();
  const cohortId = (params?.cohortId as string) || 'cohort-wia-batch-1';

  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [classes, setClasses] = useState<ScheduledClass[]>([]);
  const [activeClass, setActiveClass] = useState<ScheduledClass | null>(null);
  const [watchedSet, setWatchedSet] = useState<Set<string>>(new Set());
  const [userTz, setUserTz] = useState<string>('Asia/Kolkata');
  const [comments, setComments] = useState<ClassDiscussionComment[]>([]);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    if (activeClass) {
      setComments(ViarStore.getDiscussionComments(activeClass.id));
    }
  }, [activeClass]);

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !activeClass) return;
    const user = ViarStore.getCurrentUser();
    const authorName = user?.name || 'Viar Scholar';
    const newC = ViarStore.addDiscussionComment({
      sessionId: activeClass.id,
      authorName,
      comment: commentText.trim(),
      authorRole: user?.role === 'ADMIN' || user?.role === 'OWNER' ? 'ADMIN' : 'STUDENT',
    });
    setComments((prev) => [...prev, newC]);
    setCommentText('');
  };

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
                Taught by {course.instructor.name} (Jyotish Acharya, BVB New Delhi) • 23 Video Modules (~60–90 mins each)
              </p>
            </div>

            {/* Progress & Final Quiz Unlock CTA */}
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 w-full sm:w-auto sm:min-w-[280px]">
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
                  <span>Watch or mark all {classes.length || 23} modules completed to unlock exam.</span>
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
                      Module {activeClass.classNumber} of {classes.length || 23}
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

                {/* Self-Paced Video Details */}
                <div className="flex items-center gap-4 text-xs text-slate-300 bg-white/[0.03] p-3 rounded-xl border border-white/5">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Self-Paced Module • Duration: <strong className="text-white">{activeClass.durationMinutes || 60} mins</strong> • 100% On-Demand Access
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
                ) : (
                  <div className="p-8 rounded-2xl bg-gradient-to-b from-[#101726] to-[#0a0f1a] border border-amber-500/20 text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
                      <Play className="w-7 h-7 fill-current" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                        Self-Paced Video Module
                      </span>
                      <h3 className="text-xl font-bold text-white mt-1">
                        {activeClass.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
                        This video lesson is available for instant streaming. Mark as watched once completed to count toward your certificate eligibility.
                      </p>
                    </div>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleToggleWatched(activeClass.id)}
                        className="gold-button px-6 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{watchedSet.has(activeClass.id) ? 'Completed ✓' : 'Mark Module as Watched'}</span>
                      </button>
                    </div>
                  </div>
                )}

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

                {/* Per-Session Q&A / Discussion Space (Beat Astrotalk) */}
                <div className="space-y-4 pt-6 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>Class Q&A & Discussion</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {comments.length}
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Ask questions on Class {activeClass.classNumber} concepts. Acharya Niraj Kumar and cohort peers reply here.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Comments Thread */}
                  <div className="space-y-3 pt-2">
                    {comments.length === 0 ? (
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center text-xs text-slate-400">
                        No questions posted yet for this class session. Be the first to start the discussion!
                      </div>
                    ) : (
                      comments.map((comm) => (
                        <div
                          key={comm.id}
                          className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center text-[10px] font-bold">
                                {comm.authorName.charAt(0)}
                              </span>
                              <span className="font-semibold text-slate-200">{comm.authorName}</span>
                              {comm.authorRole === 'INSTRUCTOR' || comm.authorRole === 'ADMIN' ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#7B2D26] text-amber-200 border border-amber-500/30">
                                  Faculty
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-slate-400">
                                  Student
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500">
                              {new Date(comm.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed pl-8">
                            {comm.comment}
                          </p>

                          {/* Instructor Reply */}
                          {comm.instructorReply && (
                            <div className="ml-8 mt-2 p-3 rounded-lg bg-[#7B2D26]/20 border-l-2 border-[#E8A33D] space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                                  <span>✦</span>
                                  <span>{comm.instructorReply.authorName}</span>
                                  <span className="text-[9px] uppercase px-1 rounded bg-amber-500/20 text-amber-200">
                                    Lead Acharya
                                  </span>
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(comm.instructorReply.repliedAt).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                              </div>
                              <p className="text-xs text-slate-200 leading-relaxed">
                                {comm.instructorReply.comment}
                              </p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Post New Comment Form */}
                  <form onSubmit={handlePostComment} className="pt-2">
                    <div className="space-y-2">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder={`Ask a question or share notes regarding Class ${activeClass.classNumber}...`}
                        rows={2}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition resize-none"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">
                          Markdown supported • Moderated for Vedic scholarship
                        </span>
                        <button
                          type="submit"
                          disabled={!commentText.trim()}
                          className="gold-button px-4 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Send className="w-3 h-3" />
                          <span>Post Question</span>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-slate-400 text-xs">
                Select a module from the curriculum playlist on the right.
              </div>
            )}
          </div>

          {/* Right: Module Playlist */}
          <div className="lg:col-span-5 cosmic-card p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>23-Module Video Curriculum</span>
              </h3>
              <span className="text-[11px] text-amber-300 font-semibold">
                {watchedSet.size} / {classes.length} completed
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
                            Module {cls.classNumber}:
                          </span>
                          <h4 className="text-xs font-semibold text-white truncate">
                            {cls.title}
                          </h4>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {cls.durationMinutes || 60} mins • On-demand video
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="text-[10px] font-medium text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                        <Play className="w-2.5 h-2.5 fill-current" />
                        Video
                      </span>
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
