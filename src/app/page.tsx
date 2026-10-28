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
  Download,
} from 'lucide-react';
import { ViarStore } from '@/lib/store';
import { Course, Cohort, ContentItem } from '@/lib/types';
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
  const [announcementBar, setAnnouncementBar] = useState<ContentItem | null | undefined>(() => {
    return (BUILTIN_CONTENT_DEFAULTS.site_settings || []).find((s) => s.key === 'announcement_bar') as ContentItem | undefined;
  });
  const [testimonialsList, setTestimonialsList] = useState<ContentItem[]>(() => (BUILTIN_CONTENT_DEFAULTS.testimonials || []) as ContentItem[]);

  useEffect(() => {
    const flagship = ViarStore.getCourseBySlug('what-is-astrology');
    if (flagship) setCourse(flagship);

    const cohorts = ViarStore.getCohorts('course-what-is-astrology');
    if (cohorts.length > 0) setCohort(cohorts[0]);

    // Resilient dynamic content fetching with zero crash guarantee
    fetch('/api/content?collection=hero&key=hero_main')
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

    fetch('/api/content?collection=site_settings&key=announcement_bar')
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data.item) {
          setAnnouncementBar(data.item);
        }
      })
      .catch(() => {});

    fetch('/api/content?collection=testimonials')
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.items)) {
          setTestimonialsList(data.items);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="cosmic-bg min-h-screen">
      
      {/* Top Notification Banner — Managed via Site Settings in Content Studio */}
      {announcementBar && announcementBar.metadata?.active !== false && announcementBar.status !== 'HIDDEN' && (
        <div className="w-full bg-amber-500/10 dark:bg-amber-500/15 border-b border-amber-500/20 dark:border-amber-500/30 py-2 sm:py-2.5 px-4 text-center box-border overflow-hidden">
          <div className="max-w-[1280px] mx-auto flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap text-xs sm:text-sm font-medium leading-relaxed">
            <span className="text-amber-600 dark:text-amber-400 font-bold shrink-0">◆</span>
            <span className="font-bold text-amber-950 dark:text-amber-100">
              {isHi
                ? announcementBar.titleHi || announcementBar.titleEn
                : announcementBar.titleEn}:
            </span>
            <span className="text-amber-900/90 dark:text-amber-200/90">
              {(isHi
                ? announcementBar.contentHi || announcementBar.contentEn
                : announcementBar.contentEn)?.replace(/\s*(?:Enroll Today|आज ही प्रवेश लें)\s*→/gi, '')}
            </span>
            <Link
              href={announcementBar.metadata?.url || '/courses/what-is-astrology'}
              className="underline font-bold text-amber-950 dark:text-white hover:text-amber-600 dark:hover:text-amber-200 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded px-1 transition-colors"
            >
              {isHi ? 'प्रवेश लें →' : 'Enroll Today →'}
            </Link>
          </div>
        </div>
      )}

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
                <span>{isHi ? 'आज ही सीखना शुरू करें' : 'Start Learning Today'}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
              </Link>
              <Link
                href="/courses"
                className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition flex items-center justify-center gap-2"
              >
                <BookOpen className="w-5 h-5 text-amber-400" />
                <span>{isHi ? 'पाठ्यक्रम सूची देखें' : 'Browse Course Catalog'}</span>
              </Link>
            </div>

            {/* Key Trust Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto pt-4 border-t border-white/10 text-left">
              <div className="p-3 rounded-lg bg-white/[0.02]">
                <p className="text-2xl font-bold text-white">{isHi ? '23 मॉड्यूल' : '23 Modules'}</p>
                <p className="text-xs text-slate-400">{isHi ? 'व्यापक वीडियो मास्टरक्लास' : 'Comprehensive video masterclass'}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02]">
                <p className="text-2xl font-bold text-amber-400">{isHi ? 'सेल्फ-पेस्ड' : 'Self-Paced'}</p>
                <p className="text-xs text-slate-400">{isHi ? 'अपनी सुविधानुसार कभी भी सीखें' : 'Learn on your own schedule'}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02]">
                <p className="text-2xl font-bold text-white">{isHi ? '2 बोनस केस' : '2 Bonus Cases'}</p>
                <p className="text-xs text-slate-400">{isHi ? 'करियर व विवाह कुंडली विश्लेषण' : 'Career & Marriage chart analysis'}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02]">
                <p className="text-2xl font-bold text-amber-400">{isHi ? 'VIAR प्रमाणित' : 'VIAR Certified'}</p>
                <p className="text-xs text-slate-400">{isHi ? 'सत्यापन योग्य प्रमाणपत्र' : 'Verifiable academic credential'}</p>
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
              {isHi ? 'विश्वभर के गंभीर विद्यार्थियों हेतु निर्मित' : 'Engineered For Serious Students Worldwide'}
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
              {isHi ? 'Viar.in क्यों है ज्योतिष शिक्षा का वैश्विक मानक' : 'Why Viar.in Sets the Global Standard for Astrology Education'}
            </h3>
            <p className="text-slate-400 text-sm sm:text-base mt-4 leading-relaxed">
              {isHi
                ? 'कोई अंधविश्वास या भय नहीं। कोई अनिवार्य उपस्थिति का दबाव नहीं। वास्तविक वैदिक गणित, मनोवैज्ञानिक सिद्धांत और व्यावहारिक कुंडली फलादेश — विद्यार्थियों की पूर्ण स्वतंत्रता के साथ।'
                : 'No dogmatic superstitions. No attendance penalties. Real Vedic mathematics, psychological archetypes, and clinical chart analysis delivered with student-first flexibility.'}
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
                  {isHi ? 'रिकॉर्डेड मॉड्यूल एवं लाइव कक्षाएं' : 'Recorded Modules & Live Classes'}
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {isHi
                    ? 'आचार्य नीरज कुमार द्वारा पढ़ाया गया संरचित पाठ्यक्रम, व्यक्तिगत 1-on-1 मार्गदर्शन सत्रों के साथ (क्लाइंट अनुमोदन लंबित)।'
                    : 'Foundational-to-advanced structured curriculum taught by Acharya Niraj Kumar, paired with personal 1-on-1 mentorship sessions (pending client approval).'}
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-white/10 text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{isHi ? 'रिकॉर्डेड पाठ्यक्रम और समूह लाइव कक्षाएं' : 'Recorded modules and interactive cohort live classes'}</span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="cosmic-card p-8 rounded-2xl border border-white/10 flex flex-col justify-between relative group hover:border-amber-500/40 transition">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition">
                  <Clock className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-white mb-3">
                  {isHi ? 'स्व-गति अध्ययन एवं कक्षा रिकॉर्डिंग' : 'Self-Paced Learning with Full Recordings'}
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {isHi
                    ? 'अपनी गति से रिकॉर्डेड व्याख्यान देखें, और आपसी सुविधानुसार व्यक्तिगत 1-on-1 सत्र निर्धारित करें (क्लाइंट अनुमोदन लंबित)।'
                    : 'Study recorded lessons at your own pace, with personal 1-on-1 sessions scheduled at mutually convenient times (pending client approval).'}
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-white/10 text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-amber-400" />
                <span>{isHi ? 'लाइव क्लास और रिकॉर्डिंग दोनों उपलब्ध' : 'Live classes & on-demand recordings included'}</span>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="cosmic-card p-8 rounded-2xl border border-white/10 flex flex-col justify-between relative group hover:border-amber-500/40 transition">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition">
                  <Award className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-white mb-3">
                  {isHi ? 'परीक्षा-आधारित सत्यापन योग्य प्रमाणन' : 'Exam-Based Verifiable Certification'}
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {isHi
                    ? '20 प्रश्नों की अंतिम ऑनलाइन मूल्यांकन परीक्षा देकर अपनी कुंडली विश्लेषण दक्षता सिद्ध करें। 70%+ अंक प्राप्त कर विहंगम ज्योतिष एवं अनुसंधान संस्थान का आधिकारिक प्रमाणपत्र प्राप्त करें।'
                    : 'Demonstrate true chart reading competency by taking the 20-question final exam. Pass with 70%+ to receive your official certificate from Vihangam Institute of Astrology and Research.'}
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-white/10 text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>{isHi ? 'सार्वजनिक सत्यापन लिंक: viar.in/verify' : 'Public verification URL at viar.in/verify'}</span>
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
                  {isHi ? 'सेल्फ-पेस्ड मास्टरक्लास अभी उपलब्ध' : 'Self-Paced Masterclass Open Now'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-slate-300 border border-white/10">
                  {isHi ? 'आरंभिक से उन्नत कुंडली विश्लेषण' : 'Beginner to Advanced Chart Reading'}
                </span>
              </div>

              <div className="text-xs text-slate-300 flex items-center gap-2 bg-white/[0.04] px-3.5 py-1.5 rounded-xl border border-white/10">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {isHi ? 'तुरंत प्रवेश: ' : 'Instant Access: '}
                  <strong className="text-white">{isHi ? 'आज ही देखना शुरू करें' : 'Start Watching Immediately'}</strong>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              <div className="lg:col-span-7">
                <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
                  {isHi ? 'ज्योतिष क्या है: मूल सिद्धांतों से कुंडली महारत तक' : 'The Ultimate Astrology Course: Foundations to Chart Mastery'}
                </h3>
                <p className="text-lg text-amber-300/90 font-medium mb-6">
                  {isHi
                    ? '23 ऑन-डिमांड वीडियो मॉड्यूल • 2 बोनस केस स्टडी कार्यशालाएं • रिकॉर्डेड मॉड्यूल एवं 1-ऑन-1 सत्र • मूल्यांकन परीक्षा एवं प्रमाणपत्र'
                    : '23 Video Modules • 2 Bonus Chart Workshops • Live Interactive Classes & Recordings • Graded Exam & Certificate'}
                </p>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
                  {isHi
                    ? 'पांच व्यापक अध्ययन स्तंभों और दो व्यावहारिक केस स्टडीज में संरचित मास्टरक्लास। खगोलीय गणित से लेकर जन्म कुंडली पढ़ने और जीवन के विभिन्न पहलुओं के सटीक फलादेश तक आत्मविश्वास से आगे बढ़ें।'
                    : 'A structured masterclass arranged into five comprehensive curriculum pillars and two bonus case studies. Move with confidence from foundational astronomical mechanics to reading complete birth charts and deciphering life themes.'}
                </p>

                {/* 5-Pillar Syllabus Preview */}
                <div className="space-y-3 mb-8">
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-center">1</span>
                      <div>
                        <span className="text-sm font-semibold text-white">
                          {isHi ? 'मॉड्यूल 1–6: ज्योतिष के मूल सिद्धांत एवं 12 भाव' : 'Modules 1–6: Foundations of Astrology & Houses'}
                        </span>
                        <p className="text-[11px] text-slate-400">
                          {isHi ? '9 ग्रहों का स्वभाव, 12 राशियां, कुंडली के 12 भाव और भावेश' : 'Nature of 9 Grahas, Zodiac Signs, Kundli Houses & Sign Lords'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-amber-300 font-medium">{isHi ? '6 वीडियो' : '6 Videos'}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-center">2</span>
                      <div>
                        <span className="text-sm font-semibold text-white">
                          {isHi ? 'मॉड्यूल 7–12: ग्रह अंश, दृष्टियां एवं अस्त/वक्री अवस्था' : 'Modules 7–12: Planetary Degrees, Drishti & Combustion'}
                        </span>
                        <p className="text-[11px] text-slate-400">
                          {isHi ? 'ग्रहों की पूर्ण दृष्टियां, उच्च-नीच अवस्था, और वक्री गति का प्रभाव' : 'Planetary aspects, exalted/debilitated states, and retrograde motion'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-amber-300 font-medium">{isHi ? '6 वीडियो' : '6 Videos'}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-center">3</span>
                      <div>
                        <span className="text-sm font-semibold text-white">
                          {isHi ? 'मॉड्यूल 13–17: राशियां, 27 नक्षत्र एवं विंशोत्तरी दशा प्रणाली' : 'Modules 13–17: Rashis, Nakshatras & The Dasha System'}
                        </span>
                        <p className="text-[11px] text-slate-400">
                          {isHi ? '27 नक्षत्र, केंद्र-त्रिकोण राजयोग, लग्नेश बल और विंशोत्तरी काल-गणना' : '27 Nakshatras, Kendra-Trikon dynamics, Lagnesh & Vimshottari timing'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-amber-300 font-medium">{isHi ? '5 वीडियो' : '5 Videos'}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-center">4</span>
                      <div>
                        <span className="text-sm font-semibold text-white">
                          {isHi ? 'मॉड्यूल 18–21: वैदिक उपाय विज्ञान एवं लग्न कुंडली विश्लेषण' : 'Modules 18–21: Vedic Remedial Sciences & Lagna Kundali'}
                        </span>
                        <p className="text-[11px] text-slate-400">
                          {isHi ? 'रत्न, रुद्राक्ष चयन, दान-दक्षिणा नियम एवं कुंडली फलादेश का संपूर्ण खाका' : 'Gemstones, Rudraksha by Rashi, Daan/Dakshina & chart reading blueprint'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-amber-300 font-medium">{isHi ? '4 वीडियो' : '4 Videos'}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-amber-500/30 text-amber-200 text-xs font-bold flex items-center justify-center">★</span>
                      <div>
                        <span className="text-sm font-semibold text-amber-300">
                          {isHi ? 'मॉड्यूल 22–23: बोनस वास्तविक कुंडली विश्लेषण मास्टरक्लास' : 'Modules 22–23: Bonus Real Chart Reading Masterclasses'}
                        </span>
                        <p className="text-[11px] text-slate-300">
                          {isHi ? 'व्यावहारिक केस स्टडीज: आजीविका/करियर एवं विवाह समय-निर्धारण' : 'Clinical case studies: Choosing Career and Marriage Timing'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-amber-300 font-bold">{isHi ? '2 बोनस वीडियो' : '2 Bonus Videos'}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href="/courses/what-is-astrology"
                    className="gold-button px-7 py-3.5 rounded-xl text-sm font-bold flex items-center gap-2"
                  >
                    <span>{isHi ? 'संपूर्ण 23-मॉड्यूल पाठ्यक्रम देखें' : 'View Complete 23-Module Syllabus'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/checkout/${cohort?.id || 'what-is-astrology'}`}
                    className="px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-white/10 hover:bg-white/15 border border-white/15 transition"
                  >
                    {isHi ? 'अभी नामांकन करें • तुरंत प्रवेश' : 'Enroll Now • Instant Access'}
                  </Link>
                </div>
              </div>

              {/* Course Card Summary */}
              <div className="lg:col-span-5">
                <div className="cosmic-card p-6 sm:p-8 rounded-2xl border border-amber-500/30 bg-[#090d16]/90">
                  
                  <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                        {isHi ? 'एकमुश्त शिक्षण शुल्क' : 'One-Time Tuition'}
                      </p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-base text-slate-400 line-through">₹11,000</span>
                        <span className="text-3xl sm:text-4xl font-black text-white">₹5,100</span>
                        
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                      {isHi ? '54% छूट' : '54% OFF Launch'}
                    </span>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">
                        {isHi ? '23 ऑन-डिमांड वीडियो मॉड्यूल (प्रत्येक ~60–90 मिनट)' : '23 On-demand video modules (~60–90 mins each)'}
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">
                        {isHi ? '2 बोनस व्यावहारिक कार्यशालाएं (करियर एवं विवाह विश्लेषण)' : '2 Bonus real chart reading workshops (Career & Marriage)'}
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">
                        {isHi ? '100% अपनी गति से सीखें — तुरंत अध्ययन आरंभ' : '100% Self-paced — start learning immediately'}
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">
                        {isHi ? 'सभी वीडियो एवं संदर्भ नोट्स की आजीवन असीमित पहुंच' : 'Permanent lifetime access to all videos & study notes'}
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">
                        {isHi ? '20 प्रश्नों की अंतिम प्रमाणन मूल्यांकन परीक्षा' : '20-Question graded certification assessment'}
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">
                        {isHi ? 'VIAR का आधिकारिक सत्यापन योग्य प्रमाणपत्र' : 'Official Verifiable Certificate from VIAR'}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/checkout/${cohort?.id || 'what-is-astrology'}`}
                    className="gold-button w-full py-4 rounded-xl text-center font-bold text-base shadow-lg shadow-amber-500/20 block"
                  >
                    {isHi ? 'आज ही सीखना शुरू करें • आजीवन पहुंच' : 'Start Learning Today • Lifetime Access'}
                  </Link>

                  <p className="text-center text-xs text-slate-400 mt-3 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>{isHi ? 'नामांकन के तुरंत बाद छात्र डैशबोर्ड में प्रवेश सक्रिय' : 'Instant access to student dashboard upon enrollment'}</span>
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
                    src="/images/Acharya_Niraj_Kumar_Desk.jpg"
                    alt="Acharya Niraj Kumar"
                    fill
                    sizes="(max-width: 640px) 224px, 256px"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="absolute -bottom-4 -right-2 bg-[#0f172a] border border-amber-400/40 px-3.5 py-1.5 rounded-xl shadow-xl">
                  <p className="text-[11px] font-bold text-amber-300">
                    {isHi ? 'संस्थापक: आपका एस्ट्रो एवं VIAR' : 'Founder, Aapka Astro & VIAR'}
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                {isHi ? 'प्रधान मार्गदर्शक एवं परंपरा' : 'Master Instructor & Lineage'}
              </span>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 mb-4">
                {isHi ? 'आचार्य नीरज कुमार' : 'Acharya Niraj Kumar'}
              </h3>
              <p className="text-sm font-semibold text-amber-300 mb-6">
                {isHi
                  ? 'संस्थापक: आपका एस्ट्रो • ज्योतिष आचार्य (भारतीय विद्या भवन) • एस्ट्रोवास्तु विशेषज्ञ'
                  : 'Founder, Aapka Astro • Jyotish Acharya (Bhartiya Vidya Bhawan) • AstroVastu Expert • 26,000+ Followers'}
              </p>
              <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
                <p>
                  {isHi
                    ? 'आचार्य नीरज कुमार जी गहन पारंपरिक वैदिक ज्ञान और कॉर्पोरेट जगत के दुर्लभ व्यावहारिक अनुभव का संगम प्रस्तुत करते हैं। बैद्यनाथ धाम (देवघर) के आध्यात्मिक वातावरण में पले-बढ़े और पूज्य स्वर्गीय गुरु श्री बी. बी. तिवारी जी के सानिध्य में प्रशिक्षित, उनका अभ्यास दो दशकों से अधिक का है, जिस पर भारत और विदेश के हजारों विद्यार्थी व साधक विश्वास करते हैं।'
                    : 'Acharya Niraj Kumar brings together deep traditional Vedic learning and rare real-world corporate insight. Raised in the spiritually rich ecosystem of Baidyanath Dham, Deoghar, and trained under Late Guru Shri B. B. Tiwari, his practice spans over two decades, trusted by students and clients across India and abroad.'}
                </p>
                <p>
                  {isHi
                    ? 'Aapka Astro (aapkaastro.com) के माध्यम से विश्वभर के लोगों का मार्गदर्शन करने और पूर्व में रिलायंस रिटेल, मेट्रो कैश एंड कैरी तथा एनआईएफ में वाइस प्रेसिडेंट व बिजनेस हेड जैसे शीर्ष पदों पर रहने के उपरांत, आचार्य जी ने अंधविश्वास-मुक्त, प्रामाणिक ज्योतिष की व्यवस्थित शिक्षा देने हेतु विहंगम ज्योतिष एवं अनुसंधान संस्थान (VIAR) की स्थापना की।'
                    : 'Having served clients worldwide through Aapka Astro (aapkaastro.com) and holding past executive roles as Vice President and Business Head at Reliance Retail, Metro Cash & Carry, and NIF Food, Acharya founded Vihangam Institute of Astrology and Research (VIAR) to systematically train serious learners in authentic Jyotish without superstition.'}
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="https://aapkaastro.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 flex items-center gap-2 transition"
                >
                  <span>{isHi ? 'AapkaAstro.com परामर्श वेबसाइट देखें' : 'Visit AapkaAstro.com Consultation Site'}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                </a>
                <Link
                  href="/courses/what-is-astrology"
                  className="px-5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-xs font-semibold text-amber-300 transition"
                >
                  {isHi ? 'सेल्फ-पेस्ड मास्टरक्लास देखें' : 'Explore Self-Paced Masterclass'}
                </Link>
                <Link
                  href="/about"
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition"
                >
                  {isHi ? 'संस्थान की संपूर्ण कहानी पढ़ें →' : 'Read Full Institute Story →'}
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
                {isHi ? 'संस्थान का बहु-पाठ्यक्रम शैक्षणिक ढांचा' : 'Multi-Course Academic Curriculum'}
              </h2>
              <h3 className="text-3xl font-extrabold text-white">
                {isHi ? 'VIAR कैटलॉग में आगामी पाठ्यक्रम' : 'Upcoming Courses in the Viar Catalog'}
              </h3>
            </div>
            <Link
              href="/courses"
              className="mt-4 md:mt-0 text-sm font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1.5"
            >
              <span>{isHi ? 'सभी पाठ्यक्रम देखें' : 'Explore All Courses'}</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="max-w-4xl mx-auto">
            
            {/* Flagship Course Card */}
            <div className="cosmic-card p-8 rounded-2xl border border-amber-500/40 bg-[#111827]/80 ring-1 ring-amber-500/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {isHi ? 'प्रमुख मास्टरक्लास' : 'Flagship Masterclass'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {isHi ? '23 वीडियो मॉड्यूल • 100% अपनी गति से' : '23 Video Modules • 100% Self-Paced'}
                  </span>
                </div>
                <h4 className="text-2xl font-bold text-white mb-2">
                  {isHi ? 'सम्पूर्ण वैदिक ज्योतिष: मूल सिद्धांतों से कुंडली महारत' : 'The Ultimate Astrology Course: Foundations to Chart Mastery'}
                </h4>
                <p className="text-sm text-slate-300 mb-6">
                  {isHi
                    ? '23 संरचित वीडियो पाठों और 2 बोनस केस स्टडीज में ज्योतिष के पवित्र विज्ञान को प्रथम सिद्धांतों से वास्तविक कुंडली तक सीखें।'
                    : 'Learn the sacred science of Jyotish from first principles to real chart readings across 23 structured video lessons and 2 bonus case studies.'}
                </p>
                <div className="space-y-2 mb-6 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{isHi ? '23 एचडी वीडियो पाठ + 2 बोनस कुंडली कार्यशालाएं सम्मिलित' : 'Includes 23 HD video lessons + 2 bonus chart workshops'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{isHi ? 'अंतिम 20 प्रश्नों की परीक्षा व सत्यापन योग्य प्रमाणपत्र' : 'Final 20-question graded quiz with verifiable certificate'}</span>
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">{isHi ? 'शिक्षण शुल्क' : 'Tuition'}</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-sm font-semibold text-slate-400 line-through">₹11,000</span>
                    <span className="text-xl font-bold text-white">₹5,100</span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                      {isHi ? '54% छूट' : '54% OFF'}
                    </span>
                  </div>
                </div>
                <Link
                  href="/courses/what-is-astrology"
                  className="gold-button px-5 py-2.5 rounded-xl text-xs font-bold"
                >
                  {isHi ? 'कोर्स विवरण देखें' : 'View Course Details'}
                </Link>
              </div>
            </div>

            

            

          </div>

        </div>
      </section>

      {/* Student Testimonials Section — "Render nothing when there are none" */}
      {testimonialsList && testimonialsList.length > 0 ? (
        <section className="py-20 bg-[#090d16] border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                {isHi ? 'विद्यार्थियों के अनुभव' : 'Student Experiences'}
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 mb-4">
                {isHi ? 'भारत और विश्वभर के विद्यार्थियों का विश्वास' : 'Trusted by Students Across India & Worldwide'}
              </h2>
              <p className="text-slate-400 text-sm sm:text-base">
                {isHi
                  ? 'आचार्य नीरज कुमार जी से सीखने वाले कामकाजी पेशेवरों, शिक्षकों और अंतरराष्ट्रीय विद्यार्थियों के प्रामाणिक अनुभव।'
                  : 'Read authentic feedback from working professionals, educators, and global learners who study with Acharya Niraj Kumar.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonialsList.map((test) => {
                const meta = (test.metadata || {}) as Record<string, unknown>;
                const quote = isHi ? test.contentHi || test.contentEn : test.contentEn;
                const author = isHi ? test.titleHi || test.titleEn : test.titleEn;
                const location = String(meta.city || meta.location || '');
                const courseName = String(meta.course || '');
                const rating = typeof meta.rating === 'number' ? meta.rating : 5;
                const isInternational = Boolean(meta.isInternational);

                return (
                  <div
                    key={test.id || test.key}
                    className="cosmic-card p-6 rounded-2xl border border-white/10 flex flex-col justify-between hover:border-amber-500/30 transition relative"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1">
                          {[...Array(rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        {isInternational ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {isHi ? 'अंतरराष्ट्रीय' : 'International'}
                          </span>
                        ) : null}
                      </div>

                      <p className="text-sm font-semibold text-amber-200 mb-2 italic">
                        &ldquo;{quote}&rdquo;
                      </p>
                    </div>

                    <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-white">{author}</h3>
                        {courseName ? (
                          <p className="text-[11px] text-slate-400">{courseName}</p>
                        ) : null}
                      </div>
                      {location ? (
                        <span className="text-[11px] text-slate-500 font-medium">
                          {location}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </section>
      ) : null}

      {/* Sample Lecture Preview Section */}
      <section className="py-20 bg-[#090d16] border-t border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Video className="w-3.5 h-3.5 text-amber-400" />
            <span>{isHi ? 'नमूना वीडियो व्याख्यान' : 'Sample Lecture Preview'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            {isHi ? 'शिक्षण पद्धति का अनुभव करें' : 'Experience the Teaching Method'}
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed mb-8">
            {isHi ? (
              <>
                <strong className="text-amber-300">आचार्य नीरज कुमार जी</strong> के तर्कसंगत, शास्त्रीय वैदिक ज्योतिष शिक्षण की एक प्रत्यक्ष झलक।
              </>
            ) : (
              <>
                An inside look at <strong className="text-amber-300">Acharya Niraj Kumar&apos;s</strong> rigorous, logic-driven Vedic Jyotish instruction.
              </>
            )}
          </p>

          <div className="relative rounded-2xl border border-amber-500/30 bg-[#0f172a] overflow-hidden shadow-2xl max-w-3xl mx-auto">
            <div className="aspect-video w-full relative">
              <iframe
                src="https://www.youtube-nocookie.com/embed/VymAmq2THHs?rel=0"
                title={isHi ? 'आचार्य नीरज कुमार जी का नमूना व्याख्यान' : 'Sample Lecture - Acharya Niraj Kumar'}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <div className="p-4 sm:p-6 bg-gradient-to-t from-[#0a0f1a] to-[#111827]/90 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10">
              <div className="text-left">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {isHi ? 'वैदिक ज्योतिष शिक्षण पद्धति का प्रत्यक्ष नमूना' : 'Sample Lecture: Logic-Driven Vedic Astrology'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isHi ? '23-मॉड्यूल संपूर्ण मास्टरक्लास से व्याख्यान' : 'Official excerpt from the 23-module self-paced masterclass'}
                </p>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <Link
                  href="/courses/what-is-astrology"
                  className="gold-button px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <span>{isHi ? 'संपूर्ण पाठ्यक्रम' : 'View Curriculum'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
                <a
                  href="/api/courses/what-is-astrology/syllabus/download?print=true"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 inline-flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isHi ? 'पाठ्यक्रम PDF' : 'Syllabus PDF'}</span>
                </a>
              </div>
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
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              {isHi ? 'सहयोगी मंच एवं परंपरा' : 'Ecosystem & Lineage'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 mb-4">
              {isHi ? 'हमारी अन्य सेवाएं' : 'Our Other Services'}
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              {isHi
                ? 'Viar.in आचार्य नीरज कुमार द्वारा स्थापित एक समग्र प्रणाली का हिस्सा है। व्यक्तिगत ज्योतिषीय परामर्श अथवा कॉर्पोरेट परामर्श हेतु हमारे सहयोगी मंचों से जुड़ें।'
                : 'Viar.in is part of a unified ecosystem founded by Acharya Niraj Kumar. Whether you require personal astrological consultations or strategic enterprise advisory, explore our sister platforms.'}
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
                    {isHi ? 'परामर्श मंच' : SISTER_SERVICES.aapkaAstro.badge}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{SISTER_SERVICES.aapkaAstro.name}</h3>
                <p className="text-xs font-semibold text-amber-300 mb-4">
                  {isHi
                    ? `${SISTER_SERVICES.aapkaAstro.domain} • भारत और विदेश में विश्वसनीय • +91 93112 15564`
                    : `${SISTER_SERVICES.aapkaAstro.domain} • Trusted Across India & Abroad • +91 93112 15564`}
                </p>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  {isHi
                    ? 'आचार्य नीरज कुमार जी के साथ व्यक्तिगत 1-ऑन-1 कुंडली विश्लेषण, वर्षफल और वैदिक मार्गदर्शन।'
                    : SISTER_SERVICES.aapkaAstro.description}
                </p>
              </div>
              <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center gap-3">
                <a
                  href={SISTER_SERVICES.aapkaAstro.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gold-button w-full sm:flex-1 py-3 rounded-xl text-xs font-bold text-center block"
                >
                  {isHi ? 'AapkaAstro.com पर जाएं →' : `${SISTER_SERVICES.aapkaAstro.ctaText} →`}
                </a>
                <a
                  href="https://wa.me/919311215564"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-4 py-3 rounded-xl text-xs font-bold text-center bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 transition block"
                >
                  {isHi ? 'व्हाट्सएप' : 'WhatsApp'}
                </a>
              </div>
            </div>

            {/* Corporate & Enterprise Advisory */}
            <div className="cosmic-card p-8 rounded-2xl border border-sky-500/30 hover:border-sky-400/50 transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Image
                      src="/images/dowconsulting-logo.png"
                      alt="DOW Consulting Logo"
                      width={120}
                      height={32}
                      className="h-8 w-auto object-contain brightness-110"
                    />
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    {isHi ? 'कॉर्पोरेट सलाहकार' : SISTER_SERVICES.dowConsulting.badge}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{SISTER_SERVICES.dowConsulting.name}</h3>
                <p className="text-xs font-semibold text-sky-300 mb-4">
                  {isHi ? 'निजी संपर्क द्वारा' : `${SISTER_SERVICES.dowConsulting.tagline} • By Private Inquiry`}
                </p>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  {isHi
                    ? 'व्यापार विस्तार, रणनीतिक निर्णय और कॉर्पोरेट समय-चयन हेतु गोपनीय वैदिक एवं वास्तु परामर्श।'
                    : SISTER_SERVICES.dowConsulting.description}
                </p>
              </div>
              <div className="pt-6 border-t border-white/10">
                <a
                  href={SISTER_SERVICES.dowConsulting.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit DOW Consulting (opens in a new tab)"
                  className="px-5 py-3 rounded-xl text-xs font-bold text-center block bg-sky-600/20 hover:bg-sky-600/30 text-sky-200 border border-sky-500/40 transition hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                >
                  {isHi ? 'कॉर्पोरेट परामर्श हेतु संपर्क करें →' : `${SISTER_SERVICES.dowConsulting.ctaText} →`}
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
            {isHi ? 'ज्योतिष की पावन यात्रा आज ही आरंभ करें' : 'Begin Your Sacred Journey in Jyotish'}
          </h2>
          <p className="text-slate-300 max-w-xl mx-auto text-base mb-8">
            {isHi
              ? '23 वीडियो मास्टरक्लास + 2 बोनस कार्यशालाएं, विस्तृत संदर्भ नोट्स और विहंगम ज्योतिष एवं अनुसंधान संस्थान का आधिकारिक प्रमाणपत्र।'
              : 'Instant lifetime access to 23 video masterclasses + 2 bonus workshops, comprehensive study materials, and verifiable certification by Vihangam Institute of Astrology and Research.'}
          </p>
          <Link
            href="/courses/what-is-astrology"
            className="gold-button inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold shadow-2xl shadow-amber-500/30"
          >
            <span>{isHi ? 'आज ही पाठ्यक्रम में नामांकन करें' : 'Enroll in Course Today'}</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

    </div>
  );
}
