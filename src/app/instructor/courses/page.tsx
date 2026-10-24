'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  ExternalLink,
  Trash2,
  Archive,
  Layers,
  AlertTriangle,
  Search,
  Copy,
  Globe,
  EyeOff,
  CheckCircle2,
  Lock,
  RefreshCw,
} from 'lucide-react';
import InstructorNav from '@/components/InstructorNav';
import { formatCourseStatus } from '@/lib/utils/formatters';
import { Course, User } from '@/lib/types';
import { isSiteOwner } from '@/lib/auth/permissions';

interface ExtendedCourse extends Course {
  shortDescription?: string;
  enrollmentCount?: number;
  displayOrder?: number;
  status?: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED' | 'COMING_SOON';
}

export default function InstructorCoursesPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<ExtendedCourse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'>('ALL');

  // Modal states
  const [isCreating, setIsCreating] = useState(false);
  const [deletingCourse, setDeletingCourse] = useState<ExtendedCourse | null>(null);
  const [confirmHardDelete, setConfirmHardDelete] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [togglingPublishId, setTogglingPublishId] = useState<string | null>(null);

  // Form states for Create Modal
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [priceInr, setPriceInr] = useState('5100');
  const [priceUsd, setPriceUsd] = useState('69');
  const [level, setLevel] = useState('Beginner');
  const [thumbnailUrl, setThumbnailUrl] = useState('/images/Acharya_Niraj_Kumar_Headshot.jpg');

  const [isSuccess, setIsSuccess] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/courses');
      const data = await res.json();
      if (data.success && Array.isArray(data.courses)) {
        setCourses(data.courses);
        return;
      }
    } catch (err) {
      console.warn('Failed to load courses from API:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetch('/api/users/sync')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, []);

  const isOwner = Boolean(currentUser?.isOwner || isSiteOwner(currentUser));
  const canManage = isOwner || currentUser?.role === 'ADMIN' || (Array.isArray(currentUser?.staffSections) && currentUser.staffSections.includes('courses'));

  // Filter courses by search and status
  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(searchQuery.toLowerCase());

    const cStatus = (c.status as string) || (c.isPublished ? 'PUBLISHED' : (c.isComingSoon ? 'COMING_SOON' : 'DRAFT'));
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PUBLISHED' && (cStatus === 'PUBLISHED' || cStatus === 'COMING_SOON')) ||
      (statusFilter === 'DRAFT' && cStatus === 'DRAFT') ||
      (statusFilter === 'ARCHIVED' && cStatus === 'ARCHIVED');

    return matchesSearch && matchesStatus;
  });

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const generatedSlug = slug.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          slug: generatedSlug,
          shortDescription: shortDescription.trim() || 'Practical self-paced Vedic astrology masterclass.',
          description: description.trim() || 'Comprehensive course curriculum.',
          priceInr: Number(priceInr) || 5100,
          priceUsd: Number(priceUsd) || 69,
          level,
          thumbnailUrl,
          status: 'DRAFT',
        }),
      });

      const data = await res.json();
      if (!res.ok && !data.success) {
        throw new Error(data.error || 'Failed to create course');
      }

      setIsCreating(false);
      setIsSuccess(`Course "${title}" created as a draft! Now build its modules and curriculum.`);
      await fetchCourses();
      setTimeout(() => setIsSuccess(''), 4000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateCourse = async (courseToDuplicate: ExtendedCourse) => {
    setDuplicatingId(courseToDuplicate.id);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/courses/${courseToDuplicate.slug || courseToDuplicate.id}/duplicate`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok && !data.success) {
        throw new Error(data.error || 'Failed to duplicate course');
      }

      setIsSuccess(`Course "${courseToDuplicate.title}" successfully duplicated into a new draft!`);
      await fetchCourses();
      setTimeout(() => setIsSuccess(''), 4000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Duplication failed');
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleTogglePublish = async (crs: ExtendedCourse) => {
    if (!isOwner) {
      alert('Only the Site Owner (Acharya Niraj Kumar) can publish or unpublish courses.');
      return;
    }

    const currentStatus = crs.status as string;
    const newStatus = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    setTogglingPublishId(crs.id);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/courses/${crs.slug || crs.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok && !data.success) {
        throw new Error(data.error || 'Failed to update course status');
      }

      setIsSuccess(`Course "${crs.title}" is now ${newStatus === 'PUBLISHED' ? 'Live & Published' : 'Draft / Unpublished'}!`);
      await fetchCourses();
      setTimeout(() => setIsSuccess(''), 4000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update publish status');
    } finally {
      setTogglingPublishId(null);
    }
  };

  const handleArchiveCourse = async (crs: ExtendedCourse) => {
    if (!isOwner) {
      alert('Only the Site Owner can archive courses.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/courses/${crs.slug || crs.id}?archive=true`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok && !data.success) {
        throw new Error(data.error || 'Failed to archive course');
      }

      setDeletingCourse(null);
      setIsSuccess(data.message || `Course "${crs.title}" moved to ARCHIVED status.`);
      await fetchCourses();
      setTimeout(() => setIsSuccess(''), 4000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to archive course');
    } finally {
      setLoading(false);
    }
  };

  const handleHardDeleteCourse = async (crs: ExtendedCourse) => {
    if (!isOwner) {
      alert('Only the Site Owner can permanently delete draft courses.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/courses/${crs.slug || crs.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok && !data.success) {
        throw new Error(data.error || 'Failed to delete course');
      }

      setDeletingCourse(null);
      setConfirmHardDelete(false);
      setIsSuccess(data.message || `Draft course "${crs.title}" deleted permanently.`);
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

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Course Catalog Manager
              </span>
              <span className="text-xs text-slate-400">
                {courses.length} Total Registered Masterclasses
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Courses &amp; Curriculum Control
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Create and edit self-paced masterclasses, build multi-lesson modules with on-demand video &amp; study notes, duplicate curriculum, and manage public availability.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setTitle('');
                setSlug('');
                setShortDescription('');
                setDescription('');
                setPriceInr('5100');
                setPriceUsd('69');
                setLevel('Beginner');
                setIsCreating(true);
              }}
              disabled={!canManage}
              className="gold-button px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Course</span>
            </button>

            <button
              onClick={fetchCourses}
              disabled={loading}
              className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 flex items-center gap-1.5"
              title="Refresh Catalog"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {isSuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{isSuccess}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Filters & Search Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
            {(['ALL', 'PUBLISHED', 'DRAFT', 'ARCHIVED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition capitalize ${
                  statusFilter === tab
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.toLowerCase()}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses by title or slug..."
              className="pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400 w-full sm:w-72"
            />
          </div>
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.length === 0 ? (
            <div className="col-span-full cosmic-card p-12 text-center rounded-2xl border border-white/10">
              <Layers className="w-10 h-10 text-slate-500 mx-auto mb-3 opacity-50" />
              <h3 className="text-base font-bold text-white">No courses found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                No masterclasses match your current filter or search criteria.
              </p>
            </div>
          ) : (
            filteredCourses.map((crs) => {
              const cStatus = (crs.status as string) || (crs.isPublished ? 'PUBLISHED' : (crs.isComingSoon ? 'COMING_SOON' : 'DRAFT'));
              const enrollments = crs.enrollmentCount || 0;

              return (
                <div
                  key={crs.id}
                  className="cosmic-card rounded-2xl border border-white/10 overflow-hidden flex flex-col justify-between hover:border-amber-400/40 transition duration-300"
                >
                  <div className="p-6">
                    {/* Status & Level Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                          cStatus === 'PUBLISHED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : cStatus === 'ARCHIVED'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : cStatus === 'COMING_SOON'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {formatCourseStatus(cStatus)}
                      </span>

                      <div className="flex items-center gap-2">
                        {enrollments > 0 && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/10 text-slate-300">
                            {enrollments} Scholars
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/5 text-slate-400">
                          {crs.level || 'Beginner'}
                        </span>
                      </div>
                    </div>

                    {/* Title & Tagline */}
                    <h3 className="text-lg font-bold text-white line-clamp-1">{crs.title}</h3>
                    <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                      {crs.shortDescription || crs.tagline || crs.description}
                    </p>

                    {/* Meta Info */}
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Tuition</span>
                        <span className="font-bold text-white">
                          ₹{crs.priceInr.toLocaleString()}
                          {crs.priceUsd ? ` / $${crs.priceUsd}` : ''}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 block text-[10px]">Curriculum</span>
                        <span className="font-medium text-slate-300">
                          {crs.modules?.length || crs.totalClasses || 0} Modules
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="p-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between gap-2">
                    {/* Primary Builder Button */}
                    <Link
                      href={`/instructor/courses/${crs.slug || crs.id}/builder`}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 flex items-center gap-1.5 transition"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Course Editor</span>
                    </Link>

                    <div className="flex items-center gap-1.5">
                      {/* Duplicate Button */}
                      <button
                        onClick={() => handleDuplicateCourse(crs)}
                        disabled={duplicatingId === crs.id}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition"
                        title="Duplicate Course as Draft"
                      >
                        <Copy className={`w-3.5 h-3.5 ${duplicatingId === crs.id ? 'animate-pulse' : ''}`} />
                      </button>

                      {/* Owner Publish / Unpublish Toggle */}
                      {isOwner ? (
                        <button
                          onClick={() => handleTogglePublish(crs)}
                          disabled={togglingPublishId === crs.id}
                          className={`p-1.5 rounded-lg border transition ${
                            cStatus === 'PUBLISHED'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                          }`}
                          title={cStatus === 'PUBLISHED' ? 'Unpublish to Draft (Owner)' : 'Publish to Live Catalog (Owner)'}
                        >
                          {cStatus === 'PUBLISHED' ? <Globe className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                      ) : (
                        <span className="p-1.5 text-slate-600" title="Publishing is Owner-only">
                          <Lock className="w-3.5 h-3.5" />
                        </span>
                      )}

                      {/* Public Preview Link */}
                      <Link
                        href={`/courses/${crs.slug}`}
                        target="_blank"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition"
                        title="Preview Public Landing Page"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>

                      {/* Delete / Archive Trigger */}
                      {isOwner && (
                        <button
                          onClick={() => {
                            setDeletingCourse(crs);
                            setConfirmHardDelete(false);
                          }}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition"
                          title="Delete or Archive Course"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal: Create New Course */}
        {isCreating && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-amber-500/40 max-w-xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-white mb-1">Create New Astrology Masterclass</h3>
              <p className="text-xs text-slate-400 mb-6">
                Define the high-level course overview. You will build modules, video sessions, and quizzes in the curriculum editor next.
              </p>

              <form onSubmit={handleCreateCourse} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Course Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Parashari Astrology: Complete Chart Mastery"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Short Description / Tagline (1-2 sentences)
                  </label>
                  <input
                    type="text"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="A fast-paced masterclass covering planetary yogas and predictive techniques."
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tuition Price (INR ₹)
                    </label>
                    <input
                      type="number"
                      required
                      value={priceInr}
                      onChange={(e) => setPriceInr(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      International Price (USD $)
                    </label>
                    <input
                      type="number"
                      value={priceUsd}
                      onChange={(e) => setPriceUsd(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Difficulty Level
                    </label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-[#111827] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="All Levels">All Levels</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Initial Status
                    </label>
                    <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-amber-400 text-xs font-bold">
                      DRAFT (Unpublished)
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Thumbnail Image URL
                  </label>
                  <input
                    type="text"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="/images/Acharya_Niraj_Kumar_Headshot.jpg"
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Course Description
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Comprehensive overview of outcomes, ancient texts referenced, and hands-on chart exercises..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
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
                    disabled={loading}
                    className="gold-button px-6 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Course Draft'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Delete or Archive Course (Strict Protection) */}
        {deletingCourse && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-red-500/40 max-w-lg w-full">
              <div className="flex items-center gap-3 text-red-400 mb-3">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="text-lg font-bold text-white">Course Deletion &amp; Archive Security</h3>
              </div>

              {(deletingCourse.enrollmentCount || 0) > 0 ? (
                /* Course HAS enrolled scholars: Hard delete is completely forbidden */
                <div className="space-y-4">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Course <strong className="text-white">&ldquo;{deletingCourse.title}&rdquo;</strong> has{' '}
                    <strong className="text-amber-400 font-bold">{deletingCourse.enrollmentCount} enrolled student(s)</strong>.
                  </p>
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
                    <strong>Protection Rule:</strong> Hard-deleting courses with active student enrollments is strictly prohibited to prevent data loss and preserve scholar access.
                  </div>
                  <p className="text-xs text-slate-400">
                    You can safely move this course to <strong>ARCHIVED</strong> status. It will disappear from the public catalog, but remains permanently accessible to all scholars who already purchased it.
                  </p>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setDeletingCourse(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleArchiveCourse(deletingCourse)}
                      disabled={loading}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>{loading ? 'Archiving...' : 'Archive Course Safely'}</span>
                    </button>
                  </div>
                </div>
              ) : deletingCourse.status !== 'DRAFT' ? (
                /* Course is PUBLISHED or COMING_SOON with zero enrollments: Must unpublish/archive first */
                <div className="space-y-4">
                  <p className="text-xs text-slate-300">
                    Course <strong className="text-white">&ldquo;{deletingCourse.title}&rdquo;</strong> is currently in{' '}
                    <span className="font-bold text-amber-400">{deletingCourse.status}</span> status.
                  </p>
                  <p className="text-xs text-slate-400">
                    Only draft courses can be hard-deleted. Please move it to <strong>Archive</strong> or change status to <strong>Draft</strong> first.
                  </p>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setDeletingCourse(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleArchiveCourse(deletingCourse)}
                      disabled={loading}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>{loading ? 'Archiving...' : 'Archive Course'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Zero enrollments & DRAFT: Hard delete allowed with explicit confirmation */
                <div className="space-y-4">
                  <p className="text-xs text-slate-300">
                    Course <strong className="text-white">&ldquo;{deletingCourse.title}&rdquo;</strong> is a draft with <strong className="text-emerald-400">0 enrollments</strong>.
                  </p>
                  <p className="text-xs text-red-300 font-semibold">
                    Warning: Permanently deleting this draft course will erase its modules and curriculum. This action cannot be reversed.
                  </p>

                  <label className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmHardDelete}
                      onChange={(e) => setConfirmHardDelete(e.target.checked)}
                      className="rounded accent-red-500"
                    />
                    <span>I confirm I want to permanently delete this draft course.</span>
                  </label>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        setDeletingCourse(null);
                        setConfirmHardDelete(false);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!confirmHardDelete || loading}
                      onClick={() => handleHardDeleteCourse(deletingCourse)}
                      className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-40 transition flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{loading ? 'Deleting...' : 'Delete Permanently'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
