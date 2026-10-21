'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import {
  AsyncStateView,
  type AsyncStateStatus,
  type ErrorType,
} from '@/components/common/AsyncStateView';

export default function StudentPaymentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Record<string, Course>>({});
  const [pageStatus, setPageStatus] = useState<AsyncStateStatus>('loading');
  const [errorType, setErrorType] = useState<ErrorType>('server');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const loadPayments = useCallback(async () => {
    setPageStatus('loading');
    setErrorMessage('');

    try {
      // 1. Fetch courses map
      const cRes = await fetch('/api/courses');
      const cData = await cRes.json().catch(() => ({}));
      const crsMap: Record<string, Course> = {};
      const allCourses: Course[] = cData.success && Array.isArray(cData.courses)
        ? cData.courses
        : ViarStore.getCourses();
      allCourses.forEach((c) => {
        crsMap[c.id] = c;
      });
      setCourses(crsMap);

      // 2. Fetch user sync
      const syncRes = await fetch('/api/users/sync');
      if (syncRes.status === 401 || syncRes.status === 403) {
        setPageStatus('error');
        setErrorType('auth');
        return;
      }
      if (!syncRes.ok) {
        setPageStatus('error');
        setErrorType('server');
        return;
      }
      const uData = await syncRes.json();
      const uid = uData?.user?.id || uData?.user?.clerkId;
      if (!uid) {
        setPageStatus('error');
        setErrorType('auth');
        return;
      }

      // 3. Fetch enrollments
      const eRes = await fetch(`/api/enrollments?userId=${encodeURIComponent(uid)}`);
      if (eRes.status === 401 || eRes.status === 403) {
        setPageStatus('error');
        setErrorType('auth');
        return;
      }
      if (!eRes.ok) {
        setPageStatus('error');
        setErrorType('server');
        return;
      }
      const eData = await eRes.json();
      let list: Enrollment[] = [];
      if (eData.success && Array.isArray(eData.enrollments)) {
        list = eData.enrollments.map((enr: {
          id: string;
          studentId?: string;
          studentName?: string;
          studentEmail?: string;
          studentPhone?: string;
          courseId: string;
          cohortId: string;
          enrolledAt?: string;
          amountPaid?: number;
          currency?: string;
          paymentStatus?: string;
          paymentMethod?: string;
          paymentReference?: string;
        }) => ({
          id: enr.id,
          studentId: enr.studentId || uid,
          studentName: enr.studentName || 'Student',
          studentEmail: enr.studentEmail || '',
          studentPhone: enr.studentPhone || '',
          courseId: enr.courseId,
          cohortId: enr.cohortId,
          enrolledAt: enr.enrolledAt || new Date().toISOString(),
          paymentAmount: enr.amountPaid || 5100,
          currency: enr.currency || 'INR',
          paymentStatus: enr.paymentStatus === 'ACTIVE' ? 'Paid' : (enr.paymentStatus || 'Paid'),
          paymentMethod: enr.paymentMethod || 'Manual UPI Payment',
          paymentId: enr.paymentReference || enr.id,
          accessExpiresAt: null,
        }));
      }

      if (list.length === 0) {
        const storeEnrollments = ViarStore.getEnrollments();
        if (storeEnrollments.length > 0) {
          list = storeEnrollments;
        }
      }

      setEnrollments(list);
      setPageStatus(list.length === 0 ? 'empty' : 'success');
    } catch (err) {
      setPageStatus('error');
      setErrorType('server');
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load transaction records');
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

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

        {/* Invoices List with strict separation of Loading, Error (401/403 vs 500), Empty, and Success */}
        <AsyncStateView
          status={pageStatus}
          errorType={errorType}
          errorMessage={errorMessage}
          onRetry={loadPayments}
          signInUrl="/login?returnUrl=/dashboard/payments"
          loadingMessage="Loading payment receipts and invoices..."
          emptyTitle="No Payment Receipts Found"
          emptyMessage="You do not currently have any recorded course tuition receipts or processed transactions."
          emptyAction={
            <Link
              href="/courses"
              className="gold-button px-6 py-2.5 rounded-xl text-xs font-bold inline-block"
            >
              Browse Masterclasses
            </Link>
          }
        >
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
                        ₹{(enr.paymentAmount || 5100).toLocaleString('en-IN')}
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
        </AsyncStateView>

        {/* Security / Guarantee Footer */}
        <div className="mt-12 p-6 rounded-2xl bg-white/[0.02] border border-white/10 text-center text-xs text-slate-400 space-y-1">
          <p className="flex items-center justify-center gap-1.5 text-slate-300">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Direct UPI QR payment verified by Vihangam Institute administration.</span>
          </p>
          <p>For invoice billing inquiries or GST receipts, contact admissions@viar.in or WhatsApp +91 93112 15564.</p>
        </div>

      </div>
    </div>
  );
}
