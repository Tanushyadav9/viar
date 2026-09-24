'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, ExternalLink } from 'lucide-react';
import { SISTER_SERVICES } from '@/config/services';

export default function DisclaimerPage() {
  return (
    <div className="cosmic-bg min-h-screen py-16 sm:py-24">
      {/* PLACEHOLDER: replace with client-approved legal text */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 hover:text-amber-300 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Academic & Professional Scope</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Educational Disclaimer
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Understanding the educational boundaries, scientific-philosophical context, and professional scope of our curriculum.
          </p>
          <div className="mt-4 text-xs text-slate-400">
            <span>Last Updated: September 2026</span> • <span>Viar Academy Academic Direction</span>
          </div>
        </div>

        {/* Legal Disclaimer / Placeholder Notice Banner */}
        <div className="mb-10 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Draft Operational Disclaimer:</span> Outlines the educational nature of Viar Academy courses and clarifies professional boundaries pending formal legal review.
          </div>
        </div>

        {/* Main Content Card */}
        <div className="cosmic-card p-6 sm:p-10 rounded-3xl border border-white/10 space-y-8 text-slate-300 text-sm leading-relaxed">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">1</span>
              Strictly Educational & Philosophical Scope
            </h2>
            <p>
              The <strong>Vedic Institute of Astrological Research (Viar Academy)</strong> provides systematic educational courses, seminars, and training in classical Vedic Astrology (<em>Parashari Jyotish Shastra</em>), astronomy fundamentals, and celestial mathematical principles.
            </p>
            <p>
              All lectures, homework assignments, case study charts, and curriculum materials are created and presented <strong>strictly for educational, academic, historical, and personal enrichment purposes</strong>.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">2</span>
              Not a Substitute for Professional Advice
            </h2>
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-200 text-xs space-y-2">
              <div className="font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>Important Professional Disclaimers</span>
              </div>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                <li>
                  <strong>Medical & Mental Health:</strong> Astrological concepts discussed in class (such as Ayurvedic doshas or planetary afflictions) are traditional philosophical models and <strong>must never</strong> be used as medical diagnoses, therapies, or substitutes for treatment by licensed physicians and psychiatrists.
                </li>
                <li>
                  <strong>Financial & Investment:</strong> Principles of planetary transits or wealth houses (Dhana Yogas) are historical interpretive tools and <strong>must never</strong> be taken as investment advice, stock recommendations, or commercial guidance. Consult a certified financial planner.
                </li>
                <li>
                  <strong>Legal Matters:</strong> Astrological discussions regarding conflict or timing do not replace qualified legal counsel from a certified attorney.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">3</span>
              No Guarantee of Predictive Outcomes
            </h2>
            <p>
              Classical Vedic astrology operates as a symbolic, mathematical, and karmic framework that maps potential tendencies, life patterns, and celestial cycles. It is non-deterministic.
            </p>
            <p>
              Viar Academy and Acharya Niraj Kumar make <strong>no representations, promises, or guarantees</strong> regarding specific future events, personal fortunes, career breakthroughs, or life outcomes. Individual destiny is shaped by conscious effort, free will, ethical conduct, and individual karma.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">4</span>
              Student Ethical Conduct & Discernment
            </h2>
            <p>
              Students who study at Viar Academy agree to approach chart interpretation with intellectual rigor, compassionate discernment, and ethical responsibility. Students are expected to refrain from creating fear, making absolute fatalistic predictions, or presenting themselves as licensed medical or legal practitioners.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">5</span>
              Distinction from Personal Consultations (Aapka Astro)
            </h2>
            <p>
              Enrolling in Viar Academy courses grants access to group educational instruction, structured syllabus modules, and academic Q&amp;A. It <strong>does not include private, confidential personal chart consultations</strong>.
            </p>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-slate-300">
              <div className="font-semibold text-white mb-1">Looking for a Private 1-on-1 Consultation?</div>
              <p className="text-slate-400">
                Personal birth chart analysis and confidential advisory sessions with Acharya Niraj Kumar are provided separately through our sister practice at{' '}
                <a
                  href={SISTER_SERVICES.aapkaAstro.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 underline inline-flex items-center gap-1 font-medium hover:text-amber-300"
                >
                  <span>{SISTER_SERVICES.aapkaAstro.name} ({SISTER_SERVICES.aapkaAstro.domain})</span>
                  <ExternalLink className="w-3 h-3" />
                </a>.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">6</span>
              Questions & Institutional Contact
            </h2>
            <p>
              For any clarification regarding this disclaimer or our educational philosophy, contact:
            </p>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-slate-300">
              <div className="font-semibold text-white">Viar Academy Academic Inquiries</div>
              <div>Email: <a href="mailto:ask@aapkaastro.com" className="text-amber-400 underline">ask@aapkaastro.com</a></div>
              <div>Website: <a href="https://viar.in" className="text-amber-400 underline">https://viar.in</a></div>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
