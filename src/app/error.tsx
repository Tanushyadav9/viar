'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, MessageCircle, Phone, Mail, Home, BookOpen } from 'lucide-react';
import { logClientError } from '@/lib/telemetry/logClientError';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Automatically report runtime error to the server endpoint
    logClientError(error, { segment: 'app/error' });
  }, [error]);

  const whatsappMessage = encodeURIComponent(
    `Namaste VIAR Team, I encountered an issue on viar.in: ${error?.message || 'Unexpected page error'}${
      error?.digest ? ` (Error ID: ${error.digest})` : ''
    }`
  );

  return (
    <div className="min-h-[80vh] cosmic-bg flex items-center justify-center px-4 py-16 text-slate-100">
      <div className="w-full max-w-2xl bg-slate-900/90 border border-amber-500/30 rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-md text-center">
        {/* Warning Icon Badge */}
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
        </div>

        {/* Calm Bilingual Notice */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-4">
          <span>System Notice</span>
          <span>•</span>
          <span>सूचना</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">
          Something Went Wrong
        </h1>
        <p className="text-amber-300 font-medium text-sm sm:text-base mb-4">
          कुछ गलत हो गया — पृष्ठ लोड नहीं हो सका
        </p>

        <p className="text-slate-300 text-sm leading-relaxed mb-3">
          We apologize for the inconvenience. Our technical engineering team has been automatically notified and is looking into it. Please try reloading or reach out to our team directly.
        </p>
        <p className="text-slate-400 text-xs leading-relaxed mb-8">
          असुविधा के लिए खेद है। हमारी तकनीकी टीम को स्वचालित रूप से सूचित कर दिया गया है। आप पृष्ठ को पुनः लोड करने का प्रयास कर सकते हैं या हमसे संपर्क कर सकते हैं।
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8">
          <button
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
            <span>WhatsApp Support</span>
          </a>

          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>All Courses</span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Home className="w-4 h-4 text-slate-400" />
            <span>Home</span>
          </Link>
        </div>

        {/* Direct Contact Details */}
        <div className="border-t border-slate-800 pt-6 mt-6">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-3">
            Direct Academic & Technical Assistance / सीधा संपर्क
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-slate-300">
            <a
              href="tel:+919311215564"
              className="inline-flex items-center gap-2 hover:text-amber-400 transition-colors"
            >
              <Phone className="w-4 h-4 text-amber-400" />
              <span>+91 93112 15564</span>
            </a>
            <a
              href="mailto:aapkaastro1606@gmail.com"
              className="inline-flex items-center gap-2 hover:text-amber-400 transition-colors"
            >
              <Mail className="w-4 h-4 text-amber-400" />
              <span>aapkaastro1606@gmail.com</span>
            </a>
          </div>
          {error?.digest && (
            <p className="text-[10px] text-slate-500 font-mono mt-4">
              Error Digest: {error.digest}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
