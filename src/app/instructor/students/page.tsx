'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  CheckCircle2,
  Award,
  ExternalLink,
  UserPlus,
  RefreshCw,
  Mail,
  Phone
} from 'lucide-react';
import InstructorNav from '@/components/InstructorNav';
import { ViarStore } from '@/lib/store';
import { Cohort } from '@/lib/types';

interface StudentRosterItem {
  id: string;
  studentId?: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  courseId: string;
  courseTitle?: string;
  cohortId: string;
  cohortBatchName?: string;
  enrolledAt: string;
  paymentStatus?: string;
  paymentAmount?: number;
  currency?: string;
  paymentMethod?: string;
  watchedClassesCount?: number;
  totalClassesCount?: number;
  quizScorePercentage?: number;
  certificateId?: string;
  certificateVerificationCode?: string;
}

export default function InstructorStudentsRosterPage() {
  const [enrollments, setEnrollments] = useState<StudentRosterItem[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Manual Enrollment Modal State
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualAmount, setManualAmount] = useState('5100');
  const [manualCurrency, setManualCurrency] = useState<'INR' | 'USD'>('INR');
  const [manualCohortId, setManualCohortId] = useState('cohort-wia-batch-1');
  const [modalSuccess, setModalSuccess] = useState('');
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch real enrollments from PostgreSQL via API
      const res = await fetch('/api/enrollments');
      const data = await res.json();
      if (data.success && Array.isArray(data.enrollments) && data.enrollments.length > 0) {
        setEnrollments(data.enrollments);
      } else {
        setEnrollments(ViarStore.getEnrollments() as unknown as StudentRosterItem[]);
      }
    } catch {
      setEnrollments(ViarStore.getEnrollments() as unknown as StudentRosterItem[]);
    } finally {
      setIsLoading(false);
    }

    setCohorts(ViarStore.getCohorts());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleManualEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualEmail.trim()) return;

    setIsSubmitting(true);
    setModalError('');
    setModalSuccess('');

    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: manualName.trim(),
          studentEmail: manualEmail.trim(),
          studentPhone: manualPhone.trim() || undefined,
          cohortId: manualCohortId,
          amount: Number(manualAmount) || 5100,
          currency: manualCurrency,
          paymentMethod: 'Direct Offline Tuition',
        }),
      });

      const data = await res.json();
      if (!res.ok && !data.success) {
        throw new Error(data.error || 'Failed to record enrollment in database');
      }

      // Also sync to ViarStore
      ViarStore.createEnrollment({
        studentName: manualName.trim(),
        studentEmail: manualEmail.trim(),
        courseId: 'course-what-is-astrology',
        cohortId: manualCohortId,
        amount: Number(manualAmount) || 5100,
        currency: manualCurrency,
        paymentMethod: 'Manual Enrollment (Astrologer)',
      });

      setModalSuccess(`Student ${manualName} enrolled successfully!`);
      setTimeout(() => {
        setIsEnrolling(false);
        setManualName('');
        setManualEmail('');
        setManualPhone('');
        setModalSuccess('');
        loadData();
      }, 1500);
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Error creating enrollment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStudents = enrollments.filter((enr) => {
    const matchesCohort = selectedCohortId === 'all' || enr.cohortId === selectedCohortId;
    const matchesSearch =
      (enr.studentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (enr.studentEmail || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCohort && matchesSearch;
  });

  return (
    <div className="cosmic-bg min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <InstructorNav />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Academy Roster
              </span>
              <span className="text-xs text-slate-400">
                {enrollments.length} Total Enrolled Students
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Enrolled Scholars &amp; Student Roster
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Track student admissions, tuition status, self-paced progress, final quiz scores, and issued certificates in real-time from the database.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setIsEnrolling(true)}
              className="gold-button px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>Enroll Student Manually</span>
            </button>

            <button
              onClick={loadData}
              disabled={isLoading}
              className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 flex items-center gap-1.5"
              title="Refresh Roster"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filters & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={selectedCohortId}
              onChange={(e) => setSelectedCohortId(e.target.value)}
              className="px-4 py-2 rounded-xl bg-[#111827] border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-amber-400"
            >
              <option value="all">All Cohorts ({enrollments.length} Students)</option>
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.batchName}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name or email..."
              className="pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400 w-full sm:w-64"
            />
          </div>
        </div>

        {/* Modal: Manual Student Enrollment */}
        {isEnrolling && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-amber-500/40 max-w-lg w-full">
              <h3 className="text-xl font-bold text-white mb-1">Enroll Scholar Manually</h3>
              <p className="text-xs text-slate-400 mb-6">
                Grant direct self-paced course access to a student who paid via offline bank transfer, WhatsApp UPI, or direct cash.
              </p>

              {modalSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{modalSuccess}</span>
                </div>
              )}

              {modalError && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleManualEnroll} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder="e.g. aarav.sharma@example.com"
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    WhatsApp / Phone Number
                  </label>
                  <input
                    type="tel"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Assign to Cohort / Course
                  </label>
                  <select
                    value={manualCohortId}
                    onChange={(e) => setManualCohortId(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-[#111827] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    {cohorts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.batchName} ({c.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tuition Amount Paid
                    </label>
                    <input
                      type="number"
                      required
                      value={manualAmount}
                      onChange={(e) => setManualAmount(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Currency
                    </label>
                    <select
                      value={manualCurrency}
                      onChange={(e) => setManualCurrency(e.target.value as 'INR' | 'USD')}
                      className="w-full px-4 py-2 rounded-xl bg-[#111827] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsEnrolling(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="gold-button px-6 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50"
                  >
                    {isSubmitting ? 'Enrolling...' : 'Confirm Enrollment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Students Table */}
        <div className="cosmic-card rounded-2xl border border-white/10 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-white/5 border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <tr>
                  <th className="py-4 px-6">Student Name</th>
                  <th className="py-4 px-6">Email / Phone</th>
                  <th className="py-4 px-6">Course / Batch</th>
                  <th className="py-4 px-6">Tuition Paid</th>
                  <th className="py-4 px-6">Enrolled Date</th>
                  <th className="py-4 px-6">Assessment &amp; Credential</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">
                      No enrolled students found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((enr) => {
                    const hasCert = Boolean(enr.certificateVerificationCode || enr.certificateId);
                    const hasScore = enr.quizScorePercentage !== undefined;

                    return (
                      <tr key={enr.id} className="hover:bg-white/[0.02] transition">
                        <td className="py-4 px-6 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <span>{enr.studentName}</span>
                          </div>
                        </td>

                        <td className="py-4 px-6 text-slate-300">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <Mail className="w-3 h-3 text-slate-500" />
                              <span>{enr.studentEmail}</span>
                            </div>
                            {enr.studentPhone && (
                              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                                <Phone className="w-3 h-3 text-slate-500" />
                                <span>{enr.studentPhone}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <div>
                            <span className="font-medium text-slate-200 block">
                              {enr.courseTitle || 'The Ultimate Vedic Astrology Course'}
                            </span>
                            <span className="text-[11px] text-amber-400/80">
                              {enr.cohortBatchName || 'Self-Paced Access'}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <div>
                            <span className="font-bold text-white">
                              {enr.currency === 'USD' ? `$${enr.paymentAmount}` : `₹${(enr.paymentAmount || 5100).toLocaleString()}`}
                            </span>
                            <span className="block text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                              {enr.paymentStatus || 'PAID ✓'}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-6 text-slate-400 text-[11px]">
                          {enr.enrolledAt ? new Date(enr.enrolledAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          }) : 'Active Scholar'}
                        </td>

                        <td className="py-4 px-6">
                          {hasCert ? (
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                <Award className="w-3 h-3" />
                                <span>Certified ({enr.quizScorePercentage}%)</span>
                              </span>
                              {enr.certificateVerificationCode && (
                                <Link
                                  href={`/verify/${enr.certificateVerificationCode}`}
                                  target="_blank"
                                  className="text-[10px] text-amber-400 hover:underline flex items-center gap-0.5"
                                >
                                  <span>Verify</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </Link>
                              )}
                            </div>
                          ) : hasScore ? (
                            <span className="text-slate-400 text-[11px]">
                              Score: {enr.quizScorePercentage}%
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">
                              In Progress
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
