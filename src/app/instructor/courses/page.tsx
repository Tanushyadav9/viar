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
  Archive,
  Layers,
  AlertTriangle
} from 'lucide-react';
import InstructorNav from '@/components/InstructorNav';
import { ViarStore } from '@/lib/store';
import { Course, User } from '@/lib/types';
import { checkStaffSectionAccess, isSiteOwner } from '@/lib/auth/permissions';

export default function InstructorCoursesPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);

  // Form states for Create/Edit
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [priceInr, setPriceInr] = useState('5100');
  const [priceUsd, setPriceUsd] = useState('69');
  const [durationWeeks, setDurationWeeks] = useState('8');
  const [totalClasses, setTotalClasses] = useState('23');
  const [status, setStatus] = useState<'PUBLISHED' | 'DRAFT' | 'COMING_SOON'>('PUBLISHED');
  const [category, setCategory] = useState('Vedic Astrology');

  const [isSuccess, setIsSuccess] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/courses');
      const data = await res.json();
      if (data.success && data.courses && data.courses.length > 0) {
        setCourses(data.courses);
        return;
      }
    } catch {
      // Fallback
    }
    setCourses(ViarStore.getCourses());
  };

  useEffect(() => {
    fetchCourses();
    setCurrentUser(ViarStore.getCurrentUser());
  }, []);

  const permissions = ViarStore.getStaffPermissions();
  const isOwner = isSiteOwner(currentUser);
  const canManage = isOwner || checkStaffSectionAccess({ user: currentUser, section: 'courses', requiredLevel: 'MANAGE', permissions }).allowed;
  const canView = isOwner || checkStaffSectionAccess({ user: currentUser, section: 'courses', requiredLevel: 'VIEW', permissions }).allowed;

  const handleOpenCreate = () => {
    setTitle('');
    setTagline('');
    setDescription('');
    setPriceInr('5100');
    setPriceUsd('69');
    setDurationWeeks('8');
    setTotalClasses('23');
    setStatus('PUBLISHED');
    setCategory('Vedic Astrology');
    setIsCreating(true);
  };

  const handleOpenEdit = (crs: Course) => {
    setEditingCourse(crs);
    setTitle(crs.title);
    setTagline(crs.tagline || '');
    setDescription(crs.description || '');
    setPriceInr(String(crs.priceInr));
    setPriceUsd(String(crs.priceUsd));
    setDurationWeeks(String(crs.durationWeeks));
    setTotalClasses(String(crs.totalClasses));
    setStatus(crs.isComingSoon ? 'COMING_SOON' : 'PUBLISHED');
    setCategory(crs.level || 'Vedic Astrology');
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      if (editingCourse) {
        // Update existing course
        const res = await fetch(`/api/courses/${editingCourse.slug || editingCourse.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            description,
            priceInr: Number(priceInr),
            priceUsd: Number(priceUsd),
            durationWeeks: Number(durationWeeks),
            totalClasses: Number(totalClasses),
            status,
            category,
          }),
        });
        const data = await res.json();
        if (!res.ok && !data.success) {
          throw new Error(data.error || 'Failed to update course in database');
        }

        // Also update local store
        const updatedCourse: Course = {
          ...editingCourse,
          title,
          tagline,
          description,
          priceInr: Number(priceInr),
          priceUsd: Number(priceUsd),
          durationWeeks: Number(durationWeeks),
          totalClasses: Number(totalClasses),
          isComingSoon: status === 'COMING_SOON',
          isPublished: status === 'PUBLISHED',
        };
        const all = ViarStore.getCourses();
        const idx = all.findIndex((c) => c.id === editingCourse.id || c.slug === editingCourse.slug);
        if (idx !== -1) {
          all[idx] = updatedCourse;
          if (typeof window !== 'undefined') localStorage.setItem('viar_courses', JSON.stringify(all));
        }

        setEditingCourse(null);
        setIsSuccess(`Course "${title}" updated successfully!`);
      } else {
        // Create new course
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const res = await fetch('/api/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            slug,
            description,
            priceInr: Number(priceInr),
            priceUsd: Number(priceUsd),
            durationWeeks: Number(durationWeeks),
            totalClasses: Number(totalClasses),
            status,
            category,
            modules: [],
          }),
        });

        const data = await res.json();
        if (!res.ok && !data.success) {
          throw new Error(data.error || 'Failed to create course in database');
        }

        const newCourse: Course = {
          id: data.course?.id || `course-${Date.now()}`,
          slug,
          title,
          tagline: tagline || 'Practical Vedic astrology masterclass.',
          subtitle: `${totalClasses} Video Modules • Self-Paced • Graded Quiz & Certificate`,
          description: description || 'Comprehensive self-paced video immersion.',
          level: (category as Course['level']) || 'Beginner',
          durationWeeks: parseInt(durationWeeks) || 8,
          totalClasses: parseInt(totalClasses) || 23,
          classesPerWeek: 0,
          priceInr: parseInt(priceInr) || 5100,
          priceUsd: parseInt(priceUsd) || 69,
          originalPriceInr: (parseInt(priceInr) || 5100) * 2,
          originalPriceUsd: (parseInt(priceUsd) || 69) * 2,
          isPublished: status === 'PUBLISHED',
          isComingSoon: status === 'COMING_SOON',
          featured: false,
          badge: 'Masterclass',
          instructor: {
            name: 'Acharya Niraj Kumar',
            title: 'Founder, Aapka Astro & Master Astrologer',
            bio: 'Acharya Niraj Kumar brings together deep traditional Vedic learning rooted in Baidyanath Dham (Deoghar) and corporate leadership experience.',
            experienceYears: 20,
            avatarUrl: '/images/Acharya_Niraj_Kumar_Headshot.jpg',
            aapkaAstroUrl: 'https://aapkaastro.com',
          },
          highlights: ['On-Demand HD Video Modules', 'Verifiable Certificate'],
          prerequisites: ['Open to beginners'],
          whatYouWillLearn: ['Foundational celestial mechanics', 'Practical chart interpretation'],
          modules: [],
          faqs: [],
        };

        ViarStore.addCourse(newCourse);
        setIsCreating(false);
        setIsSuccess(`Course "${title}" created and published successfully!`);
      }

      await fetchCourses();
      setTimeout(() => setIsSuccess(''), 4000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveCourse = async (crs: Course) => {
    if (!confirm(`Are you sure you want to archive "${crs.title}"? It will be unpublished from the public catalog.`)) return;

    try {
      await fetch(`/api/courses/${crs.slug || crs.id}?archive=true`, {
        method: 'DELETE',
      });
      setIsSuccess(`Course "${crs.title}" moved to draft/archived status.`);
      await fetchCourses();
      setTimeout(() => setIsSuccess(''), 3000);
    } catch {
      setErrorMsg('Failed to archive course');
    }
  };

  const handleDeleteCourseConfirm = async () => {
    if (!deletingCourse) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/courses/${deletingCourse.slug || deletingCourse.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok && !data.success) {
        throw new Error(data.error || 'Failed to delete course');
      }

      // Remove from ViarStore
      const all = ViarStore.getCourses().filter((c) => c.id !== deletingCourse.id && c.slug !== deletingCourse.slug);
      if (typeof window !== 'undefined') localStorage.setItem('viar_courses', JSON.stringify(all));

      setDeletingCourse(null);
      setIsSuccess(`Course "${deletingCourse.title}" deleted permanently.`);
      await fetchCourses();
      setTimeout(() => setIsSuccess(''), 4000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete course');
    } finally {
      setLoading(false);
    }
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
              Manage all astrology courses, build modules and video lessons, configure pricing, and review cohorts.
            </p>
          </div>

          {canManage ? (
            <button
              onClick={handleOpenCreate}
              className="gold-button px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Course</span>
            </button>
          ) : (
            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 flex items-center gap-1.5">
              <span>View-Only Mode</span>
            </div>
          )}
        </div>

        {isSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{isSuccess}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Modal: Create or Edit Course */}
        {(isCreating || editingCourse) && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-amber-500/40 max-w-xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-white mb-1">
                {editingCourse ? 'Edit Course Details' : 'Create New Astrology Course'}
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Configure course title, tuition pricing in INR & USD, syllabus volume, and status.
              </p>

              <form onSubmit={handleSaveCourse} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Course Title *
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
                    placeholder="e.g. Master timing events and life milestones with precision."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tuition INR (₹) *
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
                      Tuition USD ($) *
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

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Duration (Weeks)
                    </label>
                    <input
                      type="number"
                      value={durationWeeks}
                      onChange={(e) => setDurationWeeks(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Total Modules
                    </label>
                    <input
                      type="number"
                      value={totalClasses}
                      onChange={(e) => setTotalClasses(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Catalog Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as 'PUBLISHED' | 'DRAFT' | 'COMING_SOON')}
                      className="w-full px-4 py-2 rounded-xl bg-[#111827] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                    >
                      <option value="PUBLISHED">Published</option>
                      <option value="DRAFT">Draft / Hidden</option>
                      <option value="COMING_SOON">Coming Soon</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Course Description
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Comprehensive overview of learning outcomes, curriculum, and practical training..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      setEditingCourse(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="gold-button px-6 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : editingCourse ? 'Save Updates' : 'Publish Course'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Delete Confirmation */}
        {deletingCourse && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-red-500/40 max-w-md w-full text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Delete Course?</h3>
              <p className="text-xs text-slate-300">
                Are you sure you want to permanently delete &ldquo;{deletingCourse.title}&rdquo;? This will remove its curriculum and records from the database.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingCourse(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCourseConfirm}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Courses List */}
        <div className="space-y-6">
          {courses.map((crs) => {
            const isFlagship = crs.slug === 'what-is-astrology';
            const courseIdentifier = crs.id || crs.slug;

            return (
              <div
                key={courseIdentifier}
                className={`cosmic-card p-6 sm:p-8 rounded-3xl border transition ${
                  isFlagship
                    ? 'border-amber-500/40 bg-[#111827]/80 ring-1 ring-amber-500/20'
                    : 'border-white/10'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  
                  <div className="space-y-2.5 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {crs.badge || crs.level || 'Masterclass'}
                      </span>
                      {crs.isComingSoon ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Coming Soon
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Live in Catalog
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        {crs.durationWeeks} Weeks • {crs.totalClasses || 23} Modules
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
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 sm:w-auto lg:w-56">
                    {/* Primary Course Builder Button */}
                    <Link
                      href={`/instructor/courses/${courseIdentifier}/builder`}
                      className="gold-button px-4 py-2.5 rounded-xl text-xs font-bold text-center inline-flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Build Modules &amp; Lessons</span>
                    </Link>

                    {/* Edit Metadata */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(crs)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/15 text-center inline-flex items-center justify-center gap-1.5 transition"
                    >
                      <Edit className="w-3.5 h-3.5 text-amber-400" />
                      <span>Edit Course Details</span>
                    </button>

                    {/* Quiz Builder */}
                    <Link
                      href={`/instructor/courses/${courseIdentifier}/quiz`}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-center inline-flex items-center justify-center gap-1.5 transition"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      <span>Configure Final Quiz</span>
                    </Link>

                    {/* Manage Cohorts */}
                    <Link
                      href={`/instructor/courses/${courseIdentifier}/cohorts`}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-center inline-flex items-center justify-center gap-1.5 transition"
                    >
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Manage Cohort Batches</span>
                    </Link>

                    {/* Live Preview */}
                    <Link
                      href={`/courses/${crs.slug}`}
                      className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white text-center inline-flex items-center justify-center gap-1 transition"
                    >
                      <span>Preview Live Page</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>

                    {/* Archive / Delete Row */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => handleArchiveCourse(crs)}
                        className="text-[11px] text-slate-400 hover:text-amber-300 flex items-center gap-1 transition"
                      >
                        <Archive className="w-3 h-3" />
                        <span>Archive</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingCourse(crs)}
                        className="text-[11px] text-slate-400 hover:text-red-400 flex items-center gap-1 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>

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
