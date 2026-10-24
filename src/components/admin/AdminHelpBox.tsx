'use client';

import React, { useState } from 'react';
import { HelpCircle, Languages } from 'lucide-react';

interface AdminHelpBoxProps {
  titleEn: string;
  titleHi: string;
  descriptionEn: string;
  descriptionHi: string;
  tipsEn?: string[];
  tipsHi?: string[];
}

export default function AdminHelpBox({
  titleEn,
  titleHi,
  descriptionEn,
  descriptionHi,
  tipsEn = [],
  tipsHi = [],
}: AdminHelpBoxProps) {
  const [lang, setLang] = useState<'en' | 'hi'>('en');

  const isHi = lang === 'hi';
  const title = isHi ? titleHi : titleEn;
  const description = isHi ? descriptionHi : descriptionEn;
  const tips = isHi ? tipsHi : tipsEn;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200 mb-6 relative overflow-hidden transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5 text-amber-400">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">{title}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {isHi ? 'सहायता गाइड' : 'Help & Guidance'}
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px] sm:text-xs">
              {description}
            </p>

            {tips && tips.length > 0 && (
              <ul className="mt-2 space-y-1 text-slate-300 list-disc list-inside text-[11px]">
                {tips.map((tip, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {tip}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Bilingual Language Switcher */}
        <button
          onClick={() => setLang(isHi ? 'en' : 'hi')}
          className="shrink-0 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 text-[11px] font-semibold flex items-center gap-1.5 transition"
          title="Switch guidance between English and Hindi"
        >
          <Languages className="w-3.5 h-3.5 text-amber-400" />
          <span>{isHi ? 'English' : 'हिन्दी'}</span>
        </button>
      </div>
    </div>
  );
}
