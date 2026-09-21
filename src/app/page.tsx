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
  Flame,
  Star
} from 'lucide-react';
import { ViarStore } from '@/lib/store';
import { Course, Cohort } from '@/lib/types';
import { formatInTimezone, getUserLocalTimezone } from '@/lib/timezones';
import { PLACEHOLDER_TESTIMONIALS } from '@/lib/data';
import { SISTER_SERVICES } from '@/config/services';

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
      {/* PLACEHOLDER: replace with real content */}
      <div className="bg-gradient-to-r from-amber-600/20 via-amber-500/30 to-amber-600/20 border-b border-amber-500/30 py-2.5 px-4 text-center">
        <p className="text-xs md:text-sm text-amber-200 font-medium flex items-center justify-center gap-2 flex-wrap">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="font-bold text-amber-300">Cohort Enrolling:</span> {cohort?.batchName || 'Batch — Starting [Month Year]'} (Capacity: {cohort?.maxSeats || 50} students). Only {cohort ? cohort.maxSeats - cohort.enrolledCount : 12} seats remaining!
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
            {/* PLACEHOLDER: replace with real instructor bio */}
            <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10 font-normal">
              A comprehensive online education platform run by <strong className="text-amber-300">Acharya [ASTROLOGER NAME]</strong> (founder of <a href="https://aapkaastro.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">Aapka Astro</a>). 
              With over [X] years of experience in Vedic astrology, Vastu Shastra, and gemstone science, trusted by a growing community of over 26,000 followers.
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
                {/* PLACEHOLDER: replace with real title */}
                <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
                  What is Astrology — Foundations of Vedic Astrology
                </h3>
                {/* PLACEHOLDER: replace with real format details */}
                <p className="text-lg text-amber-300/90 font-medium mb-6">
                  18 Live Classes • 2 Per Week • 9 Weeks (~60–90 mins each) • Final Graded Quiz & Certificate
                </p>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
                  A structured 9-week immersion arranged into three progressive blocks. Move with confidence from foundational astronomical mechanics to reading complete birth charts and deciphering life themes.
                </p>

                {/* Structure: roughly 3-week blocks */}
                {/* PLACEHOLDER: replace with real block structure */}
                <div className="space-y-3 mb-8">
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-center">1</span>
                      <div>
                        <span className="text-sm font-semibold text-white">Weeks 1–3: History & Fundamentals of Astrology</span>
                        <p className="text-[11px] text-slate-400">Cosmology, Karma model, Zodiac belt, and Panchanga</p>
                      </div>
                    </div>
                    <span className="text-xs text-amber-300 font-medium">Classes 1–6</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-center">2</span>
                      <div>
                        <span className="text-sm font-semibold text-white">Weeks 4–6: Reading a Birth Chart</span>
                        <p className="text-[11px] text-slate-400">North & South Indian Kundalis, Lagna, and 12 Rashis</p>
                      </div>
                    </div>
                    <span className="text-xs text-amber-300 font-medium">Classes 7–12</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-center">3</span>
                      <div>
                        <span className="text-sm font-semibold text-white">Weeks 7–9: Planets, Houses & Basic Predictions</span>
                        <p className="text-[11px] text-slate-400">9 Grahas, 12 Bhavas, 5-Step Synthesis & Final Graded Quiz</p>
                      </div>
                    </div>
                    <span className="text-xs text-amber-300 font-medium">Classes 13–18</span>
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
                      {/* PLACEHOLDER: Tuition is admin-editable */}
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">One-Time Tuition</p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl sm:text-4xl font-black text-white">₹4,999</span>
                        <span className="text-sm text-slate-500 line-through">₹9,999</span>
                        <span className="text-xs font-bold text-amber-400">/ $69 USD</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                      50% OFF Launch
                    </span>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">18 Live interactive classes (~60–90 mins each)</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">Final assessment: 20-question graded quiz with certificate</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">Capacity capped at 50 students per cohort</span>
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
                      {/* PLACEHOLDER: replace with real instructor name */}
                      <span className="text-sm text-slate-300">Direct chart review with Acharya [ASTROLOGER NAME]</span>
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
      {/* PLACEHOLDER: replace with real content */}
      <section className="py-20 bg-[#090d16] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5 text-center lg:text-left">
              <div className="relative inline-block">
                <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-2xl mx-auto">
                  <img
                    src="https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=600&auto=format&fit=crop"
                    alt="Acharya [ASTROLOGER NAME]"
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
              {/* PLACEHOLDER: replace with real instructor name */}
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 mb-4">
                Acharya [ASTROLOGER NAME]
              </h3>
              {/* PLACEHOLDER: replace with real experience stats */}
              <p className="text-sm font-semibold text-amber-300 mb-6">
                Founder, Aapka Astro • Vedic Astrology, Vastu Shastra & Gemstone Science • 26,000+ Followers
              </p>
              {/* PLACEHOLDER: reuse consistent bio language */}
              <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
                <p>
                  &quot;Acharya [ASTROLOGER NAME], with over [X] years of experience in Vedic astrology, Vastu Shastra, and gemstone science, trusted by a growing community of over 26,000 followers.&quot;
                </p>
                <p>
                  Having served thousands of clients across India, North America, Europe, and the Middle East through his consultation platform <a href="https://aapkaastro.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline font-semibold">Aapka Astro (aapkaastro.com)</a>, Acharya [ASTROLOGER NAME] created <strong>Viar.in</strong> to systematically train serious students through deep cohort immersions.
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
            
            {/* Flagship Course Card */}
            {/* PLACEHOLDER: replace with real content */}
            <div className="cosmic-card p-8 rounded-2xl border border-amber-500/40 bg-[#111827]/80 ring-1 ring-amber-500/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Flagship Cohort
                  </span>
                  <span className="text-xs text-slate-400">18 Classes • 9 Weeks</span>
                </div>
                <h4 className="text-2xl font-bold text-white mb-2">
                  What is Astrology — Foundations of Vedic Astrology
                </h4>
                <p className="text-sm text-slate-300 mb-6">
                  Learn the sacred science of Jyotish from first principles to real chart readings across 3 cohesive blocks.
                </p>
                <div className="space-y-2 mb-6 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Includes 18 live Zoom sessions + full recording archives</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Final 20-question graded quiz with verifiable certificate</span>
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Tuition</span>
                  <span className="text-lg font-bold text-white">₹4,999 <span className="text-xs text-amber-400">/ $69 USD</span></span>
                </div>
                <Link
                  href="/courses/what-is-astrology"
                  className="gold-button px-5 py-2.5 rounded-xl text-xs font-bold"
                >
                  View Course Details
                </Link>
              </div>
            </div>

            {/* PLACEHOLDER: Additional catalog placeholder */}
            <div className="cosmic-card p-8 rounded-2xl border border-purple-500/30 bg-[#0d101a]/90 opacity-95 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    Coming Soon
                  </span>
                  <span className="text-xs text-slate-400">12 Classes • 6 Weeks</span>
                </div>
                <h4 className="text-2xl font-bold text-white mb-2">
                  Vastu Shastra for Your Home
                </h4>
                <p className="text-sm text-slate-300 mb-6">
                  Harmonize living spaces with cosmic directional energies, 8 compass deities, and non-demolition remedies.
                </p>
                <div className="space-y-2 mb-6 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    <span>Vastu Purusha Mandala layout calculation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    <span>Practical spatial alignment for health and peace</span>
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Expected Tuition</span>
                  <span className="text-lg font-bold text-white">₹5,999 <span className="text-xs text-purple-400">/ $79 USD</span></span>
                </div>
                {/* PLACEHOLDER: Not yet open for enrollment */}
                <button
                  disabled
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 text-purple-300/70 border border-purple-500/20 cursor-not-allowed"
                >
                  Coming Soon
                </button>
              </div>
            </div>

            {/* PLACEHOLDER: Additional catalog placeholder */}
            <div className="cosmic-card p-8 rounded-2xl border border-purple-500/30 bg-[#0d101a]/90 opacity-95 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    Coming Soon
                  </span>
                  <span className="text-xs text-slate-400">8 Classes • 4 Weeks</span>
                </div>
                <h4 className="text-2xl font-bold text-white mb-2">
                  Gemstone Science 101
                </h4>
                <p className="text-sm text-slate-300 mb-6">
                  The physics and metaphysics of Vedic Ratna therapy. Mineralogy, light refraction, and safe chart-based prescription rules.
                </p>
                <div className="space-y-2 mb-6 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    <span>The 9 Navaratnas & planetary frequencies</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    <span>Natural vs treated gemstone identification</span>
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Expected Tuition</span>
                  <span className="text-lg font-bold text-white">₹3,999 <span className="text-xs text-purple-400">/ $55 USD</span></span>
                </div>
                {/* PLACEHOLDER: Not yet open for enrollment */}
                <button
                  disabled
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 text-purple-300/70 border border-purple-500/20 cursor-not-allowed"
                >
                  Coming Soon
                </button>
              </div>
            </div>

            {/* PLACEHOLDER: Additional catalog placeholder */}
            <div className="cosmic-card p-8 rounded-2xl border border-purple-500/30 bg-[#0d101a]/90 opacity-95 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    Coming Soon
                  </span>
                  <span className="text-xs text-slate-400">8 Classes • 4 Weeks</span>
                </div>
                <h4 className="text-2xl font-bold text-white mb-2">
                  Numerology Basics
                </h4>
                <p className="text-sm text-slate-300 mb-6">
                  Decode destiny and life purpose through numerical vibrations. Moolank, Bhagyank, and personal year forecasting.
                </p>
                <div className="space-y-2 mb-6 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    <span>Psychic & Destiny number alignment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    <span>Name vibration tuning for career & relationships</span>
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Expected Tuition</span>
                  <span className="text-lg font-bold text-white">₹3,499 <span className="text-xs text-purple-400">/ $49 USD</span></span>
                </div>
                {/* PLACEHOLDER: Not yet open for enrollment */}
                <button
                  disabled
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 text-purple-300/70 border border-purple-500/20 cursor-not-allowed"
                >
                  Coming Soon
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Student Testimonials Section */}
      {/* PLACEHOLDER: replace with real student testimonials */}
      <section className="py-20 bg-[#090d16] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Student Experiences</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 mb-4">
              Trusted by Students Across India & Worldwide
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              {/* PLACEHOLDER: replace with real content */}
              Read authentic feedback from working professionals, educators, and global learners who study with Acharya [ASTROLOGER NAME].
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PLACEHOLDER_TESTIMONIALS.map((test) => (
              <div
                key={test.id}
                className="cosmic-card p-6 rounded-2xl border border-white/10 flex flex-col justify-between hover:border-amber-500/30 transition relative"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1">
                      {[...Array(test.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    {test.isInternational && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        International
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-amber-200 mb-2">
                    &ldquo;{test.highlight}&rdquo;
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed mb-6">
                    {test.content.replace('/* PLACEHOLDER */ ', '')}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white">{test.name}</h3>
                    <p className="text-[11px] text-slate-400">{test.role}</p>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {test.location}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* YouTube Preview Embed Section */}
      {/* PLACEHOLDER: replace with real YouTube embed */}
      <section className="py-20 bg-[#090d16] border-t border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-500/10 border border-red-500/25 text-red-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Video className="w-3.5 h-3.5 text-red-400" />
            <span>Sample Lecture Preview</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Experience the Teaching Method
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed mb-8">
            Watch a preview excerpt from Class 1 of <em>&ldquo;What is Astrology&rdquo;</em> with <strong className="text-amber-300">Acharya [ASTROLOGER NAME]</strong> as he explains how celestial geometry translates into human consciousness.
          </p>

          <div className="relative rounded-2xl overflow-hidden border-2 border-amber-500/30 shadow-2xl bg-black aspect-video max-w-4xl mx-auto">
            <iframe
              src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0"
              title="Viar.in Masterclass Preview"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full object-cover"
            ></iframe>
          </div>

          <p className="text-xs text-slate-400 mt-4 flex items-center justify-center gap-2">
            <span>Official YouTube Channel:</span>
            {/* PLACEHOLDER: replace with client channel link */}
            <a
              href="https://youtube.com/@aapkaastro_official"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 underline font-medium inline-flex items-center gap-1"
            >
              @aapkaastro_official <ExternalLink className="w-3 h-3 inline" />
            </a>
          </p>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-20 bg-[#070b12] border-t border-white/10">
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

      {/* "Our Other Services" Cross-Promotion Section */}
      <section className="py-20 bg-gradient-to-b from-[#090d16] to-[#0d121f] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Ecosystem & Lineage</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 mb-4">
              Our Other Services
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Viar.in is part of a unified ecosystem founded by Acharya [ASTROLOGER NAME]. Whether you require personal astrological consultations or strategic enterprise advisory, explore our sister platforms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* Sister Site 1: Aapka Astro */}
            <div className="cosmic-card p-8 rounded-2xl border border-amber-500/30 hover:border-amber-400/50 transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {SISTER_SERVICES.aapkaAstro.badge}
                  </span>
                  <ExternalLink className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{SISTER_SERVICES.aapkaAstro.name}</h3>
                <p className="text-xs font-semibold text-amber-300 mb-4">{SISTER_SERVICES.aapkaAstro.domain} • 35,000+ Consultations</p>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  {SISTER_SERVICES.aapkaAstro.description}
                </p>
              </div>
              <div className="pt-6 border-t border-white/10">
                <a
                  href={SISTER_SERVICES.aapkaAstro.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gold-button w-full py-3 rounded-xl text-xs font-bold text-center block"
                >
                  {SISTER_SERVICES.aapkaAstro.ctaText} &rarr;
                </a>
              </div>
            </div>

            {/* Sister Site 2: DOW Consulting */}
            <div className="cosmic-card p-8 rounded-2xl border border-sky-500/30 hover:border-sky-400/50 transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    {SISTER_SERVICES.dowConsulting.badge}
                  </span>
                  <ExternalLink className="w-4 h-4 text-sky-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{SISTER_SERVICES.dowConsulting.name}</h3>
                <p className="text-xs font-semibold text-sky-300 mb-4">{SISTER_SERVICES.dowConsulting.domain} • Enterprise Advisory</p>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  {SISTER_SERVICES.dowConsulting.description}
                </p>
              </div>
              <div className="pt-6 border-t border-white/10">
                <a
                  href={SISTER_SERVICES.dowConsulting.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 rounded-xl text-xs font-bold text-center block bg-sky-600/20 hover:bg-sky-600/30 text-sky-200 border border-sky-500/40 transition"
                >
                  {SISTER_SERVICES.dowConsulting.ctaText} &rarr;
                </a>
              </div>
            </div>

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
          {/* PLACEHOLDER: replace with real content */}
          <p className="text-slate-300 max-w-xl mx-auto text-base mb-8">
            Seats in the upcoming cohort of &quot;What is Astrology&quot; are strictly capped at 50 students to ensure personal interaction with Acharya [ASTROLOGER NAME].
          </p>
          <Link
            href="/courses/what-is-astrology"
            className="gold-button inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold shadow-2xl shadow-amber-500/30"
          >
            <span>Enroll in Cohort Today</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

    </div>
  );
}
