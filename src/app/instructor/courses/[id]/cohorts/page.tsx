'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Users,
  Plus,
  ArrowLeft,
  Video,
  CheckCircle2
} from 'lucide-react';
import InstructorNav from '@/components/InstructorNav';
import { ViarStore } from '@/lib/store';
import { Course, Cohort } from '@/lib/types';
import { formatInTimezone } from '@/lib/timezones';

export default function CourseCohortsPage() {
  const params = useParams();
  const courseId = (params?.id as string) || 'course-what-is-astrology';

  const [course, setCourse] = useState<Course | null>(null);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [batchName, setBatchName] = useState('Batch — Starting [Month Year]');
  const [startDate, setStartDate] = useState('2026-11-07');
  const [scheduleDesc, setScheduleDesc] = useState('Every Saturday & Sunday at 8:00 PM – 9:30 PM IST');
  const [maxSeats, setMaxSeats] = useState('50');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const crs = ViarStore.getCourseById(courseId) || ViarStore.getCourses()[0];
    if (crs) setCourse(crs);

    const list = ViarStore.getCohorts(courseId);
    setCohorts(list);
  }, [courseId]);

  const handleCreateCohort = (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;

    const newCohort: Cohort = {
      id: `cohort-${Date.now()}`,
      courseId: course.id,
      batchNumber: cohorts.length + 1,
      batchName,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(new Date(startDate).getTime() + 63 * 24 * 3600 * 1000).toISOString(),
      scheduleDescription: scheduleDesc,
      scheduleTimeUtc: {
        dayOfWeek: [6, 0],
        hoursUtc: 14,
        minutesUtc: 30,
      },
      maxSeats: parseInt(maxSeats) || 50,
      enrolledCount: 0,
      status: 'ENROLLING',
      enrollmentDeadline: new Date(startDate).toISOString(),
    };

    const updated = [...cohorts, newCohort];
    setCohorts(updated);
    setIsCreating(false);
    setSuccessMsg(`New cohort "${batchName}" created successfully!`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="cosmic-bg min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <InstructorNav />

        {/* Back link */}
        <Link
          href="/instructor/courses"
          className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Courses</span>
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Cohort Management
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-0.5">
              {course?.title || 'What is Astrology'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Configure batch launch dates, class schedules, and 50-student capacity caps.
            </p>
          </div>

          <button
            onClick={() => setIsCreating(true)}
            className="gold-button px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Cohort Batch</span>
          </button>
        </div>

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal: Create Cohort */}
        {isCreating && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-amber-500/40 max-w-lg w-full">
              <h3 className="text-xl font-bold text-white mb-1">Create Cohort Batch</h3>
              <p className="text-xs text-slate-400 mb-6">
                Set start date, student seat capacity, and recurring class time.
              </p>

              <form onSubmit={handleCreateCohort} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Batch Name (Placeholder / Admin-Editable)
                  </label>
                  <input
                    type="text"
                    required
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    placeholder="Batch — Starting [Month Year]"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Weekly Schedule Description
                  </label>
                  <input
                    type="text"
                    required
                    value={scheduleDesc}
                    onChange={(e) => setScheduleDesc(e.target.value)}
                    placeholder="Every Saturday & Sunday at 8:00 PM – 9:30 PM IST"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Max Student Capacity (Capped at 50)
                  </label>
                  <input
                    type="number"
                    required
                    value={maxSeats}
                    onChange={(e) => setMaxSeats(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="gold-button px-6 py-2.5 rounded-xl text-xs font-bold"
                  >
                    Save Cohort
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Cohorts List */}
        <div className="space-y-4">
          {cohorts.map((coh) => (
            <div
              key={coh.id}
              className="cosmic-card p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-amber-500/30 transition"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {coh.batchName}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    Status: <strong className="text-emerald-400">{coh.status}</strong>
                  </span>
                </div>

                <div className="text-xs text-slate-300 flex items-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>Starts: <strong className="text-white">{formatInTimezone(coh.startDate, 'Asia/Kolkata', 'short')}</strong></span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{coh.scheduleDescription}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>Enrollments: <strong className="text-white">{coh.enrolledCount} / {coh.maxSeats}</strong></span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href={`/instructor/courses/${course?.id || 'course-what-is-astrology'}/cohorts/${coh.id}/sessions`}
                  className="gold-button px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Manage 18 Sessions (Zoom & Replays)</span>
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
