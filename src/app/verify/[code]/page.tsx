'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  Award,
  Sparkles,
  Download,
  ArrowLeft
} from 'lucide-react';
import { ViarStore } from '@/lib/store';
import { Certificate } from '@/lib/types';

export default function PublicVerifyCertificatePage() {
  const params = useParams();
  const code = params?.code as string;
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (code) {
      const found = ViarStore.getCertificateByCode(code);
      if (found) {
        setCert(found);
      }
      setLoading(false);
    }
  }, [code]);

  if (loading) {
    return (
      <div className="cosmic-bg min-h-screen flex items-center justify-center p-4">
        <Sparkles className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="cosmic-bg min-h-screen py-20 text-center px-4">
        <div className="max-w-md mx-auto cosmic-card p-8 rounded-2xl border border-white/10 space-y-4">
          <Award className="w-12 h-12 text-slate-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Certificate Not Found</h2>
          <p className="text-xs text-slate-400">
            No active certificate matching code &quot;<span className="font-mono text-amber-400">{code}</span>&quot; exists in the registry.
          </p>
          <Link
            href="/verify"
            className="gold-button px-5 py-2 rounded-xl text-xs font-bold inline-block"
          >
            Search Another Code
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cosmic-bg min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Link
          href="/verify"
          className="text-xs text-slate-400 hover:text-white mb-6 inline-flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Verification Registry</span>
        </Link>

        {/* Verification Verified Banner */}
        <div className="mb-8 p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-emerald-300 font-bold">
                Authentic & Officially Verified Credential
              </p>
              <p className="text-xs text-slate-300 mt-0.5">
                Issued by Viar.in Academy in partnership with Aapka Astro (aapkaastro.com).
              </p>
            </div>
          </div>

          <a
            href={`/api/certificates/${code}/download?print=true`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/15 flex items-center gap-1.5 shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Official Certificate PDF</span>
          </a>
        </div>

        {/* The Official Certificate Rendering */}
        <div className="p-8 sm:p-14 rounded-3xl bg-[#090d16] border-4 border-amber-500/40 shadow-2xl relative overflow-hidden text-center mb-10">
          
          {/* Corner Decors */}
          <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-amber-400/60"></div>
          <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-amber-400/60"></div>
          <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-amber-400/60"></div>
          <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-amber-400/60"></div>

          {/* Seal / Emblem */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-6 h-6 text-amber-400" />
              <span className="text-3xl font-black tracking-widest text-white">
                VIAR<span className="text-amber-400">.IN</span> ACADEMY
              </span>
              <Sparkles className="w-6 h-6 text-amber-400" />
            </div>
            <p className="text-xs uppercase tracking-widest text-amber-300 font-semibold">
              School of Vedic Jyotish & Applied Cosmology • By Aapka Astro
            </p>
          </div>

          <p className="text-xs uppercase tracking-widest text-slate-400 font-medium mb-3">
            Certificate of Academic & Practical Achievement
          </p>

          <p className="text-xs text-slate-400 mb-2">This is proudly awarded to</p>

          <h1 className="text-3xl sm:text-5xl font-serif font-black text-amber-300 mb-4 tracking-wide">
            {cert.studentName}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed mb-6">
            for successfully fulfilling the 18 live masterclasses, chart reading practicum, and demonstrating comprehensive mastery with a grade of{' '}
            <strong className="text-white">{cert.grade} ({cert.scorePercentage}%)</strong> on the final examination of:
          </p>

          <h2 className="text-xl sm:text-2xl font-black text-white mb-8 border-y border-amber-500/30 py-3.5 max-w-xl mx-auto">
            {cert.courseTitle}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-white/10 items-end max-w-2xl mx-auto text-left">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Date of Award</p>
              <p className="text-xs font-semibold text-white">{cert.issueDate}</p>
              <p className="text-[10px] text-slate-400 mt-1">{cert.cohortBatchName}</p>
            </div>

            <div className="text-center">
              {/* Verified Instructor Signature Line */}
              <div className="font-serif italic text-lg text-amber-400 mb-1">
                {cert.instructorName}
              </div>
              <div className="w-32 h-[1px] bg-amber-500/40 mx-auto mb-1"></div>
              <p className="text-[11px] font-bold text-white">{cert.instructorName}</p>
              <p className="text-[10px] text-slate-400">{cert.instructorTitle}</p>
            </div>

            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Official Hash</p>
              <p className="text-xs font-mono font-bold text-amber-300">{cert.verificationCode}</p>
              <p className="text-[9px] text-emerald-400 font-semibold flex items-center justify-end gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3" />
                <span>Verified in Registry</span>
              </p>
            </div>
          </div>

        </div>

        {/* Verification Metadata Box */}
        <div className="cosmic-card p-6 rounded-2xl border border-white/10 text-xs text-slate-300 space-y-3">
          <h3 className="font-bold text-white uppercase tracking-wider text-xs">
            Credential Metadata & Audit Trail
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div>
              <span className="text-slate-400 block">Student Name:</span>
              <span className="font-bold text-white">{cert.studentName}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Issuing Authority:</span>
              <span className="font-bold text-white">Viar.in Academy / Aapka Astro</span>
            </div>
            <div>
              <span className="text-slate-400 block">Examination Result:</span>
              <span className="font-bold text-amber-300">{cert.scorePercentage}% (Passed)</span>
            </div>
            <div>
              <span className="text-slate-400 block">Permanent Record:</span>
              <span className="font-mono text-slate-300 truncate block">{cert.verificationCode}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
