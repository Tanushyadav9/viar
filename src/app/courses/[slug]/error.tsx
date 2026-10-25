'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, MessageCircle, Phone, Mail, BookOpen, Home } from 'lucide-react';
import { logClientError } from '@/lib/telemetry/logClientError';

interface CourseErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CourseSegmentError({ error, reset }: CourseErrorProps) {
  useEffect(() => {
    logClientError(error, { segment: 'courses/[slug]' });
  }, [error]);

  const whatsappMessage = encodeURIComponent(
    `Namaste VIAR Support, I encountered an issue viewing a course curriculum on viar.in: ${
      error?.message || 'Course page error'
    }${error?.digest ? ` (Error ID: ${error.digest})` : ''}`
  );

  return (
    <div className="min-h-[80vh] cosmic-bg bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4 py-16 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900/95 border-2 border-amber-500/30 dark:border-amber-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-md text-center">
        {/* Course Error Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider mb-4">
          <span>Curriculum Notice</span>
          <span>•</span>
          <span>पाठ्यक्रम सूचना</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2">
          Unable to Load Course Details
        </h1>
        <p className="text-amber-700 dark:text-amber-300 font-semibold text-sm sm:text-base mb-4">
          पाठ्यक्रम विवरण लोड करने में समस्या
        </p>

        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-3 font-medium">
          Please try reloading the page, or contact us directly on WhatsApp (+91 93112 15564) if the issue persists.
        </p>
        <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed mb-8">
          कृपया पृष्ठ को पुनः लोड करने का प्रयास करें, या सीधे व्हाट्सएप (+91 93112 15564) पर हमसे संपर्क करें।
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8">
          <button
            type="button"
            onClick={() => reset()}
            className="gold-button inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again / पुनः प्रयास करें</span>
          </button>

          <a
            href={`https://wa.me/919311215564?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-lg shadow-emerald-900/30"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp Admissions</span>
          </a>

          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors"
          >
            <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Browse All Courses</span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors"
          >
            <Home className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span>Home</span>
          </Link>
        </div>

        {/* Contact info with Public Inquiry Email */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-6 mt-6">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold mb-3">
            Academic Counselor & Admissions Support / प्रवेश सहायता
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
            <a
              href="tel:+919311215564"
              className="inline-flex items-center gap-2 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            >
              <Phone className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>+91 93112 15564</span>
            </a>
            <a
              href="mailto:admissions@viar.in"
              className="inline-flex items-center gap-2 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            >
              <Mail className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>admissions@viar.in</span>
            </a>
          </div>
          {error?.digest && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-4">
              Error Digest: {error.digest}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
