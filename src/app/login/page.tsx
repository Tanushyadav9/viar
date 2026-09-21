'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sparkles,
  Phone,
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { authProvider } from '@/lib/auth';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams?.get('returnUrl') || '/dashboard';

  const [authMode, setAuthMode] = useState<'PHONE' | 'EMAIL'>('PHONE');
  
  // Phone flow
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  
  // Email flow
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);

    const res = await authProvider.sendPhoneOtp(phone);
    setLoading(false);
    if (res.success) {
      setOtpSent(true);
      setInfoMsg(res.message);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const res = await authProvider.verifyPhoneOtp(phone, otp);
    setLoading(false);
    if (res.success) {
      router.push(returnUrl);
    } else {
      setErrorMsg(res.error || 'Invalid OTP code.');
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const res = await authProvider.signInWithEmail(email, password);
    setLoading(false);
    if (res.success) {
      router.push(returnUrl);
    } else {
      setErrorMsg(res.error || 'Invalid email or password.');
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setLoading(true);
    const res = await authProvider.signInWithGoogle();
    setLoading(false);
    if (res.success) {
      router.push(returnUrl);
    } else {
      setErrorMsg(res.error || 'Google sign in failed.');
    }
  };

  return (
    <div className="cosmic-bg min-h-screen py-16 sm:py-24 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">
              VIAR<span className="text-amber-400">.IN</span>
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Sign In to Student Portal
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Access your live class links, video replay archives, and certificates.
          </p>
        </div>

        {/* Card */}
        <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl">
          
          {/* Clerk Multi-Domain SSO badge */}
          <div className="mb-6 p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 shrink-0 text-purple-400" />
            <span>Unified login recognized across Viar, Aapka Astro & DOW.</span>
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-white/5 border border-white/10 mb-6">
            <button
              onClick={() => {
                setAuthMode('PHONE');
                setErrorMsg('');
                setInfoMsg('');
              }}
              className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                authMode === 'PHONE'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>India Mobile</span>
            </button>
            <button
              onClick={() => {
                setAuthMode('EMAIL');
                setErrorMsg('');
                setInfoMsg('');
              }}
              className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                authMode === 'EMAIL'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>International</span>
            </button>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{infoMsg}</span>
            </div>
          )}

          {/* Flow 1: Indian Phone + OTP */}
          {authMode === 'PHONE' && (
            <div>
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Mobile Number (India)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-400">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="98765 43210"
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400 transition"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Instant OTP sent to your WhatsApp or SMS (Test passcode: 123456)
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="gold-button w-full py-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                  >
                    <span>{loading ? 'Sending OTP...' : 'Send Login OTP'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Enter 6-Digit Passcode
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      className="w-full text-center tracking-[0.5em] font-mono font-bold text-lg py-3 rounded-xl bg-white/5 border border-amber-500/40 text-amber-300 focus:outline-none transition"
                    />
                    <div className="flex justify-between items-center mt-1 text-[11px]">
                      <span className="text-slate-400">Sent to +91 {phone}</span>
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="text-amber-400 hover:underline"
                      >
                        Change Number
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="gold-button w-full py-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                  >
                    <span>{loading ? 'Verifying...' : 'Verify & Enter Portal'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Flow 2: Email & Google */}
          {authMode === 'EMAIL' && (
            <div className="space-y-4">
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400 transition"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Tip: Enter <span className="font-mono text-amber-300">admin@viar.in</span> for master instructor persona.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="gold-button w-full py-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  <span>{loading ? 'Signing in...' : 'Sign In with Password'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                  <span className="bg-[#0f1523] px-3 text-slate-400">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 rounded-xl text-xs font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-xs text-slate-400">
              New to Viar Academy?{' '}
              <Link href="/signup" className="text-amber-400 font-bold hover:underline">
                Create an Account &rarr;
              </Link>
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen cosmic-bg" />}>
      <LoginContent />
    </Suspense>
  );
}
