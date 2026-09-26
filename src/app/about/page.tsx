'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  Award,
  ArrowRight,
  ExternalLink,
  Users,
  Compass,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  Phone,
  Mail,
  X
} from 'lucide-react';

const CREDENTIAL_GALLERY = [
  {
    src: '/images/gallery/Jyotish_Acharya_Certificate.png',
    alt: 'Jyotish Acharya Certificate',
    title: 'Jyotish Acharya',
    institution: 'Bhartiya Vidya Bhawan (K.N. Rao Institute)',
    category: 'Formal Jyotish Credential',
  },
  {
    src: '/images/gallery/Vastu_Expert_Certificate.png',
    alt: 'Vastu Expert Certificate',
    title: 'Certified Vastu Expert',
    institution: 'Divya Vastu & Vaastu Just For You',
    category: 'Advanced AstroVastu Credential',
  },
  {
    src: '/images/gallery/Recognition_Awards.jpg',
    alt: 'Recognition Awards',
    title: 'Excellence in Astrology & Vastu',
    institution: 'National Astrological Forum',
    category: 'Honor & Recognition',
  },
  {
    src: '/images/gallery/with_guruji.jpg',
    alt: 'Acharya Niraj Kumar with Guruji',
    title: 'With Late Guru Shri B. B. Tiwari',
    institution: 'Parampara & Traditional Lineage',
    category: 'Spiritual Lineage',
  },
  {
    src: '/images/gallery/Awards_Receiving.jpg',
    alt: 'Receiving Astrological Honors',
    title: 'Astrology Felicitations',
    institution: 'Vedic Science Conclave',
    category: 'Honor & Award',
  },
  {
    src: '/images/gallery/Getting_Certificates.jpg',
    alt: 'Certification Ceremony',
    title: 'Academic Convocations',
    institution: 'Jyotish Vidyapeeth',
    category: 'Academic Convocation',
  },
];

