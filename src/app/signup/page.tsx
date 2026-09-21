'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Phone,
  Mail,
  ArrowRight,
  AlertCircle,
  Globe
} from 'lucide-react';
import { authProvider } from '@/lib/auth';
import { getUserLocalTimezone } from '@/lib/timezones';
import { ViarStore } from '@/lib/store';

function SignupContent() {
  const router = useRouter();

  const [authMode, setAuthMode] = useState<'PHONE' | 'EMAIL'>('PHONE');
  const [name, setName] = useState('');
  
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

  const detectedTz = getUserLocalTimezone();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    const res = await authProvider.sendPhoneOtp(phone);
    setLoading(false);
    if (res.success) {
      setOtpSent(true);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const res = await authProvider.verifyPhoneOtp(phone, otp, name);
    setLoading(false);
    if (res.success) {
      router.push('/dashboard');
    } else {
      setErrorMsg(res.error || 'Invalid OTP code.');
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    const res = await authProvider.signInWithEmail(email, password);
    setLoading(false);
    if (res.success) {
      if (typeof window !== 'undefined') {
        const u = ViarStore.getCurrentUser();
        if (u) {
          ViarStore.setCurrentUser({ ...u, name });
        }
      }
      router.push('/dashboard');
    } else {
      setErrorMsg(res.error || 'Failed to create account.');
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
            Create Student Account
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Join the upcoming Vedic Jyotish cohort with Acharya Niraj Kumar.
          </p>
        </div>

        {/* Card */}
        <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl">
          
          {/* Detected Timezone notice */}
          <div className="mb-6 p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[11px] flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 shrink-0 text-sky-400" />
            <span>Detected timezone: <strong className="text-white">{detectedTz}</strong></span>
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-white/5 border border-white/10 mb-6">
            <button
              onClick={() => {
                setAuthMode('PHONE');
                setErrorMsg('');
              }}
              className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                authMode === 'PHONE'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>India Student (OTP)</span>
            </button>
            <button
              onClick={() => {
                setAuthMode('EMAIL');
                setErrorMsg('');
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

          {/* Form */}
          {authMode === 'PHONE' ? (
            <div>
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      WhatsApp / Mobile Number (India)
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
                      (Test passcode: 123456)
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="gold-button w-full py-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                  >
                    <span>{loading ? 'Sending OTP...' : 'Send Verification OTP'}</span>
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
                    <p className="text-[11px] text-slate-400 mt-1 text-center">
                      Sent to +91 {phone} • (Use 123456)
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="gold-button w-full py-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                  >
                    <span>{loading ? 'Registering...' : 'Complete Registration'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          ) : (
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sarah@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Create Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="gold-button w-full py-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <Link href="/login" className="text-amber-400 font-bold hover:underline">
                Sign In &rarr;
              </Link>
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen cosmic-bg" />}>
      <SignupContent />
    </Suspense>
  );
}
