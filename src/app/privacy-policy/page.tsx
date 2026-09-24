'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Student Privacy & Security</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            How Viar Academy collects, uses, and safeguards your student data and learning records.
          </p>
          <div className="mt-4 text-xs text-slate-400">
            <span>Last Updated: September 2026</span> • <span>Viar Academy (Vedic Institute of Astrological Research)</span>
          </div>
        </div>

        {/* Legal Disclaimer / Placeholder Notice Banner */}
        <div className="mb-10 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Draft Operational Privacy Policy:</span> Outlines data protection, student record storage, and security practices on viar.in pending formal legal sign-off.
          </div>
        </div>

        {/* Main Content Card */}
        <div className="cosmic-card p-6 sm:p-10 rounded-3xl border border-white/10 space-y-8 text-slate-300 text-sm leading-relaxed">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">1</span>
              Our Commitment to Student Privacy
            </h2>
            <p>
              At <strong>Viar Academy</strong> (operating at viar.in), we recognize that trust is the foundation of genuine spiritual and academic education. We hold your personal details, academic progress, and study interactions with the utmost confidentiality.
            </p>
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>Zero-Sale Pledge:</strong> We do NOT sell, rent, trade, or monetize student personal data with advertisers or data brokers under any circumstances.</span>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">2</span>
              What Student Data We Collect
            </h2>
            <p>We collect only the information necessary to provide an authentic, personalized educational experience:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
                <div className="font-semibold text-white">Identity & Contact Information</div>
                <p className="text-xs text-slate-400">
                  Full name, email address, WhatsApp/phone number (used strictly for live session reminders and cohort updates), country, and local timezone.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
                <div className="font-semibold text-white">Payment & Billing Reference</div>
                <p className="text-xs text-slate-400">
                  Order ID, transaction reference, amount paid, and invoice details. We <strong>never</strong> store credit card numbers, CVVs, or bank passwords; all payments are processed securely by PCI-DSS compliant providers (Razorpay and Stripe).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
                <div className="font-semibold text-white">Academic & Learning Records</div>
                <p className="text-xs text-slate-400">
                  Live session attendance logs, lecture replay watch timestamps, lesson completion percentages, practice quiz answers, final exam scores, and verifiable certificate issuance identifiers.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
                <div className="font-semibold text-white">Technical & Session Data</div>
                <p className="text-xs text-slate-400">
                  IP address, device type, browser metadata, and essential authentication cookies required to maintain your secure student session.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">3</span>
              How We Use Your Data
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-300">
              <li>
                <strong>Cohort Delivery:</strong> Provisioning your student dashboard, providing access to class links (Zoom / Google Meet), and tracking attendance toward graduation.
              </li>
              <li>
                <strong>Academic Support:</strong> Evaluating knowledge check quizzes, reviewing homework chart interpretations, and issuing digital completion certificates.
              </li>
              <li>
                <strong>Critical Operational Notifications:</strong> Dispatching schedule change alerts, holiday postponements, and recording availability emails.
              </li>
              <li>
                <strong>Public Credential Verification:</strong> Maintaining our tamper-proof verification database at <code className="text-amber-300">viar.in/verify</code> where employers or clients can confirm the authenticity of your certificate.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">4</span>
              Third-Party Infrastructure Partners
            </h2>
            <p>
              To maintain industry-standard security and reliability, we work with specialized technology providers:
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <span className="font-semibold text-white">Clerk</span>
                <span className="text-slate-400">Identity management & secure session authentication</span>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <span className="font-semibold text-white">Razorpay & Stripe</span>
                <span className="text-slate-400">PCI-DSS compliant payment gateways (INR & Global USD)</span>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <span className="font-semibold text-white">Vercel & Supabase</span>
                <span className="text-slate-400">Secure serverless hosting & encrypted PostgreSQL database</span>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">5</span>
              Data Retention & Student Rights
            </h2>
            <p>
              We retain student course records, attendance logs, and certificate data for as long as your account remains active or as needed to maintain verifiable credential archives.
            </p>
            <p>
              Students have the right to request a copy of their stored profile data or request account closure by contacting our admissions office at <a href="mailto:ask@aapkaastro.com" className="text-amber-400 underline">ask@aapkaastro.com</a>.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">6</span>
              Contact the Privacy & Admissions Desk
            </h2>
            <p>
              If you have any questions or concerns regarding our privacy practices, please contact:
            </p>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-slate-300">
              <div className="font-semibold text-white">Viar Academy Student Data Protection Desk</div>
              <div>Email: <a href="mailto:ask@aapkaastro.com" className="text-amber-400 underline">ask@aapkaastro.com</a></div>
              <div>Operating Jurisdiction: New Delhi / Gurugram, India</div>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
