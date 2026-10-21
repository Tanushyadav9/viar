'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  ArrowLeft,
  ShieldCheck,
  Calendar,
  Lock,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { Enrollment, Course } from '@/lib/types';
import {
  AsyncStateView,
  type AsyncStateStatus,
  type ErrorType,
} from '@/components/common/AsyncStateView';

export interface StudentOrder {
  id: string;
  orderReference: string;
  amount: number;
  currency: string;
  status: 'PENDING_PAYMENT' | 'PAYMENT_CLAIMED' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'REFUNDED';
  studentName?: string;
  studentEmail?: string;
  studentPhone?: string;
  utr?: string;
  claimedAt?: string;
  createdAt: string;
  rejectionReason?: string;
  refundReason?: string;
  course?: { id: string; title: string; slug: string };
  cohort?: { id: string; batchName: string };
}

export default function StudentPaymentsPage() {
  const [orders, setOrders] = useState<StudentOrder[]>([]);
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
        : [];
      allCourses.forEach((c) => {
        crsMap[c.id] = c;
      });
      setCourses(crsMap);

      // 2. Fetch authoritative student orders from PostgreSQL
      const ordersRes = await fetch('/api/orders');
      if (ordersRes.status === 401 || ordersRes.status === 403) {
        setPageStatus('error');
        setErrorType('auth');
        return;
      }
      if (!ordersRes.ok) {
        setPageStatus('error');
        setErrorType('server');
        return;
      }
      const ordersData = await ordersRes.json();
      const loadedOrders: StudentOrder[] = ordersData.success && Array.isArray(ordersData.orders)
        ? ordersData.orders
        : [];
      setOrders(loadedOrders);

      // 3. Fetch user session to query enrollments
      const syncRes = await fetch('/api/users/sync');
      let loadedEnrollments: Enrollment[] = [];
      if (syncRes.ok) {
        const uData = await syncRes.json();
        const uid = uData?.user?.id || uData?.user?.clerkId;
        if (uid) {
          const eRes = await fetch(`/api/enrollments?userId=${encodeURIComponent(uid)}`);
          if (eRes.ok) {
            const eData = await eRes.json();
            if (eData.success && Array.isArray(eData.enrollments)) {
              loadedEnrollments = eData.enrollments.map((enr: {
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
          }
        }
      }
      setEnrollments(loadedEnrollments);

      const totalRecords = loadedOrders.length + loadedEnrollments.length;
      setPageStatus(totalRecords === 0 ? 'empty' : 'success');
    } catch (err) {
      setPageStatus('error');
      setErrorType('server');
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load transaction records');
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const totalTransactionCount = orders.length > 0 ? orders.length : enrollments.length;

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
              <span>Verified Invoices & Orders</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Orders & Payment History
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Live orders, verification status, and tuition receipts for your academy enrolments.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-right shrink-0">
            <span className="text-[11px] text-slate-400 block">Total Records</span>
            <span className="text-2xl font-black text-white">{totalTransactionCount} Orders</span>
          </div>
        </div>

        {/* Invoices & Orders List */}
        <AsyncStateView
          status={pageStatus}
          errorType={errorType}
          errorMessage={errorMessage}
          onRetry={loadPayments}
          signInUrl="/login?returnUrl=/dashboard/payments"
          loadingMessage="Loading payment receipts and orders..."
          emptyTitle="No Orders or Receipts Found"
          emptyMessage="You do not currently have any recorded course tuition orders or transaction receipts in the database."
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
            {/* 1. Database Orders (Pending, Claimed, Approved, Rejected, Refunded) */}
            {orders.map((ord) => {
              const isApproved = ord.status === 'APPROVED';
              const isClaimed = ord.status === 'PAYMENT_CLAIMED';
              const isPending = ord.status === 'PENDING_PAYMENT';
              const isRejected = ord.status === 'REJECTED';
              const isRefunded = ord.status === 'REFUNDED';

              let badgeBg = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
              let badgeText = 'Payment Pending';
              let StatusIcon = Clock;

              if (isApproved) {
                badgeBg = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
                badgeText = 'Paid & Enrolled';
                StatusIcon = CheckCircle2;
              } else if (isClaimed) {
                badgeBg = 'bg-blue-500/15 text-blue-300 border-blue-500/30';
                badgeText = 'Under Verification';
                StatusIcon = Clock;
              } else if (isRejected) {
                badgeBg = 'bg-red-500/15 text-red-300 border-red-500/30';
                badgeText = 'Payment Rejected';
                StatusIcon = AlertCircle;
              } else if (isRefunded) {
                badgeBg = 'bg-purple-500/15 text-purple-300 border-purple-500/30';
                badgeText = 'Tuition Refunded';
                StatusIcon = RotateCcw;
              }

              return (
                <div
                  key={ord.id}
                  className="cosmic-card p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-amber-500/30 transition"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${badgeBg}`}>
                        <StatusIcon className="w-3 h-3" />
                        {badgeText}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        REF: {ord.orderReference}
                      </span>
                      {ord.utr && (
                        <span className="text-[11px] font-mono text-slate-300 px-2 py-0.5 rounded bg-white/5 border border-white/10">
                          UTR: {ord.utr}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-white mt-1">
                      {ord.course?.title || 'What is Astrology — Foundations of Vedic Astrology'}
                    </h3>
                    
                    <p className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>{new Date(ord.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      <span>•</span>
                      <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                      <span>Direct UPI QR</span>
                      {ord.cohort?.batchName && (
                        <>
                          <span>•</span>
                          <span className="text-slate-300">{ord.cohort.batchName}</span>
                        </>
                      )}
                    </p>

                    {isRejected && ord.rejectionReason && (
                      <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl mt-2">
                        <strong>Reason:</strong> {ord.rejectionReason}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t md:border-t-0 border-white/10">
                    <div className="text-left md:text-right">
                      <span className="text-[11px] text-slate-400 block">Tuition Amount</span>
                      <span className="text-xl font-black text-white">
                        ₹{ord.amount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {isApproved ? (
                      <button
                        onClick={() => window.print()}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5 text-amber-400" />
                        <span>Print Receipt</span>
                      </button>
                    ) : isPending ? (
                      <Link
                        href={`/checkout/what-is-astrology?ref=${ord.orderReference}`}
                        className="gold-button px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <span>Submit UTR</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {/* 2. Additional legacy enrollments if not already shown in orders */}
            {orders.length === 0 && enrollments.map((enr) => {
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
