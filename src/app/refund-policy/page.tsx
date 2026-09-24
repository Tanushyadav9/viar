'use client';

import React from 'react';
import Link from 'next/link';
import { RefreshCw, AlertCircle, Mail, Phone, ArrowLeft } from 'lucide-react';

export default function RefundPolicyPage() {
  return (
    <div className="cosmic-bg min-h-screen py-16 sm:py-24">
      {/* PLACEHOLDER: replace with client-approved legal text */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb & Navigation */}
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
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Academic Tuition & Cohorts</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Refund & Cancellation Policy
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Transparent, student-friendly terms for cohort seat reservations, schedule adjustments, and tuition refund requests.
          </p>
          <div className="mt-4 text-xs text-slate-400">
            <span>Last Updated: September 2026</span> • <span>Governed by Viar Academy Academic Admissions</span>
          </div>
        </div>

        {/* Legal Disclaimer / Placeholder Notice Banner */}
        <div className="mb-10 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Draft Operational Policy:</span> This policy outlines the cohort tuition framework for Viar Academy courses. All terms are subject to final client and legal confirmation.
          </div>
        </div>

        {/* Main Content Card */}
        <div className="cosmic-card p-6 sm:p-10 rounded-3xl border border-white/10 space-y-8 text-slate-300 text-sm leading-relaxed">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">1</span>
              Scope & Cohort Context
            </h2>
            <p>
              Vedic Institute of Astrological Research (<strong>Viar Academy</strong>, operating at viar.in) delivers structured, live cohort-based educational programs in Vedic Jyotish under the academic direction of Acharya Niraj Kumar.
            </p>
            <p>
              Because our courses feature live interactive teaching with limited cohort seats and individual chart review allocations, seat enrollments directly impact cohort sizing and instructor availability. Consequently, tuition refunds are governed by the cohort-specific milestone windows detailed below rather than per-minute consultation rates.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">2</span>
              Cancellations Prior to Cohort Commencement
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="font-semibold text-white mb-1">More than 72 Hours Before Class 1</div>
                <p className="text-xs text-slate-400">
                  Students may cancel their enrollment for a <strong>100% tuition refund</strong>, minus gateway transaction processing fees (typically 2–3% assessed by Razorpay or Stripe).
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="font-semibold text-white mb-1">Within 72 Hours of Class 1</div>
                <p className="text-xs text-slate-400">
                  Eligible for an <strong>85% tuition refund</strong>, or a <strong>100% transfer credit</strong> toward the subsequent batch at zero re-registration fee.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">3</span>
              Early Cohort Review Window (Classes 1 & 2)
            </h2>
            <p>
              We want every enrolled student to feel confident in the teaching methodology. If, after attending or viewing the replays of <strong>Class 1 or Class 2</strong>, you feel the course is not suitable for your current level, you may request:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
              <li>
                <strong>A 50% prorated refund</strong> of the net tuition paid, OR
              </li>
              <li>
                <strong>A 100% tuition credit voucher</strong> valid for 12 months for any upcoming Viar Academy cohort or masterclass.
              </li>
            </ul>
            <p className="text-xs text-slate-400">
              *Notice must be received via email prior to the scheduled live start time of <strong>Class 3</strong>.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">4</span>
              Post-Class 2 Policy (No Refund Window)
            </h2>
            <p>
              Once <strong>Class 3</strong> has commenced, <strong>no monetary refunds will be issued</strong> under any circumstances.
            </p>
            <p>
              By this milestone, students have gained full access to proprietary course workbooks, foundational planetary slide decks, interactive classroom forums, and recorded archive vaults.
            </p>
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200">
              <span className="font-semibold text-white">Emergency Deferral Option:</span> In the event of unforeseen medical or personal emergencies, a student may petition the Admissions Office for a one-time deferred transfer to the next available batch without re-purchasing the course.
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">5</span>
              Academy Rescheduling or Batch Postponement
            </h2>
            <p>
              If Viar Academy is forced to reschedule a cohort start date by more than thirty (30) calendar days, students will be given the option of either:
            </p>
            <ol className="list-decimal pl-5 space-y-1 text-slate-300">
              <li>An unconditional <strong>100% full refund</strong> returned immediately to the original payment method, or</li>
              <li>Guaranteed priority seat confirmation in the rescheduled batch with complimentary access to introductory preparatory study materials.</li>
            </ol>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">6</span>
              How to Request a Refund & Processing Timelines
            </h2>
            <p>
              To initiate a cancellation or refund inquiry, submit an email to our academic helpdesk:
            </p>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-xs space-y-2">
              <div className="flex items-center gap-2 text-white">
                <Mail className="w-4 h-4 text-amber-400" />
                <span className="font-mono">ask@aapkaastro.com</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>Admissions Helpline: +91 93112 15564 (WhatsApp Mon–Sat, 10 AM – 7 PM IST)</span>
              </div>
              <p className="text-slate-400 pt-1">
                Please include your registered student email, Order / Transaction Reference ID, and the specific reason for your cancellation.
              </p>
            </div>
            <p className="text-xs text-slate-400">
              Approved refunds are submitted to the payment gateway within <strong>48 hours</strong> and typically reflect in the student&apos;s source bank account, card, or UPI app within <strong>5 to 7 business days</strong>.
            </p>
          </section>

          {/* Sister Services Clarification */}
          <section className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs text-slate-300 space-y-1">
            <div className="font-bold text-amber-300">Note on Sister Platform Services:</div>
            <p>
              This policy strictly applies to educational courses on <strong>viar.in</strong>. Private 1-on-1 consultations and kundli chart services booked through our sister portal <strong>aapkaastro.com</strong> are governed separately by Aapka Astro consultation terms.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}
