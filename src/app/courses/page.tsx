'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Clock, CheckCircle2, ArrowRight, BookOpen, Bell, Mail, X } from 'lucide-react';
import { Course } from '@/lib/types';
import { useLanguage } from '@/components/LanguageContext';

const COURSE_HINDI_MAP: Record<string, {
  title: string;
  tagline: string;
  description: string;
  highlights: string[];
  badge?: string;
}> = {
  'course-flagship-astrology': {
    title: 'सम्पूर्ण वैदिक ज्योतिष: मूल सिद्धांतों से कुंडली महारत',
    tagline: '23 संरचित पाठों में पवित्र विज्ञान सीखें — प्रथम सिद्धांतों से वास्तविक कुंडली तक।',
    description: 'ग्रहों, राशियों, भावों, नक्षत्रों, गोचर और दशा प्रणालियों का विस्तृत अध्ययन। वास्तविक कुंडलियों के साथ भविष्यवाणियां करने में सक्षम बनें।',
    badge: 'प्रमुख मास्टरक्लास',
    highlights: [
      'वैदिक ज्योतिष के संपूर्ण विज्ञान को कवर करने वाले 23 व्यापक वीडियो मॉड्यूल',
      '2 बोनस वास्तविक कुंडली मास्टरक्लास: करियर विश्लेषण एवं विवाह समय-निर्धारण',
      '100% स्व-चालित: कभी भी, किसी भी उपकरण से आजीवन पहुंच के साथ अध्ययन करें',
    ],
  },
};

