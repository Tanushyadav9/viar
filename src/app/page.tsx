'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  CheckCircle2,
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
  Star,
  Building2
} from 'lucide-react';
import { ViarStore } from '@/lib/store';
import { Course, Cohort } from '@/lib/types';
import { PLACEHOLDER_TESTIMONIALS } from '@/lib/data';
import { SISTER_SERVICES } from '@/config/services';
import { useLanguage } from '@/components/LanguageContext';
import { BUILTIN_CONTENT_DEFAULTS } from '@/lib/content/defaultContent';

export default function HomePage() {
  const { language } = useLanguage();
  const isHi = language === 'hi';
  const [course, setCourse] = useState<Course | null>(null);
  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [heroContent, setHeroContent] = useState<any>(() => BUILTIN_CONTENT_DEFAULTS.hero[0]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [faqsList, setFaqsList] = useState<any[]>(() => BUILTIN_CONTENT_DEFAULTS.faqs); // eslint-disable-line @typescript-eslint/no-explicit-any

  useEffect(() => {
    const flagship = ViarStore.getCourseBySlug('what-is-astrology');
    if (flagship) setCourse(flagship);

    const cohorts = ViarStore.getCohorts('course-what-is-astrology');
    if (cohorts.length > 0) setCohort(cohorts[0]);

    // Resilient dynamic content fetching with zero crash guarantee
    fetch('/api/content?collection=hero&key=homepage_main_hero')
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data.item) {
          setHeroContent(data.item);
        }
      })
      .catch(() => {});

    fetch('/api/content?collection=faqs')
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data.items && data.items.length > 0) {
          setFaqsList(data.items);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="cosmic-bg min-h-screen">
      
      {/* Top Notification Banner */}
      {/* Top Notification Banner */}
      <div className="bg-gradient-to-r from-amber-600/20 via-amber-500/30 to-amber-600/20 border-b border-amber-500/30 py-2.5 px-4 text-center">
        <p className="text-xs md:text-sm text-amber-200 font-medium flex items-center justify-center gap-2 flex-wrap">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="font-bold text-amber-300">Self-Paced Masterclass Open:</span> The Ultimate Astrology Course (23 Video Modules + 2 Bonus Workshops). Instant Lifetime Access!
          <Link href="/courses/what-is-astrology" className="underline font-bold text-white hover:text-amber-100 ml-1">
            Enroll Today &rarr;
          </Link>
        </p>
      </div>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 md:pt-24 md:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-4xl mx-auto">
            
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-6 backdrop-blur-md">
              <Image
                src="/images/logo-icon.png"
                alt="VIAR Logo"
                width={18}
                height={18}
                className="w-4 h-4 object-contain inline-block"
              />
              <span>
                {isHi
                  ? heroContent?.metadata?.badgeHi || heroContent?.metadata?.badgeEn || 'विहंगम ज्योतिष एवं अनुसंधान संस्थान • By Aapka Astro'
                  : heroContent?.metadata?.badgeEn || 'Vihangam Institute of Astrology and Research • By Aapka Astro'}
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] mb-6">
              {isHi && heroContent?.titleHi ? (
                heroContent.titleHi
              ) : (
                heroContent?.titleEn || (
                  <>
                    Learn Vedic Astrology <br className="hidden sm:inline" />
                    <span className="gold-gradient-text">From Sacred Principles</span> <br className="hidden sm:inline" />
                    to Real Chart Mastery
                  </>
                )
              )}
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10 font-normal">
              {isHi && heroContent?.contentHi ? (
                heroContent.contentHi
              ) : (
                heroContent?.contentEn || (
                  <>
                    A comprehensive self-paced video education platform run by <strong className="text-amber-300">Acharya Niraj Kumar</strong> (Jyotish Acharya, Bharatiya Vidya Bhavan New Delhi; founder of <a href="https://aapkaastro.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">Aapka Astro</a>). 
                    Blending 20+ years of traditional learning from Baidyanath Dham (Deoghar) with 20+ years of senior executive leadership, trusted by students and clients across India and abroad, and backed by a community of 26,000+ followers.
                  </>
                )
              )}
            </p>

            {/* CTA Group */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                href="/courses/what-is-astrology"
                className="gold-button w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 group"
              >
                <span>Start Learning Today</span>
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
                <p className="text-2xl font-bold text-white">23 Modules</p>
                <p className="text-xs text-slate-400">Comprehensive video masterclass</p>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02]">
                <p className="text-2xl font-bold text-amber-400">Self-Paced</p>
                <p className="text-xs text-slate-400">Learn on your own schedule</p>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02]">
                <p className="text-2xl font-bold text-white">2 Bonus Cases</p>
                <p className="text-xs text-slate-400">Career &amp; Marriage chart analysis</p>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02]">
                <p className="text-2xl font-bold text-amber-400">VIAR Certified</p>
                <p className="text-xs text-slate-400">Verifiable academic credential</p>
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
                  23 On-Demand Video Modules
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Complete foundational-to-advanced curriculum taught by Acharya Niraj Kumar. Pause, rewind, and re-watch anytime with lifetime access, downloadable chart templates, and study cheatsheets.
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-white/10 text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Lifetime access on all mobile &amp; desktop devices</span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="cosmic-card p-8 rounded-2xl border border-white/10 flex flex-col justify-between relative group hover:border-amber-500/40 transition">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition">
                  <Clock className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-white mb-3">
                  100% Self-Paced • Zero Schedule Stress
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  No live Zoom scheduling pressure or timezone conflicts. Progress at whatever pace fits your personal and professional lifestyle, with active academic discussion support.
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-white/10 text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-amber-400" />
                <span>Learn at your own pace from anywhere in the world</span>
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
                  Demonstrate true chart reading competency by taking the 20-question final exam. Pass with 70%+ to receive your official certificate from Vihangam Institute of Astrology and Research.
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-white/10 text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Public verification URL at viar.in/verify</span>
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
                  Self-Paced Masterclass Open Now
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-slate-300 border border-white/10">
                  Beginner to Advanced Chart Reading
                </span>
              </div>

              <div className="text-xs text-slate-300 flex items-center gap-2 bg-white/[0.04] px-3.5 py-1.5 rounded-xl border border-white/10">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Instant Access: <strong className="text-white">Start Watching Immediately</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              <div className="lg:col-span-7">
                <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
                  The Ultimate Astrology Course: Foundations to Chart Mastery
                </h3>
                <p className="text-lg text-amber-300/90 font-medium mb-6">
                  23 On-Demand Video Modules • 2 Bonus Chart Workshops • Complete Self-Paced Access • Graded Exam &amp; Certificate
                </p>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
                  A structured masterclass arranged into five comprehensive curriculum pillars and two bonus case studies. Move with confidence from foundational astronomical mechanics to reading complete birth charts and deciphering life themes.
                </p>

                {/* 5-Pillar Syllabus Preview */}
                <div className="space-y-3 mb-8">
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-center">1</span>
                      <div>
                        <span className="text-sm font-semibold text-white">Modules 1–6: Foundations of Astrology &amp; Houses</span>
                        <p className="text-[11px] text-slate-400">Nature of 9 Grahas, Zodiac Signs, Kundli Houses &amp; Sign Lords</p>
                      </div>
                    </div>
                    <span className="text-xs text-amber-300 font-medium">6 Videos</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-center">2</span>
                      <div>
                        <span className="text-sm font-semibold text-white">Modules 7–12: Planetary Degrees, Drishti &amp; Combustion</span>
                        <p className="text-[11px] text-slate-400">Planetary aspects, exalted/debilitated states, and retrograde motion</p>
                      </div>
                    </div>
                    <span className="text-xs text-amber-300 font-medium">6 Videos</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-center">3</span>
                      <div>
                        <span className="text-sm font-semibold text-white">Modules 13–17: Rashis, Nakshatras &amp; The Dasha System</span>
                        <p className="text-[11px] text-slate-400">27 Nakshatras, Kendra-Trikon dynamics, Lagnesh &amp; Vimshottari timing</p>
                      </div>
                    </div>
                    <span className="text-xs text-amber-300 font-medium">5 Videos</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-center">4</span>
                      <div>
                        <span className="text-sm font-semibold text-white">Modules 18–21: Vedic Remedial Sciences &amp; Lagna Kundali</span>
                        <p className="text-[11px] text-slate-400">Gemstones, Rudraksha by Rashi, Daan/Dakshina &amp; chart reading blueprint</p>
                      </div>
                    </div>
                    <span className="text-xs text-amber-300 font-medium">4 Videos</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-amber-500/30 text-amber-200 text-xs font-bold flex items-center justify-center">★</span>
                      <div>
                        <span className="text-sm font-semibold text-amber-300">Modules 22–23: Bonus Real Chart Reading Masterclasses</span>
                        <p className="text-[11px] text-slate-300">Clinical case studies: Choosing Career and Marriage Timing</p>
                      </div>
                    </div>
                    <span className="text-xs text-amber-300 font-bold">2 Bonus Videos</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href="/courses/what-is-astrology"
                    className="gold-button px-7 py-3.5 rounded-xl text-sm font-bold flex items-center gap-2"
                  >
                    <span>View Complete 23-Module Syllabus</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/checkout/${cohort?.id || 'cohort-wia-batch-1'}`}
                    className="px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-white/10 hover:bg-white/15 border border-white/15 transition"
                  >
                    Enroll Now • Instant Access
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
                        <span className="text-3xl sm:text-4xl font-black text-white">₹5,100</span>
                        <span className="text-sm text-slate-500 line-through">₹11,000</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                      54% OFF Launch
                    </span>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">23 On-demand video modules (~60–90 mins each)</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">2 Bonus real chart reading workshops (Career &amp; Marriage)</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">100% Self-paced — start learning immediately</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">Permanent lifetime access to all videos &amp; study notes</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">20-Question graded certification assessment</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">Official Verifiable Certificate from VIAR</span>
                    </div>
                  </div>

                  <Link
                    href={`/checkout/${cohort?.id || 'cohort-wia-batch-1'}`}
                    className="gold-button w-full py-4 rounded-xl text-center font-bold text-base shadow-lg shadow-amber-500/20 block"
                  >
                    Start Learning Today • Lifetime Access
                  </Link>

                  <p className="text-center text-xs text-slate-400 mt-3 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Instant access to student dashboard upon enrollment</span>
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
                <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-2xl mx-auto relative group">
                  <Image
                    src="/images/Acharya_Niraj_Kumar_Solo.jpg"
                    alt="Acharya Niraj Kumar"
                    fill
                    sizes="(max-width: 640px) 224px, 256px"
                    className="object-cover object-top transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="absolute -bottom-4 -right-2 bg-[#0f172a] border border-amber-400/40 px-3.5 py-1.5 rounded-xl shadow-xl">
                  <p className="text-[11px] font-bold text-amber-300">Founder, Aapka Astro & VIAR</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Master Instructor & Lineage</span>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 mb-4">
                Acharya Niraj Kumar
              </h3>
              <p className="text-sm font-semibold text-amber-300 mb-6">
                Founder, Aapka Astro • Jyotish Acharya (Bhartiya Vidya Bhawan) • AstroVastu Expert • 26,000+ Followers
              </p>
              <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
                <p>
                  {/* PLACEHOLDER: Replace with verified consultation/interpretation count once confirmed across both sites */}
                  Acharya Niraj Kumar brings together deep traditional Vedic learning and rare real-world corporate insight. Raised in the spiritually rich ecosystem of Baidyanath Dham, Deoghar, and trained under Late Guru Shri B. B. Tiwari, his practice spans over two decades, trusted by students and clients across India and abroad.
                </p>
                <p>
                  Having served clients worldwide through <a href="https://aapkaastro.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline font-semibold">Aapka Astro (aapkaastro.com)</a> and holding past executive roles as Vice President and Business Head at Reliance Retail, Metro Cash & Carry, and NIF Food, Acharya founded <strong>Vihangam Institute of Astrology and Research (VIAR)</strong> to systematically train serious learners in authentic Jyotish without superstition.
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
                  Explore Self-Paced Masterclass
                </Link>
                <Link
                  href="/about"
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition"
                >
                  Read Full Institute Story &rarr;
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
                    Flagship Masterclass
                  </span>
                  <span className="text-xs text-slate-400">23 Video Modules • 100% Self-Paced</span>
                </div>
                <h4 className="text-2xl font-bold text-white mb-2">
                  The Ultimate Astrology Course: Foundations to Chart Mastery
                </h4>
                <p className="text-sm text-slate-300 mb-6">
                  Learn the sacred science of Jyotish from first principles to real chart readings across 23 structured video lessons and 2 bonus case studies.
                </p>
                <div className="space-y-2 mb-6 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Includes 23 HD video lessons + 2 bonus chart workshops</span>
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
                  <span className="text-lg font-bold text-white">₹5,100</span>
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
                  <span className="text-lg font-bold text-white">₹5,999</span>
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
                  <span className="text-lg font-bold text-white">₹3,999</span>
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
                  <span className="text-lg font-bold text-white">₹3,499</span>
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
              Read authentic feedback from working professionals, educators, and global learners who study with Acharya Niraj Kumar.
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
                    {test.content}
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

      {/* Sample Lecture Preview Section (Honest Placeholder State - Unverified video embed removed) */}
      <section className="py-20 bg-[#090d16] border-t border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Video className="w-3.5 h-3.5 text-amber-400" />
            <span>Sample Lecture Preview</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Experience the Teaching Method
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed mb-8">
            An inside look at <strong className="text-amber-300">Acharya Niraj Kumar&apos;s</strong> rigorous, logic-driven Vedic Jyotish instruction.
          </p>

          {/* PLACEHOLDER: Unverified video embed hibDdoH5kbQ removed. Client to provide verified official sample video URL. */}
          <div className="relative rounded-2xl border border-dashed border-amber-500/30 bg-gradient-to-b from-[#111827]/80 to-[#0a0f1a]/80 p-8 sm:p-14 text-center max-w-2xl mx-auto shadow-xl">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-5">
              <Video className="w-8 h-8" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Sample Lecture Video Coming Soon
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-lg mx-auto mb-6">
              Official video excerpts demonstrating chart analysis and syllabus methodology are currently being curated from the 23-module self-paced masterclass.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/courses/what-is-astrology"
                className="gold-button px-6 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2"
              >
                <span>View Full 23-Module Curriculum</span>
              </Link>
              <a
                href="/api/courses/what-is-astrology/syllabus/download?print=true"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 inline-flex items-center gap-2 transition"
              >
                <span>Download Syllabus (PDF)</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-20 bg-[#070b12] border-t border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">
              {isHi ? 'स्पष्ट उत्तर' : 'Clear Answers'}
            </h2>
            <h3 className="text-3xl font-extrabold text-white">
              {isHi ? 'अक्सर पूछे जाने वाले प्रश्न' : 'Frequently Asked Questions'}
            </h3>
          </div>

          <div className="space-y-4">
            {(faqsList && faqsList.length > 0 ? faqsList : course?.faqs || []).map((faq, index: number) => {
              const f = faq as Record<string, string | undefined>;
              const isOpen = openFaq === index;
              const questionText = isHi && f.titleHi ? f.titleHi : f.titleEn || f.question;
              const answerText = isHi && f.contentHi ? f.contentHi : f.contentEn || f.answer;
              return (
                <div
                  key={faq.id || faq.key || index}
                  className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden transition"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 font-semibold text-white text-sm sm:text-base hover:text-amber-300 transition"
                  >
                    <span>{questionText}</span>
                    <span className="text-amber-400 text-lg">{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-4 pt-1 text-sm text-slate-300 leading-relaxed border-t border-white/5">
                      {answerText}
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
              Viar.in is part of a unified ecosystem founded by Acharya Niraj Kumar. Whether you require personal astrological consultations or strategic enterprise advisory, explore our sister platforms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* Sister Site 1: Aapka Astro */}
            <div className="cosmic-card p-8 rounded-2xl border border-amber-500/30 hover:border-amber-400/50 transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Image
                      src="/images/aapkaastro-logo.png"
                      alt="Aapka Astro Logo"
                      width={120}
                      height={32}
                      className="h-8 w-auto object-contain brightness-110"
                    />
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {SISTER_SERVICES.aapkaAstro.badge}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{SISTER_SERVICES.aapkaAstro.name}</h3>
                {/* PLACEHOLDER: Replace with verified consultation count once confirmed across both sites */}
                <p className="text-xs font-semibold text-amber-300 mb-4">{SISTER_SERVICES.aapkaAstro.domain} • Trusted Across India & Abroad • +91 93112 15564</p>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  {SISTER_SERVICES.aapkaAstro.description}
                </p>
              </div>
              <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center gap-3">
                <a
                  href={SISTER_SERVICES.aapkaAstro.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gold-button w-full sm:flex-1 py-3 rounded-xl text-xs font-bold text-center block"
                >
                  {SISTER_SERVICES.aapkaAstro.ctaText} &rarr;
                </a>
                <a
                  href="https://wa.me/919311215564"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-4 py-3 rounded-xl text-xs font-bold text-center bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 transition block"
                >
                  WhatsApp
                </a>
              </div>
            </div>

            {/* Corporate & Enterprise Advisory */}
            <div className="cosmic-card p-8 rounded-2xl border border-sky-500/30 hover:border-sky-400/50 transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    {SISTER_SERVICES.dowConsulting.badge}
                  </span>
                  <Building2 className="w-4 h-4 text-sky-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{SISTER_SERVICES.dowConsulting.name}</h3>
                <p className="text-xs font-semibold text-sky-300 mb-4">{SISTER_SERVICES.dowConsulting.tagline} • By Private Inquiry</p>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  {SISTER_SERVICES.dowConsulting.description}
                </p>
              </div>
              <div className="pt-6 border-t border-white/10">
                <Link
                  href={SISTER_SERVICES.dowConsulting.url}
                  className="px-5 py-3 rounded-xl text-xs font-bold text-center block bg-sky-600/20 hover:bg-sky-600/30 text-sky-200 border border-sky-500/40 transition"
                >
                  {SISTER_SERVICES.dowConsulting.ctaText} &rarr;
                </Link>
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
          <p className="text-slate-300 max-w-xl mx-auto text-base mb-8">
            Instant lifetime access to 23 video masterclasses + 2 bonus workshops, comprehensive study materials, and verifiable certification by Vihangam Institute of Astrology and Research.
          </p>
          <Link
            href="/courses/what-is-astrology"
            className="gold-button inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold shadow-2xl shadow-amber-500/30"
          >
            <span>Enroll in Course Today</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

    </div>
  );
}
