'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Award,
  Download,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  Copy,
  Check
} from 'lucide-react';
import { ViarStore } from '@/lib/store';
import { Certificate } from '@/lib/types';

export default function StudentCertificatesPage() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const allCerts = ViarStore.getCertificates();
    setCerts(allCerts);
  }, []);

  const handleCopyLink = (code: string) => {
    const url = `${window.location.origin}/verify/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="cosmic-bg min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            href="/dashboard"
            className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/payments"
              className="text-xs text-slate-400 hover:text-white transition"
            >
              Payment Receipts
            </Link>
          </div>
        </div>

        {/* Header Card */}
        <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-white/10 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold uppercase tracking-wider mb-2">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Verifiable Academic Credentials</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              My Viar Academy Certificates
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Authentic certifications earned by fulfilling live masterclasses and passing the final graded assessment.
            </p>
          </div>

          <Link
            href="/verify"
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition shrink-0 inline-flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Public Registry Lookup</span>
          </Link>
        </div>

        {/* Certificates List */}
        {certs.length === 0 ? (
          <div className="cosmic-card p-12 rounded-3xl border border-white/10 text-center max-w-lg mx-auto space-y-4">
            <Award className="w-12 h-12 text-slate-500 mx-auto" />
            <h3 className="text-xl font-bold text-white">No Certificates Issued Yet</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Complete your 18 cohort classes (or mark them watched) and pass the 20-question final quiz with 70%+ to receive your authentic credential.
            </p>
            <Link
              href="/dashboard/courses/cohort-wia-batch-1"
              className="gold-button px-6 py-2.5 rounded-xl text-xs font-bold inline-block"
            >
              Continue Flagship Course
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {certs.map((cert) => (
              <div
                key={cert.id}
                className="cosmic-card p-6 sm:p-10 rounded-3xl border border-amber-500/30 shadow-2xl bg-gradient-to-b from-[#101726] to-[#090d16]"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-8">
                  <div>
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      {cert.cohortBatchName}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                      {cert.courseTitle}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Issued on {cert.issueDate} • Grade: <strong className="text-emerald-400">{cert.grade} ({cert.scorePercentage}%)</strong>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleCopyLink(cert.verificationCode)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white flex items-center gap-1.5 transition"
                    >
                      {copiedCode === cert.verificationCode ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-amber-400" />
                          <span>Copy Verify Link</span>
                        </>
                      )}
                    </button>

                    <Link
                      href={`/verify/${cert.verificationCode}`}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 flex items-center gap-1.5 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View Public Page</span>
                    </Link>

                    <a
                      href={`/api/certificates/${cert.verificationCode}/download?print=true`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gold-button px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </a>
                  </div>
                </div>

                {/* High-Fidelity Certificate Render */}
                <div className="p-8 sm:p-12 rounded-3xl bg-[#070a12] border-2 border-amber-500/40 relative overflow-hidden text-center max-w-3xl mx-auto shadow-2xl">
                  
                  {/* Decorative Borders */}
                  <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-amber-400"></div>
                  <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-amber-400"></div>
                  <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-amber-400"></div>
                  <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-amber-400"></div>

                  <div className="inline-flex items-center gap-2 text-amber-400 mb-2">
                    <Sparkles className="w-5 h-5" />
                    <span className="text-2xl font-black tracking-widest text-white">
                      VIAR<span className="text-amber-400">.IN</span> ACADEMY
                    </span>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <p className="text-[11px] uppercase tracking-widest text-amber-300 font-semibold mb-6">
                    School of Vedic Jyotish & Applied Cosmology • By Aapka Astro
                  </p>

                  <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">
                    Certificate of Academic Achievement
                  </p>
                  <p className="text-xs text-slate-400 mb-2">Proudly conferred upon</p>

                  <h3 className="text-3xl sm:text-4xl font-serif font-black text-amber-300 mb-4">
                    {cert.studentName}
                  </h3>

                  <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed mb-6">
                    for demonstrating complete mastery of 18 cohort classes, classical Kundali synthesis, and achieving a passing grade of{' '}
                    <strong className="text-white">{cert.grade} ({cert.scorePercentage}%)</strong> in the examination of:
                  </p>

                  <h4 className="text-lg sm:text-xl font-bold text-white mb-6 border-y border-amber-500/20 py-2.5 max-w-md mx-auto">
                    {cert.courseTitle}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-white/10 items-end max-w-xl mx-auto text-left">
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider">Date of Award</p>
                      <p className="text-xs font-semibold text-white">{cert.issueDate}</p>
                    </div>

                    <div className="text-center">
                      <div className="font-serif italic text-base text-amber-400 mb-0.5">
                        {cert.instructorName}
                      </div>
                      <div className="w-24 h-[1px] bg-amber-500/40 mx-auto mb-1"></div>
                      <p className="text-[10px] font-bold text-white">{cert.instructorName}</p>
                      <p className="text-[9px] text-slate-400">{cert.instructorTitle}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider">Verification Hash</p>
                      <p className="text-xs font-mono font-bold text-amber-300">{cert.verificationCode}</p>
                      <p className="text-[8px] text-emerald-400 flex items-center justify-end gap-1 mt-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Tamper-Proof</span>
                      </p>
                    </div>
                  </div>

                </div>

              </div>
            ))}
          </div>
        )}

        {/* Course Completion Cross-Sell: 1:1 Consultation on Aapka Astro (Requirement: Beat Astrotalk) */}
        <div className="mt-12 p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-950/20 to-purple-950/20 border border-amber-500/30 text-white relative overflow-hidden shadow-2xl">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Alumni Privilege • Next Step in Your Astrological Journey</span>
              </div>
              <h3 className="text-2xl font-black text-white">
                Apply Your Knowledge to Your Own Chart
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Now that you have mastered the foundational mechanics of Jyotish, book a private 1-on-1 Kundali consultation with <strong>Acharya Niraj Kumar</strong> on Aapka Astro. Have your personal dashas, karmic questions, and remedies analyzed directly by your master instructor.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full lg:w-auto">
              <a
                href="https://aapkaastro.com"
                target="_blank"
                rel="noopener noreferrer"
                className="gold-button w-full sm:w-auto px-6 py-3.5 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Book 1:1 Consultation on Aapka Astro</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <a
                href="https://wa.me/919311215564?text=Hello%20Acharya%20Niraj%20Kumar,%20I%20have%20completed%20the%20Viar.in%20astrology%20course%20and%20would%20like%20to%20schedule%20a%20private%20chart%20consultation."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl text-xs font-bold text-center bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 transition"
              >
                WhatsApp Desk
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
