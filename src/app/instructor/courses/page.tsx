'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Calendar,
  ExternalLink,
  Award,
  CheckCircle2
} from 'lucide-react';
import InstructorNav from '@/components/InstructorNav';
import { ViarStore } from '@/lib/store';
import { Course, User } from '@/lib/types';
import { checkStaffSectionAccess, isSiteOwner } from '@/lib/auth/permissions';

export default function InstructorCoursesPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [priceInr, setPriceInr] = useState('4999');
  const [priceUsd, setPriceUsd] = useState('69');
  const [durationWeeks, setDurationWeeks] = useState('9');
  const [totalClasses, setTotalClasses] = useState('18');
  const [quizUnlockCondition, setQuizUnlockCondition] = useState<'ALL_SESSIONS_COMPLETED' | 'COHORT_END_DATE_PASSED'>('ALL_SESSIONS_COMPLETED');
  const [isSuccess, setIsSuccess] = useState('');

  useEffect(() => {
    setCourses(ViarStore.getCourses());
    setCurrentUser(ViarStore.getCurrentUser());
  }, []);

  const permissions = ViarStore.getStaffPermissions();
  const isOwner = isSiteOwner(currentUser);
  const canManage = isOwner || checkStaffSectionAccess({ user: currentUser, section: 'courses', requiredLevel: 'MANAGE', permissions }).allowed;
  const canView = isOwner || checkStaffSectionAccess({ user: currentUser, section: 'courses', requiredLevel: 'VIEW', permissions }).allowed;

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newCourse: Course = {
      id: `course-${Date.now()}`,
      slug,
      title,
      tagline: tagline || 'Practical Vedic astrology masterclass.',
      subtitle: `${totalClasses} Live Classes • ${durationWeeks} Weeks • Graded Quiz & Certificate`,
      description: description || 'Comprehensive cohort-based immersion.',
      level: 'Beginner',
      durationWeeks: parseInt(durationWeeks) || 9,
      totalClasses: parseInt(totalClasses) || 18,
      classesPerWeek: 2,
      priceInr: parseInt(priceInr) || 4999,
      priceUsd: parseInt(priceUsd) || 69,
      originalPriceInr: (parseInt(priceInr) || 4999) * 2,
      originalPriceUsd: (parseInt(priceUsd) || 69) * 2,
      isPublished: true,
      featured: false,
      badge: 'Active Cohort',
      quizUnlockCondition,
      instructor: {
        name: 'Acharya Niraj Kumar',
        title: 'Founder, Aapka Astro & Master Astrologer',
        /* PLACEHOLDER: Replace with verified chart analysis count once confirmed across both sites */
        bio: 'Acharya Niraj Kumar brings together deep traditional Vedic learning rooted in Baidyanath Dham (Deoghar) and corporate leadership experience. Over 20 years of practice, trusted by students and clients across India and abroad.',
        experienceYears: 20,
        studentsTaught: 5200,
        avatarUrl: '/images/Acharya_Niraj_Kumar.jpg',
        aapkaAstroUrl: 'https://aapkaastro.com',
      },
      highlights: [
        'Live interactive Zoom sessions + recording archives',
        'Timezone-synchronized schedule',
        'Verifiable certificate upon passing final exam',
      ],
      prerequisites: ['Basic interest in Vedic Jyotish'],
      whatYouWillLearn: [
        'Complete planetary mechanics',
        'Chart reading synthesis',
      ],
      modules: [],
      faqs: [],
    };

    ViarStore.addCourse(newCourse);
    setCourses(ViarStore.getCourses());
    setIsCreating(false);
    setTitle('');
    setTagline('');
    setDescription('');
    setIsSuccess(`Course "${title}" created successfully!`);
    setTimeout(() => setIsSuccess(''), 3000);
  };

  return (
    <div className="cosmic-bg min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <InstructorNav />

        {/* Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-white">Course Curriculum & Catalog</h2>
              {!canManage && canView && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  VIEW-ONLY ACCESS
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Create, edit, and configure pricing, syllabus blocks, and cohorts for your academy.
            </p>
          </div>

          {canManage ? (
            <button
              onClick={() => setIsCreating(true)}
              className="gold-button px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Course</span>
            </button>
          ) : (
            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 flex items-center gap-1.5">
              <span>View-Only Mode (MANAGE permission required to edit)</span>
            </div>
          )}
        </div>

        {!canView && (
          <div className="p-8 rounded-2xl bg-red-950/20 border border-red-500/30 text-center my-8">
            <h3 className="text-lg font-bold text-white mb-2">Section Access Restricted</h3>
            <p className="text-xs text-slate-300">Your account does not have permission to view the courses section.</p>
          </div>
        )}

        {isSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSuccess}</span>
          </div>
        )}

        {/* Modal: Create Course */}
        {isCreating && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-amber-500/40 max-w-xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-white mb-1">Create New Astrology Course</h3>
              <p className="text-xs text-slate-400 mb-6">
                Add a new cohort-based syllabus to the Viar.in academy catalog.
              </p>

              <form onSubmit={handleCreateCourse} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Course Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Predictive Astrology: Vimshottari Dasha"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. Master timing events and life milestones."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tuition INR (₹)
                    </label>
                    <input
                      type="number"
                      required
                      value={priceInr}
                      onChange={(e) => setPriceInr(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tuition USD ($)
                    </label>
                    <input
                      type="number"
                      required
                      value={priceUsd}
                      onChange={(e) => setPriceUsd(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Duration (Weeks)
                    </label>
                    <input
                      type="number"
                      value={durationWeeks}
                      onChange={(e) => setDurationWeeks(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Total Classes
                    </label>
                    <input
                      type="number"
                      value={totalClasses}
                      onChange={(e) => setTotalClasses(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Final Quiz Unlock Condition
                  </label>
                  <select
                    value={quizUnlockCondition}
                    onChange={(e) => setQuizUnlockCondition(e.target.value as 'ALL_SESSIONS_COMPLETED' | 'COHORT_END_DATE_PASSED')}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
                  >
                    <option value="ALL_SESSIONS_COMPLETED" className="bg-slate-900 text-white">
                      Require all sessions watched/attended (Recommended)
                    </option>
                    <option value="COHORT_END_DATE_PASSED" className="bg-slate-900 text-white">
                      Unlock automatically once cohort end date passes
                    </option>
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Students must pass the quiz (≥70%) to receive their digital credential & certificate.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Course Description
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the curriculum and learning outcomes..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
                  ></textarea>
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
                    Save & Publish Course
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Courses List */}
        <div className="space-y-6">
          {courses.map((crs) => {
            const isFlagship = crs.slug === 'what-is-astrology';

            return (
              <div
                key={crs.id}
                className={`cosmic-card p-6 sm:p-8 rounded-3xl border transition ${
                  isFlagship
                    ? 'border-amber-500/40 bg-[#111827]/80 ring-1 ring-amber-500/20'
                    : 'border-white/10'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {crs.badge || crs.level}
                      </span>
                      {crs.isComingSoon && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Coming Soon
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        {crs.durationWeeks} Weeks • {crs.totalClasses} Masterclasses
                      </span>
                    </div>

                    <h3 className="text-2xl font-black text-white">
                      {crs.title}
                    </h3>
                    <p className="text-xs text-amber-300/90 font-medium">
                      {crs.tagline}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                      {crs.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs pt-1">
                      <span className="text-slate-400">
                        Tuition: <strong className="text-white">₹{crs.priceInr.toLocaleString()}</strong> / <strong className="text-amber-300">${crs.priceUsd} USD</strong>
                      </span>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
                    <Link
                      href={`/instructor/courses/${crs.id}/cohorts`}
                      className="gold-button px-4 py-2.5 rounded-xl text-xs font-bold text-center inline-flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Manage Cohort Batches</span>
                    </Link>

                    <Link
                      href={`/instructor/courses/${crs.id}/quiz`}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/15 text-center inline-flex items-center justify-center gap-1.5 transition"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      <span>Edit Final Exam (Quiz)</span>
                    </Link>

                    <Link
                      href={`/courses/${crs.slug}`}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white text-center inline-flex items-center justify-center gap-1 transition"
                    >
                      <span>Preview Live Page</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
