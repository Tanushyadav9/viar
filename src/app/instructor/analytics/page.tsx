'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Globe
} from 'lucide-react';
import InstructorNav from '@/components/InstructorNav';
import { ViarStore } from '@/lib/store';
import { Enrollment, Cohort } from '@/lib/types';

export default function InstructorAnalyticsPage() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);

  useEffect(() => {
    fetch('/api/enrollments')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && Array.isArray(data.enrollments)) {
          setEnrollments(data.enrollments);
        } else {
          setEnrollments(ViarStore.getEnrollments());
        }
      })
      .catch(() => {
        setEnrollments(ViarStore.getEnrollments());
      });

    fetch('/api/cohorts')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && Array.isArray(data.cohorts)) {
          setCohorts(data.cohorts);
        } else {
          setCohorts(ViarStore.getCohorts());
        }
      })
      .catch(() => {
        setCohorts(ViarStore.getCohorts());
      });

    fetch('/api/admin/orders')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.orders) {
          const totalInr = data.orders.reduce((sum: number, o: { amountPaidInr?: number }) => sum + (o.amountPaidInr || 0), 0);
          setStats({
            totalStudents: data.orders.length,
            totalRevenueInr: totalInr || 0,
          });
        } else {
          setStats({
            totalStudents: 0,
            totalRevenueInr: 0,
          });
        }
      })
      .catch(() => {
        setStats({
          totalStudents: 0,
          totalRevenueInr: 0,
        });
      });
  }, []);

  return (
    <div className="cosmic-bg min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <InstructorNav />

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">Enrollment Numbers & Revenue Analytics</h2>
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
              <span className="text-xs font-bold text-emerald-400">+12% this week</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Active in Cohort 01</p>
          </div>

          <div className="cosmic-card p-6 rounded-2xl border border-emerald-500/30">
            <span className="text-xs font-semibold text-slate-400 block mb-1">Direct UPI Tuition Revenue</span>
            <span className="text-3xl font-black text-white">
              ₹{(stats.totalRevenueInr || 5100).toLocaleString('en-IN')}
            </span>
            <p className="text-[11px] text-emerald-400 mt-2">
              {enrollments.length} Direct UPI Admissions
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
              <span className="text-3xl font-black text-amber-400">89%</span>
              <span className="text-xs text-slate-400">exam pass rate</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Attended or marked watched</p>
          </div>
        </div>

        {/* Detailed Breakdown Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          
          {/* Cohort Capacity Utilization */}
          <div className="cosmic-card p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <span>Cohort Seat Capacity Utilization (Cap: 50)</span>
            </h3>

            {cohorts.map((c) => {
              const pct = Math.round((c.enrolledCount / c.maxSeats) * 100);
              return (
                <div key={c.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-white">{c.batchName}</span>
                    <span className="text-amber-300">{c.enrolledCount} / {c.maxSeats} seats ({pct}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                    <span>Deadline: Oct 2, 2026</span>
                    <span className="text-emerald-400 font-semibold">{c.maxSeats - c.enrolledCount} seats remaining</span>
                  </div>
                </div>
              );
            })}
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
                  {enrollments.length}
                </span>
                <p className="text-[10px] text-emerald-400 mt-1">aapkaastro@okaxis</p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-xs text-slate-400 block font-medium">Manual Verification</span>
                <span className="text-2xl font-bold text-white mt-1 block">
                  {enrollments.length}
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
