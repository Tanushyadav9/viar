'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Clock, CheckCircle2, ArrowRight, BookOpen, Bell, Mail, X } from 'lucide-react';
import { ViarStore } from '@/lib/store';
import { Course } from '@/lib/types';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [notifyCourse, setNotifyCourse] = useState<Course | null>(null);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySuccess, setNotifySuccess] = useState(false);

  useEffect(() => {
    setCourses(ViarStore.getCourses());
  }, []);

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyCourse || !notifyEmail) return;

    ViarStore.saveNotifyMeLead({
      courseId: notifyCourse.id,
      courseTitle: notifyCourse.title,
      email: notifyEmail,
    });

    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: notifyEmail,
        courseSlug: notifyCourse.slug,
      }),
    }).catch((err) => console.warn('Leads API sync failed:', err));

    setNotifySuccess(true);
    setTimeout(() => {
      setNotifySuccess(false);
      setNotifyCourse(null);
      setNotifyEmail('');
    }, 3000);
  };

  const filteredCourses = selectedLevel === 'All'
    ? courses
    : courses.filter((c) => c.level === selectedLevel);

  return (
    <div className="cosmic-bg min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Academic Curriculum</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
            Astrology Course Catalog
          </h1>
          <p className="text-slate-300 text-base leading-relaxed">
            All courses at Viar.in are delivered as cohort-based live classes on Zoom/Meet with HD video recordings, timezone-aware schedules, and verifiable certification.
          </p>

          {/* Level Filter Tabs */}
          <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
            {['All', 'Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  selectedLevel === lvl
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                {lvl === 'All' ? 'All Courses' : `${lvl} Level`}
              </button>
            ))}
          </div>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {filteredCourses.map((course) => {
            const isFlagship = course.slug === 'what-is-astrology';
            const isComingSoon = course.isComingSoon;

            return (
              <div
                key={course.id}
                className={`cosmic-card rounded-2xl p-8 border flex flex-col justify-between transition ${
                  isFlagship
                    ? 'border-amber-500/50 bg-[#111827]/80 ring-1 ring-amber-500/30'
                    : isComingSoon
                    ? 'border-purple-500/30 bg-[#0d101a]/90 opacity-95'
                    : 'border-white/10'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-4 mb-4">
                    {/* PLACEHOLDER: Additional catalog placeholder status */}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        isFlagship
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : isComingSoon
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}
                    >
                      {isComingSoon ? 'Coming Soon' : course.badge || course.level}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      {course.durationWeeks} Weeks • {course.totalClasses} Classes
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold text-white mb-2 leading-snug">
                    {course.title}
                  </h2>
                  <p className="text-sm text-amber-300/90 font-medium mb-4">
                    {course.tagline}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                    {course.description}
                  </p>

                  <div className="space-y-2.5 mb-6 text-xs text-slate-300">
                    {course.highlights.slice(0, 3).map((hl, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>{hl}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">
                      {isComingSoon ? 'Expected Tuition' : 'Tuition (One-Time)'}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-white">₹{course.priceInr.toLocaleString()}</span>
                      <span className="text-xs text-slate-500 line-through">₹{course.originalPriceInr.toLocaleString()}</span>
                      <span className="text-xs font-bold text-amber-400">/ ${course.priceUsd} USD</span>
                    </div>
                  </div>

                  {isComingSoon ? (
                    /* PLACEHOLDER: Not yet open for enrollment with Notify Me email capture */
                    <button
                      onClick={() => setNotifyCourse(course)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 flex items-center gap-1.5 transition"
                    >
                      <Bell className="w-3.5 h-3.5 text-purple-300" />
                      <span>Notify Me</span>
                    </button>
                  ) : (
                    <Link
                      href={`/courses/${course.slug}`}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                        isFlagship
                          ? 'gold-button shadow-md shadow-amber-500/20'
                          : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                      }`}
                    >
                      <span>View Curriculum</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Lineage Callout */}
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-white">Want to suggest a specialized Jyotish cohort?</p>
              <p className="text-xs text-slate-400">Our catalog expands with specialized cohorts on Muhurta, Medical Astrology, and Jaimini Sutras.</p>
            </div>
          </div>
          <a
            href="https://aapkaastro.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition shrink-0"
          >
            Visit Aapka Astro Consultations &rarr;
          </a>
        </div>

      </div>

      {/* Notify Me Modal */}
      {notifyCourse && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-purple-500/40 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setNotifyCourse(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center mb-4">
              <Bell className="w-6 h-6" />
            </div>

            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
              Early Cohort Notification
            </span>
            <h3 className="text-xl font-bold text-white mt-1 mb-2">
              {notifyCourse.title}
            </h3>
            <p className="text-xs text-slate-300 mb-6">
              Enter your email to receive priority notification and early-bird registration access the moment Batch 01 opens.
            </p>

            {notifySuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>You are on the priority notification list! We will email you upon launch.</span>
              </div>
            ) : (
              <form onSubmit={handleNotifySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.value)}
                      placeholder="student@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 transition"
                >
                  Notify Me When Enrollment Opens
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