export default function AboutPage() {
  const [activeModalImg, setActiveModalImg] = useState<{ src: string; title: string; institution: string } | null>(null);

  return (
    <div className="cosmic-bg min-h-screen py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Master Lineage, Science & Corporate Leadership</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6">
            The Mind Behind <span className="gold-gradient-text">Aapka Astro & Viar.in</span>
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Where traditional Vedic lineage meets corporate executive insight and empirical mathematical rigor.
          </p>
        </div>

        {/* Primary Biography Showcase */}
        <div className="bg-gradient-to-b from-[#111827] to-[#0d131f] rounded-3xl border border-amber-500/30 p-8 sm:p-12 lg:p-16 mb-20 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5 text-center">
              <div className="relative inline-block mx-auto">
                <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-3xl overflow-hidden border-2 border-amber-500/40 shadow-2xl mx-auto relative group">
                  <Image
                    src="/images/Acharya_Niraj_Kumar.jpg"
                    alt="Acharya Niraj Kumar"
                    fill
                    sizes="(max-width: 640px) 256px, 320px"
                    className="object-cover transition duration-500 group-hover:scale-105"
                    priority
                  />
                </div>
                <div className="absolute -bottom-4 right-0 bg-[#0f172a] border border-amber-400/40 px-4 py-2 rounded-xl shadow-xl text-left">
                  <p className="text-xs font-bold text-amber-300">Acharya Niraj Kumar</p>
                  <p className="text-[10px] text-slate-400">Founder, Aapka Astro & Viar.in</p>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-center gap-4">
                <a
                  href="https://wa.me/919311215564"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold inline-flex items-center gap-1.5 hover:bg-emerald-600/30 transition"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>+91 93112 15564</span>
                </a>
                <a
                  href="mailto:ask@aapkaastro.com"
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-medium inline-flex items-center gap-1.5 hover:bg-white/10 transition"
                >
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>ask@aapkaastro.com</span>
                </a>
              </div>

              {/* Official Social Media Channels */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
                <a
                  href="https://www.youtube.com/@aapkaastro7900"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-red-600/15 border border-red-500/30 text-red-300 text-[11px] font-semibold inline-flex items-center gap-1 hover:bg-red-600/25 transition"
                >
                  <span>YouTube: @aapkaastro7900</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
                <a
                  href="https://www.facebook.com/aapkaastro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-blue-600/15 border border-blue-500/30 text-blue-300 text-[11px] font-semibold inline-flex items-center gap-1 hover:bg-blue-600/25 transition"
                >
                  <span>Facebook: /aapkaastro</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
                <a
                  href="https://www.instagram.com/aapkaastrologer/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-pink-600/15 border border-pink-500/30 text-pink-300 text-[11px] font-semibold inline-flex items-center gap-1 hover:bg-pink-600/25 transition"
                >
                  <span>Instagram: @aapkaastrologer</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6 text-slate-300 text-sm sm:text-base leading-relaxed">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Master Instructor Profile</span>
                <h2 className="text-3xl sm:text-4xl font-black text-white mt-1">
                  Acharya Niraj Kumar
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-amber-300 mt-1">
                  Jyotish Acharya • AstroVastu Consultant • Corporate Leadership Veteran
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm font-medium italic">
                &ldquo;Aapka Astro and Viar.in are led by Acharya Niraj Kumar, a practitioner who brings together deep traditional learning and rare real-world corporate leadership.&rdquo;
              </div>

              <p>
                {/* PLACEHOLDER: Replace with verified chart analysis count once confirmed across both sites */}
                Raised in the spiritually rich ecosystem of <strong>Baidyanath Dham, Deoghar</strong>, his journey into astrology and Vastu began early, shaped by curiosity and disciplined guidance. Over the last two decades, he has studied, practiced, and refined his approach, <strong>trusted by students and clients across India and abroad</strong> through comprehensive chart interpretations and numerous Vastu consultations.
              </p>

              <p>
                What makes Acharya Niraj Kumar uniquely effective—especially in demystifying chart interpretation and teaching commercial Vastu—is his extensive corporate background. With over two decades in senior executive roles including <strong>Vice President and Business Head</strong> at major organizations such as <strong>Reliance Retail, Metro Cash & Carry, and NIF Food</strong>, he understands business realities, career crossroads, and executive leadership pressure firsthand.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-left">
                <div className="p-3 rounded-xl bg-white/[0.03]">
                  <p className="text-2xl font-black text-amber-300">20+ Years</p>
                  <p className="text-xs text-slate-400">Vedic Practice</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03]">
                  {/* PLACEHOLDER: Replace with verified chart count once confirmed across both sites */}
                  <p className="text-2xl font-black text-white">Trusted</p>
                  <p className="text-xs text-slate-400">Across India & Abroad</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] col-span-2 sm:col-span-1">
                  <p className="text-2xl font-black text-emerald-400">26,000+</p>
                  <p className="text-xs text-slate-400">Global Community</p>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Credentials & Lineage Grid */}
        <div className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">Lineage & Learning</h2>
            <h3 className="text-3xl font-extrabold text-white">Formal Qualifications & Traditional Credentials</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Traditional Lineage & Jyotish Credentials */}
            <div className="cosmic-card p-8 rounded-2xl border border-amber-500/30 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">Vedic Lineage & Certifications</h4>
                  <p className="text-xs text-amber-300">Certified by India&apos;s leading Jyotish authorities</p>
                </div>
              </div>

              <ul className="space-y-4 text-xs sm:text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold">Trained under Late Guru Shri B. B. Tiwari</strong>
                    <span>Direct lineage learning in classical Parashari Jyotish and ancient oral tradition.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold">Jyotish Acharya</strong>
                    <span>Bhartiya Vidya Bhawan (K.N. Rao Institute) — premier classical Jyotish certification.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold">M.A. in Jyotish (IGNOU, 2024)</strong>
                    <span>Postgraduate academic degree in Vedic astrological sciences and computational astronomy.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold">Nadi Parveen (ICAS)</strong>
                    <span>Indian Council of Astrological Sciences — specialized techniques in Nadi astrology.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold">Jyotish Prabhakar (IRIW under Dr. Pawan Sinha)</strong>
                    <span>Advanced psychological analysis and karmic remedial frameworks.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold">Jyotish Visharad & Jyotish Mani (Bharat Jyotish Vidyapith)</strong>
                    <span>Mastery of planetary transits, Dashas, and Muhurta selection.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold">Advanced Devta & Energy Vastu (Divya Vastu)</strong>
                    <span>Granular decoding of spatial energetic blueprints, micro-zones, and non-demolition remedies.</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Academic & Corporate Leadership */}
            <div className="cosmic-card p-8 rounded-2xl border border-sky-500/30 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">Academic & Corporate Foundation</h4>
                  <p className="text-xs text-sky-300">Executive realism meets timeless metaphysics</p>
                </div>
              </div>

              <ul className="space-y-4 text-xs sm:text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold">B.Sc. (Hons.) in Physics</strong>
                    <span>Analytical, first-principles approach to celestial geometry, optics, and planetary vibrations.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold">PGDBM in International Business & Marketing</strong>
                    <span>Structured corporate management, cross-border operations, and business strategy.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold">Leadership Development & Change Management (XLRI)</strong>
                    <span>Executive leadership credentials from one of Asia&apos;s most prestigious management institutions.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold">Former Vice President & Business Head</strong>
                    <span>Executive leadership tenures at <strong>Reliance Retail</strong>, <strong>Metro Cash & Carry</strong>, and <strong>NIF Food</strong>.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold">Strategic Corporate Vastu Practice</strong>
                    <span>Translating ancient Vastu from abstract dogma into actionable strategy for productivity, leadership alignment, and retail throughput.</span>
                  </div>
                </li>
              </ul>

              <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-200 text-xs leading-relaxed">
                <strong className="font-semibold block mb-1">Why this matters to Viar students:</strong>
                Classes are not taught with vague superstitions or fatalistic warnings. Every concept is taught with astronomical mathematics, psychological nuance, and pragmatic real-world grounding.
              </div>
            </div>

          </div>
        </div>

        {/* Visual Credentials & Recognition Gallery */}
        <div className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">Verified Visual Proof</h2>
            <h3 className="text-3xl font-extrabold text-white">Credentials & Recognition Gallery</h3>
            <p className="text-slate-400 text-sm mt-2">
              Official certificates, awards, and lineage documentation from Aapka Astro archives.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CREDENTIAL_GALLERY.map((item, index) => (
              <div
                key={index}
                onClick={() => setActiveModalImg(item)}
                className="cosmic-card p-4 rounded-2xl border border-white/10 hover:border-amber-500/40 transition group cursor-pointer"
              >
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-black/40 relative mb-4">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-4">
                    <span className="text-xs text-amber-300 font-semibold flex items-center gap-1">
                      <span>Click to view full credential</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                    {item.category}
                  </span>
                  <h4 className="text-base font-bold text-white group-hover:text-amber-200 transition">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {item.institution}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal for viewing credential images */}
        {activeModalImg && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setActiveModalImg(null)}
          >
            <div
              className="bg-[#0f172a] border border-amber-500/40 rounded-2xl max-w-3xl w-full p-4 sm:p-6 relative shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setActiveModalImg(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-white/5 hover:bg-white/10"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full rounded-xl overflow-hidden bg-black mb-4">
                <Image
                  src={activeModalImg.src}
                  alt={activeModalImg.title}
                  fill
                  sizes="800px"
                  className="object-contain"
                />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-white">{activeModalImg.title}</h3>
                <p className="text-sm text-amber-300">{activeModalImg.institution}</p>
              </div>
            </div>
          </div>
        )}

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
                Small interactive cohorts capped at 50 students. Live sessions with direct question-and-answer with Acharya Niraj Kumar on Zoom or Google Meet.
              </p>
            </div>

            <div className="cosmic-card p-8 rounded-2xl border border-white/10">
              <Award className="w-10 h-10 text-amber-400 mb-4" />
              <h4 className="text-xl font-bold text-white mb-2">Verifiable Credential</h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                Earn an authentic graduate certificate backed by a 20-question examination, signed by Acharya Niraj Kumar and verifiable at viar.in/verify.
              </p>
            </div>
          </div>
        </div>

        {/* Cross-Platform Ecosystem Callout */}
        <div className="p-8 rounded-3xl bg-[#090d16] border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-6 mb-20">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Image
                src="/images/aapkaastro-logo.png"
                alt="Aapka Astro"
                width={48}
                height={48}
                className="h-10 w-auto object-contain brightness-110"
              />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Looking for 1-on-1 Consultation Instead?</h3>
              <p className="text-sm text-slate-300 max-w-2xl">
                If you seek personal horoscope readings, marriage matching, or corporate advisory with Acharya Niraj Kumar, explore sister platforms Aapka Astro (+91 93112 15564) or DOW Consulting.
              </p>
            </div>
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
            <span>Explore Upcoming Cohort with Acharya Niraj Kumar</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

      </div>
    </div>
  );
}
