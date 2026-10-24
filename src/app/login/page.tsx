import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { SignIn, SignOutButton } from '@clerk/nextjs';
import { validateRedirectUrl } from '@/lib/auth/urlValidation';
import { prisma } from '@/lib/prisma';
import {
  ShieldCheck,
  AlertCircle,
  LogOut,
  ArrowRight,
  Lock,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface LoginPageProps {
  searchParams: {
    error?: string;
    redirect_url?: string;
    returnUrl?: string;
    redirect?: string;
  };
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  let clerkAuth = null;
  try {
    clerkAuth = await auth();
  } catch {
    clerkAuth = null;
  }

  const userId = clerkAuth?.userId;
  const errorParam = searchParams?.error;
  const rawTarget = searchParams?.redirect_url || searchParams?.returnUrl || searchParams?.redirect;
  const targetUrl = validateRedirectUrl(rawTarget, '/dashboard');

  // Case 1: Valid server session and NO error -> immediate server-side redirect (No loop!)
  if (userId && !errorParam) {
    redirect(targetUrl);
  }

  // Case 2: Browser/server mismatch error -> log diagnostic event and offer clean sign-out
  if (errorParam === 'session_mismatch') {
    try {
      await prisma.activityLog.create({
        data: {
          action: 'AUTH_SESSION_MISMATCH',
          entityType: 'AUTH_SESSION',
          entityId: userId || 'anonymous',
          details: {
            userId: userId || 'anonymous',
            path: '/login',
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch {
      // Non-blocking log
    }
  }

  // Fetch current user details if signed in with an authorization error
  let signedInEmail = '';
  if (userId) {
    try {
      const user = await currentUser();
      signedInEmail =
        user?.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
        user?.emailAddresses?.[0]?.emailAddress ||
        '';
    } catch {
      signedInEmail = '';
    }
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
            Welcome to VIAR
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Access your live masterclasses, HD recordings, and certificates.
          </p>

          <div className="mt-4 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center gap-2 text-[11px] text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Secure Student Authentication • Powered by Clerk</span>
          </div>
        </div>

        {/* Case 3: Signed in but unauthorized (owner_only / unauthorized_role) -> NEVER LOOP */}
        {userId && errorParam ? (
          <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-amber-500/30 shadow-2xl space-y-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">
                {errorParam === 'owner_only'
                  ? 'Site Owner Verification Required'
                  : errorParam === 'session_mismatch'
                  ? 'Session Mismatch Detected'
                  : 'Access Restricted'}
              </h2>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {errorParam === 'owner_only' ? (
                  <>
                    You are signed in as <strong className="text-amber-300 font-mono">{signedInEmail || 'your account'}</strong>. The Admin Console is strictly reserved for the Site Owner (<code>aapkaastro1606@gmail.com</code>).
                  </>
                ) : errorParam === 'session_mismatch' ? (
                  <>
                    Your browser session is out of sync with the server security boundary. Please sign out and sign back in to establish a synchronized session.
                  </>
                ) : (
                  <>
                    You are signed in as <strong className="text-amber-300 font-mono">{signedInEmail || 'your account'}</strong>. This section requires higher authorization privileges.
                  </>
                )}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <SignOutButton redirectUrl="/login">
                <button
                  type="button"
                  className="w-full px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out and Try Again</span>
                </button>
              </SignOutButton>

              <Link
                href="/dashboard"
                className="gold-button w-full px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2"
              >
                <span>Continue to Student Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : !isPublishableKeyConfigured ? (
          <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-amber-500/30 shadow-2xl text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
            <h2 className="text-base font-bold text-white">Authentication Misconfigured</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> is missing from environment variables.
            </p>
          </div>
        ) : (
          /* Case 4: Standard Clerk SignIn component themed to cosmic aesthetic */
          <div className="space-y-4">
            <div className="flex justify-center">
              <SignIn
                routing="hash"
                signUpUrl="/signup"
                fallbackRedirectUrl={targetUrl}
                forceRedirectUrl={targetUrl}
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
          </div>
        )}

      </div>
    </div>
  );
}
