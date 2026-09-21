'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  Clock,
  CheckCircle2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { ViarStore } from '@/lib/store';
import { Course, Cohort, ScheduledClass } from '@/lib/types';
import { formatInTimezone, getUserLocalTimezone } from '@/lib/timezones';

export default function CourseDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [classes, setClasses] = useState<ScheduledClass[]>([]);
  const [userTz, setUserTz] = useState<string>('Asia/Kolkata');
  const [openModule, setOpenModule] = useState<number | null>(1);
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');

  useEffect(() => {
    const targetCourse = ViarStore.getCourseBySlug(slug) || ViarStore.getCourseBySlug('what-is-astrology');
    if (targetCourse) {
      setCourse(targetCourse);
      const cohorts = ViarStore.getCohorts(targetCourse.id);
      if (cohorts.length > 0) {
        setCohort(cohorts[0]);
        setClasses(ViarStore.getClasses(cohorts[0].id));
      }
    }

    const tz = ViarStore.getTimezone() || getUserLocalTimezone();
    setUserTz(tz);

    const handleTzChange = () => {
      setUserTz(ViarStore.getTimezone());
    };
    window.addEventListener('timezone-changed', handleTzChange);
    return () => window.removeEventListener('timezone-changed', handleTzChange);
  }, [slug]);

  if (!course) {
    return (
      <div className="min-h-screen cosmic-bg flex items-center justify-center p-4">
        <div className="text-center">
          <Sparkles className="w-8 h-8 text-amber-400 mx-auto animate-spin mb-4" />
          <p className="text-slate-300">Loading course curriculum...</p>
        </div>
      </div>
    );
  }

  const seatsLeft = cohort ? Math.max(cohort.maxSeats - cohort.enrolledCount, 2) : 18;
  const progressPercent = cohort ? Math.round((cohort.enrolledCount / cohort.maxSeats) * 100) : 70;

  return (
    <div className="cosmic-bg min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-8">
          <Link href="/" className="hover:text-amber-400 transition">Home</Link>
          <span>/</span>
          <Link href="/courses" className="hover:text-amber-400 transition">Courses</Link>
          <span>/</span>
          <span className="text-amber-300 font-medium">{course.title}</span>
        </div>

        {/* Hero Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          
          <div className="lg:col-span-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {course.badge || 'Cohort Batch'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-slate-300 border border-white/10">
                {course.level} Level
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-slate-300 border border-white/10 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                {course.durationWeeks} Weeks • {course.totalClasses} Live Masterclasses
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-4">
              {course.title}
            </h1>
            <p className="text-lg text-amber-300/90 font-medium mb-6">
              {course.tagline}
            </p>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
              {course.description}
            </p>

            {/* Value Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {course.highlights.map((hl, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-300">{hl}</span>
                </div>
              ))}
            </div>

            {/* Instructor Quick Card */}
            {/* PLACEHOLDER: replace with real instructor info */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-4">
              <img
                src={course.instructor.avatarUrl}
                alt={course.instructor.name}
                className="w-14 h-14 rounded-xl object-cover border border-amber-500/30 shrink-0"
              />
              <div>
                <h4 className="text-sm font-bold text-white">{course.instructor.name}</h4>
                <p className="text-xs text-amber-300">{course.instructor.title}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Over [X] years experience • Founder of{' '}
                  <a
                    href="https://aapkaastro.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-amber-300 hover:text-white inline-flex items-center gap-0.5"
                  >
                    Aapka Astro <ExternalLink className="w-2.5 h-2.5 inline" />
                  </a>
                  {' '}• 26,000+ followers
                </p>
              </div>
            </div>

          </div>

          {/* Sticky Enrollment Card */}
          <div className="lg:col-span-4">
            <div className="cosmic-card p-6 rounded-2xl border border-amber-500/40 bg-[#0c101c] sticky top-28 shadow-2xl">
              
              {/* Currency Selector */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <span className="text-xs text-slate-400 font-medium">Select Currency:</span>
                <div className="flex rounded-lg bg-white/5 p-1 border border-white/10">
                  <button
                    onClick={() => setCurrency('INR')}
                    className={`px-3 py-1 rounded text-xs font-bold transition ${
                      currency === 'INR' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ₹ INR
                  </button>
                  <button
                    onClick={() => setCurrency('USD')}
                    className={`px-3 py-1 rounded text-xs font-bold transition ${
                      currency === 'USD' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    $ USD
                  </button>
                </div>
              </div>

              {/* Price display */}
              <div className="mb-6">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Tuition (One-Time)</p>
                <div className="flex items-baseline gap-2 mt-1">
                  {currency === 'INR' ? (
                    <>
                      <span className="text-3xl font-black text-white">₹{course.priceInr.toLocaleString()}</span>
                      <span className="text-sm text-slate-500 line-through">₹{course.originalPriceInr.toLocaleString()}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-3xl font-black text-white">${course.priceUsd}</span>
                      <span className="text-sm text-slate-500 line-through">${course.originalPriceUsd}</span>
                    </>
                  )}
                  <span className="text-xs font-bold text-emerald-400">Save 40%</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Includes all 18 classes, recordings & certificate.</p>
              </div>

              {/* Cohort Details & Local Timezone Conversion */}
              {cohort && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-6 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-amber-300 font-bold">
                    <span>{cohort.batchName}</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-[10px]">Active</span>
                  </div>
                  
                  <div className="text-slate-300">
                    <p className="font-semibold text-white">Class Start Date:</p>
                    <p className="text-amber-200">{formatInTimezone(cohort.startDate, userTz, 'short')}</p>
                  </div>

                  <div className="text-slate-300">
                    <p className="font-semibold text-white flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      Live Schedule (in your timezone):
                    </p>
                    <p className="text-slate-300">
                      Every Saturday & Sunday at{' '}
                      <strong className="text-white">
                        {formatInTimezone(cohort.startDate, userTz, 'timeOnly')}
                      </strong>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Timezone: {userTz}</p>
                  </div>

                  {/* Seat urgency */}
                  <div className="pt-2 border-t border-amber-500/20">
                    <div className="flex justify-between text-[11px] mb-1 font-semibold">
                      <span className="text-amber-300">Batch Filling Fast</span>
                      <span className="text-white">{seatsLeft} seats left</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Checkout CTA */}
              {course.isComingSoon ? (
                /* PLACEHOLDER: Additional catalog placeholder, not yet open for enrollment */
                <button
                  disabled
                  className="w-full py-3.5 rounded-xl text-center font-bold text-sm bg-white/10 text-purple-300/70 border border-purple-500/30 cursor-not-allowed block"
                >
                  Coming Soon • Enrollment Opens Soon
                </button>
              ) : (
                <Link
                  href={`/checkout/${cohort?.id || 'cohort-wia-batch-1'}?currency=${currency}`}
                  className="gold-button w-full py-3.5 rounded-xl text-center font-bold text-sm shadow-xl shadow-amber-500/20 block"
                >
                  Enroll Now • Instant Access
                </Link>
              )}

              <div className="mt-4 space-y-1.5 text-[11px] text-slate-400 text-center">
                <p className="flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Secure checkout via Razorpay & Stripe</span>
                </p>
                <p>Attend live on Zoom/Meet or watch recordings anytime.</p>
              </div>

            </div>
          </div>

        </div>

        {/* Full 18-Class Curriculum Accordion */}
        <div className="py-12 border-t border-white/10">
          <div className="max-w-4xl mx-auto">
            
            <div className="text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Complete Syllabus</span>
              <h2 className="text-3xl font-black text-white mt-1">
                The 18-Class Master Curriculum
              </h2>
              {/* PLACEHOLDER: 3-week block structure */}
              <p className="text-sm text-slate-400 mt-2">
                Divided into 3 progressive blocks (18 classes) over 9 weeks from cosmic fundamentals to real chart synthesis.
              </p>
            </div>

            <div className="space-y-6">
              {course.modules.map((mod) => {
                const isExpanded = openModule === mod.moduleNumber;
                const modClasses = classes.filter((c) => c.moduleNumber === mod.moduleNumber);

                return (
                  <div
                    key={mod.id}
                    className="rounded-2xl border border-white/10 bg-[#0d121f] overflow-hidden transition"
                  >
                    {/* Header */}
                    <button
                      onClick={() => setOpenModule(isExpanded ? null : mod.moduleNumber)}
                      className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-white/[0.02] transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-sm border border-amber-500/30 shrink-0">
                          M{mod.moduleNumber}
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-bold text-white">
                            {mod.title}
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {mod.classCount} Classes • Classes {mod.classNumbers.join(', ')}
                          </p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-amber-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                      )}
                    </button>

                    {/* Classes inside Module */}
                    {isExpanded && (
                      <div className="px-6 pb-6 pt-2 border-t border-white/5 space-y-4">
                        <p className="text-xs text-slate-400 italic mb-3">{mod.description}</p>
                        
                        <div className="space-y-3">
                          {modClasses.map((cls) => (
                            <div
                              key={cls.id}
                              className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                                    Class {cls.classNumber}:
                                  </span>
                                  <h4 className="text-sm font-semibold text-white">
                                    {cls.title}
                                  </h4>
                                </div>
                                <p className="text-xs text-slate-400">{cls.description}</p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[11px] text-slate-400 px-2.5 py-1 rounded bg-white/5 border border-white/10 font-mono">
                                  {cls.durationMinutes} mins
                                </span>
                                {cls.recording ? (
                                  <span className="text-[11px] text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 font-medium">
                                    Recording Ready
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-amber-300 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 font-medium">
                                    Live Session
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </div>

        {/* What You Will Learn Grid */}
        <div className="py-16 border-t border-white/10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-10">
              Core Skills You Will Graduate With
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {course.whatYouWillLearn.map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-slate-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
