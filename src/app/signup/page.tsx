'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Mail,
  User,
  Lock,
  ArrowRight,
  AlertCircle,
  Globe,
  ShieldCheck
} from 'lucide-react';
import { authProvider } from '@/lib/auth';
import { getUserLocalTimezone } from '@/lib/timezones';

function SignupContent() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const detectedTz = getUserLocalTimezone();

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    const res = await authProvider.signUpWithEmail(email, password, name);
    setLoading(false);
    if (res.success) {
      router.push('/dashboard');
    } else {
      setErrorMsg(res.error || 'Failed to create account.');
    }
  };

  const handleGoogleSignUp = async () => {
    setErrorMsg('');
    setLoading(true);
    const res = await authProvider.signInWithGoogle({
      redirectUrl: '/signup/sso-callback',
      redirectUrlComplete: '/dashboard',
    });
    if (!res.success && res.error) {
      setLoading(false);
      setErrorMsg(res.error);
    }
  };

  return (
    <div className="cosmic-bg min-h-screen py-16 sm:py-24 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black tracking-wider text-white">
              VIAR<span className="text-amber-400">.IN</span>
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Create Student Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Join live cohorts, track syllabus progress, and earn authentic certifications.
          </p>

          {/* Multi-Domain Satellite SSO Notice */}
          <div className="mt-4 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center gap-2 text-[11px] text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Single Sign-On across Viar.in, AapkaAstro & DOW Consulting</span>
          </div>
        </div>

        {/* Auth Card */}
        <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl relative">
          
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Google OAuth via Clerk */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition shadow-md disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign up with Google</span>
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-[#0f172a] px-3 text-slate-500 font-bold tracking-wider">
                Or create account with email
              </span>
            </div>
          </div>

          {/* Email / Password Sign Up Form */}
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Aarav Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-400/60"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-400/60"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-400/60"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Timezone Helper */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-white/[0.03] p-2.5 rounded-xl border border-white/5">
              <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                Detected timezone: <strong className="text-slate-200">{detectedTz}</strong>
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="gold-button w-full py-3.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-amber-500/20 disabled:opacity-50 mt-2"
            >
              <span>{loading ? 'Creating account...' : 'Create Student Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-amber-400 font-bold hover:underline">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="cosmic-bg min-h-screen flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-amber-400 animate-spin" />
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  );
}
