'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Award, Search, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { ViarStore } from '@/lib/store';

export default function CertificateSearchPage() {
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      setErrorMsg('Please enter a certificate verification code.');
      return;
    }

    const cert = ViarStore.getCertificateByCode(trimmed);
    if (cert) {
      router.push(`/verify/${cert.verificationCode}`);
    } else {
      setErrorMsg(`No certificate found matching code "${trimmed}". Please double check the certificate ID.`);
    }
  };

  return (
    <div className="cosmic-bg min-h-screen py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-6 text-amber-400 shadow-xl shadow-amber-500/10">
          <Award className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Viar Academy Registry</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white mb-4">
          Verify an Astrology Certificate
        </h1>
        <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed mb-8">
          Every graduate of Viar.in academy receives a cryptographic, tamper-proof credential signed by Acharya Niraj Kumar. Enter the certificate code below to authenticate.
        </p>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 max-w-lg mx-auto text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="max-w-lg mx-auto mb-12">
          <div className="flex rounded-2xl bg-white/5 border border-white/15 p-1.5 focus-within:border-amber-400 transition shadow-xl">
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setErrorMsg('');
              }}
              placeholder="e.g. VIAR-2026-WIA-9842"
              className="w-full px-4 py-3 bg-transparent text-white text-sm focus:outline-none placeholder:text-slate-500 font-mono uppercase"
            />
            <button
              type="submit"
              className="gold-button px-6 py-3 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5"
            >
              <Search className="w-4 h-4" />
              <span>Verify</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Try demo certificate code: <span className="font-mono text-amber-300 cursor-pointer underline" onClick={() => setCode('VIAR-2026-WIA-9842')}>VIAR-2026-WIA-9842</span>
          </p>
        </form>

        {/* Verification Criteria */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-8 border-t border-white/10">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <CheckCircle2 className="w-4 h-4 text-amber-400 mb-2" />
            <h4 className="text-xs font-bold text-white mb-1">18 Masterclasses</h4>
            <p className="text-[11px] text-slate-400">Complete curriculum in signs, grahas, bhavas, and synthesis.</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <CheckCircle2 className="w-4 h-4 text-amber-400 mb-2" />
            <h4 className="text-xs font-bold text-white mb-1">Rigorous Exam</h4>
            <p className="text-[11px] text-slate-400">Minimum 70% required on 20-question Vedic Jyotish assessment.</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <CheckCircle2 className="w-4 h-4 text-amber-400 mb-2" />
            <h4 className="text-xs font-bold text-white mb-1">Aapka Astro Lineage</h4>
            {/* PLACEHOLDER: Replace with verified reading/consultation count once confirmed across both sites */}
            <p className="text-[11px] text-slate-400">Authenticated by master astrologer trusted by students and clients across India and abroad.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
