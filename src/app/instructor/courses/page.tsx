'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Calendar,
  ExternalLink,
  Award,
  CheckCircle2,
  Edit,
  Trash2,
  Video,
  Save,
  X,
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
  const [priceInr, setPriceInr] = useState('5100');
  const [priceUsd, setPriceUsd] = useState('69');
  const [durationWeeks, setDurationWeeks] = useState('8');
  const [totalClasses, setTotalClasses] = useState('23');
  const [quizUnlockCondition, setQuizUnlockCondition] = useState<'ALL_SESSIONS_COMPLETED' | 'COHORT_END_DATE_PASSED'>('ALL_SESSIONS_COMPLETED');
  const [isSuccess, setIsSuccess] = useState('');

  // Edit Course Modal State
  const [isEditingOpen, setIsEditingOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editTagline, setEditTagline] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriceInr, setEditPriceInr] = useState('5100');
  const [editPriceUsd, setEditPriceUsd] = useState('69');
  const [editDurationWeeks, setEditDurationWeeks] = useState('8');
  const [editTotalClasses, setEditTotalClasses] = useState('23');
  const [editIsPublished, setEditIsPublished] = useState(true);

  // Delete Course State
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

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
      subtitle: `${totalClasses} Video Modules • Self-Paced • Graded Quiz & Certificate`,
      description: description || 'Comprehensive self-paced video immersion.',
      level: 'Beginner',
      durationWeeks: parseInt(durationWeeks) || 8,
      totalClasses: parseInt(totalClasses) || 23,
      classesPerWeek: 0,
      priceInr: parseInt(priceInr) || 5100,
      priceUsd: parseInt(priceUsd) || 69,
      originalPriceInr: (parseInt(priceInr) || 5100) * 2,
      originalPriceUsd: (parseInt(priceUsd) || 69) * 2,
      isPublished: true,
      featured: false,
      badge: 'Masterclass',
      quizUnlockCondition,
      instructor: {
        name: 'Acharya Niraj Kumar',
        title: 'Founder, Aapka Astro & Master Astrologer',
        /* PLACEHOLDER: Replace with verified chart analysis count once confirmed across both sites */
        bio: 'Acharya Niraj Kumar brings together deep traditional Vedic learning rooted in Baidyanath Dham (Deoghar) and corporate leadership experience. Over 20 years of practice, trusted by students and clients across India and abroad.',
        experienceYears: 20,
        avatarUrl: '/images/Acharya_Niraj_Kumar_Headshot.jpg',
        aapkaAstroUrl: 'https://aapkaastro.com',
      },
      highlights: [
        '23 On-Demand HD Video Modules + 2 Bonus Workshops',
        'Lifetime access & self-paced learning portal',
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

  const handleOpenEdit = (crs: Course) => {
    setEditingCourseId(crs.id);
    setEditTitle(crs.title);
    setEditTagline(crs.tagline || '');
    setEditDescription(crs.description || '');
    setEditPriceInr(String(crs.priceInr || 5100));
    setEditPriceUsd(String(crs.priceUsd || 69));
    setEditDurationWeeks(String(crs.durationWeeks || 8));
    setEditTotalClasses(String(crs.totalClasses || 23));
    setEditIsPublished(crs.isPublished !== false);
    setIsEditingOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourseId || !editTitle) return;

    const updates: Partial<Course> = {
      title: editTitle,
      tagline: editTagline,
      description: editDescription,
      priceInr: parseInt(editPriceInr) || 5100,
      priceUsd: parseInt(editPriceUsd) || 69,
      durationWeeks: parseInt(editDurationWeeks) || 8,
      totalClasses: parseInt(editTotalClasses) || 23,
      isPublished: editIsPublished,
    };

    ViarStore.updateCourse(editingCourseId, updates);
    fetch('/api/courses', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingCourseId, ...updates }),
    }).catch((err) => console.warn('Courses API PATCH fallback:', err));

    setCourses(ViarStore.getCourses());
    setIsEditingOpen(false);
    setIsSuccess(`Course "${editTitle}" updated successfully!`);
    setTimeout(() => setIsSuccess(''), 3000);
  };

  const handleConfirmDelete = () => {
    if (!courseToDelete) return;
    const deletedTitle = courseToDelete.title;
    ViarStore.deleteCourse(courseToDelete.id);
    fetch(`/api/courses?id=${courseToDelete.id}`, {
      method: 'DELETE',
    }).catch((err) => console.warn('Courses API DELETE fallback:', err));

    setCourses(ViarStore.getCourses());
    setCourseToDelete(null);
    setIsSuccess(`Course "${deletedTitle}" removed from catalog.`);
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
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
                    {canManage && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(crs)}
                          className="flex-1 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/15 inline-flex items-center justify-center gap-1.5 transition"
                        >
                          <Edit className="w-3.5 h-3.5 text-amber-400" />
                          <span>Edit Course</span>
                        </button>

                        <button
                          onClick={() => setCourseToDelete(crs)}
                          className="px-3 py-2 rounded-xl text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 inline-flex items-center justify-center gap-1 transition"
                          title="Delete course"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <Link
                      href={`/instructor/courses/${crs.id}/cohorts`}
                      className="gold-button px-4 py-2 rounded-xl text-xs font-bold text-center inline-flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Manage Cohort Batches</span>
                    </Link>

                    <Link
                      href={`/instructor/courses/${crs.id}/cohorts/cohort-wia-batch-1/sessions`}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-center inline-flex items-center justify-center gap-1.5 transition"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Manage Videos &amp; Lessons</span>
                    </Link>

                    <Link
                      href={`/instructor/courses/${crs.id}/quiz`}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-center inline-flex items-center justify-center gap-1.5 transition"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      <span>Edit Final Exam</span>
                    </Link>

                    <Link
                      href={`/courses/${crs.slug}`}
                      target="_blank"
                      className="px-4 py-1.5 rounded-xl text-[11px] font-semibold text-slate-400 hover:text-white text-center inline-flex items-center justify-center gap-1 transition"
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

        {/* EDIT COURSE MODAL */}
        {isEditingOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#0f172a] border border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl my-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Edit className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-bold text-white">Edit Course Details</h3>
                </div>
                <button
                  onClick={() => setIsEditingOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Course Title</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Tagline</label>
                  <input
                    type="text"
                    value={editTagline}
                    onChange={(e) => setEditTagline(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Description</label>
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Tuition (INR ₹)</label>
                    <input
                      type="number"
                      required
                      value={editPriceInr}
                      onChange={(e) => setEditPriceInr(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Tuition (USD $)</label>
                    <input
                      type="number"
                      required
                      value={editPriceUsd}
                      onChange={(e) => setEditPriceUsd(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Duration (Weeks)</label>
                    <input
                      type="number"
                      value={editDurationWeeks}
                      onChange={(e) => setEditDurationWeeks(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Total Classes</label>
                    <input
                      type="number"
                      value={editTotalClasses}
                      onChange={(e) => setEditTotalClasses(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white block">Course Published</span>
                    <span className="text-[11px] text-slate-400">Available to prospective students online</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editIsPublished}
                    onChange={(e) => setEditIsPublished(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsEditingOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-300 bg-white/5 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="gold-button px-5 py-2 rounded-xl font-bold flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE COURSE CONFIRMATION */}
        {courseToDelete && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-red-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
                <Trash2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Delete Course?</h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Are you sure you want to delete <strong className="text-white">&ldquo;{courseToDelete.title}&rdquo;</strong>?
                  This action will permanently remove it from your institute catalog.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setCourseToDelete(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition"
                >
                  Yes, Delete Course
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
