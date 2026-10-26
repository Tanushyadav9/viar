'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Globe
} from 'lucide-react';
import InstructorNav from '@/components/InstructorNav';
import { Enrollment } from '@/lib/types';

export default function InstructorAnalyticsPage() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch('/api/enrollments').then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([statsData, enrData]) => {
      const enrs = enrData?.success && Array.isArray(enrData.enrollments) ? enrData.enrollments : [];
      setEnrollments(enrs);

      if (statsData?.success && statsData.stats) {
        setStats({
          totalStudents: statsData.stats.totalStudents,
          totalRevenueInr: statsData.stats.totalRevenueInr,
          directUpiCount: statsData.stats.approvedOrdersCount,
          manualUtrCount: 0,
          completionRate: statsData.stats.completionRate,
          certificatesCount: statsData.stats.certificatesIssued,
        });
      } else {
        setStats({
          totalStudents: 0,
          totalRevenueInr: 0,
          directUpiCount: 0,
          manualUtrCount: 0,
          completionRate: 0,
          certificatesCount: 0,
        });
      }
    }).catch(() => {
      setStats({
        totalStudents: 0,
        totalRevenueInr: 0,
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
              <span className="text-2xl sm:text-3xl font-black text-white">
                {enrollments.length > 0 ? enrollments.length : <span className="text-lg font-bold text-slate-400">No students yet</span>}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              {enrollments.length > 0 ? `${enrollments.length} enrolled scholar${enrollments.length === 1 ? '' : 's'}` : 'Self-paced admissions open'}
            </p>
          </div>

          <div className="cosmic-card p-6 rounded-2xl border border-emerald-500/30">
            <span className="text-xs font-semibold text-slate-400 block mb-1">Direct UPI Tuition Revenue</span>
            <span className="text-2xl sm:text-3xl font-black text-white">
              {(stats.totalRevenueInr && stats.totalRevenueInr > 0) ? `₹${stats.totalRevenueInr.toLocaleString('en-IN')}` : <span className="text-lg font-bold text-slate-400">No revenue yet</span>}
            </span>
            <p className="text-[11px] text-emerald-400 mt-2">
              Direct UPI QR • 0% Transaction Fees
            </p>
          </div>

          <div className="cosmic-card p-6 rounded-2xl border border-amber-500/30">
            <span className="text-xs font-semibold text-slate-400 block mb-1">Verifiable Certificates</span>
            <span className="text-2xl sm:text-3xl font-black text-amber-400">
              {(stats.certificatesCount && stats.certificatesCount > 0) ? stats.certificatesCount : <span className="text-lg font-bold text-slate-400">No certificates yet</span>}
            </span>
            <p className="text-[11px] text-amber-300 mt-2">
              Issued upon 70%+ score on final exam
            </p>
          </div>

          <div className="cosmic-card p-6 rounded-2xl border border-white/10">
            <span className="text-xs font-semibold text-slate-400 block mb-1">Course Completion Rate</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-amber-400">
                {enrollments.length > 0 ? `${stats.completionRate || 0}%` : <span className="text-lg font-bold text-slate-400">No completions yet</span>}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              {enrollments.length > 0 ? `${stats.certificatesCount || 0} certified of ${enrollments.length} enrolled` : 'Awaiting student completions'}
            </p>
          </div>
        </div>

        {/* Detailed Breakdown Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          
          {/* Curriculum Delivery Status */}
          <div className="cosmic-card p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <span>Curriculum Delivery Status</span>
            </h3>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-white">The Ultimate Astrology Course: Foundations to Chart Mastery</span>
                <span className="text-emerald-400">₹5,100</span>
              </div>
              <p className="text-xs text-slate-300">
                23 on-demand video modules published with downloadable notes, 2 bonus real chart workshops, and final certification exam.
              </p>
              <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                <span>Mode: Self-Paced Masterclass</span>
                <span className="text-amber-300 font-semibold">Lifetime Access</span>
              </div>
            </div>
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
                <p className="text-[10px] text-emerald-400 mt-1">9310709233m@pnb</p>
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
              <strong>Direct Peer-to-Peer UPI:</strong> 100% of student tuition reaches the institute directly via UPI with zero gateway fees.
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
