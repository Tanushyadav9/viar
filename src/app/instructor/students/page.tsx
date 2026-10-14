'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  CheckCircle2,
  Award,
  UserPlus,
  RefreshCw,
  Mail,
  Phone,
  UserX,
  FileSpreadsheet
} from 'lucide-react';
import InstructorNav from '@/components/InstructorNav';
import { ViarStore } from '@/lib/store';
import { Cohort, Course, User } from '@/lib/types';
import { isSiteOwner } from '@/lib/auth/permissions';

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
  amountPaid: number;
  currency: string;
  paymentStatus: string;
  paymentReference?: string;
  paymentMethod?: string;
  progressPercentage?: number;
  quizResult?: string;
  quizScorePercentage?: number;
  certificateStatus?: string;
  certificateId?: string;
  certificateVerificationCode?: string;
}

export default function InstructorStudentsRosterPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [enrollments, setEnrollments] = useState<StudentRosterItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Manual Grant Modal State
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualCourseId, setManualCourseId] = useState('course-what-is-astrology');
  const [manualCohortId, setManualCohortId] = useState('cohort-wia-batch-1');
  const [manualAmount, setManualAmount] = useState('5100');
  const [manualCurrency, setManualCurrency] = useState<'INR' | 'USD'>('INR');
  const [manualReason, setManualReason] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Revoke Access Modal State
  const [revokingEnrollment, setRevokingEnrollment] = useState<StudentRosterItem | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revokeSuccess, setRevokeSuccess] = useState('');
  const [revokeError, setRevokeError] = useState('');
  const [isRevoking, setIsRevoking] = useState(false);

  const isOwner = isSiteOwner(currentUser);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch live enrollments from PostgreSQL API
      const res = await fetch(`/api/enrollments?courseId=${selectedCourseId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.enrollments)) {
        setEnrollments(data.enrollments);
      }
    } catch (err) {
      console.warn('Enrollment API error:', err);
    } finally {
      setIsLoading(false);
    }

    // 2. Fetch courses & cohorts for filtering
    try {
      const cRes = await fetch('/api/courses');
      const cData = await cRes.json();
      if (cData.success && Array.isArray(cData.courses)) {
        setCourses(cData.courses);
      }
    } catch {
      setCourses(ViarStore.getCourses());
    }

    setCohorts(ViarStore.getCohorts());
  }, [selectedCourseId]);

  useEffect(() => {
    loadData();
    setCurrentUser(ViarStore.getCurrentUser());
  }, [loadData]);

  const handleManualGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualEmail.trim()) return;

    if (!manualReason.trim()) {
      setModalError('A mandatory reason is required to log this manual access grant.');
      return;
    }

    setIsSubmitting(true);
    setModalError('');
    setModalSuccess('');

    try {
      const res = await fetch('/api/enrollments/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: manualName.trim(),
          studentEmail: manualEmail.trim(),
          studentPhone: manualPhone.trim() || undefined,
          courseId: manualCourseId,
          cohortId: manualCohortId,
          amountPaid: Number(manualAmount) || 5100,
          currency: manualCurrency,
          reason: manualReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok && !data.success) {
        throw new Error(data.error || 'Failed to grant enrollment access');
      }

      setModalSuccess(`Scholar ${manualName} granted access successfully! Audit log saved.`);
      setTimeout(() => {
        setIsEnrolling(false);
        setManualName('');
        setManualEmail('');
        setManualPhone('');
        setManualReason('');
        setModalSuccess('');
        loadData();
      }, 1500);
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Error granting enrollment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokingEnrollment) return;

    if (!revokeReason.trim()) {
      setRevokeError('A mandatory reason is strictly required to revoke course access.');
      return;
    }

    setIsRevoking(true);
    setRevokeError('');
    setRevokeSuccess('');

    try {
      const res = await fetch('/api/enrollments/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentId: revokingEnrollment.id,
          reason: revokeReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok && !data.success) {
        throw new Error(data.error || 'Failed to revoke enrollment');
      }

      setRevokeSuccess(`Access revoked for ${revokingEnrollment.studentName}. Audit log recorded.`);
      setTimeout(() => {
        setRevokingEnrollment(null);
        setRevokeReason('');
        setRevokeSuccess('');
        loadData();
      }, 1500);
    } catch (err: unknown) {
      setRevokeError(err instanceof Error ? err.message : 'Error revoking access');
    } finally {
      setIsRevoking(false);
    }
  };

  const handleExportCsv = () => {
    const url = `/api/enrollments/export?courseId=${selectedCourseId}`;
    window.open(url, '_blank');
  };

  const filteredStudents = enrollments.filter((enr) => {
    const matchesCourse = selectedCourseId === 'all' || enr.courseId === selectedCourseId;
    const matchesSearch =
      (enr.studentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (enr.studentEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (enr.studentPhone || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCourse && matchesSearch;
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
                {enrollments.length} Total Enrolled Scholars
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Student Admissions &amp; Progress Roster
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Track student curriculum progress percentage, video completion, final quiz assessment results, verifiable certificates, and historical tuition paid.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* CSV Export Button */}
            <button
              onClick={handleExportCsv}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold border border-white/10 flex items-center gap-2 transition"
              title="Download Student Roster CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            {/* Manual Enrollment Button */}
            <button
              onClick={() => setIsEnrolling(true)}
              className="gold-button px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>Manual Student Admission</span>
            </button>

            <button
              onClick={loadData}
              disabled={isLoading}
              className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 flex items-center gap-1.5"
              title="Refresh Roster"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filters & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Course Filter Dropdown */}
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="px-4 py-2 rounded-xl bg-[#111827] border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-amber-400"
            >
              <option value="all">All Courses ({enrollments.length} Scholars)</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
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
              placeholder="Search by student name, email, or phone..."
              className="pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400 w-full sm:w-72"
            />
          </div>
        </div>

        {/* Modal: Manual Student Enrollment (Owner-only with required reason) */}
        {isEnrolling && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-amber-500/40 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-white mb-1">Grant Scholar Admission Manually</h3>
              <p className="text-xs text-slate-400 mb-6">
                Directly provision self-paced course access for students paying via direct cash, ashram donation, or offline bank transfer.
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

              <form onSubmit={handleManualGrant} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Scholar Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="e.g. Priyadarshini Sen"
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
                    placeholder="scholar@example.com"
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Assign to Course
                    </label>
                    <select
                      value={manualCourseId}
                      onChange={(e) => setManualCourseId(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-[#111827] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Assign to Cohort
                    </label>
                    <select
                      value={manualCohortId}
                      onChange={(e) => setManualCohortId(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-[#111827] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                    >
                      {cohorts.map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          {ch.batchName || ch.id}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tuition Paid
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

                {/* MANDATORY AUDIT REASON */}
                <div>
                  <label className="block text-xs font-semibold text-amber-300 mb-1">
                    Audit Reason (Required for Audit Log) *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={manualReason}
                    onChange={(e) => setManualReason(e.target.value)}
                    placeholder="e.g. Direct cash tuition received at Deoghar ashram; or full academic scholarship granted."
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-amber-500/30 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    This reason is permanently recorded in the system activity audit log.
                  </span>
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
                    {isSubmitting ? 'Granting...' : 'Confirm Admission'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Revoke Student Access (Owner-only with required reason) */}
        {revokingEnrollment && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-red-500/40 max-w-lg w-full">
              <div className="flex items-center gap-3 text-red-400 mb-2">
                <UserX className="w-6 h-6 shrink-0" />
                <h3 className="text-lg font-bold text-white">Revoke Course Access</h3>
              </div>

              <p className="text-xs text-slate-300 mb-4">
                You are revoking access for <strong className="text-white">{revokingEnrollment.studentName}</strong> ({revokingEnrollment.studentEmail}) from <strong className="text-amber-300">{revokingEnrollment.courseTitle}</strong>.
              </p>

              {revokeSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{revokeSuccess}</span>
                </div>
              )}

              {revokeError && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                  {revokeError}
                </div>
              )}

              <form onSubmit={handleRevokeAccess} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-red-300 mb-1">
                    Audit Reason for Revocation (Strictly Required) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={revokeReason}
                    onChange={(e) => setRevokeReason(e.target.value)}
                    placeholder="e.g. Full tuition refund requested and issued via Razorpay; or student cancelled enrollment."
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-red-500/30 text-white text-xs focus:outline-none focus:border-red-400"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    This reason will be recorded in the security audit trail.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setRevokingEnrollment(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRevoking}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition disabled:opacity-50"
                  >
                    {isRevoking ? 'Revoking...' : 'Confirm Revoke Access'}
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
                  <th className="py-4 px-6">Scholar Name</th>
                  <th className="py-4 px-6">Email / Phone</th>
                  <th className="py-4 px-6">Course</th>
                  <th className="py-4 px-6">Progress %</th>
                  <th className="py-4 px-6">Quiz Result</th>
                  <th className="py-4 px-6">Certificate</th>
                  <th className="py-4 px-6">Tuition Paid</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-500">
                      No enrolled scholars found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((enr) => {
                    const isRevoked = enr.paymentStatus === 'REVOKED';

                    return (
                      <tr key={enr.id} className="hover:bg-white/[0.02] transition">
                        <td className="py-4 px-6 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <span>{enr.studentName}</span>
                            {isRevoked && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/20 text-red-300">
                                REVOKED
                              </span>
                            )}
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
                          <span className="font-medium text-slate-200 block line-clamp-1">
                            {enr.courseTitle || 'Vedic Astrology'}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Enrolled: {enr.enrolledAt ? new Date(enr.enrolledAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                          </span>
                        </td>

                        {/* Progress Percentage */}
                        <td className="py-4 px-6">
                          <div className="w-24 space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span>Progress</span>
                              <span className="font-bold text-amber-300">{enr.progressPercentage || 0}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                                style={{ width: `${enr.progressPercentage || 0}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Quiz Result */}
                        <td className="py-4 px-6">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            enr.quizResult?.startsWith('Passed')
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : enr.quizResult?.startsWith('Failed')
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-white/5 text-slate-400'
                          }`}>
                            {enr.quizResult || 'Not Attempted'}
                          </span>
                        </td>

                        {/* Certificate Status */}
                        <td className="py-4 px-6">
                          {enr.certificateVerificationCode ? (
                            <Link
                              href={`/verify/${enr.certificateVerificationCode}`}
                              target="_blank"
                              className="text-[11px] font-mono text-amber-300 hover:underline flex items-center gap-1"
                            >
                              <Award className="w-3.5 h-3.5 text-amber-400" />
                              <span>{enr.certificateVerificationCode}</span>
                            </Link>
                          ) : (
                            <span className="text-slate-500 text-[11px]">
                              {enr.certificateStatus || 'Not Issued'}
                            </span>
                          )}
                        </td>

                        {/* Tuition Paid */}
                        <td className="py-4 px-6">
                          <span className="font-bold text-white block">
                            {enr.currency === 'USD' ? `$${enr.amountPaid}` : `₹${enr.amountPaid.toLocaleString()}`}
                          </span>
                          <span className="text-[10px] text-emerald-400 uppercase font-semibold">
                            {enr.paymentStatus}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          {isOwner && !isRevoked && (
                            <button
                              onClick={() => {
                                setRevokingEnrollment(enr);
                                setRevokeReason('');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-semibold border border-red-500/20 transition"
                            >
                              Revoke
                            </button>
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
