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
import { ViarStore } from '@/lib/store';
import { Course, Cohort } from '@/lib/types';
import { formatInTimezone } from '@/lib/timezones';

export default function InstructorOverviewPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});

  useEffect(() => {
    // Auto switch to ADMIN persona if visiting instructor page
    const user = ViarStore.getCurrentUser();
    if (user.role !== 'ADMIN') {
      ViarStore.switchUserRole('ADMIN');
    }
    setCourses(ViarStore.getCourses());
    setCohorts(ViarStore.getCohorts());
    setStats(ViarStore.getAdminStats());
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
            <p className="text-3xl font-black text-white">{stats.totalStudents || 3}</p>
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <span>Cohort enrollment active</span>
            </p>
          </div>

          <div className="cosmic-card p-5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Active Cohorts</span>
              <Calendar className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-3xl font-black text-white">{cohorts.length}</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Flagship: {cohorts[0]?.enrolledCount || 38}/50 seats filled
            </p>
          </div>

          <div className="cosmic-card p-5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Live Classes</span>
              <Video className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-3xl font-black text-white">18</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Zoom & Google Meet linked
            </p>
          </div>

          <div className="cosmic-card p-5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Total Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">
              ₹{(stats.totalRevenueInr || 4999).toLocaleString()}
            </p>
            <p className="text-[11px] text-amber-300 mt-1">
              + ${(stats.totalRevenueUsd || 138)} USD Global
            </p>
          </div>
        </div>

        {/* Courses & Active Cohorts Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          
          {/* Active Cohorts Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Active Cohort Batches</span>
              </h2>
              <Link
                href="/instructor/courses"
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
              >
                <span>Manage All Courses & Cohorts</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {cohorts.map((coh) => {
              const crs = courses.find((c) => c.id === coh.courseId);
              return (
                <div
                  key={coh.id}
                  className="cosmic-card p-6 rounded-2xl border border-white/10 space-y-4 hover:border-amber-500/30 transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {coh.batchName}
                    </span>
                    <span className="text-xs text-slate-400">
                      Capacity: <strong className="text-white">{coh.enrolledCount} / {coh.maxSeats}</strong> seats
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {crs?.title || 'What is Astrology — Foundations of Vedic Astrology'}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      {coh.scheduleDescription}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-slate-400">
                      Starts: <strong className="text-white">{formatInTimezone(coh.startDate, 'Asia/Kolkata', 'short')}</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/instructor/courses/${coh.courseId}/cohorts/${coh.id}/sessions`}
                        className="gold-button px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Manage 18 Class Links</span>
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
              );
            })}
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
                className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 flex items-center justify-between transition group block"
              >
                <div>
                  <h4 className="text-sm font-semibold text-white group-hover:text-amber-300 transition">
                    Course & Syllabus Editor
                  </h4>
                  <p className="text-xs text-slate-400">Edit titles, 3-week blocks, pricing, and thumbnails</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                href="/instructor/courses/course-what-is-astrology/quiz"
                className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 flex items-center justify-between transition group block"
              >
                <div>
                  <h4 className="text-sm font-semibold text-white group-hover:text-amber-300 transition">
                    Final Quiz Questions Builder
                  </h4>
                  <p className="text-xs text-slate-400">Manage the 20 multiple-choice exam questions</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                href="/instructor/students"
                className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 flex items-center justify-between transition group block"
              >
                <div>
                  <h4 className="text-sm font-semibold text-white group-hover:text-amber-300 transition">
                    Student Progress & Quiz Grades
                  </h4>
                  <p className="text-xs text-slate-400">View roster, watched completion, and issued certificates</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                href="/instructor/analytics"
                className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 flex items-center justify-between transition group block"
              >
                <div>
                  <h4 className="text-sm font-semibold text-white group-hover:text-amber-300 transition">
                    Enrollment Revenue & Analytics
                  </h4>
                  <p className="text-xs text-slate-400">INR vs USD payment breakdown and completion rates</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 group-hover:translate-x-0.5 transition" />
              </Link>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
