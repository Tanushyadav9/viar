'use client';

import React, { useState, useEffect } from 'react';
import RootError from '@/app/error';
import { AlertTriangle, CheckCircle2, ShieldCheck, CreditCard } from 'lucide-react';
import Link from 'next/link';

type ViewMode = 'error-light' | 'error-dark' | 'enrolled' | 'open-order' | 'duplicate-warning';

export default function TestProofViewsPage() {
  const [view, setView] = useState<ViewMode>('error-light');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('view') as ViewMode | null;
    if (v && ['error-light', 'error-dark', 'enrolled', 'open-order', 'duplicate-warning'].includes(v)) {
      setView(v);
    }
  }, []);

  const dummyError = Object.assign(new Error('Database connection reset during query execution (SIMULATED_PROOF_TEST)'), {
    digest: 'VIAR_ERR_PROOF_2026',
  });

  return (
    <div className={view === 'error-dark' ? 'dark' : ''}>
      {/* View Switcher Bar for Verification */}
      <div className="bg-slate-900 border-b border-amber-500/30 text-white p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="font-bold text-amber-400 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" />
          <span>VIAR VERIFICATION HARNESS</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('error-light')}
            className={`px-3 py-1 rounded-lg border font-semibold ${view === 'error-light' ? 'bg-amber-500 text-black border-amber-400' : 'bg-slate-800 text-slate-300 border-slate-700'}`}
          >
            1. Error Page (Light)
          </button>
          <button
            onClick={() => setView('error-dark')}
            className={`px-3 py-1 rounded-lg border font-semibold ${view === 'error-dark' ? 'bg-amber-500 text-black border-amber-400' : 'bg-slate-800 text-slate-300 border-slate-700'}`}
          >
            2. Error Page (Dark)
          </button>
          <button
            onClick={() => setView('enrolled')}
            className={`px-3 py-1 rounded-lg border font-semibold ${view === 'enrolled' ? 'bg-amber-500 text-black border-amber-400' : 'bg-slate-800 text-slate-300 border-slate-700'}`}
          >
            3. Enrolled Student (Course & Navbar)
          </button>
          <button
            onClick={() => setView('open-order')}
            className={`px-3 py-1 rounded-lg border font-semibold ${view === 'open-order' ? 'bg-amber-500 text-black border-amber-400' : 'bg-slate-800 text-slate-300 border-slate-700'}`}
          >
            4. Open Order (Resume Payment)
          </button>
          <button
            onClick={() => setView('duplicate-warning')}
            className={`px-3 py-1 rounded-lg border font-semibold ${view === 'duplicate-warning' ? 'bg-amber-500 text-black border-amber-400' : 'bg-slate-800 text-slate-300 border-slate-700'}`}
          >
            5. Duplicate Payment Warning
          </button>
        </div>
      </div>

      {/* 1. Error Page Light Mode */}
      {view === 'error-light' && (
        <div className="bg-slate-50 min-h-screen">
          <RootError error={dummyError} reset={() => alert('Reset clicked')} />
        </div>
      )}

      {/* 2. Error Page Dark Mode */}
      {view === 'error-dark' && (
        <div className="dark bg-slate-950 min-h-screen text-slate-100">
          <RootError error={dummyError} reset={() => alert('Reset clicked')} />
        </div>
      )}

      {/* 3. Enrolled Student View */}
      {view === 'enrolled' && (
        <div className="min-h-screen cosmic-bg bg-slate-950 text-white p-6 space-y-6">
          {/* Header Simulation */}
          <div className="max-w-6xl mx-auto flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 border border-amber-500/20">
            <div className="flex items-center gap-2 font-black text-amber-400 text-lg">
              VIAR.IN
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">Signed in as <strong className="text-white">enrolled.student@example.com</strong></span>
              <Link
                href="/dashboard/courses"
                className="gold-button px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-950" />
                <span>You&apos;re enrolled. Go to my course</span>
              </Link>
            </div>
          </div>

          {/* Course Page Gated Card Simulation */}
          <div className="max-w-3xl mx-auto cosmic-card p-8 rounded-3xl border border-emerald-500/40 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs uppercase tracking-wider mb-2">
                Active Enrolment Confirmed
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                You Are Enrolled in This Course
              </h2>
              <p className="text-slate-300 text-sm max-w-lg mx-auto mt-2 leading-relaxed">
                Your admission is active. You have full lifetime access to all 23 recorded modules, reference manuals, and live Q&A sessions. Direct payment and QR code are permanently disabled.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 max-w-md mx-auto text-left text-xs space-y-2">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Student Account:</span>
                <span className="text-emerald-300 font-mono">enrolled.student@example.com</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Enrollment Status:</span>
                <span className="text-emerald-400 font-bold">APPROVED & ACTIVE</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Course Slug:</span>
                <span className="text-amber-300 font-mono">what-is-astrology</span>
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <Link
                href="/dashboard/courses"
                className="gold-button px-6 py-3 rounded-xl text-sm font-bold shadow-lg"
              >
                Go to My Course (Access Dashboard)
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 4. Open Order View */}
      {view === 'open-order' && (
        <div className="min-h-screen cosmic-bg bg-slate-950 text-white p-6 space-y-6">
          <div className="max-w-3xl mx-auto cosmic-card p-8 rounded-3xl border border-amber-500/40 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
              <CreditCard className="w-8 h-8" />
            </div>
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs uppercase tracking-wider mb-2">
                Existing Order Detected • No Second Order Created
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Resume Payment for Your Order
              </h2>
              <p className="text-slate-300 text-sm max-w-lg mx-auto mt-2 leading-relaxed">
                An active order already exists for your account. You can complete verification using your existing order reference.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 max-w-md mx-auto text-left text-xs space-y-2">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Order Reference:</span>
                <span className="text-amber-300 font-mono font-bold">ORD-2026-WIA-9842</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Amount Due:</span>
                <span className="text-white font-bold">₹11,000</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Order Status:</span>
                <span className="text-amber-400 font-bold">PENDING_PAYMENT</span>
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <button
                type="button"
                className="gold-button px-6 py-3 rounded-xl text-sm font-bold shadow-lg"
              >
                Resume Payment / I Have Paid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Duplicate Payment Warning Modal in Admin Payments */}
      {view === 'duplicate-warning' && (
        <div className="min-h-screen bg-slate-950/90 text-white p-6 flex items-center justify-center">
          <div className="w-full max-w-xl cosmic-card p-6 sm:p-8 rounded-3xl border-2 border-amber-500/40 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                  ₹
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Manual Payment Verification</h3>
                  <p className="text-xs text-slate-400">Order: ORD-2026-WIA-9842</p>
                </div>
              </div>
            </div>

            {/* Prominent Duplicate Payment Protection Warning */}
            <div className="p-4 rounded-xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-200 text-xs space-y-3">
              <div className="flex items-center gap-2 font-black text-amber-300 text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Duplicate Payment Protection</span>
              </div>
              <p className="leading-relaxed">
                This student is <strong className="text-emerald-400 font-bold">ALREADY ACTIVELY ENROLLED</strong> in this course. Approving another enrollment would charge them twice. Nothing will be activated twice.
              </p>
              <p className="text-white font-semibold">Please choose an action:</p>
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition shadow-md flex-1 text-center"
                >
                  Record as duplicate payment (refund due)
                </button>
                <button
                  type="button"
                  className="px-3.5 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-semibold text-xs transition flex-1 text-center"
                >
                  Cancel this order
                </button>
              </div>
            </div>

            {/* Bank Statement Verification Banner */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Bank Statement is the Sole Proof of Payment</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Confirm that ₹11,000 has actually credited in Axis Bank UPI statement (9310709233m@pnb) before ticking verification.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
