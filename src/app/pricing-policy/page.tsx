'use client';

import React from 'react';
import Link from 'next/link';
import { CreditCard, CheckCircle2, Tag, AlertCircle, ArrowLeft } from 'lucide-react';

export default function PricingPolicyPage() {
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
            <CreditCard className="w-3.5 h-3.5 text-amber-400" />
            <span>Tuition & Inclusions</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Pricing & Tuition Policy
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Transparent one-time course tuition, complete learning inclusions, and pricing terms for current and upcoming courses.
          </p>
          <div className="mt-4 text-xs text-slate-400">
            <span>Last Updated: September 2026</span> • <span>Vihangam Institute of Astrology and Research Academic Admissions</span>
          </div>
        </div>

        {/* Legal Disclaimer / Placeholder Notice Banner */}
        <div className="mb-10 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Draft Operational Pricing Statement:</span> This policy outlines the one-time tuition model and course inclusions on viar.in pending formal legal/client review.
          </div>
        </div>

        {/* Main Content Card */}
        <div className="cosmic-card p-6 sm:p-10 rounded-3xl border border-white/10 space-y-8 text-slate-300 text-sm leading-relaxed">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">1</span>
              Transparent One-Time Tuition Model
            </h2>
            <p>
              Vihangam Institute of Astrology and Research operates on a straightforward, transparent <strong>one-time tuition fee per course</strong>.
            </p>
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-200 text-xs space-y-1">
              <div className="font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero Hidden Subscriptions or Auto-Debits</span>
              </div>
              <p className="text-slate-300">
                We do not enforce recurring monthly membership fees, surprise automated renewals, or hidden technology charges. When you enroll in a course, the tuition paid at checkout covers your entire enrollment through completion.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">2</span>
              What Is Included in Your Tuition
            </h2>
            <p>Every course enrollment includes complete, unrestricted access to:</p>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span><strong>All 23 Structured Video Modules + 2 Bonus Workshops:</strong> Taught systematically by Acharya Niraj Kumar (Jyotish Acharya, BVB New Delhi).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span><strong>1080p HD Video Vault:</strong> Instant, unrestricted lifetime access on any device with progress tracking.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span><strong>Study Workbooks &amp; Slide Decks:</strong> Comprehensive PDF lecture presentations, Sanskrit term glossaries, and chart calculation templates.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span><strong>Interactive Knowledge Checks:</strong> Periodic quizzes to test retention of planetary Dignities, House significations, and Dashas.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span><strong>Final Certification Evaluation:</strong> Graded comprehensive exam and issuance of a tamper-proof digital Certificate of Completion.</span>
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">3</span>
              Direct UPI QR Payment with Zero Gateway Commission Fees
            </h2>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
              <div className="font-semibold text-white">Direct UPI Tuition Fee (₹5,100 INR)</div>
              <p className="text-xs text-slate-300 leading-relaxed">
                All tuition fees on viar.in are priced transparently in <strong>Indian Rupees (₹ INR)</strong>. Third-party payment gateways charge steep 2% to 3% intermediary commission fees. To ensure student tuition remains fully dedicated to genuine Vedic instruction, VIAR receives all payments directly via <strong>UPI QR Code</strong> (Google Pay, PhonePe, Paytm, BHIM, and bank UPI apps).
              </p>
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                <strong>Official Academy UPI ID:</strong> <code className="font-mono bg-black/40 px-2 py-0.5 rounded text-amber-300">9310709233m@pnb</code> (Vihangam Institute of Astrology and Research)
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">4</span>
              &ldquo;Coming Soon&rdquo; Courses & Price Adjustments
            </h2>
            <p>
              Programs listed in our catalog with the badge <strong>&ldquo;Coming Soon&rdquo;</strong> (such as specialized advanced masterclasses) are currently in active syllabus design.
            </p>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-slate-300 space-y-1.5">
              <div className="font-semibold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-400" />
                <span>Price Adjustment Policy</span>
              </div>
              <p className="text-slate-400">
                Any tuition figures or estimated pricing displayed on preview pages prior to enrollment launch are indicative only. Vihangam Institute of Astrology and Research reserves the right to calibrate tuition rates prior to enrollment launch based on expanded session counts, guest masterclasses, and specialized course materials. Once a student completes enrollment at a given rate, their tuition is permanently locked.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">5</span>
              Payment Security & Account Access
            </h2>
            <p>
              UPI transactions are authenticated securely within your own banking application with two-factor authorization. Upon completing payment, simply send the payment confirmation screenshot along with your transaction reference (UTR) to our admissions WhatsApp (+91 93112 15564). Once verified by the academy, access to all course recordings, syllabus materials, and quizzes is automatically activated under your registered login.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">6</span>
              Admissions Billing Support
            </h2>
            <p>
              If you require a formal invoice with GST details for corporate or professional accounting, or if you have questions regarding payment methods, contact our admissions office:
            </p>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-slate-300">
              <div className="font-semibold text-white">Vihangam Institute of Astrology and Research Admissions Billing Desk</div>
              <div>Email: <a href="mailto:aapkaastro1606@gmail.com" className="text-amber-400 underline">aapkaastro1606@gmail.com</a></div>
              <div>WhatsApp Helpline: +91 93112 15564</div>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
