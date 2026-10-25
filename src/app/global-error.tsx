'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, MessageCircle, Phone, Mail } from 'lucide-react';
import { logClientError } from '@/lib/telemetry/logClientError';
import './globals.css';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    logClientError(error, { segment: 'app/global-error' });
  }, [error]);

  const whatsappMessage = encodeURIComponent(
    `Namaste VIAR Team, I encountered a critical layout error on viar.in: ${error?.message || 'Global runtime error'}${
      error?.digest ? ` (Digest: ${error.digest})` : ''
    }`
  );

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans antialiased">
        <div className="w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-2xl p-6 sm:p-10 shadow-2xl text-center">
          {/* Warning Icon Badge */}
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <span>Critical Application Recovery</span>
            <span>•</span>
            <span>पुनर्प्राप्ति</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">
            Application Recovery
          </h1>
          <p className="text-amber-300 font-medium text-sm sm:text-base mb-4">
            तकनीकी समस्या — पृष्ठ को पुनः लोड करने का प्रयास करें
          </p>

          <p className="text-slate-300 text-sm leading-relaxed mb-3">
            An unexpected error occurred while initializing the portal. Our monitoring systems have logged this issue automatically.
          </p>
          <p className="text-slate-400 text-xs leading-relaxed mb-8">
            पोर्टल लोड करते समय एक अप्रत्याशित समस्या आई। हमारी तकनीकी प्रणाली ने इसे स्वचालित रूप से रिकॉर्ड कर लिया है।
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8">
            <button
              onClick={() => reset()}
              className="gold-button inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again / पुनः प्रयास करें</span>
            </button>

            <a
              href={`https://wa.me/919311215564?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-lg shadow-emerald-900/30"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Support</span>
            </a>

            <a
              href="/"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <span>Reload Home / मुख्य पृष्ठ</span>
            </a>
          </div>

          {/* Direct Support Details */}
          <div className="border-t border-slate-800 pt-6 mt-6">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-3">
              Direct Contact / संपर्क सूत्र
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-slate-300">
              <a
                href="tel:+919311215564"
                className="inline-flex items-center gap-2 hover:text-amber-400 transition-colors"
              >
                <Phone className="w-4 h-4 text-amber-400" />
                <span>+91 93112 15564</span>
              </a>
              <a
                href="mailto:aapkaastro1606@gmail.com"
                className="inline-flex items-center gap-2 hover:text-amber-400 transition-colors"
              >
                <Mail className="w-4 h-4 text-amber-400" />
                <span>aapkaastro1606@gmail.com</span>
              </a>
            </div>
            {error?.digest && (
              <p className="text-[10px] text-slate-500 font-mono mt-4">
                Digest: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
