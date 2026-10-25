import React from 'react';
import Link from 'next/link';
import { Compass, BookOpen, Home, MessageCircle, Phone, Mail } from 'lucide-react';

export default function CourseNotFound() {
  const whatsappMessage = encodeURIComponent(
    'Namaste VIAR Admissions, I was searching for an astrology course on viar.in but could not find it. Could you please share the upcoming course schedule and catalog?'
  );

  return (
    <div className="min-h-[75vh] cosmic-bg flex items-center justify-center px-4 py-16 text-slate-100">
      <div className="w-full max-w-2xl bg-slate-900/90 border border-amber-500/30 rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-md text-center">
        {/* Not Found Badge Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6">
          <Compass className="w-8 h-8 text-amber-400" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-4">
          <span>404 Notice</span>
          <span>•</span>
          <span>पाठ्यक्रम नहीं मिला</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">
          Course Not Found
        </h1>
        <p className="text-amber-300 font-medium text-sm sm:text-base mb-4">
          यह पाठ्यक्रम उपलब्ध नहीं है अथवा इसका पता बदल गया है
        </p>

        <p className="text-slate-300 text-sm leading-relaxed mb-3">
          The course address you requested could not be located in our current catalog. It may have been archived, renamed, or is scheduled for a future cohort.
        </p>
        <p className="text-slate-400 text-xs leading-relaxed mb-8">
          आपके द्वारा खोजा गया पाठ्यक्रम वर्तमान कैटलॉग में नहीं मिला। यह भविष्य के सत्र के लिए निर्धारित हो सकता है अथवा इसका लिंक परिवर्तित हो गया है।
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8">
          <Link
            href="/courses"
            className="gold-button inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20"
          >
            <BookOpen className="w-4 h-4" />
            <span>Explore All Courses / सभी पाठ्यक्रम देखें</span>
          </Link>

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
            href="/"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Home className="w-4 h-4 text-slate-400" />
            <span>Home</span>
          </Link>
        </div>

        {/* Contact info */}
        <div className="border-t border-slate-800 pt-6 mt-6">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-3">
            Academic Counseling & Admissions Desk / प्रवेश एवं मार्गदर्शन
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
        </div>
      </div>
    </div>
  );
}
