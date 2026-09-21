'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  CheckCircle2,
  Download,
  ArrowLeft,
  ShieldCheck,
  Calendar,
  Lock
} from 'lucide-react';
import { ViarStore } from '@/lib/store';
import { Enrollment, Course } from '@/lib/types';

export default function StudentPaymentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Record<string, Course>>({});

  useEffect(() => {
    const list = ViarStore.getEnrollments();
    setEnrollments(list);

    const crsMap: Record<string, Course> = {};
    ViarStore.getCourses().forEach((c) => {
      crsMap[c.id] = c;
    });
    setCourses(crsMap);
  }, []);

  return (
    <div className="cosmic-bg min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            href="/dashboard"
            className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <Link
            href="/dashboard/certificates"
            className="text-xs text-amber-300 hover:text-white transition"
          >
            My Certificates &rarr;
          </Link>
        </div>

        {/* Header */}
        <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-white/10 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified Invoices & Receipts</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Purchase History & Receipts
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              One-time tuition receipts with lifetime access rights for your enrolled cohorts.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-right shrink-0">
            <span className="text-[11px] text-slate-400 block">Total Transactions</span>
            <span className="text-2xl font-black text-white">{enrollments.length} Paid</span>
          </div>
        </div>

        {/* Table / Invoices List */}
        <div className="space-y-4">
          {enrollments.map((enr) => {
            const crs = courses[enr.courseId];
            return (
              <div
                key={enr.id}
                className="cosmic-card p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-amber-500/30 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {enr.paymentStatus}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      ID: {enr.paymentId}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mt-1">
                    {crs?.title || 'What is Astrology — Foundations of Vedic Astrology'}
                  </h3>
                  
                  <p className="text-xs text-slate-400 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>{new Date(enr.enrolledAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    <span>•</span>
                    <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                    <span>{enr.paymentMethod}</span>
                  </p>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t md:border-t-0 border-white/10">
                  <div className="text-left md:text-right">
                    <span className="text-[11px] text-slate-400 block">Amount Paid</span>
                    <span className="text-xl font-black text-white">
                      {enr.currency === 'INR' ? `₹${enr.paymentAmount.toLocaleString()}` : `$${enr.paymentAmount} USD`}
                    </span>
                  </div>

                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Print Receipt</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Security / Guarantee Footer */}
        <div className="mt-12 p-6 rounded-2xl bg-white/[0.02] border border-white/10 text-center text-xs text-slate-400 space-y-1">
          <p className="flex items-center justify-center gap-1.5 text-slate-300">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Secure 256-bit encrypted transactions via Razorpay (India) & Stripe (Global).</span>
          </p>
          <p>For invoice billing inquiries or GST receipts, contact admissions@viar.in.</p>
        </div>

      </div>
    </div>
  );
}
