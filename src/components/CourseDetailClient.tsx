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
  Bell,
  Download,
  Video,
  Lock,
  MessageCircle,
} from 'lucide-react';
import { Cohort, ContentItem } from '@/lib/types';
import { CoursePublicDTO } from '@/lib/courses/dto';
import { useLanguage } from '@/components/LanguageContext';
import { BUILTIN_CONTENT_DEFAULTS } from '@/lib/content/defaultContent';

interface CourseDetailClientProps {
  slug: string;
}

export default function CourseDetailClient({ slug }: CourseDetailClientProps) {
  const { isHi } = useLanguage();
  const [course, setCourse] = useState<CoursePublicDTO | null>(null);
  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [openModule, setOpenModule] = useState<number | null>(1);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySuccess, setNotifySuccess] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [testimonialsList, setTestimonialsList] = useState<ContentItem[]>(() => (BUILTIN_CONTENT_DEFAULTS.testimonials || []) as ContentItem[]);

  const publishedLessonsCount = React.useMemo(() => {
    if (!course) return 0;
    if (Array.isArray(course.modules) && course.modules.length > 0) {
      const total = course.modules.reduce((acc, m) => {
        if (Array.isArray(m.lessons) && m.lessons.length > 0) {
          return acc + m.lessons.filter((l) => l.isPublished !== false).length;
        }
        return acc + (m.isPublished !== false ? 1 : 0);
      }, 0);
      if (total > 0) return total;
    }
    return course.totalClasses || 23;
  }, [course]);

  useEffect(() => {
    fetch(`/api/courses/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.course) {
          setCourse(data.course);
          if (Array.isArray(data.course.cohorts) && data.course.cohorts.length > 0) {
            setCohort(data.course.cohorts[0]);
          }
        } else {
          setNotFound(true);
        }
      })
      .catch(() => {
        setNotFound(true);
      });

    fetch('/api/content?collection=testimonials')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.items)) {
          setTestimonialsList(data.items);
        }
      })
      .catch(() => {});
  }, [slug]);

  const [notifyError, setNotifyError] = useState<string | null>(null);

  const handleNotifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail || !course) return;

    setNotifyError(null);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: notifyEmail.trim(),
          courseSlug: course.slug,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        setNotifySuccess(true);
        setNotifyEmail('');
        setNotifyError(null);
      } else {
        setNotifyError(data?.error || 'Could not register notification. Please try again.');
      }
    } catch {
      setNotifyError('Network error. Please try again.');
    }
  };

  if (notFound) {
    return (
      <div className="min-h-screen cosmic-bg flex flex-col items-center justify-center p-4 text-center">
        <div className="w-full max-w-xl bg-slate-900/90 border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <span>404 Notice</span>
            <span>•</span>
            <span>पाठ्यक्रम नहीं मिला</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">Course Not Found</h1>
          <p className="text-amber-300 font-medium text-sm mb-3">
            यह पाठ्यक्रम उपलब्ध नहीं है अथवा इसका पता बदल गया है
          </p>
          <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto mb-6">
            The course you are looking for does not exist or has been moved in the Vihangam Institute catalog.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <Link href="/courses" className="gold-button px-6 py-3 rounded-xl text-xs font-bold inline-block">
              Explore All Courses / सभी पाठ्यक्रम
            </Link>
            <a
              href="https://wa.me/919311215564?text=Namaste%20VIAR%20Admissions%2C%20I%20was%20looking%20for%20a%20course%20on%20viar.in%20that%20was%20not%20found."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              WhatsApp Admissions
            </a>
          </div>
          <div className="border-t border-slate-800 pt-4 text-xs text-slate-400">
            Admissions Desk: <a href="tel:+919311215564" className="text-amber-400 hover:underline">+91 93112 15564</a> • <a href="mailto:aapkaastro1606@gmail.com" className="text-amber-400 hover:underline">aapkaastro1606@gmail.com</a>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen cosmic-bg flex items-center justify-center p-4">
        <Sparkles className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  const isComingSoon = course.isComingSoon || !course.isPublished;
  const price = `₹${(course.priceInr || 5100).toLocaleString('en-IN')}`;
  const originalPrice = `₹${(course.originalPriceInr || 11000).toLocaleString('en-IN')}`;
  const savings = `Save ₹${((course.originalPriceInr || 11000) - (course.priceInr || 5100)).toLocaleString('en-IN')}`;
  const origPriceNum = course.originalPriceInr || 11000;
  const priceNum = course.priceInr || 5100;
  const instructor = course.instructor || {
    name: 'Acharya Niraj Kumar',
    title: 'Founder, Aapka Astro & Master Astrologer',
    bio: 'Acharya Niraj Kumar brings together deep traditional Vedic learning rooted in Baidyanath Dham (Deoghar) and corporate leadership experience. Over 20 years of practice, trusted by students and clients across India and abroad.',
    experienceYears: 20,
    avatarUrl: '/images/Acharya_Niraj_Kumar_Desk.jpg',
    aapkaAstroUrl: 'https://aapkaastro.com',
  };
  const discountPercent = origPriceNum > priceNum && origPriceNum > 0
    ? Math.round(((origPriceNum - priceNum) / origPriceNum) * 100)
    : 54;

  return (
    <div className="cosmic-bg min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-8">
          <Link href="/" className="hover:text-white transition">{isHi ? 'होम' : 'Home'}</Link>
          <span>/</span>
          <Link href="/courses" className="hover:text-white transition">{isHi ? 'पाठ्यक्रम' : 'Courses'}</Link>
          <span>/</span>
          <span className="text-amber-400 font-medium truncate max-w-xs">{course.title}</span>
        </div>

        {/* Hero Banner Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-16">
          
          {/* Main Course Info (Left 7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                {isHi ? 'सेल्फ-पेस्ड मास्टरक्लास' : (course.badge || 'Self-Paced Masterclass')}
              </span>
              <span className="text-xs text-slate-400">
                {isHi ? 'स्तर' : 'Level'}: <strong className="text-slate-200">
                  {isHi ? (course.level === 'Beginner' ? 'प्रारंभिक' : course.level === 'Intermediate' ? 'मध्यम' : 'उन्नत') : course.level}
                </strong>
              </span>
              <span className="text-xs text-slate-400">
                {isHi ? 'भाषा' : 'Language'}: <strong className="text-slate-200">
                  {isHi ? 'हिंदी एवं प्रामाणिक वैदिक शब्दावली' : 'English + Hindi Technical Terms'}
                </strong>
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
              {isHi && slug === 'what-is-astrology'
                ? 'सम्पूर्ण वैदिक ज्योतिष: मूल सिद्धांतों से कुंडली महारत'
                : course.title}
            </h1>

            <p className="text-lg sm:text-xl text-amber-200/90 font-medium leading-relaxed">
              {isHi && slug === 'what-is-astrology'
                ? `${publishedLessonsCount} संरचित पाठों में पवित्र विज्ञान सीखें — प्रथम सिद्धांतों से वास्तविक कुंडली तक।`
                : course.tagline}
            </p>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {isHi && slug === 'what-is-astrology'
                ? 'ग्रहों, राशियों, भावों, नक्षत्रों, गोचर और दशा प्रणालियों का विस्तृत अध्ययन। वास्तविक कुंडलियों के साथ भविष्यवाणियां करने में सक्षम बनें।'
                : course.description}
            </p>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="block text-[11px] text-slate-400 uppercase tracking-wider">{isHi ? 'प्रारूप' : 'Format'}</span>
                <span className="text-sm font-bold text-white">{isHi ? `${publishedLessonsCount} वीडियो पाठ` : `${publishedLessonsCount} Video Modules`}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="block text-[11px] text-slate-400 uppercase tracking-wider">{isHi ? 'गति' : 'Pace'}</span>
                <span className="text-sm font-bold text-white">{isHi ? '100% स्व-अध्ययन' : '100% Self-Paced'}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="block text-[11px] text-slate-400 uppercase tracking-wider">{isHi ? 'बोनस' : 'Bonus'}</span>
                <span className="text-sm font-bold text-white">{isHi ? '2 लाइव कुंडली केस' : '2 Real Chart Cases'}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="block text-[11px] text-slate-400 uppercase tracking-wider">{isHi ? 'प्रमाणन' : 'Credential'}</span>
                <span className="text-sm font-bold text-amber-300">{isHi ? 'परीक्षा व प्रमाणपत्र' : 'Exam & Certificate'}</span>
              </div>
            </div>

            {/* Instructor Quick Intro */}
            <div className="p-5 rounded-2xl cosmic-card border border-white/10 flex items-start gap-4 mt-6">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-amber-500/40 shrink-0">
                <Image
                  src={instructor.avatarUrl}
                  alt={instructor.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">
                    {isHi ? 'आचार्य नीरज कुमार' : instructor.name}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {isHi ? 'मुख्य मार्गदर्शक' : 'Lead Astrologer'}
                  </span>
                </div>
                <p className="text-xs text-amber-400/90 font-medium">
                  {isHi
                    ? `संस्थापक, आपका एस्ट्रो • ${instructor.experienceYears}+ वर्ष वैदिक अनुभव`
                    : `Founder, Aapka Astro • ${instructor.experienceYears}+ Years Vedic Experience`}
                </p>
                <p className="text-xs text-slate-400 leading-relaxed pt-1">
                  {isHi
                    ? 'बैद्यनाथ धाम (देवघर) की प्राचीन परंपरा और 20+ वर्षों के कॉर्पोरेट कार्यकारी नेतृत्व का दुर्लभ संगम। देश-विदेश में हजारों छात्रों और परामर्शार्थियों द्वारा प्रशंसित।'
                    : instructor.bio}
                </p>
              </div>
            </div>

          </div>

          {/* Enrollment Card & Pricing (Right 5 cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-amber-500/40 shadow-2xl shadow-amber-500/10 space-y-6 relative overflow-hidden">
              
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

              {/* Payment Mode Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{isHi ? 'शुल्क भुगतान:' : 'Tuition Payment:'}</span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {isHi ? 'सीधा UPI QR (₹ INR)' : 'Direct UPI QR (₹ INR)'}
                </span>
              </div>

              {/* Pricing Display */}
              <div>
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider mb-1">
                  {isHi ? 'एकमुश्त शिक्षण शुल्क • आजीवन पहुंच' : 'One-Time Tuition Fee • Lifetime Access'}
                </span>
                <div className="flex items-baseline gap-3">
                  <span className="text-lg text-slate-400 line-through">{originalPrice}</span>
                  <span className="text-4xl font-black text-white">{price}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {isHi ? `${discountPercent}% प्रारंभिक छूट` : `${discountPercent}% Off Launch`}
                  </span>
                </div>
                <p className="text-xs text-amber-400/90 font-medium mt-1">
                  {isHi
                    ? `बचत ₹${((course.originalPriceInr || 11000) - (course.priceInr || 5100)).toLocaleString('en-IN')} • सभी ${publishedLessonsCount} वीडियो पाठ + 2 बोनस मास्टरक्लास + प्रमाणपत्र सम्मिलित`
                    : `${savings} • All ${publishedLessonsCount} video modules + 2 bonus masterclasses + certificate included`}
                </p>
              </div>

              {/* Course Delivery Details */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{isHi ? 'अध्ययन प्रारूप' : 'Delivery Model'}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300">
                    {isHi ? '100% स्व-अध्ययन' : '100% Self-Paced'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{isHi ? 'पहुंच का प्रकार' : 'Access Type'}</span>
                  <span className="font-semibold text-white">{isHi ? 'तत्काल आजीवन पहुंच' : 'Instant Lifetime Access'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{isHi ? 'कुल पाठ' : 'Total Lessons'}</span>
                  <span className="font-semibold text-white">{isHi ? `${publishedLessonsCount} मॉड्यूल + 2 बोनस कार्यशालाएं` : `${publishedLessonsCount} Modules + 2 Bonus Workshops`}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                  <span className="text-slate-400">{isHi ? 'संस्थान प्रमाणन' : 'Accreditation'}</span>
                  <span className="font-semibold text-amber-400">
                    {isHi ? 'विहंगम संस्थान (VIAR)' : 'Vihangam Institute (VIAR)'}
                  </span>
                </div>
              </div>

              {/* CTA Action */}
              {isComingSoon ? (
                <div className="space-y-4 pt-2">
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block mb-1">
                      {isHi ? 'पाठ्यक्रम तैयारी में है' : 'Curriculum in Preparation'}
                    </span>
                    <p className="text-xs text-slate-300">
                      {isHi
                        ? 'इस पाठ्यक्रम का नामांकन शीघ्र खुल रहा है। प्राथमिकता प्रवेश हेतु अपना ईमेल दर्ज करें।'
                        : 'Enrollment for this syllabus opens shortly. Enter your email for priority admission.'}
                    </p>
                  </div>

                  {notifyError && (
                    <div className="p-3 mb-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs text-center">
                      {notifyError}
                    </div>
                  )}

                  {notifySuccess ? (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                      <p className="text-xs font-bold text-emerald-300">
                        {isHi ? 'आप प्राथमिकता सूची में शामिल हो चुके हैं!' : 'You are on the priority VIP list!'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {isHi ? 'नामांकन शुरू होते ही हम आपको ईमेल भेजेंगे।' : 'We will email you the moment admissions open.'}
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleNotifySubmit} className="space-y-2">
                      <input
                        type="email"
                        required
                        value={notifyEmail}
                        onChange={(e) => setNotifyEmail(e.target.value)}
                        placeholder={isHi ? 'अपना ईमेल पता दर्ज करें' : 'Enter your email address'}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="submit"
                        className="gold-button w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                      >
                        <Bell className="w-4 h-4" />
                        <span>{isHi ? 'नामांकन खुलने पर मुझे सूचित करें' : 'Notify Me When Admissions Open'}</span>
                      </button>
                    </form>
                  )}
                </div>
              ) : cohort ? (
                course.acceptingEnrollments === false ? (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center">
                      <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block mb-1">
                        {isHi ? 'प्रवेश अस्थायी रूप से स्थगित' : 'Admissions Currently Paused'}
                      </span>
                      <p className="text-xs text-slate-300">
                        {isHi
                          ? 'इस बैच में ऑनलाइन प्रवेश अभी बंद है। आगामी तिथियों हेतु आचार्य जी से व्हाट्सएप पर संपर्क करें।'
                          : 'Online checkout is currently paused for this batch. Enquire directly on WhatsApp for upcoming admissions.'}
                      </p>
                    </div>
                    <a
                      href={`https://wa.me/919311215564?text=${encodeURIComponent(
                        isHi
                          ? `नमस्ते आचार्य जी, मैं "${course.title}" पाठ्यक्रम में प्रवेश हेतु पूछताछ करना चाहता/चाहती हूँ।`
                          : `Hello Acharya Ji, I would like to enquire about admissions for "${course.title}".`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 rounded-2xl text-center font-black text-sm block shadow-lg shadow-emerald-500/20 tracking-wide uppercase bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{isHi ? 'व्हाट्सएप पर पूछताछ करें' : 'Enquire on WhatsApp'}</span>
                    </a>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Link
                      href={`/checkout/${cohort.id}`}
                      className="gold-button w-full py-3.5 rounded-2xl text-center font-black text-sm block shadow-lg shadow-amber-500/20 tracking-wide uppercase"
                    >
                      {isHi ? `आज ही सीखना शुरू करें • ${price}` : `Start Learning Today • ${price}`}
                    </Link>

                    <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isHi ? 'सीधा UPI भुगतान • शून्य गेटवे शुल्क • त्वरित सत्यापन' : 'Direct UPI Payment • Zero Gateway Fee • Fast Verification'}</span>
                    </p>
                  </div>
                )
              ) : null}

              {/* Guarantees Checklist */}
              <div className="pt-4 border-t border-white/10 space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{isHi ? `आचार्य नीरज कुमार के ${publishedLessonsCount} संरचित वीडियो पाठ` : `${publishedLessonsCount} structured video modules with Acharya Niraj Kumar`}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{isHi ? '2 बोनस व्यावहारिक कुंडली कार्यशालाएं (करियर व विवाह)' : '2 bonus real-world chart workshops (Career & Marriage)'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{isHi ? 'मोबाइल और लैपटॉप पर आजीवन ऑन-डिमांड पहुंच' : 'Permanent on-demand lifetime access on mobile & desktop'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{isHi ? '20 प्रश्नों की अंतिम परीक्षा + डिजिटल प्रमाणपत्र' : 'Graded 20-question final quiz + digital certificate'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{isHi ? 'viar.in/verify पर सत्यापन योग्य विशिष्ट कोड' : 'Verifiable credential slug on viar.in/verify'}</span>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Free Sample Lesson Section (Requirement: Beat Astrotalk) */}
        <div className="mb-20 cosmic-card p-6 sm:p-10 rounded-3xl border border-amber-500/30 bg-gradient-to-b from-[#111827] to-[#0a0f1a]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
                <Video className="w-3.5 h-3.5 text-amber-400" />
                <span>{isHi ? 'निःशुल्क पूर्वावलोकन पाठ' : 'Free Preview Lesson'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                {isHi ? 'आचार्य नीरज कुमार की शिक्षण शैली का अनुभव करें' : 'Experience Acharya Niraj Kumar\'s Teaching Style'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {isHi
                  ? 'नामांकन से पूर्व शिक्षण की स्पष्टता, तार्किकता और गहन वैदिक गहराई का प्रत्यक्ष अनुभव करें। यह निःशुल्क सत्र दर्शाता है कि खगोलीय कोण, भाव और कर्म के सिद्धांतों को बिना किसी भय या अंधविश्वास के कैसे सिखाया जाता है।'
                  : 'Sample the clarity, logic, and profound Vedic depth before enrolling. Watch this free introductory session demonstrating how astronomical angles, bhavas, and planetary karma are explained without fear or superstition.'}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <span className="text-xs text-amber-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> {isHi ? '100% निःशुल्क पाठ' : '100% Free Sample Lesson'}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {isHi ? 'कार्ड की आवश्यकता नहीं' : 'No Card Required'}
                </span>
              </div>
            </div>

            <div className="lg:col-span-7">
              {/* Official sample video placeholder with download link */}
              <div className="relative rounded-2xl border border-dashed border-amber-500/30 bg-gradient-to-b from-[#111827]/80 to-[#0a0f1a]/80 p-8 sm:p-10 text-center aspect-video flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                  <Video className="w-7 h-7" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                  {isHi ? 'नमूना व्याख्यान वीडियो शीघ्र उपलब्ध' : 'Sample Lecture Video Coming Soon'}
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed max-w-sm mb-4">
                  {isHi
                    ? 'पाठ्यक्रम के पूर्वावलोकन अंश यहां शीघ्र प्रकाशित किए जाएंगे।'
                    : 'Full preview excerpts and sample video lessons are published here in the curriculum.'}
                </p>
                <a
                  href={`/api/courses/${course.slug}/syllabus/download?print=true`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold inline-flex items-center gap-2 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isHi ? 'संपूर्ण पाठ्यक्रम डाउनलोड करें (PDF)' : 'Download Complete Syllabus (PDF)'}</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 23-Module Syllabus Section */}
        <div className="mb-20">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 block mb-2">
              {isHi ? `व्यापक ${publishedLessonsCount}-मॉड्यूल मास्टरक्लास` : `Comprehensive ${publishedLessonsCount}-Module Masterclass`}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              {isHi ? `${publishedLessonsCount} ऑन-डिमांड वीडियो मॉड्यूल + 2 बोनस केस स्टडीज` : `${publishedLessonsCount} On-Demand Video Modules + 2 Bonus Case Studies`}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 mb-6">
              {isHi
                ? 'मूल सिद्धांतों से संपूर्ण शिक्षा: ग्रहों के गणित से लेकर करियर, विवाह और उपायों के लिए वास्तविक कुंडली विश्लेषण तक।'
                : 'Complete first-principles education: from planetary mechanics to reading live charts for career, marriage, and remedies.'}
            </p>

            {/* Downloadable Syllabus Button */}
            <a
              href={`/api/courses/${course.slug}/syllabus/download?print=true`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-slate-200 inline-flex items-center gap-2 transition shadow-md hover:border-amber-400/40"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>{isHi ? `संपूर्ण ${publishedLessonsCount}-मॉड्यूल पाठ्यक्रम विवरण डाउनलोड करें (PDF)` : `Download Complete ${publishedLessonsCount}-Module Curriculum (PDF)`}</span>
            </a>
          </div>

          <div className="space-y-4 max-w-4xl mx-auto">
            {(Array.isArray(course.modules) ? course.modules : []).map((module) => {
              const modNum = module.moduleNumber || module.number || 1;
              const isOpen = openModule === modNum;

              return (
                <div
                  key={module.id}
                  className={`cosmic-card rounded-2xl border transition ${
                    module.isBonus ? 'border-amber-500/40 bg-gradient-to-r from-amber-500/5 to-transparent' : 'border-white/10'
                  }`}
                >
                  <button
                    onClick={() => setOpenModule(isOpen ? null : modNum)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-white/[0.02] transition"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          module.isBonus ? 'bg-amber-500/30 text-amber-200 border border-amber-400/40' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {module.isBonus ? (isHi ? 'बोनस मास्टरक्लास' : 'Bonus Masterclass') : (isHi ? `मॉड्यूल ${modNum}` : `Module ${modNum}`)}
                        </span>
                        <span className="text-xs text-slate-400">
                          {isHi ? `~${module.durationMinutes || 75} मिनट वीडियो` : `~${module.durationMinutes || 75} Mins On-Demand Video`}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white">{module.title}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">{module.description}</p>
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
                    <div className="px-6 pb-6 pt-2 border-t border-white/5 space-y-4">
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                        <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                          {isHi ? 'मॉड्यूल सारांश एवं मार्गदर्शिका' : 'Module Summary & Explanatory Guide'}
                        </span>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                          {module.description}
                        </p>
                      </div>

                      {module.keyTopics && module.keyTopics.length > 0 && (
                        <div>
                          <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider block mb-2">
                            {isHi ? 'मुख्य अवधारणाएं एवं विषय' : 'Key Concepts & Topics Covered'}
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {module.keyTopics.map((topic, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs text-slate-300 p-2 rounded-lg bg-white/[0.02]">
                                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                <span>{topic}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Detailed Lessons Outline */}
                      {Array.isArray(module.lessons) && module.lessons.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                            {isHi ? 'इस मॉड्यूल के पाठ' : 'Lessons in this Module'}
                          </span>
                          <div className="space-y-1.5">
                            {module.lessons.map((lesson) => {
                              const isPreview = Boolean(lesson.isFreePreview);
                              return (
                                <div
                                  key={lesson.id}
                                  className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3 text-xs"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {isPreview ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                        {isHi ? 'निःशुल्क पूर्वावलोकन' : 'Free Preview'}
                                      </span>
                                    ) : (
                                      <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                    )}
                                    <span className={`font-medium truncate ${isPreview ? 'text-amber-200' : 'text-slate-300'}`}>
                                      {lesson.title}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-500 shrink-0">
                                    {isPreview ? (isHi ? 'नमूना उपलब्ध' : 'Sample Available') : (isHi ? 'नामांकित छात्रों के लिए' : 'Enrolled Access')}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <Video className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="text-xs font-semibold text-white">
                            {isHi ? 'पूर्ण वीडियो पाठ + डाउनलोड करने योग्य चीटशीट' : 'Full Video Masterclass + Downloadable Chart Cheatsheet'}
                          </span>
                        </div>
                        <span className="text-[11px] text-emerald-400 font-semibold">
                          {isHi ? 'नामांकन में सम्मिलित' : 'Included in Enrollment'}
                        </span>
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
                {isHi ? 'आधिकारिक प्रमाणन' : 'Official Credential'}
              </span>
              <h3 className="text-2xl font-bold text-white">
                {isHi ? 'अंतिम परीक्षा एवं सत्यापन योग्य डिजिटल प्रमाणपत्र' : 'Final Graded Assessment & Verifiable Certificate'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {isHi
                  ? `${publishedLessonsCount} वीडियो मॉड्यूल पूर्ण करने के बाद विद्यार्थी 20 प्रश्नों की व्यापक अंतिम परीक्षा दे सकते हैं। 70% या अधिक अंक प्राप्त करने पर विहंगम ज्योतिष एवं अनुसंधान संस्थान (VIAR) द्वारा आधिकारिक डिजिटल प्रमाणपत्र प्रदान किया जाता है, जो viar.in/verify पर विश्व स्तर पर सत्यापन योग्य है।`
                  : `Upon completing the ${publishedLessonsCount} self-paced video modules, students unlock the 20-question comprehensive final assessment. Scoring 70% or higher generates an authentic digital Certificate of Completion from Vihangam Institute of Astrology and Research, verifiable worldwide at viar.in/verify.`}
              </p>
              <div className="flex items-center gap-4 text-xs text-amber-400 pt-2">
                <span>{isHi ? '• 20 बहुविकल्पीय प्रश्न' : '• 20 Multiple Choice Questions'}</span>
                <span>{isHi ? '• तत्काल स्वचालित परिणाम' : '• Instant Automated Scoring'}</span>
                <span>{isHi ? '• अद्वितीय सार्वजनिक सत्यापन कोड' : '• Unique Public Verification Slug'}</span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center shrink-0 w-full md:w-56">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-white block">
                {isHi ? 'VIAR द्वारा मान्यता प्राप्त' : 'Accredited by VIAR'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {isHi ? 'विहंगम ज्योतिष एवं अनुसंधान संस्थान' : 'Vihangam Institute of Astrology & Research'}
              </span>
              <span className="text-[10px] text-amber-300 block mt-0.5">
                {isHi ? 'आचार्य नीरज कुमार द्वारा हस्ताक्षरित' : 'Signed by Acharya Niraj Kumar'}
              </span>
            </div>
          </div>
        </div>

        {/* Testimonials Grid — "Render nothing when there are none" */}
        {testimonialsList && testimonialsList.length > 0 ? (
          <div className="mb-20">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400 block mb-2">
                {isHi ? 'छात्रों के अनुभव' : 'Student Experiences'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {isHi ? 'विश्वव्यापी छात्रों एवं अध्येताओं का विश्वास' : 'Trusted by Worldwide Scholars & Cohorts'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonialsList.slice(0, 3).map((t) => {
                const meta = (t.metadata || {}) as Record<string, unknown>;
                const quote = isHi ? t.contentHi || t.contentEn : t.contentEn;
                const author = isHi ? t.titleHi || t.titleEn : t.titleEn;
                const location = String(meta.city || meta.location || '');
                const courseName = String(meta.course || '');
                const rating = typeof meta.rating === 'number' ? meta.rating : 5;

                return (
                  <div key={t.id || t.key} className="cosmic-card p-6 rounded-2xl border border-white/10 space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-1 text-amber-400">
                        {[...Array(rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400" />
                        ))}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed italic">&ldquo;{quote}&rdquo;</p>
                    </div>
                    <div className="pt-2 border-t border-white/5">
                      <span className="text-xs font-semibold text-white block">{author}</span>
                      <span className="text-[10px] text-slate-400 block">
                        {[location, courseName].filter(Boolean).join(' • ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* FAQs */}
        <div className="max-w-3xl mx-auto space-y-4 mb-16">
          <h3 className="text-2xl font-bold text-white text-center mb-6">
            {isHi ? 'अक्सर पूछे जाने वाले प्रश्न' : 'Frequently Asked Questions'}
          </h3>
          {(Array.isArray(course.faqs) ? course.faqs : []).map((faq, idx) => (
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
