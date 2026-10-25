'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  X,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  GraduationCap,
} from 'lucide-react';
import { ViarStore } from '@/lib/store';
import { Course, Cohort, CourseModule, ContentItem } from '@/lib/types';
import { BUILTIN_CONTENT_DEFAULTS } from '@/lib/content/defaultContent';
import { useLanguage } from '@/components/LanguageContext';

interface WelcomeCohortModalProps {
  /** Override session key for testing or customization */
  sessionKey?: string;
  /** Persistent dismiss key for "Don't show again" */
  dismissKey?: string;
  /** Milliseconds delay before modal appears */
  delayMs?: number;
}

export default function WelcomeCohortModal({
  sessionKey = 'viar_welcome_modal_shown_session',
  dismissKey = 'viar_welcome_modal_dismissed_v1',
  delayMs = 1800,
}: WelcomeCohortModalProps) {
  const pathname = usePathname();
  const { isHi } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [popupContent, setPopupContent] = useState<ContentItem | null | undefined>(() => BUILTIN_CONTENT_DEFAULTS.popup?.[0] as ContentItem | undefined);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    try {
      sessionStorage.setItem(sessionKey, 'true');
    } catch {
      // Ignore storage errors
    }
  }, [sessionKey]);

  const handleDismissForever = useCallback(() => {
    try {
      localStorage.setItem(dismissKey, 'true');
      sessionStorage.setItem(sessionKey, 'true');
    } catch {
      // Storage unavailable or quota exceeded
    }
    setIsOpen(false);
  }, [dismissKey, sessionKey]);

  useEffect(() => {
    // Check if forceOpen query param is present for visual verification & regression checks
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const forceOpen = searchParams?.get('promo') === '1';

    if (!forceOpen) {
      // 1. Route Suppression: Never show on dashboard, admin, instructor, checkout, or auth routes
      if (
        !pathname ||
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/instructor') ||
        pathname.startsWith('/checkout') ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/signup') ||
        pathname.startsWith('/sign-in') ||
        pathname.startsWith('/sign-up') ||
        pathname.startsWith('/sso-callback')
      ) {
        setIsOpen(false);
        return;
      }

      // 2. Persistent Dismissal Check (localStorage)
      try {
        if (localStorage.getItem(dismissKey) === 'true') {
          return;
        }
      } catch {
        // Ignore storage errors
      }

      // 3. Once per visitor per session check (sessionStorage)
      try {
        if (sessionStorage.getItem(sessionKey) === 'true') {
          return;
        }
      } catch {
        // Ignore storage errors
      }

      // 4. User Logged-In Suppression Check:
      // Strictly suppressed for logged-in users (matching Aapka Astro's welcome popup pattern)
      const currentUser = ViarStore.getCurrentUser();
      if (currentUser) {
        return;
      }

      // Check for active authentication session cookie (Clerk)
      if (
        typeof document !== 'undefined' &&
        (document.cookie.includes('__session') || document.cookie.includes('__client_uat'))
      ) {
        return;
      }
    }

    // 4.5 Enrolled Student Suppression Check: Never show to enrolled students
    fetch('/api/courses/what-is-astrology/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((statusData) => {
        if (statusData?.isEnrolled || statusData?.state === 'ENROLLED') {
          setIsOpen(false);
        }
      })
      .catch(() => {});

    // 5. Load flagship course and cohort data
    const flagshipSlug = 'what-is-astrology-basics-of-astrology';
    const flagship =
      ViarStore.getCourseBySlug(flagshipSlug) ||
      ViarStore.getCourseBySlug('what-is-astrology') ||
      ViarStore.getCourses()[0];
    const flagshipCohort = flagship ? (Array.isArray(ViarStore.getCohorts(flagship.id)) ? ViarStore.getCohorts(flagship.id)[0] : null) : null;

    if (flagship) {
      setCourse(flagship);
      if (flagshipCohort) {
        setCohort(flagshipCohort);
      }
    }

    // Query live database/API endpoint to ensure real-time pricing and availability
    fetch(`/api/courses?slug=${flagship?.slug || flagshipSlug}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.course) {
          setCourse(data.course);
          if (data.course.cohorts && data.course.cohorts.length > 0) {
            setCohort(data.course.cohorts[0]);
          }
        }
      })
      .catch(() => {
        // Fallback to ViarStore initialized state
      });

    // Fetch promotional popup content dynamically from Content Studio
    fetch('/api/content?collection=popup&key=course_promo_popup')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data.item) {
          setPopupContent(data.item);
          if (data.item.metadata?.enabled === false || data.item.status === 'HIDDEN') {
            setIsOpen(false);
          }
        }
      })
      .catch(() => {});

    const effectiveDelay = forceOpen ? 0 : delayMs;
    const timer = setTimeout(() => {
      // Check if popup has been disabled by Owner
      if (popupContent?.metadata?.enabled === false || popupContent?.status === 'HIDDEN') {
        return;
      }
      try {
        if (!forceOpen) {
          sessionStorage.setItem(sessionKey, 'true');
        }
      } catch {
        // Ignore
      }
      setIsOpen(true);
    }, effectiveDelay);

    return () => clearTimeout(timer);
  }, [pathname, sessionKey, dismissKey, delayMs, popupContent]);

  // 6. Dismissible via Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen || !course) return null;

  const targetCohort = cohort || (Array.isArray(ViarStore.getCohorts()) ? ViarStore.getCohorts()[0] : null);
  const priceFormatted = `₹${(course.priceInr || 5100).toLocaleString('en-IN')}`;
  const originalPriceFormatted = `₹${(course.originalPriceInr || 11000).toLocaleString('en-IN')}`;

  const publishedLessonsCount =
    (course.modules && course.modules.length > 0)
      ? course.modules.reduce((acc: number, m: CourseModule) => acc + (m.lessons ? m.lessons.filter((l) => l.isPublished !== false).length : 0), 0)
      : (course.totalClasses || 23);

  const popupMeta = (popupContent?.metadata || {}) as Record<string, unknown>;

  const modalTitle = (isHi ? (popupContent?.titleHi || popupContent?.titleEn) : (popupContent?.titleEn || popupContent?.titleHi)) || 'The Ultimate Astrology Course';
  const modalSubtitle = (isHi ? (popupContent?.contentHi || popupContent?.contentEn) : (popupContent?.contentEn || popupContent?.contentHi)) || `Basics of Vedic Astrology • ${publishedLessonsCount} Video Modules + 2 Bonus Workshops`;
  const datesLabel = (popupMeta.dates as string) ||
    (popupMeta.startDate && popupMeta.endDate
      ? `${popupMeta.startDate} – ${popupMeta.endDate}`
      : (isHi ? 'प्रवेश प्रारंभ' : 'Launch Enrollment Open'));
  const modalImageUrl = (popupMeta.imageUrl as string) || '/images/Acharya_Niraj_Kumar_Headshot.jpg';
  const modalLinkUrl = (popupMeta.linkUrl as string) || (popupMeta.url as string) || `/checkout/${targetCohort?.id || 'what-is-astrology'}`;
  const modalButtonLabel = isHi
    ? ((popupMeta.buttonLabelHi as string) || (popupMeta.buttonLabelEn as string) || 'अभी प्रवेश लें — तुरंत एक्सेस')
    : ((popupMeta.buttonLabelEn as string) || (popupMeta.buttonLabelHi as string) || 'Enroll Now — Instant Access');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
      data-testid="viar-welcome-cohort-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#3B2A1E]/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      {/* Click-outside backdrop */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Warm Ivory / Maroon / Gold Modal Card in Established Site Theme */}
      <div
        data-testid="viar-welcome-modal-card"
        className="relative w-full max-w-lg min-w-0 mx-auto rounded-2xl sm:rounded-3xl bg-[#FBF3E7] text-[#3B2A1E] border-2 border-[#E8A33D]/60 shadow-2xl shadow-[#7B2D26]/25 overflow-hidden z-10 animate-in zoom-in-95 duration-200 font-body max-h-[92vh] overflow-y-auto"
      >
        {/* Top Decorative Header Accent Bar in Brand Maroon & Gold */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#7B2D26] via-[#E8A33D] to-[#7B2D26]" />

        {/* Subtle Warm Celestial / Zodiac Wheel Backdrop Motif in Brand Gold & Maroon */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
          {/* Soft warm radial glow */}
          <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-gradient-to-br from-[#E8A33D]/15 via-[#7B2D26]/5 to-transparent blur-2xl" />
          <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-gradient-to-tr from-[#E8A33D]/10 via-[#7B2D26]/5 to-transparent blur-2xl" />

          {/* Authentic Astrological Zodiac Wheel / Kundli Chakra in Warm Gold & Maroon */}
          <svg
            viewBox="0 0 500 500"
            className="absolute -right-20 -bottom-20 w-80 h-80 sm:w-96 sm:h-96 opacity-20 sm:opacity-25"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Concentric Astrological Coordinate Rings */}
            <circle cx="250" cy="250" r="230" stroke="#E8A33D" strokeWidth="1.5" strokeDasharray="4 4" />
            <circle cx="250" cy="250" r="210" stroke="#7B2D26" strokeWidth="1.5" opacity="0.6" />
            <circle cx="250" cy="250" r="160" stroke="#E8A33D" strokeWidth="1" />
            <circle cx="250" cy="250" r="110" stroke="#7B2D26" strokeWidth="1" opacity="0.5" />
            <circle cx="250" cy="250" r="60" stroke="#E8A33D" strokeWidth="1.5" />
            <circle cx="250" cy="250" r="15" fill="#E8A33D" opacity="0.3" />

            {/* 12 Astrological House Radials (Bhavas / Rashis at 30-degree intervals) */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * 30 * Math.PI) / 180;
              const x1 = 250 + 60 * Math.cos(angle);
              const y1 = 250 + 60 * Math.sin(angle);
              const x2 = 250 + 210 * Math.cos(angle);
              const y2 = 250 + 210 * Math.sin(angle);
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={i % 3 === 0 ? '#7B2D26' : '#E8A33D'}
                  strokeWidth={i % 3 === 0 ? '1.5' : '0.75'}
                  opacity={i % 3 === 0 ? '0.7' : '0.4'}
                />
              );
            })}

            {/* 24 Degree / Nakshatra Ticks */}
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i * 15 * Math.PI) / 180;
              const x1 = 250 + 205 * Math.cos(angle);
              const y1 = 250 + 205 * Math.sin(angle);
              const x2 = 250 + 210 * Math.cos(angle);
              const y2 = 250 + 210 * Math.sin(angle);
              return (
                <line
                  key={`tick-${i}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#E8A33D"
                  strokeWidth="1"
                  opacity="0.6"
                />
              );
            })}

            {/* 8-Pointed Star / Ashtakavarga Accent at the Hub */}
            <polygon
              points="250,225 257,243 275,250 257,257 250,275 243,257 225,250 243,243"
              fill="#7B2D26"
              opacity="0.3"
            />
          </svg>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close promotion dialog"
          className="absolute top-3.5 right-3.5 z-20 p-1.5 rounded-full text-[#7B2D26]/70 hover:text-[#7B2D26] bg-[#7B2D26]/10 hover:bg-[#7B2D26]/20 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Main Content Container with Generous Spacing */}
        <div className="relative z-10 p-4 sm:p-7 text-center">
          
          {/* 1. Header: Vihangam Real Sun Logo & Academic Brand Mark */}
          <div className="flex flex-col items-center justify-center gap-1.5 mb-3.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#7B2D26]/10 border border-[#7B2D26]/20 text-[#7B2D26]">
              <Image
                src="/images/logo-icon.png"
                alt="VIAR Sun Logo"
                width={20}
                height={20}
                className="w-5 h-5 object-contain"
                priority
              />
              <span className="font-heading text-[10px] sm:text-[11px] font-bold tracking-[0.16em] uppercase">
                Vihangam Institute (VIAR)
              </span>
            </div>
            <div className="font-body text-[10px] text-[#3B2A1E]/70 font-medium">
              In Academic Lineage with Aapka Astro
            </div>
          </div>

          {/* 2. Launch Announcement Pill in its own block container with guaranteed bottom clearance */}
          <div className="flex justify-center mb-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E8A33D]/25 text-[#7B2D26] border border-[#E8A33D]/60 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#C1662F] shrink-0" />
              <span className="tracking-wide uppercase text-[10px] sm:text-[11px] font-extrabold font-body">
                {datesLabel}
              </span>
            </div>
          </div>

          {/* 3. Headline & Subtitle with Dedicated Margin, Generous Line-Height and Zero Overlap */}
          <div className="mb-4 px-1">
            <h2
              id="welcome-modal-title"
              data-testid="viar-welcome-modal-title"
              className="text-lg sm:text-2xl font-black text-[#7B2D26] font-heading tracking-normal leading-snug sm:leading-normal mb-1.5 pt-0.5"
            >
              {modalTitle}
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-[#C1662F] font-body leading-normal">
              {modalSubtitle}
            </p>
          </div>

          {/* 4. Instructor Solo Portrait with Circular Halo Frame & Academic Credential */}
          <div className="flex flex-col items-center justify-center mb-3.5">
            {/* Solo Portrait in Intentional Circular Frame / Halo */}
            <div className="relative mb-2">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[2.5px] bg-gradient-to-tr from-[#7B2D26] via-[#E8A33D] to-[#7B2D26] shadow-md shadow-[#7B2D26]/20">
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-[#FFFDF9] bg-[#F5EADB]">
                  <Image
                    src={modalImageUrl}
                    alt="Acharya Niraj Kumar"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover object-center"
                    priority
                  />
                </div>
              </div>
              <div
                className="absolute -bottom-0.5 -right-0.5 p-1 rounded-full bg-[#7B2D26] text-[#E8A33D] border border-[#FFFDF9] shadow-sm"
                title="Jyotish Acharya, Bharatiya Vidya Bhavan"
              >
                <GraduationCap className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl bg-[#FFFDF9] border border-[#E8A33D]/40 text-[#3B2A1E] text-[11px] sm:text-xs font-medium shadow-sm max-w-full">
              <span className="leading-tight sm:leading-normal font-body">
                Taught by <strong className="text-[#7B2D26]">Acharya Niraj Kumar</strong> (Jyotish Acharya, BVB New Delhi)
              </span>
            </div>
          </div>

          {/* 5. Course Structure Badge Grid */}
          <div className="grid grid-cols-2 gap-2.5 mb-3.5 text-center">
            <div className="bg-[#FFFDF9] border border-[#E8A33D]/30 rounded-xl p-2.5 shadow-sm">
              <div className="font-heading font-bold text-[#7B2D26] text-xs sm:text-sm">
                {publishedLessonsCount} Video Modules
              </div>
              <div className="font-body text-[10px] text-[#3B2A1E]/75 font-medium mt-0.5">
                + 2 Bonus Real Chart Labs
              </div>
            </div>
            <div className="bg-[#FFFDF9] border border-[#E8A33D]/30 rounded-xl p-2.5 shadow-sm">
              <div className="font-heading font-bold text-[#7B2D26] text-xs sm:text-sm">
                100% Self-Paced
              </div>
              <div className="font-body text-[10px] text-[#3B2A1E]/75 font-medium mt-0.5">
                Instant Lifetime Access
              </div>
            </div>
          </div>

          {/* 6. Confirmed Offer Price Box */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F5EADB] border border-[#E8A33D]/50 mb-3.5 text-center">
            <div className="flex items-baseline justify-center gap-2.5 flex-wrap">
              <span className="text-base sm:text-lg font-semibold text-[#3B2A1E]/50 line-through font-body">
                {originalPriceFormatted}
              </span>
              <span className="text-3xl sm:text-4xl font-black text-[#7B2D26] font-heading tracking-tight">
                {priceFormatted}
              </span>
              
              <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-[#6B8E5A]/20 text-[#355326] border border-[#6B8E5A]/40 font-body">
                54% OFF Launch
              </span>
            </div>
            <p className="text-[11px] text-[#3B2A1E]/80 mt-1 font-medium font-body">
              Strictly one-time tuition • Zero recurring fees • Verifiable Certificate included
            </p>
          </div>

          {/* 7. Curriculum Highlights Checklist */}
          <ul className="space-y-1.5 text-xs text-[#3B2A1E]/90 text-left mb-4 max-w-sm mx-auto font-body">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#7B2D26] shrink-0 mt-0.5" />
              <span>
                <strong>{publishedLessonsCount} On-Demand Modules:</strong> 9 Planets, 12 Houses, Rashis, Dashas &amp; Drishti
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#7B2D26] shrink-0 mt-0.5" />
              <span>
                <strong>2 Bonus Clinical Masterclasses:</strong> Real Chart Analysis for Career &amp; Marriage
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#7B2D26] shrink-0 mt-0.5" />
              <span>
                <strong>Verifiable Certificate:</strong> Issued upon passing the 20-question final exam
              </span>
            </li>
          </ul>

          {/* 8. Call to Action & Dismiss Link */}
          <div className="space-y-2.5">
            <Link
              href={modalLinkUrl}
              onClick={handleClose}
              className="w-full py-3.5 px-6 rounded-xl font-heading font-bold text-sm sm:text-base shadow-lg shadow-[#7B2D26]/20 flex items-center justify-center gap-2 bg-gradient-to-r from-[#7B2D26] via-[#8c332b] to-[#7B2D26] text-white hover:brightness-110 active:scale-[0.99] transition cursor-pointer tracking-wide border border-[#E8A33D]/40"
            >
              <span>{modalButtonLabel}</span>
              <ArrowRight className="w-4 h-4 text-[#E8A33D]" />
            </Link>

            <div>
              <button
                type="button"
                onClick={handleDismissForever}
                className="text-xs text-[#3B2A1E]/70 hover:text-[#7B2D26] underline underline-offset-4 font-medium transition cursor-pointer font-body"
              >
                Maybe later, continue browsing
              </button>
            </div>
          </div>

          {/* 9. Subdued Sister Platform Cross-Link */}
          <div className="mt-3.5 pt-3 border-t border-[#7B2D26]/10 text-center font-body">
            <p
              data-testid="viar-welcome-modal-astro-link"
              className="text-[11px] text-[#3B2A1E]/75"
            >
              Looking for a personal 1:1 astrological consultation?{' '}
              <a
                href="https://aapkaastro.com"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleClose}
                className="font-semibold text-[#7B2D26] hover:text-[#521d18] underline decoration-[#E8A33D] underline-offset-2 transition"
              >
                Visit Aapka Astro &rarr;
              </a>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