export default function CoursesPage() {
  const { isHi } = useLanguage();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [notifyCourse, setNotifyCourse] = useState<Course | null>(null);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySuccess, setNotifySuccess] = useState(false);

  useEffect(() => {
    fetch('/api/courses')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.courses)) {
          setCourses(data.courses);
        }
      })
      .catch((err) => {
        console.error('Failed to load courses from API:', err);
      });
  }, []);

  const [notifyError, setNotifyError] = useState<string | null>(null);

  const handleNotifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyCourse || !notifyEmail) return;

    setNotifyError(null);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: notifyEmail.trim(),
          courseSlug: notifyCourse.slug,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        setNotifySuccess(true);
        setTimeout(() => {
          setNotifySuccess(false);
          setNotifyCourse(null);
          setNotifyEmail('');
          setNotifyError(null);
        }, 3000);
      } else {
        setNotifyError(data?.error || 'Could not save notification request. Please try again.');
      }
    } catch {
      setNotifyError('Network error. Please try again.');
    }
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
            <span>{isHi ? 'शैक्षणिक पाठ्यक्रम' : 'Academic Curriculum'}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
            {isHi ? 'ज्योतिष पाठ्यक्रम सूची' : 'Astrology Course Catalog'}
          </h1>
          <p className="text-slate-300 text-base leading-relaxed">
            {isHi
              ? 'विहंगम ज्योतिष एवं अनुसंधान संस्थान (VIAR) के सभी पाठ्यक्रम संरचित, स्व-चालित (self-paced) वीडियो मॉड्यूल, व्यापक नोट्स, वास्तविक कुंडली विश्लेषण और सत्यापन योग्य प्रमाणपत्र के साथ प्रदान किए जाते हैं।'
              : 'All courses at Vihangam Institute of Astrology and Research (VIAR) are delivered as structured, self-paced video modules with comprehensive notes, real chart walkthroughs, and verifiable certification.'}
          </p>

          {/* Level Filter Tabs */}
          <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
            {[
              { id: 'All', labelEn: 'All Courses', labelHi: 'सभी पाठ्यक्रम' },
              { id: 'Beginner', labelEn: 'Beginner Level', labelHi: 'प्रारंभिक स्तर' },
              { id: 'Intermediate', labelEn: 'Intermediate Level', labelHi: 'मध्यम स्तर' },
              { id: 'Advanced', labelEn: 'Advanced Level', labelHi: 'उन्नत स्तर' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedLevel(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  selectedLevel === tab.id
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                {isHi ? tab.labelHi : tab.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {filteredCourses.map((course) => {
            const isFeatured = course.featured;
            const isComingSoon = course.isComingSoon;
            const hiData = COURSE_HINDI_MAP[course.id];
            const courseTitle = isHi && hiData?.title ? hiData.title : course.title;
            const courseTagline = isHi && hiData?.tagline ? hiData.tagline : course.tagline;
            const courseDesc = isHi && hiData?.description ? hiData.description : course.description;
            const courseHighlights = isHi && hiData?.highlights ? hiData.highlights : course.highlights;

            const badgeText = isComingSoon
              ? (isHi ? 'शीघ्र आ रहा है' : 'Coming Soon')
              : (isHi
                  ? (hiData?.badge || (course.level === 'Beginner' ? 'प्रारंभिक' : course.level === 'Intermediate' ? 'मध्यम' : 'उन्नत'))
                  : (course.badge || course.level));

            return (
              <div
                key={course.id}
                className={`cosmic-card rounded-2xl p-8 border flex flex-col justify-between transition ${
                  isFeatured
                    ? 'border-amber-500/50 bg-[#111827]/80 ring-1 ring-amber-500/30'
                    : isComingSoon
                    ? 'border-purple-500/30 bg-[#0d101a]/90 opacity-95'
                    : 'border-white/10'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        isFeatured
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : isComingSoon
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}
                    >
                      {badgeText}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      {course.deliveryMode === 'SELF_PACED'
                        ? (isHi ? `${course.totalClasses} वीडियो मॉड्यूल • स्व-अध्ययन` : `${course.totalClasses} Video Modules • Self-Paced`)
                        : (isHi ? `${course.durationWeeks} सप्ताह • ${course.totalClasses} कक्षाएं` : `${course.durationWeeks} Weeks • ${course.totalClasses} Classes`)}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold text-white mb-2 leading-snug">
                    {courseTitle}
                  </h2>
                  <p className="text-sm text-amber-300/90 font-medium mb-4">
                    {courseTagline}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                    {courseDesc}
                  </p>

                  <div className="space-y-2.5 mb-6 text-xs text-slate-300">
                    {courseHighlights.slice(0, 3).map((hl, i) => (
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
                      {isComingSoon
                        ? (isHi ? 'अपेक्षित शुल्क' : 'Expected Tuition')
                        : (isHi ? 'शिक्षण शुल्क (एकमुश्त)' : 'Tuition (One-Time)')}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-slate-500 line-through">₹{course.originalPriceInr.toLocaleString()}</span>
                      <span className="text-2xl font-black text-white">₹{course.priceInr.toLocaleString()}</span>
                      
                    </div>
                  </div>

                  {isComingSoon ? (
                    <button
                      onClick={() => setNotifyCourse(course)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 flex items-center gap-1.5 transition"
                    >
                      <Bell className="w-3.5 h-3.5 text-purple-300" />
                      <span>{isHi ? 'मुझे सूचित करें' : 'Notify Me'}</span>
                    </button>
                  ) : (
                    <Link
                      href={`/courses/${course.slug}`}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                        isFeatured
                          ? 'gold-button shadow-md shadow-amber-500/20'
                          : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                      }`}
                    >
                      <span>{isHi ? 'पाठ्यक्रम देखें' : 'View Curriculum'}</span>
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
              <p className="text-sm font-semibold text-white">
                {isHi ? 'क्या आप किसी विशेष ज्योतिष सत्र का सुझाव देना चाहते हैं?' : 'Want to suggest a specialized Jyotish cohort?'}
              </p>
              <p className="text-xs text-slate-400">
                {isHi
                  ? 'हमारी सूची में शीघ्र ही मुहूर्त, चिकित्सा ज्योतिष और जैमिनी सूत्रों पर विशेष कक्षाएं शामिल की जा रही हैं।'
                  : 'Our catalog expands with specialized cohorts on Muhurta, Medical Astrology, and Jaimini Sutras.'}
              </p>
            </div>
          </div>
          <a
            href="https://aapkaastro.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition shrink-0"
          >
            {isHi ? 'आपका एस्ट्रो व्यक्तिगत परामर्श देखें →' : 'Visit Aapka Astro Consultations \u2192'}
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
              {isHi ? 'प्रथम बैच पूर्व-सूचना' : 'Early Cohort Notification'}
            </span>
            <h3 className="text-xl font-bold text-white mt-1 mb-2">
              {isHi && COURSE_HINDI_MAP[notifyCourse.id]?.title ? COURSE_HINDI_MAP[notifyCourse.id].title : notifyCourse.title}
            </h3>
            <p className="text-xs text-slate-300 mb-6">
              {isHi
                ? 'बैच 01 का पंजीकरण शुरू होते ही प्राथमिकता सूचना और विशेष अर्ली-बर्ड छूट प्राप्त करने के लिए अपना ईमेल दर्ज करें।'
                : 'Enter your email to receive priority notification and early-bird registration access the moment Batch 01 opens.'}
            </p>

            {notifyError && (
              <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                {notifyError}
              </div>
            )}

            {notifySuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  {isHi
                    ? 'आप प्राथमिकता सूची में शामिल हो चुके हैं! शुभारंभ पर हम आपको ईमेल भेजेंगे।'
                    : 'You are on the priority notification list! We will email you upon launch.'}
                </span>
              </div>
            ) : (
              <form onSubmit={handleNotifySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {isHi ? 'ईमेल पता' : 'Email Address'}
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
                  {isHi ? 'नामांकन खुलने पर मुझे सूचित करें' : 'Notify Me When Enrollment Opens'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
