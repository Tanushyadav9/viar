'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, ShieldCheck, Video, Award, Clock, ExternalLink, Phone, Mail } from 'lucide-react';
import { SISTER_SERVICES } from '@/config/services';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#05070a] text-slate-400 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Dedicated "Our Other Services" Section (Requirement 6.6) */}
        <div className="mb-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500/5 via-purple-500/5 to-transparent border border-white/10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Ecosystem Cross-Promotion
                </span>
                <span className="text-xs text-slate-400">Our Other Services</span>
              </div>
              <h3 className="text-lg font-bold text-white">
                Explore Consultations & Corporate Advisory
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Looking for 1-on-1 private chart readings or corporate muhurta consulting? Connect with our sister platforms founded by Acharya Niraj Kumar.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <a
                href={SISTER_SERVICES.aapkaAstro.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center gap-2 transition"
              >
                <Image
                  src="/images/aapkaastro-logo.png"
                  alt="Aapka Astro"
                  width={60}
                  height={18}
                  className="h-4 w-auto object-contain brightness-110"
                />
                <span>{SISTER_SERVICES.aapkaAstro.name}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href={SISTER_SERVICES.dowConsulting.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 inline-flex items-center gap-1.5 transition"
              >
                <span>{SISTER_SERVICES.dowConsulting.name} ({SISTER_SERVICES.dowConsulting.domain})</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

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
                Taught directly by Acharya Niraj Kumar, founder of aapkaastro.com.
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
                <Link href="/courses/vastu-shastra-for-your-home" className="hover:text-amber-400 transition">
                  Vastu Shastra for Your Home
                </Link>
              </li>
              <li>
                <Link href="/courses/gemstone-science-101" className="hover:text-amber-400 transition">
                  Gemstone Science 101
                </Link>
              </li>
              <li>
                <Link href="/courses/numerology-basics" className="hover:text-amber-400 transition">
                  Numerology Basics
                </Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-amber-400 transition text-slate-400">
                  View Full Catalog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Academy & Lineage</h5>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/about" className="hover:text-amber-400 transition">
                  About the Instructor
                </Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-amber-400 transition">
                  Full Course Catalog
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-amber-400 transition">
                  Contact & Admissions
                </Link>
              </li>
              <li>
                <Link href="/instructor" className="hover:text-amber-400 transition text-amber-300">
                  Instructor Suite
                </Link>
              </li>
              <li>
                <a
                  href="https://dowconsulting.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-sky-300 transition text-slate-400 flex items-center gap-1"
                >
                  <span>DOW Consulting</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Student Portal</h5>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/dashboard" className="hover:text-amber-400 transition">
                  Student Dashboard
                </Link>
              </li>
              <li>
                <Link href="/dashboard/courses/cohort-wia-batch-1" className="hover:text-amber-400 transition">
                  18 Classes & Replays
                </Link>
              </li>
              <li>
                <Link href="/dashboard/certificates" className="hover:text-amber-400 transition">
                  My Certificates
                </Link>
              </li>
              <li>
                <Link href="/dashboard/payments" className="hover:text-amber-400 transition">
                  Purchase History & Receipts
                </Link>
              </li>
              <li>
                <Link href="/verify" className="hover:text-amber-400 transition">
                  Public Certificate Lookup
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Connect & Channels</h5>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <a
                  href="https://wa.me/919311215564"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition flex items-center gap-1.5 text-slate-300 font-medium"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>+91 93112 15564 (WhatsApp)</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:ask@aapkaastro.com"
                  className="hover:text-amber-300 transition flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>ask@aapkaastro.com</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/aapkaastrologer/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 transition flex items-center gap-1.5"
                >
                  <span>Instagram: @aapkaastrologer</span>
                  <ExternalLink className="w-3 h-3 inline" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/aapkaastro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 transition flex items-center gap-1.5"
                >
                  <span>Facebook: /aapkaastro</span>
                  <ExternalLink className="w-3 h-3 inline" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.youtube.com/@aapkaastro7900"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 transition flex items-center gap-1.5"
                >
                  <span>YouTube: @aapkaastro7900</span>
                  <ExternalLink className="w-3 h-3 inline" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal & Trust Policies Navigation */}
        <div className="pt-8 pb-8 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-slate-300">Legal & Trust Policies</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-400">
            <Link href="/terms" className="hover:text-amber-400 transition">
              Terms of Service
            </Link>
            <Link href="/privacy-policy" className="hover:text-amber-400 transition">
              Privacy Policy
            </Link>
            <Link href="/refund-policy" className="hover:text-amber-400 transition">
              Refund & Cancellation
            </Link>
            <Link href="/disclaimer" className="hover:text-amber-400 transition">
              Educational Disclaimer
            </Link>
            <Link href="/pricing-policy" className="hover:text-amber-400 transition">
              Pricing Policy
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
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
