'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Star,
  Globe,
  Bell,
} from 'lucide-react';
import { ViarStore } from '@/lib/store';
import { Course, Cohort, ScheduledClass } from '@/lib/types';
import { formatInTimezone, getUserLocalTimezone } from '@/lib/timezones';
import { PLACEHOLDER_TESTIMONIALS } from '@/lib/data';

interface CourseDetailClientProps {
  slug: string;
}

export default function CourseDetailClient({ slug }: CourseDetailClientProps) {
  const [course, setCourse] = useState<Course | null>(null);
  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [classes, setClasses] = useState<ScheduledClass[]>([]);
  const [userTz, setUserTz] = useState<string>('Asia/Kolkata');
  const [openModule, setOpenModule] = useState<number | null>(1);
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySuccess, setNotifySuccess] = useState(false);

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

    // Auto-detect currency based on geo-IP / timezone, overridable by the user
    const savedCurrency = (typeof window !== 'undefined' ? localStorage.getItem('viar_user_currency') : null) as 'INR' | 'USD' | null;
    if (savedCurrency) {
      setCurrency(savedCurrency);
    } else {
      const isIndiaTimezone = tz.toLowerCase().includes('kolkata') || tz.toLowerCase().includes('calcutta') || tz.toLowerCase().includes('india');
      setCurrency(isIndiaTimezone ? 'INR' : 'USD');
    }

    const handleTzChange = () => {
      setUserTz(ViarStore.getTimezone());
    };
    window.addEventListener('storage', handleTzChange);
    return () => window.removeEventListener('storage', handleTzChange);
  }, [slug]);

  const handleCurrencySwitch = (newCurr: 'INR' | 'USD') => {
    setCurrency(newCurr);
    if (typeof window !== 'undefined') {
      localStorage.setItem('viar_user_currency', newCurr);
    }
  };

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail || !course) return;
    ViarStore.saveNotifyMeLead({
      courseId: course.id,
      courseTitle: course.title,
      email: notifyEmail,
    });
    setNotifySuccess(true);
    setNotifyEmail('');
  };

  if (!course) {
    return (
      <div className="min-h-screen cosmic-bg flex items-center justify-center p-4">
        <Sparkles className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  const isComingSoon = course.isComingSoon || !course.isPublished;
  const price = currency === 'INR' ? `₹${course.priceInr.toLocaleString('en-IN')}` : `$${course.priceUsd} USD`;
  const originalPrice = currency === 'INR' ? `₹${course.originalPriceInr.toLocaleString('en-IN')}` : `$${course.originalPriceUsd} USD`;
  const savings = currency === 'INR' 
    ? `Save ₹${(course.originalPriceInr - course.priceInr).toLocaleString('en-IN')}` 
    : `Save $${course.originalPriceUsd - course.priceUsd} USD`;

  return (
    <div className="cosmic-bg min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-8">
          <Link href="/" className="hover:text-white transition">Home</Link>
          <span>/</span>
          <Link href="/courses" className="hover:text-white transition">Courses</Link>
          <span>/</span>
          <span className="text-amber-400 font-medium truncate max-w-xs">{course.title}</span>
        </div>

        {/* Hero Banner Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-16">
          
          {/* Main Course Info (Left 7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                {course.badge || 'Cohort-Based Masterclass'}
              </span>
              <span className="text-xs text-slate-400">
                Level: <strong className="text-slate-200">{course.level}</strong>
              </span>
              <span className="text-xs text-slate-400">
                Language: <strong className="text-slate-200">English + Hindi Technical Terms</strong>
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
              {course.title}
            </h1>

            <p className="text-lg sm:text-xl text-amber-200/90 font-medium leading-relaxed">
              {course.tagline}
            </p>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {course.description}
            </p>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="block text-[11px] text-slate-400 uppercase tracking-wider">Format</span>
                <span className="text-sm font-bold text-white">{course.totalClasses} Live Classes</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="block text-[11px] text-slate-400 uppercase tracking-wider">Duration</span>
                <span className="text-sm font-bold text-white">{course.durationWeeks} Weeks (2/wk)</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="block text-[11px] text-slate-400 uppercase tracking-wider">Class Length</span>
                <span className="text-sm font-bold text-white">~60–90 Mins</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="block text-[11px] text-slate-400 uppercase tracking-wider">Credential</span>
                <span className="text-sm font-bold text-amber-300">Exam & Certificate</span>
              </div>
            </div>

            {/* Instructor Quick Intro */}
            <div className="p-5 rounded-2xl cosmic-card border border-white/10 flex items-start gap-4 mt-6">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-amber-500/40 shrink-0">
                <Image
                  src={course.instructor.avatarUrl}
                  alt={course.instructor.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{course.instructor.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Lead Astrologer
                  </span>
                </div>
                <p className="text-xs text-amber-400/90 font-medium">
                  Founder, Aapka Astro • {course.instructor.experienceYears}+ Years Vedic Experience
                </p>
                {/* PLACEHOLDER: replace with real content */}
                <p className="text-xs text-slate-400 leading-relaxed pt-1">
                  {course.instructor.bio}
                </p>
              </div>
            </div>

          </div>

          {/* Enrollment Card & Pricing (Right 5 cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-amber-500/40 shadow-2xl shadow-amber-500/10 space-y-6 relative overflow-hidden">
              
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

              {/* Currency Selector Toggle */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Globe className="w-3.5 h-3.5 text-amber-400" />
                  <span>Currency:</span>
                </div>
                <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
                  <button
                    onClick={() => handleCurrencySwitch('INR')}
                    className={`px-3 py-1 rounded-lg font-bold transition ${
                      currency === 'INR'
                        ? 'bg-amber-500 text-black shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ₹ INR (India)
                  </button>
                  <button
                    onClick={() => handleCurrencySwitch('USD')}
                    className={`px-3 py-1 rounded-lg font-bold transition ${
                      currency === 'USD'
                        ? 'bg-amber-500 text-black shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    $ USD (Intl)
                  </button>
                </div>
              </div>

              {/* Pricing Display */}
              <div>
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider mb-1">
                  One-Time Cohort Tuition
                </span>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-black text-white">{price}</span>
                  <span className="text-base text-slate-500 line-through">{originalPrice}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    50% Off Launch
                  </span>
                </div>
                <p className="text-xs text-amber-400/90 font-medium mt-1">
                  {savings} • All 18 live classes + lifetime recordings + certificate included
                </p>
              </div>

              {/* Cohort Batch Details */}
              {cohort && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Upcoming Cohort</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300">
                      {cohort.batchName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Class Schedule</span>
                    <span className="font-semibold text-white">{cohort.scheduleDescription}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Cohort Starts</span>
                    <span className="font-semibold text-white">
                      {formatInTimezone(cohort.startDate, userTz, 'dateOnly')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                    <span className="text-slate-400">Batch Capacity</span>
                    <span className="font-semibold text-amber-400">
                      Capped at {cohort.capacity || cohort.maxSeats} seats ({(cohort.capacity || cohort.maxSeats) - cohort.enrolledCount} seats left)
                    </span>
                  </div>
                </div>
              )}

              {/* CTA Action */}
              {isComingSoon ? (
                <div className="space-y-4 pt-2">
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block mb-1">
                      Curriculum in Preparation
                    </span>
                    <p className="text-xs text-slate-300">
                      Enrollment for this syllabus opens shortly. Enter your email for priority batch admission.
                    </p>
                  </div>

                  {notifySuccess ? (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                      <p className="text-xs font-bold text-emerald-300">You are on the priority VIP list!</p>
                      <p className="text-[11px] text-slate-400">We will email you the moment batch admissions open.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleNotifySubmit} className="space-y-2">
                      <input
                        type="email"
                        required
                        value={notifyEmail}
                        onChange={(e) => setNotifyEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="submit"
                        className="gold-button w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                      >
                        <Bell className="w-4 h-4" />
                        <span>Notify Me When Admissions Open</span>
                      </button>
                    </form>
                  )}
                </div>
              ) : cohort ? (
                <div className="space-y-3">
                  <Link
                    href={`/checkout/${cohort.id}?currency=${currency}`}
                    className="gold-button w-full py-3.5 rounded-2xl text-center font-black text-sm block shadow-lg shadow-amber-500/20 tracking-wide uppercase"
                  >
                    Enroll Now • {price}
                  </Link>

                  <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Secure checkout via {currency === 'INR' ? 'Razorpay (UPI / Cards / NetBanking)' : 'Stripe (International Cards)'}</span>
                  </p>
                </div>
              ) : null}

              {/* Guarantees Checklist */}
              <div className="pt-4 border-t border-white/10 space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>18 interactive live video classes with Acharya Niraj Kumar</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Permanent recording access uploaded within hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Graded 20-question final quiz + digital certificate</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Verifiable credential slug on viar.in/verify</span>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* 3-Week Blocks / Syllabus Section */}
        <div className="mb-20">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 block mb-2">
              Comprehensive 9-Week Syllabus
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              {course.totalClasses} Live Sessions Structured in 3-Week Mastery Blocks
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Every class is ~60–90 minutes of structured lecture, live birth chart demonstrations, and student Q&A.
            </p>
          </div>

          <div className="space-y-4 max-w-4xl mx-auto">
            {course.modules.map((module) => {
              const modNum = module.moduleNumber || module.number || 1;
              const isOpen = openModule === modNum;
              const moduleClasses = classes.filter((c) => {
                const num = c.classNumber || c.sessionNumber || 1;
                return (
                  module.classNumbers?.includes(num) ||
                  (num >= (modNum - 1) * 6 + 1 && num <= modNum * 6)
                );
              });
              const weeksLabel = module.weeks || `Weeks ${(modNum - 1) * 3 + 1}–${modNum * 3}`;
              const classRangeLabel = module.classRange || `${(modNum - 1) * 6 + 1}–${modNum * 6}`;

              return (
                <div
                  key={module.id}
                  className="cosmic-card rounded-2xl border border-white/10 overflow-hidden transition"
                >
                  <button
                    onClick={() => setOpenModule(isOpen ? null : modNum)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-white/[0.02] transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                          {weeksLabel}
                        </span>
                        <span className="text-xs text-slate-400">Classes {classRangeLabel}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white">{module.title}</h3>
                      <p className="text-xs text-slate-400">{module.description}</p>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-amber-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 pt-2 border-t border-white/5 space-y-3">
                      <div className="grid grid-cols-1 gap-2.5">
                        {moduleClasses.map((cls) => {
                          const clsNum = cls.classNumber || cls.sessionNumber || 1;
                          const classStartTime = cls.scheduledStartTime || cls.scheduledAt || new Date().toISOString();

                          return (
                            <div
                              key={cls.id}
                              className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                            >
                              <div className="flex items-start gap-3">
                                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                  {clsNum}
                                </span>
                                <div>
                                  <h4 className="text-xs font-semibold text-white">{cls.title}</h4>
                                  <p className="text-[11px] text-slate-400">{cls.description}</p>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="text-[11px] text-slate-400 block">
                                  {formatInTimezone(classStartTime, userTz, 'short')}
                                </span>
                                <span className="text-[10px] text-slate-500">~{cls.durationMinutes} minutes</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Final Assessment & Certificate Spotlight */}
        <div className="max-w-4xl mx-auto cosmic-card p-8 rounded-3xl border border-amber-500/30 mb-20 bg-gradient-to-r from-amber-500/10 via-transparent to-purple-500/10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="space-y-3">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 uppercase tracking-wide">
                Official Credential
              </span>
              <h3 className="text-2xl font-bold text-white">
                Final Graded Assessment & Verifiable Certificate
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Upon completing the 18 live classes (or watching their recording archives), students unlock the 20-question final exam. Passing with ≥70% immediately generates a verifiable digital certificate recognized across the Jyotish community.
              </p>
              <div className="flex items-center gap-4 text-xs text-amber-400 pt-2">
                <span>• 20 Multiple Choice Questions</span>
                <span>• Instant Automated Scoring</span>
                <span>• Unique Public Verification Slug</span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center shrink-0 w-full md:w-56">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-white block">Accredited by Viar.in</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Signed by Acharya Niraj Kumar</span>
            </div>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 block mb-2">
              Student Experiences
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Trusted by 26,000+ Followers & Worldwide Cohorts
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PLACEHOLDER_TESTIMONIALS.slice(0, 3).map((t) => (
              <div key={t.id} className="cosmic-card p-6 rounded-2xl border border-white/10 space-y-4">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <h4 className="text-sm font-bold text-white">&ldquo;{t.highlight}&rdquo;</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{t.content}</p>
                <div className="pt-2 border-t border-white/5">
                  <span className="text-xs font-semibold text-white block">{t.name}</span>
                  <span className="text-[10px] text-slate-400 block">{t.location} • {t.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto space-y-4 mb-16">
          <h3 className="text-2xl font-bold text-white text-center mb-6">Frequently Asked Questions</h3>
          {course.faqs.map((faq, idx) => (
            <div key={idx} className="cosmic-card p-5 rounded-2xl border border-white/5 space-y-2">
              <h4 className="text-sm font-bold text-white">{faq.question}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
