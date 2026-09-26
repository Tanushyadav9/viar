'use client';

import React from 'react';
import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';
import { Sparkles, Loader2, ShieldCheck } from 'lucide-react';

export default function ViarLoginSSOCallbackPage() {
  return (
    <div className="cosmic-bg min-h-screen py-16 sm:py-24 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Brand Header */}
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-4 animate-pulse">
          <Sparkles className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Authenticating Student Session...
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2">
          Completing secure Google OAuth handshake and preparing your academy dashboard.
        </p>

        {/* Handshake Card */}
        <div className="cosmic-card mt-6 p-6 rounded-2xl border border-white/10 shadow-2xl flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <span className="text-xs font-semibold text-slate-300">
            Verifying OAuth credentials with Clerk...
          </span>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Encrypted Single Sign-On Handshake</span>
          </div>
        </div>

        {/* Clerk OAuth Redirect Handshake Processor */}
        <AuthenticateWithRedirectCallback
          signInForceRedirectUrl="/dashboard"
          signUpForceRedirectUrl="/dashboard"
          signInFallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/dashboard"
        />
      </div>
    </div>
  );
}
