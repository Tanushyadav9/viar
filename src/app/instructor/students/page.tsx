'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  CheckCircle2,
  Award,
  ExternalLink
} from 'lucide-react';
import InstructorNav from '@/components/InstructorNav';
import { ViarStore } from '@/lib/store';
import { Enrollment, Certificate, Cohort } from '@/lib/types';

export default function InstructorStudentsRosterPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setEnrollments(ViarStore.getEnrollments());
    setCertificates(ViarStore.getCertificates());
    setCohorts(ViarStore.getCohorts());
  }, []);

  const filteredStudents = enrollments.filter((enr) => {
    const matchesCohort = selectedCohortId === 'all' || enr.cohortId === selectedCohortId;
    const matchesSearch =
      enr.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enr.studentEmail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCohort && matchesSearch;
  });

  return (
    <div className="cosmic-bg min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <InstructorNav />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Student Roster & Progress Tracking</h2>
            <p className="text-xs text-slate-400 mt-1">
              View individual attendance, watched class progress, final quiz scores, and issued credentials.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Cohort Selector */}
            <select
              value={selectedCohortId}
              onChange={(e) => setSelectedCohortId(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-amber-400"
            >
              <option value="all">All Cohorts ({enrollments.length} Students)</option>
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.batchName} ({c.enrolledCount}/{c.maxSeats})
                </option>
              ))}
            </select>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students..."
                className="pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400 w-48"
              />
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="cosmic-card rounded-2xl border border-white/10 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-white/5 border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <tr>
                  <th className="py-4 px-6">Student Name</th>
                  <th className="py-4 px-6">Email / Phone</th>
                  <th className="py-4 px-6">Cohort Batch</th>
                  <th className="py-4 px-6">Watched / Attended</th>
                  <th className="py-4 px-6">Quiz Result</th>
                  <th className="py-4 px-6 text-right">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-500">
                      No enrolled students found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st) => {
                    const cert = certificates.find((c) => c.studentName === st.studentName || c.studentEmail === st.studentEmail);

                    return (
                      <tr key={st.id} className="hover:bg-white/[0.02] transition">
                        <td className="py-4 px-6 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-xs">
                              {st.studentName.charAt(0)}
                            </div>
                            <span>{st.studentName}</span>
                          </div>
                        </td>

                        <td className="py-4 px-6 text-slate-400">
                          <div>{st.studentEmail}</div>
                          <div className="text-[10px] text-slate-500">{st.paymentMethod}</div>
                        </td>

                        <td className="py-4 px-6">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Batch 01 (50 Cap)
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-medium">
                              <span className="text-white">18 / 18</span>
                              <span className="text-emerald-400">100%</span>
                            </div>
                            <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full w-full"></div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          {cert ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" />
                              Passed ({cert.scorePercentage}%)
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">
                              In Progress
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-right">
                          {cert ? (
                            <Link
                              href={`/verify/${cert.verificationCode}`}
                              target="_blank"
                              className="px-3 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1 transition"
                            >
                              <Award className="w-3 h-3" />
                              <span>{cert.verificationCode}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">Not issued</span>
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
