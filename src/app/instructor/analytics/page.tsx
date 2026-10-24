'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Globe
} from 'lucide-react';
import InstructorNav from '@/components/InstructorNav';
import { Enrollment, Cohort } from '@/lib/types';

export default function InstructorAnalyticsPage() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/enrollments').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch('/api/cohorts').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch('/api/admin/orders').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch('/api/certificates').then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([enrData, cohData, ordData, certData]) => {
      const enrs = enrData?.success && Array.isArray(enrData.enrollments) ? enrData.enrollments : [];
      const cohs = cohData?.success && Array.isArray(cohData.cohorts) ? cohData.cohorts : [];
      const ords = ordData?.orders && Array.isArray(ordData.orders) ? ordData.orders : [];
      const certs = certData?.success && Array.isArray(certData.certificates) ? certData.certificates : [];

      setEnrollments(enrs);
      setCohorts(cohs);

      const verifiedOrds = ords.filter((o: { status?: string }) => o.status === 'VERIFIED' || o.status === 'APPROVED' || o.status === 'PAID');
      const totalInr = verifiedOrds
        .filter((o: { currency?: string }) => o.currency !== 'USD')
        .reduce((sum: number, o: { amountPaidInr?: number; amount?: number }) => sum + (o.amountPaidInr || o.amount || 0), 0);
      const totalUsd = verifiedOrds
        .filter((o: { currency?: string }) => o.currency === 'USD')
        .reduce((sum: number, o: { amountPaidUsd?: number; amount?: number }) => sum + (o.amountPaidUsd || o.amount || 0), 0);

      const directUpiCount = verifiedOrds.filter((o: { paymentMethod?: string }) => !o.paymentMethod || o.paymentMethod === 'UPI_QR').length;
      const manualUtrCount = verifiedOrds.filter((o: { paymentMethod?: string }) => o.paymentMethod === 'MANUAL_UTR' || o.paymentMethod === 'WHATSAPP').length;

      const completionRate = enrs.length > 0 ? Math.round((certs.length / enrs.length) * 100) : 0;

      setStats({
        totalStudents: enrs.length,
        totalRevenueInr: totalInr,
        totalRevenueUsd: totalUsd,
        directUpiCount,
        manualUtrCount,
        completionRate,
        certificatesCount: certs.length,
      });
    }).catch(() => {
      setStats({
        totalStudents: 0,
        totalRevenueInr: 0,
        totalRevenueUsd: 0,
        directUpiCount: 0,
        manualUtrCount: 0,
        completionRate: 0,
        certificatesCount: 0,
      });
    });
  }, []);

  return (
    <div className="cosmic-bg min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <InstructorNav />

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">Enrollment Numbers &amp; Revenue Analytics</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time financial performance, multi-currency breakdown, and student completion metrics.
          </p>
        </div>

        {/* Primary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="cosmic-card p-6 rounded-2xl border border-white/10">
            <span className="text-xs font-semibold text-slate-400 block mb-1">Total Enrolled Students</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{enrollments.length}</span>
              <span className="text-xs font-semibold text-slate-400">
                {enrollments.length === 1 ? '1 student' : `${enrollments.length} students`}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              {cohorts.length > 0 ? `Active across ${cohorts.length} Cohort${cohorts.length === 1 ? '' : 's'}` : 'No cohorts created'}
            </p>
          </div>

          <div className="cosmic-card p-6 rounded-2xl border border-emerald-500/30">
            <span className="text-xs font-semibold text-slate-400 block mb-1">Direct UPI Tuition Revenue</span>
            <span className="text-3xl font-black text-white">
              ₹{(stats.totalRevenueInr || 0).toLocaleString('en-IN')}
            </span>
            <p className="text-[11px] text-emerald-400 mt-2">
              {stats.totalStudents || 0} Direct Admissions
            </p>
          </div>

          <div className="cosmic-card p-6 rounded-2xl border border-amber-500/30">
            <span className="text-xs font-semibold text-slate-400 block mb-1">Gateway Commissions Saved</span>
            <span className="text-3xl font-black text-amber-400">
              100%
            </span>
            <p className="text-[11px] text-amber-300 mt-2">
              Direct UPI QR (0% gateway deductions)
            </p>
          </div>

          <div className="cosmic-card p-6 rounded-2xl border border-white/10">
            <span className="text-xs font-semibold text-slate-400 block mb-1">Course Completion Rate</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-400">{stats.completionRate || 0}%</span>
              <span className="text-xs text-slate-400">certification rate</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              {stats.certificatesCount || 0} certified of {enrollments.length} enrolled
            </p>
          </div>
        </div>

        {/* Detailed Breakdown Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          
          {/* Cohort Capacity Utilization */}
          <div className="cosmic-card p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <span>Cohort Seat Capacity Utilization</span>
            </h3>

            {cohorts.length === 0 ? (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-slate-400 text-center">
                No active cohorts in database
              </div>
            ) : (
              cohorts.map((c) => {
                const seatCap = c.maxSeats || c.capacity || 50;
                const enrolled = c.enrolledCount || 0;
                const pct = Math.min(100, Math.round((enrolled / seatCap) * 100));
                const seatsRemaining = Math.max(0, seatCap - enrolled);
                return (
                  <div key={c.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-white">{c.batchName}</span>
                      <span className="text-amber-300">{enrolled} / {seatCap} seats ({pct}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                      <span>{c.startDate ? `Starts: ${new Date(c.startDate).toLocaleDateString('en-IN')}` : 'Admissions Open'}</span>
                      <span className="text-emerald-400 font-semibold">{seatsRemaining} seats remaining</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Payment Method Distribution */}
          <div className="cosmic-card p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Tuition Payment Methods</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-xs text-slate-400 block font-medium">Direct UPI QR</span>
                <span className="text-2xl font-bold text-white mt-1 block">
                  {stats.directUpiCount || 0}
                </span>
                <p className="text-[10px] text-emerald-400 mt-1">aapkaastro@okaxis</p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-xs text-slate-400 block font-medium">Manual Verification</span>
                <span className="text-2xl font-bold text-white mt-1 block">
                  {stats.manualUtrCount || 0}
                </span>
                <p className="text-[10px] text-amber-400 mt-1">WhatsApp UTR Verified</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300">
              <strong>Zero Gateway Deductions:</strong> 100% of student tuition reaches the institute directly via UPI with zero gateway fees.
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
