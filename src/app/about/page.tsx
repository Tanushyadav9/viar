'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  Award,
  ArrowRight,
  ExternalLink,
  Users,
  Compass
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="cosmic-bg min-h-screen py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Master Lineage & Philosophy</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6">
            About the Master Instructor & <span className="gold-gradient-text">Viar Academy</span>
          </h1>
          {/* PLACEHOLDER: replace with real content */}
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Bridging classical Vedic mathematics, psychological archetypes, and clinical chart analysis for seekers and students worldwide.
          </p>
        </div>

        {/* Biography Showcase */}
        {/* PLACEHOLDER: replace with real content */}
        <div className="bg-gradient-to-b from-[#111827] to-[#0d131f] rounded-3xl border border-amber-500/30 p-8 sm:p-12 lg:p-16 mb-20 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5 text-center">
              <div className="relative inline-block mx-auto">
                <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-3xl overflow-hidden border-2 border-amber-500/40 shadow-2xl mx-auto relative">
                  <Image
                    src="https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=800&auto=format&fit=crop"
                    alt="Acharya [ASTROLOGER NAME]"
                    fill
                    sizes="(max-width: 640px) 256px, 320px"
                    className="object-cover"
                    priority
                  />
                </div>
                <div className="absolute -bottom-4 right-0 bg-[#0f172a] border border-amber-400/40 px-4 py-2 rounded-xl shadow-xl">
                  <p className="text-xs font-bold text-amber-300">Founder, Aapka Astro</p>
                  <p className="text-[10px] text-slate-400">26,000+ Community</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6 text-slate-300 text-sm sm:text-base leading-relaxed">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Biography</span>
                {/* PLACEHOLDER: replace with real instructor name */}
                <h2 className="text-3xl sm:text-4xl font-black text-white mt-1">
                  Acharya [ASTROLOGER NAME]
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-amber-300 mt-1">
                  Founder, Aapka Astro • Vedic Astrology, Vastu Shastra & Gemstone Science
                </p>
              </div>

              {/* PLACEHOLDER: reuse consistent bio language */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm font-medium italic">
                &ldquo;Acharya [ASTROLOGER NAME], with over [X] years of experience in Vedic astrology, Vastu Shastra, and gemstone science, trusted by a growing community of over 26,000 followers.&rdquo;
              </div>

              <p>
                Astrology is often misunderstood as fatalistic superstition or ungrounded guesswork. At Viar.in, Acharya teaches Jyotish as it was originally codified by ancient rishis: the sacred mathematical science of light (<span className="text-amber-300 italic">Jyoti</span>) and cosmic timing.
              </p>

              <p>
                Having conducted over 35,000 personal chart consultations through his private consultation platform{' '}
                <a
                  href="https://aapkaastro.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 underline font-semibold hover:text-white"
                >
                  Aapka Astro (aapkaastro.com)
                </a>
                , Acharya established <strong>Viar.in</strong> in response to hundreds of clients asking to study Vedic charts systematically with logical clarity, modern pedagogical tools, and authentic certification.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-left">
                <div className="p-3 rounded-xl bg-white/[0.03]">
                  <p className="text-2xl font-black text-amber-300">26,000+</p>
                  <p className="text-xs text-slate-400">Social Followers</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03]">
                  <p className="text-2xl font-black text-white">35,000+</p>
                  <p className="text-xs text-slate-400">Consultations Lineage</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] col-span-2 sm:col-span-1">
                  <p className="text-2xl font-black text-emerald-400">100%</p>
                  <p className="text-xs text-slate-400">Replay Flexibility</p>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* The 3 Educational Pillars of Viar */}
        <div className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">Our Core Standards</h2>
            <h3 className="text-3xl font-extrabold text-white">How Viar Academy Differs</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="cosmic-card p-8 rounded-2xl border border-white/10">
              <Compass className="w-10 h-10 text-amber-400 mb-4" />
              <h4 className="text-xl font-bold text-white mb-2">Mathematical Rigor</h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                We study Sidereal zodiacs, Ayanamsha mechanics, planetary longitude, and actual astronomical cycles rather than vague generic horoscopes.
              </p>
            </div>

            <div className="cosmic-card p-8 rounded-2xl border border-white/10">
              <Users className="w-10 h-10 text-amber-400 mb-4" />
              <h4 className="text-xl font-bold text-white mb-2">Cohort Learning</h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                Small interactive cohorts capped at 50 students. Live sessions with direct question-and-answer on Zoom or Google Meet.
              </p>
            </div>

            <div className="cosmic-card p-8 rounded-2xl border border-white/10">
              <Award className="w-10 h-10 text-amber-400 mb-4" />
              <h4 className="text-xl font-bold text-white mb-2">Verifiable Credential</h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                Earn an authentic graduate certificate backed by a 20-question examination, verifiable at viar.in/verify with a unique registry code.
              </p>
            </div>
          </div>
        </div>

        {/* Cross-Platform Ecosystem Callout */}
        <div className="p-8 rounded-3xl bg-[#090d16] border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-6 mb-20">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Looking for 1-on-1 Consultation Instead?</h3>
            <p className="text-sm text-slate-300 max-w-2xl">
              If you seek personal horoscope readings, marriage matching, or corporate advisory rather than student training, explore Acharya&apos;s consultation platform Aapka Astro or executive advisory platform DOW Consulting.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href="https://aapkaastro.com"
              target="_blank"
              rel="noopener noreferrer"
              className="gold-button px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
            >
              <span>AapkaAstro.com</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://dowconsulting.in"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-200 bg-white/10 hover:bg-white/15 border border-white/15 inline-flex items-center gap-1.5"
            >
              <span>DOWConsulting.in</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/courses/what-is-astrology"
            className="gold-button inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold shadow-xl shadow-amber-500/20"
          >
            <span>Explore Upcoming Cohort</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

      </div>
    </div>
  );
}
