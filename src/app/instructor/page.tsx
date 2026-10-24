'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Calendar,
  Users,
  Video,
  DollarSign,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import InstructorNav from '@/components/InstructorNav';
import { Course } from '@/lib/types';

export default function InstructorOverviewPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});

  useEffect(() => {
    // 1. Fetch live courses
    fetch('/api/courses')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && Array.isArray(data.courses)) {
          setCourses(data.courses);
        } else {
          setCourses([]);
        }
      })
      .catch(() => {
        setCourses([]);
      });



    // 3. Stats from live database orders & enrollments
    Promise.all([
      fetch('/api/admin/orders').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch('/api/enrollments').then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([ordersData, enrollmentsData]) => {
      const orders = ordersData?.orders || [];
      const enrollments = enrollmentsData?.enrollments || [];

      const verifiedOrders = orders.filter((o: { status?: string }) => o.status === 'VERIFIED' || o.status === 'APPROVED' || o.status === 'PAID');
      const totalRevInr = verifiedOrders
        .filter((o: { currency?: string }) => o.currency !== 'USD')
        .reduce((sum: number, o: { amountPaidInr?: number; amount?: number }) => sum + (o.amountPaidInr || o.amount || 0), 0);
      const totalRevUsd = verifiedOrders
        .filter((o: { currency?: string }) => o.currency === 'USD')
        .reduce((sum: number, o: { amountPaidUsd?: number; amount?: number }) => sum + (o.amountPaidUsd || o.amount || 0), 0);

      const totalStudents = enrollments.length > 0 ? enrollments.length : new Set(verifiedOrders.map((o: { studentEmail?: string }) => o.studentEmail).filter(Boolean)).size;

      setStats({
        totalStudents,
        totalEnrollments: enrollments.length,
        totalRevenueInr: totalRevInr,
        totalRevenueUsd: totalRevUsd,
      });
    }).catch(() => {
      setStats({
        totalStudents: 0,
        totalEnrollments: 0,
        totalRevenueInr: 0,
        totalRevenueUsd: 0,
      });
    });
  }, []);

  return (
    <div className="cosmic-bg min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <InstructorNav />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="cosmic-card p-5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Total Students</span>
              <Users className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">
              {(stats.totalStudents && stats.totalStudents > 0) ? stats.totalStudents : <span className="text-lg font-bold text-slate-400">No students yet</span>}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span>{(stats.totalStudents && stats.totalStudents > 0) ? `${stats.totalStudents} enrolled student${stats.totalStudents === 1 ? '' : 's'}` : 'Self-paced enrollment open'}</span>
            </p>
          </div>

          <div className="cosmic-card p-5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Course Delivery</span>
              <Calendar className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">Self-Paced</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Instant lifetime access
            </p>
          </div>

          <div className="cosmic-card p-5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Video Modules</span>
              <Video className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">23</p>
            <p className="text-[11px] text-slate-400 mt-1">
              On-Demand Lessons &amp; Notes
            </p>
          </div>

          <div className="cosmic-card p-5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Total Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">
              {(stats.totalRevenueInr && stats.totalRevenueInr > 0) ? `₹${stats.totalRevenueInr.toLocaleString('en-IN')}` : <span className="text-lg font-bold text-slate-400">No revenue yet</span>}
            </p>
            <p className="text-[11px] text-emerald-400 mt-1">
              Direct UPI • Zero gateway fees
            </p>
          </div>
        </div>

        {/* Course & Curriculum Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          
          {/* Course Details Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Video className="w-4 h-4 text-amber-400" />
                <span>Published Course Curriculum</span>
              </h2>
              <Link
                href="/instructor/courses"
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
              >
                <span>Manage Course &amp; Curriculum</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="cosmic-card p-6 rounded-2xl border border-white/10 space-y-4 hover:border-amber-500/30 transition">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Self-Paced Masterclass
                </span>
                <span className="text-xs text-emerald-400 font-bold">
                  Tuition: ₹5,100
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">
                  {courses[0]?.title || 'The Ultimate Astrology Course: Foundations to Chart Mastery'}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  23 on-demand video modules • 2 practical chart reading masterclasses • Self-paced lifetime access with verifiable certification.
                </p>
              </div>

              <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-400">
                  Admissions: <strong className="text-white">Active (Continuous Open Enrollment)</strong>
                </span>

                <div className="flex items-center gap-2">
                  <Link
                    href="/instructor/courses"
                    className="gold-button px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Manage 23 Lesson Modules</span>
                  </Link>
                  <Link
                    href="/instructor/students"
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10"
                  >
                    Student Roster
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions & Short-cuts */}
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Instructor Controls</span>
            </h2>

            <div className="cosmic-card p-6 rounded-2xl border border-white/10 space-y-3">
              <Link
                href="/instructor/courses"
                className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 transition group"
              >
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition">
                    Course &amp; Syllabus Editor
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Edit titles, modules, pricing, and curriculum
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition" />
              </Link>

              <Link
                href="/instructor/courses/course-what-is-astrology/quiz"
                className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 transition group"
              >
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition">
                    Final Quiz Questions Builder
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Manage the 20 multiple-choice exam questions
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition" />
              </Link>

              <Link
                href="/instructor/students"
                className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 transition group"
              >
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition">
                    Student Progress &amp; Quiz Grades
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    View roster, watched completion, and issued certificates
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition" />
              </Link>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
