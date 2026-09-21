'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  CheckCircle2,
  Calendar,
  Clock,
  Video,
  Award,
  ShieldCheck,
  ChevronRight,
  Globe,
  ArrowRight,
  BookOpen,
  ExternalLink,
  Flame
} from 'lucide-react';
import { ViarStore } from '@/lib/store';
import { Course, Cohort } from '@/lib/types';
import { formatInTimezone, getUserLocalTimezone } from '@/lib/timezones';

export default function HomePage() {
  const [course, setCourse] = useState<Course | null>(null);
  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [userTz, setUserTz] = useState<string>('Asia/Kolkata');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const flagship = ViarStore.getCourseBySlug('what-is-astrology');
    if (flagship) setCourse(flagship);

    const cohorts = ViarStore.getCohorts('course-what-is-astrology');
    if (cohorts.length > 0) setCohort(cohorts[0]);

    const tz = ViarStore.getTimezone() || getUserLocalTimezone();
    setUserTz(tz);

    const handleTzChange = () => {
      setUserTz(ViarStore.getTimezone());
    };
    window.addEventListener('timezone-changed', handleTzChange);
    return () => window.removeEventListener('timezone-changed', handleTzChange);
  }, []);

  return (
    <div className="cosmic-bg min-h-screen">
      
      {/* Top Notification Banner */}
      <div className="bg-gradient-to-r from-amber-600/20 via-amber-500/30 to-amber-600/20 border-b border-amber-500/30 py-2.5 px-4 text-center">
        <p className="text-xs md:text-sm text-amber-200 font-medium flex items-center justify-center gap-2 flex-wrap">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="font-bold text-amber-300">Cohort 01 Enrolling:</span> Flagship 9-Week Batch Starts October 3, 2026. Only {cohort ? cohort.maxSeats - cohort.enrolledCount : 18} seats remaining!
          <Link href="/courses/what-is-astrology" className="underline font-bold text-white hover:text-amber-100 ml-1">
            Claim Your Seat &rarr;
          </Link>
        </p>
      </div>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 md:pt-24 md:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-4xl mx-auto">
            
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-6 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Vedic Jyotish Academy • By Aapka Astro</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] mb-6">
              Learn Vedic Astrology <br className="hidden sm:inline" />
              <span className="gold-gradient-text">From Sacred Principles</span> <br className="hidden sm:inline" />
              to Real Chart Mastery
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10 font-normal">
              A comprehensive online education platform run by <strong className="text-amber-300">Acharya Dr. Hemant Vashishta</strong> (founder of <a href="https://aapkaastro.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">Aapka Astro</a>). 
              18 live cohort classes, HD recording archives, automated timezone sync, and a verifiable final certification.
            </p>

            {/* CTA Group */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                href="/courses/what-is-astrology"
                className="gold-button w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 group"
              >
                <span>Enroll in &quot;What is Astrology&quot;</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
              </Link>
              <Link
                href="/courses"
                className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition flex items-center justify-center gap-2"
              >
                <BookOpen className="w-5 h-5 text-amber-400" />
                <span>Browse Course Catalog</span>
              </Link>
            </div>

            {/* Key Trust Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto pt-4 border-t border-white/10 text-left">
              <div className="p-3 rounded-lg bg-white/[0.02]">
                <p className="text-2xl font-bold text-white">18 Classes</p>
                <p className="text-xs text-slate-400">2 live classes/week for 9 weeks</p>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02]">
                <p className="text-2xl font-bold text-amber-400">Live or Replay</p>
                <p className="text-xs text-slate-400">Both count 100% toward course</p>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02]">
                <p className="text-2xl font-bold text-white">No Gate</p>
                <p className="text-xs text-slate-400">Pass final exam to get certified</p>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02]">
                <p className="text-2xl font-bold text-amber-400">Aapka Astro</p>
                <p className="text-xs text-slate-400">35,000+ client consultations lineage</p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* The Viar.in Business Model & Education Architecture */}
      <section className="py-20 bg-[#090d16] border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">
              Engineered For Serious Students Worldwide
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
              Why Viar.in Sets the Global Standard for Astrology Education
            </h3>
            <p className="text-slate-400 text-sm sm:text-base mt-4 leading-relaxed">
              No dogmatic superstitions. No attendance penalties. Real Vedic mathematics, psychological archetypes, and clinical chart analysis delivered with student-first flexibility.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Pillar 1 */}
            <div className="cosmic-card p-8 rounded-2xl border border-white/10 flex flex-col justify-between relative group hover:border-amber-500/40 transition">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition">
                  <Video className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-white mb-3">
                  Live Zoom Classes + Instant HD Archives
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Join live interactive classes on Zoom or Google Meet with direct Q&A. Missed a session? Every class is archived in crystal-clear HD with downloadable slide decks and summary notes within hours.
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-white/10 text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Replays count identically to live attendance</span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="cosmic-card p-8 rounded-2xl border border-white/10 flex flex-col justify-between relative group hover:border-amber-500/40 transition">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition">
                  <Globe className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-white mb-3">
                  Automatic Local Timezone Synchronization
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Students join us from New York, London, Dubai, Mumbai, and Sydney. The platform detects your local browser timezone and presents every class time in your exact clock time, with 1-click Google Calendar sync.
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-white/10 text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Your detected timezone: {userTz}</span>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="cosmic-card p-8 rounded-2xl border border-white/10 flex flex-col justify-between relative group hover:border-amber-500/40 transition">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition">
                  <Award className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-white mb-3">
                  Exam-Based Verifiable Certification
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  We don&apos;t lock certificates behind arbitrary attendance thresholds. Complete the 18 classes at your own rhythm and pass the 20-question Final Certification Exam to earn an authentic, verifiable credential.
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-white/10 text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Public verification URL with unique hash</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Flagship Course Spotlight */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="bg-gradient-to-b from-[#111827] to-[#0d131f] rounded-3xl border border-amber-500/30 p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-2xl">
            
            {/* Top Badge */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-2">
                <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  Flagship Course Enrolling Now
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-slate-300 border border-white/10">
                  Beginner to Intermediate
                </span>
              </div>

              {cohort && (
                <div className="text-xs text-slate-300 flex items-center gap-2 bg-white/[0.04] px-3.5 py-1.5 rounded-xl border border-white/10">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Batch starts: <strong className="text-white">{formatInTimezone(cohort.startDate, userTz, 'short')}</strong></span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              <div className="lg:col-span-7">
                <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
                  What is Astrology: The Foundational Immersion
                </h3>
                <p className="text-lg text-amber-300/90 font-medium mb-6">
                  18 Live Classes • 2 Classes Per Week • 9-Week Live Batch • Final Test & Certificate
                </p>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
                  Decode the profound science of light (Jyotish). Over 9 rigorous weeks, you will master the 12 signs, 9 grahas, 12 houses, planetary aspects, and the 5-step framework to read any North or South Indian birth chart with clinical precision.
                </p>

                {/* Modules quick preview */}
                <div className="space-y-3 mb-8">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-center">1</span>
                      <span className="text-sm font-semibold text-white">Module 1: Cosmic Geometry & Panchanga (Classes 1–4)</span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">4 Classes</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-center">2</span>
                      <span className="text-sm font-semibold text-white">Module 2: The 12 Signs (Rashis) & Elements (Classes 5–8)</span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">4 Classes</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-center">3</span>
                      <span className="text-sm font-semibold text-white">Module 3: The 9 Grahas & Planetary Dignities (Classes 9–12)</span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">4 Classes</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-center">4</span>
                      <span className="text-sm font-semibold text-white">Module 4: The 12 Houses of Human Life (Classes 13–15)</span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">3 Classes</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-center">5</span>
                      <span className="text-sm font-semibold text-white">Module 5: 5-Step Chart Synthesis & Exam Prep (Classes 16–18)</span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">3 Classes</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href="/courses/what-is-astrology"
                    className="gold-button px-7 py-3.5 rounded-xl text-sm font-bold flex items-center gap-2"
                  >
                    <span>View Complete 18-Class Syllabus</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/checkout/${cohort?.id || 'cohort-wia-batch-1'}`}
                    className="px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-white/10 hover:bg-white/15 border border-white/15 transition"
                  >
                    Quick Enroll Now
                  </Link>
                </div>
              </div>

              {/* Course Card Summary */}
              <div className="lg:col-span-5">
                <div className="cosmic-card p-6 sm:p-8 rounded-2xl border border-amber-500/30 bg-[#090d16]/90">
                  
                  <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">One-Time Tuition</p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl sm:text-4xl font-black text-white">₹14,999</span>
                        <span className="text-sm text-slate-500 line-through">₹24,999</span>
                        <span className="text-xs font-bold text-amber-400">/ $199 USD</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                      40% OFF Launch
                    </span>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">18 Live interactive 90-minute classes on Zoom</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">Lifetime access to all video recordings & notes</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">Timezone-aware scheduling tailored to your country</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">Direct chart review with Acharya Dr. Hemant</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">Verifiable Viar.in Academy Graduate Certificate</span>
                    </div>
                  </div>

                  <Link
                    href={`/checkout/${cohort?.id || 'cohort-wia-batch-1'}`}
                    className="gold-button w-full py-4 rounded-xl text-center font-bold text-base shadow-lg shadow-amber-500/20 block"
                  >
                    Enroll Now • One-Time Payment
                  </Link>

                  <p className="text-center text-xs text-slate-400 mt-3 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Instant access to dashboard upon checkout</span>
                  </p>

                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* Instructor / Lineage Section */}
      <section className="py-20 bg-[#090d16] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5 text-center lg:text-left">
              <div className="relative inline-block">
                <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-2xl mx-auto">
                  <img
                    src="https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=600&auto=format&fit=crop"
                    alt="Acharya Dr. Hemant Vashishta"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-4 -right-2 bg-[#0f172a] border border-amber-400/40 px-3.5 py-1.5 rounded-xl shadow-xl">
                  <p className="text-[11px] font-bold text-amber-300">Founder, Aapka Astro</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Master Instructor & Lineage</span>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 mb-4">
                Acharya Dr. Hemant Vashishta
              </h3>
              <p className="text-sm font-semibold text-amber-300 mb-6">
                Over 22 Years of Jyotish Practice • 35,000+ Consultations • Founder of Aapka Astro
              </p>
              <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
                <p>
                  &quot;Astrology is not about helpless superstition or fatalistic fortune-telling. It is the sacred mathematical science of cosmic resonance — understanding how planetary frequencies harmonize with human psychology and karmic timing.&quot;
                </p>
                <p>
                  Having served thousands of clients across India, North America, Europe, and the Middle East through his consultation platform <a href="https://aapkaastro.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline font-semibold">Aapka Astro (aapkaastro.com)</a>, Acharya Dr. Hemant created <strong>Viar.in</strong> to train the next generation of genuine astrological practitioners.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="https://aapkaastro.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 flex items-center gap-2 transition"
                >
                  <span>Visit AapkaAstro.com Consultation Site</span>
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                </a>
                <Link
                  href="/courses/what-is-astrology"
                  className="px-5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-xs font-semibold text-amber-300 transition"
                >
                  Join Acharya&apos;s Upcoming Cohort
                </Link>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* Multi-Course Academy Preview */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">
                Multi-Course Academic Curriculum
              </h2>
              <h3 className="text-3xl font-extrabold text-white">
                Upcoming Courses in the Viar Catalog
              </h3>
            </div>
            <Link
              href="/courses"
              className="mt-4 md:mt-0 text-sm font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1.5"
            >
              <span>Explore All Courses</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Course 1 Card */}
            <div className="cosmic-card p-8 rounded-2xl border border-amber-500/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Flagship Course
                  </span>
                  <span className="text-xs text-slate-400">18 Classes • 9 Weeks</span>
                </div>
                <h4 className="text-2xl font-bold text-white mb-2">
                  What is Astrology: The Complete Foundational Immersion
                </h4>
                <p className="text-sm text-slate-300 mb-6">
                  The complete entry point. Master signs, planets, houses, chart layouts, and the 5-step clinical reading method.
                </p>
                <div className="space-y-2 mb-6 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Includes 18 live Zoom sessions + full recording archives</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Final test with verifiable certificate of completion</span>
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Tuition</span>
                  <span className="text-lg font-bold text-white">₹14,999 <span className="text-xs text-amber-400">/ $199</span></span>
                </div>
                <Link
                  href="/courses/what-is-astrology"
                  className="gold-button px-5 py-2.5 rounded-xl text-xs font-bold"
                >
                  View Course Details
                </Link>
              </div>
            </div>

            {/* Course 2 Card */}
            <div className="cosmic-card p-8 rounded-2xl border border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Intermediate Cohort
                  </span>
                  <span className="text-xs text-slate-400">16 Classes • 8 Weeks</span>
                </div>
                <h4 className="text-2xl font-bold text-white mb-2">
                  Predictive Astrology: Vimshottari Dasha & Transits
                </h4>
                <p className="text-sm text-slate-300 mb-6">
                  Master the clockwork of timing events. Pinpoint marriage, career promotions, relocations, and health milestones.
                </p>
                <div className="space-y-2 mb-6 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                    <span>Vimshottari Dasha down to Pratyantara cycles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                    <span>Jupiter & Saturn double-transit trigger rules</span>
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Tuition</span>
                  <span className="text-lg font-bold text-white">₹18,999 <span className="text-xs text-indigo-400">/ $249</span></span>
                </div>
                <Link
                  href="/courses"
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition"
                >
                  Learn More
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-20 bg-[#090d16] border-t border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">Clear Answers</h2>
            <h3 className="text-3xl font-extrabold text-white">Frequently Asked Questions</h3>
          </div>

          <div className="space-y-4">
            {course?.faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden transition"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 font-semibold text-white text-sm sm:text-base hover:text-amber-300 transition"
                  >
                    <span>{faq.question}</span>
                    <span className="text-amber-400 text-lg">{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-4 pt-1 text-sm text-slate-300 leading-relaxed border-t border-white/5">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Bottom Final CTA */}
      <section className="py-20 relative overflow-hidden text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-6 text-amber-400 shadow-xl shadow-amber-500/10">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">
            Begin Your Sacred Journey in Jyotish
          </h2>
          <p className="text-slate-300 max-w-xl mx-auto text-base mb-8">
            Seats in Cohort 01 of &quot;What is Astrology&quot; are strictly capped at 60 students to ensure personal interaction with Acharya Dr. Hemant.
          </p>
          <Link
            href="/courses/what-is-astrology"
            className="gold-button inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold shadow-2xl shadow-amber-500/30"
          >
            <span>Enroll in Cohort 01 Today</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

    </div>
  );
}
