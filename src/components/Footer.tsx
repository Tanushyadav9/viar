'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ShieldCheck, Video, Award, Clock, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#05070a] text-slate-400 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Trust features banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-12 border-b border-white/10 mb-12">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Video className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Live + HD Recordings</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Attend live on Zoom/Meet or watch recordings. Both count 100% toward course completion.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Global Timezone Sync</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Every class time converts accurately to your local timezone with calendar integration.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Verifiable Certification</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Passing the final examination earns an authentic credential with online verification.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Aapka Astro Pedigree</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Taught directly by Acharya Dr. Hemant Vashishta, founder of aapkaastro.com.
              </p>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 pb-12">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-black" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                VIAR<span className="text-amber-400">.IN</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed mb-4">
              The premier online astrology academy for students worldwide seeking authentic, mathematical, and compassionate Vedic Jyotish education.
            </p>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-slate-300 max-w-sm">
              <p className="font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
                <span>Looking for private 1-on-1 consultations?</span>
              </p>
              <p className="text-slate-400 leading-normal">
                Visit our sister consultation practice at{' '}
                <a 
                  href="https://aapkaastro.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-amber-400 underline font-medium hover:text-amber-300 inline-flex items-center gap-0.5"
                >
                  AapkaAstro.com <ExternalLink className="w-2.5 h-2.5 inline" />
                </a>
              </p>
            </div>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Courses</h5>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/courses/what-is-astrology" className="hover:text-amber-400 transition">
                  What is Astrology (Flagship)
                </Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-amber-400 transition">
                  Vimshottari Dasha & Transits
                </Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-amber-400 transition">
                  Nakshatra Wisdom
                </Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-amber-400 transition">
                  View Full Catalog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Students</h5>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/dashboard" className="hover:text-amber-400 transition">
                  Student Portal
                </Link>
              </li>
              <li>
                <Link href="/dashboard?tab=recordings" className="hover:text-amber-400 transition">
                  Class Recordings & Notes
                </Link>
              </li>
              <li>
                <Link href="/dashboard?tab=exam" className="hover:text-amber-400 transition">
                  Final Exam Portal
                </Link>
              </li>
              <li>
                <Link href="/verify" className="hover:text-amber-400 transition">
                  Verify a Certificate
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Academy Ethics</h5>
            <ul className="space-y-2.5 text-sm">
              <li className="text-xs text-slate-400 leading-relaxed">
                We practice strictly non-fatalistic, empowering Vedic astrology grounded in cosmic mathematics and psychological wisdom.
              </li>
              <li className="pt-2">
                <span className="inline-block px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 text-xs font-medium border border-amber-500/20">
                  Batch 01 Enrolling Now
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Viar.in (Viar Academy). All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <span>Powered by Aapka Astro Network</span>
            <span>Secure 256-Bit SSL Encrypted</span>
            <span>Worldwide Zoom / Meet Classes</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
