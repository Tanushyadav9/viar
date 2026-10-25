import React from 'react';
import Link from 'next/link';
import { Compass, BookOpen, Home, MessageCircle, Phone, Mail } from 'lucide-react';

export default function GlobalNotFound() {
  const whatsappMessage = encodeURIComponent(
    'Namaste VIAR Team, I was trying to open a page on viar.in but received a 404 Not Found notice. Can you assist me?'
  );

  return (
    <div className="min-h-[75vh] cosmic-bg flex items-center justify-center px-4 py-16 text-slate-100">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-amber-500/30 rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-md text-center text-slate-900 dark:text-slate-100">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6">
          <Compass className="w-8 h-8 text-amber-400" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-4">
          <span>404 — Page Not Found</span>
          <span>•</span>
          <span>पृष्ठ नहीं मिला</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2">
          Page Not Found
        </h1>
        <p className="text-amber-300 font-medium text-sm sm:text-base mb-4">
          पृष्ठ नहीं मिला — यह पता मौजूद नहीं है
        </p>

        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-3">
          The page or resource you are looking for doesn&apos;t exist, may have moved, or is temporarily unavailable.
        </p>
        <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed mb-8">
          आपके द्वारा अनुरोधित पृष्ठ या संसाधन उपलब्ध नहीं है अथवा स्थानांतरित कर दिया गया है।
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8">
          <Link
            href="/"
            className="gold-button inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home / मुख्य पृष्ठ</span>
          </Link>

          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Browse Courses / पाठ्यक्रम देखें</span>
          </Link>

          <a
            href={`https://wa.me/919311215564?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-lg shadow-emerald-900/30"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp Support</span>
          </a>
        </div>

        {/* Contact info */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-6 mt-6">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-3">
            Institute Support Desk / संस्थान सहायता
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            <a
              href="tel:+919311215564"
              className="inline-flex items-center gap-2 hover:text-amber-400 transition-colors"
            >
              <Phone className="w-4 h-4 text-amber-400" />
              <span>+91 93112 15564</span>
            </a>
            <a
              href="mailto:admissions@viar.in"
              className="inline-flex items-center gap-2 hover:text-amber-400 transition-colors"
            >
              <Mail className="w-4 h-4 text-amber-400" />
              <span>admissions@viar.in</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
