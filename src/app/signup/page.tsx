import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { SignUp } from '@clerk/nextjs';
import { ShieldCheck, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SignupPage() {
  let clerkAuth = null;
  try {
    clerkAuth = await auth();
  } catch {
    clerkAuth = null;
  }

  // If already authenticated on server, redirect directly to dashboard
  if (clerkAuth?.userId) {
    redirect('/dashboard');
  }

  const isPublishableKeyConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  return (
    <div className="cosmic-bg min-h-screen py-16 sm:py-24 flex items-center justify-center px-4">
      <div className="max-w-md w-full">

        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center space-x-3 mb-4 group">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-amber-500/30 p-1 flex items-center justify-center group-hover:scale-105 transition shadow-lg shadow-amber-500/10 shrink-0">
              <Image
                src="/images/logo-icon.png"
                alt="VIAR Logo"
                width={40}
                height={40}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div className="text-left">
              <span className="text-2xl font-black tracking-wider text-white block leading-none">
                VIAR<span className="text-amber-400">.IN</span>
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block mt-0.5">
                Vihangam Academy
              </span>
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Create Student Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Join live cohorts, track syllabus progress, and earn authentic certifications.
          </p>

          <div className="mt-4 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center gap-2 text-[11px] text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Secure Student Registration • Powered by Clerk</span>
          </div>
        </div>

        {!isPublishableKeyConfigured ? (
          <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-amber-500/30 shadow-2xl text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
            <h2 className="text-base font-bold text-white">Authentication Misconfigured</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> is missing from environment variables.
            </p>
          </div>
        ) : (
          <div className="flex justify-center">
            <SignUp
              routing="path"
              path="/signup"
              signInUrl="/login"
              fallbackRedirectUrl="/dashboard"
              forceRedirectUrl="/dashboard"
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'bg-[#0f172a] border border-white/10 shadow-2xl rounded-3xl text-white p-6 sm:p-8',
                  headerTitle: 'text-xl font-black text-white text-center',
                  headerSubtitle: 'text-xs text-slate-400 text-center',
                  socialButtonsBlockButton:
                    'bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-xl transition text-xs font-semibold py-2.5',
                  socialButtonsBlockButtonText: 'text-slate-200 font-semibold',
                  dividerLine: 'bg-white/10',
                  dividerText: 'text-slate-500 text-xs uppercase tracking-wider',
                  formFieldLabel: 'text-xs font-semibold text-slate-300',
                  formFieldInput:
                    'bg-white/5 border-white/10 text-white rounded-xl focus:border-amber-400 focus:ring-amber-400 text-sm py-2 px-3',
                  formButtonPrimary:
                    'gold-button text-black font-bold rounded-xl py-2.5 text-xs shadow-lg transition',
                  footerActionText: 'text-xs text-slate-400',
                  footerActionLink: 'text-xs text-amber-400 hover:text-amber-300 font-bold',
                  identityPreviewText: 'text-slate-200 text-xs',
                  identityPreviewEditButtonIcon: 'text-amber-400',
                },
              }}
            />
          </div>
        )}

      </div>
    </div>
  );
}
