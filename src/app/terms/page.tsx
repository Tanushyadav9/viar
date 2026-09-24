'use client';

import React from 'react';
import Link from 'next/link';
import { Scale, AlertCircle, ArrowLeft } from 'lucide-react';

export default function TermsPage() {
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
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            <span>Academic Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Terms of Service & Student Agreement
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Please read these terms carefully before enrolling in any course or using the Viar Academy platform.
          </p>
          <div className="mt-4 text-xs text-slate-400">
            <span>Last Updated: September 2026</span> • <span>Governed by Viar Academy & Aapka Astro Network</span>
          </div>
        </div>

        {/* Legal Disclaimer / Placeholder Notice Banner */}
        <div className="mb-10 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Draft Legal Agreement:</span> This document outlines the operational rules and conditions governing student enrollment on viar.in pending formal legal counsel review.
          </div>
        </div>

        {/* Main Terms Content */}
        <div className="cosmic-card p-6 sm:p-10 rounded-3xl border border-white/10 space-y-8 text-slate-300 text-sm leading-relaxed">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">1</span>
              Acceptance of Agreement
            </h2>
            <p>
              By visiting, accessing, or enrolling in any program on <strong>viar.in</strong> (the &ldquo;Site&rdquo; or &ldquo;Viar Academy&rdquo;), you agree to comply with and be bound by these Terms of Service (&ldquo;Terms&rdquo;), along with our Privacy Policy and Refund Policy.
            </p>
            <p>
              If you do not agree to all provisions of these Terms, you may not register for courses or access student classroom materials.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">2</span>
              Eligibility & Accurate Information Pledge
            </h2>
            <p>
              To register for an account or enroll in a cohort, you must be at least 18 years of age or possess the verified consent of a legal parent or guardian.
            </p>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
              <div className="font-semibold text-white">Accurate Information Pledge:</div>
              <p className="text-xs text-slate-400">
                You agree to provide true, current, and complete personal and contact details during enrollment. Because academic completion certificates are cryptographically verifiable records, certificates are issued strictly in the legal student name provided during registration.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">3</span>
              Cohort Enrollment & Academic Conduct
            </h2>
            <p>
              Course registration grants a personal, revocable, non-transferable right to participate in the designated cohort program.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-300">
              <li>
                <strong>Classroom Etiquette:</strong> Live virtual lectures (via Zoom, Google Meet, or proprietary classroom tools) are scholarly, collegiate environments. Students are expected to maintain respect and decorum.
              </li>
              <li>
                <strong>Zero Tolerance for Harassment:</strong> Any abusive, discriminatory, harassing, or disruptive behavior toward instructors, staff, or fellow students will lead to immediate expulsion and revocation of platform access without refund.
              </li>
              <li>
                <strong>Academic Integrity:</strong> Quizzes, case chart studies, and the final credentialing examination must represent the student&apos;s own scholarly analysis.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">4</span>
              Intellectual Property & Content Protection
            </h2>
            <p>
              All course materials—including recorded live video lectures, slide presentations, proprietary astronomical calculation workbooks, Vedic interpretation frameworks, and case studies developed by Acharya Niraj Kumar—are the exclusive intellectual property of Viar Academy.
            </p>
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
              <strong>Strict Restrictions:</strong> Students are granted access strictly for personal, non-commercial study. You may not record, redistribute, upload to public cloud drives (Google Drive, Dropbox, Mega), share on social platforms (YouTube, Telegram, Instagram), or sell any portion of the course curriculum. Unauthorized redistribution constitutes copyright infringement and will be prosecuted under applicable cyber and copyright laws.
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">5</span>
              Certificates of Completion
            </h2>
            <p>
              Verifiable completion credentials (e.g., VIAR-2026-WIA-XXXX) are granted solely to students who meet the academic criteria:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
              <li>Attendance or verified replay viewing of all eighteen (18) cohort sessions;</li>
              <li>Completion of all periodic knowledge checks;</li>
              <li>Passing the comprehensive final exam with a score of 70% or higher.</li>
            </ul>
            <p className="text-xs text-slate-400">
              Certificates may be verified by any third party via our public registry at <code className="text-amber-300">viar.in/verify</code>.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">6</span>
              Limitation of Educational Liability
            </h2>
            <p>
              Viar Academy provides education in historical, philosophical, and astrological traditions. Course content does not constitute medical, psychological, legal, or investment advice. The Academy and its instructors shall not be held liable for personal, financial, or lifestyle decisions made by students or their acquaintances following course participation.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">7</span>
              Governing Law & Jurisdiction
            </h2>
            <p>
              These Terms of Service and any enrollment agreements shall be governed by, construed, and enforced in accordance with the laws of <strong>India</strong>, without regard to its conflict of law principles.
            </p>
            <p>
              Any disputes or legal proceedings arising out of or related to these Terms shall be subject to the exclusive jurisdiction of the competent civil courts situated in <strong>New Delhi / Gurugram, India</strong>.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">8</span>
              Contact & Inquiries
            </h2>
            <p>
              For questions concerning these Terms or academic enrollment agreements, please contact:
            </p>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-slate-300">
              <div className="font-semibold text-white">Viar Academy Legal & Academic Desk</div>
              <div>Email: <a href="mailto:ask@aapkaastro.com" className="text-amber-400 underline">ask@aapkaastro.com</a></div>
              <div>Affiliated Network: Aapka Astro & DOW Consulting</div>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
