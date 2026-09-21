'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Video,
  Calendar,
  Edit,
  Plus,
  Users,
  CheckCircle2,
  DollarSign,
  Award,
  BookOpen,
  Save,
  ExternalLink,
  Search
} from 'lucide-react';
import { ViarStore } from '@/lib/store';
import {
  ScheduledClass,
  Cohort,
  Course,
  Enrollment
} from '@/lib/types';
import { formatInTimezone, getUserLocalTimezone } from '@/lib/timezones';

interface AdminStats {
  totalStudents: number;
  totalRevenueInr: number;
  totalRevenueUsd: number;
  completedClasses: number;
  upcomingClasses: number;
  certificatesIssued: number;
  activeCohorts: number;
}

export default function AdminPortalPage() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'recordings' | 'roster' | 'courses'>('schedule');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [classes, setClasses] = useState<ScheduledClass[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState<string>('cohort-wia-batch-1');
  const [userTz, setUserTz] = useState<string>('Asia/Kolkata');

  // Editing Class Modal/Form State
  const [editingClass, setEditingClass] = useState<ScheduledClass | null>(null);
  const [editJoinUrl, setEditJoinUrl] = useState('');
  const [editMeetingId, setEditMeetingId] = useState('');
  const [editPasscode, setEditPasscode] = useState('');
  const [editPlatform, setEditPlatform] = useState<'ZOOM' | 'GOOGLE_MEET'>('ZOOM');
  const [editStatus, setEditStatus] = useState<'UPCOMING' | 'LIVE' | 'COMPLETED'>('UPCOMING');
  const [editVideoUrl, setEditVideoUrl] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Manual Enrollment Form Modal
  const [isManualEnrollOpen, setIsManualEnrollOpen] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');

  // New Course Modal
  const [isNewCourseOpen, setIsNewCourseOpen] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseTagline, setNewCourseTagline] = useState('');
  const [newCoursePriceInr, setNewCoursePriceInr] = useState('19999');
  const [newCoursePriceUsd, setNewCoursePriceUsd] = useState('249');
  const [newCourseWeeks, setNewCourseWeeks] = useState('8');
  const [newCourseClasses, setNewCourseClasses] = useState('16');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  const loadAdminData = React.useCallback(() => {
    setStats(ViarStore.getAdminStats());
    setCohorts(ViarStore.getCohorts());
    setCourses(ViarStore.getCourses());
    setClasses(ViarStore.getClasses(selectedCohortId));
    setEnrollments(ViarStore.getEnrollments());
  }, [selectedCohortId]);

  useEffect(() => {
    loadAdminData();
    setUserTz(ViarStore.getTimezone() || getUserLocalTimezone());

    const handleTzChange = () => {
      setUserTz(ViarStore.getTimezone());
    };
    window.addEventListener('timezone-changed', handleTzChange);
    return () => window.removeEventListener('timezone-changed', handleTzChange);
  }, [loadAdminData]);

  const handleOpenEditClass = (cls: ScheduledClass) => {
    setEditingClass(cls);
    setEditJoinUrl(cls.joinUrl);
    setEditMeetingId(cls.meetingId || '');
    setEditPasscode(cls.passcode || '');
    setEditPlatform(cls.meetingPlatform);
    setEditStatus(cls.status);
    setEditVideoUrl(cls.recording?.videoUrl || '');
    setEditNotes(cls.recording?.notesMarkdown || '');
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;

    const updates: Partial<ScheduledClass> = {
      joinUrl: editJoinUrl,
      meetingId: editMeetingId,
      passcode: editPasscode,
      meetingPlatform: editPlatform,
      status: editStatus,
    };

    if (editVideoUrl) {
      updates.recording = {
        id: editingClass.recording?.id || `rec-${editingClass.id}`,
        videoUrl: editVideoUrl,
        provider: 'YOUTUBE',
        durationMinutes: editingClass.durationMinutes,
        recordedDate: new Date().toISOString().split('T')[0],
        notesMarkdown: editNotes,
        keyTakeaways: editingClass.recording?.keyTakeaways || [
          'Detailed chart breakdown discussed in session',
          'Review notes and practice on sample Kundalis',
        ],
        resources: editingClass.recording?.resources || [],
      };
      if (editStatus === 'UPCOMING' || editStatus === 'LIVE') {
        updates.status = 'COMPLETED';
      }
    }

    ViarStore.updateClass(editingClass.id, updates);
    setEditingClass(null);
    loadAdminData();
  };

  const handleManualEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName || !manualEmail) return;

    ViarStore.createEnrollment({
      studentName: manualName,
      studentEmail: manualEmail,
      courseId: 'course-what-is-astrology',
      cohortId: selectedCohortId,
      amount: 0,
      currency: 'INR',
      paymentMethod: 'Manual Admin Grant / Scholarship',
    });

    setManualName('');
    setManualEmail('');
    setIsManualEnrollOpen(false);
    loadAdminData();
  };

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle) return;

    const slug = newCourseTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newCourse: Course = {
      id: `course-${Date.now()}`,
      slug,
      title: newCourseTitle,
      tagline: newCourseTagline || 'Advanced Vedic Jyotish Masterclass',
      subtitle: `${newCourseClasses} Classes • ${newCourseWeeks}-Week Live Cohort`,
      description: 'Comprehensive curriculum expanding the multi-course catalog of Viar.in academy.',
      level: 'Advanced',
      durationWeeks: parseInt(newCourseWeeks) || 8,
      totalClasses: parseInt(newCourseClasses) || 16,
      classesPerWeek: 2,
      priceInr: parseInt(newCoursePriceInr) || 19999,
      priceUsd: parseInt(newCoursePriceUsd) || 249,
      originalPriceInr: Math.round((parseInt(newCoursePriceInr) || 19999) * 1.5),
      originalPriceUsd: Math.round((parseInt(newCoursePriceUsd) || 249) * 1.5),
      isPublished: true,
      featured: false,
      badge: 'New Cohort',
      instructor: {
        /* PLACEHOLDER: replace with real content */
        name: 'Acharya [ASTROLOGER NAME]',
        title: 'Founder, Aapka Astro',
        bio: 'Acharya [ASTROLOGER NAME], with over [X] years of experience in Vedic astrology, Vastu Shastra, and gemstone science, trusted by a growing community of over 26,000 followers.',
        experienceYears: 15,
        studentsTaught: 4800,
        avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=400&auto=format&fit=crop',
        aapkaAstroUrl: 'https://aapkaastro.com',
      },
      highlights: [
        'Live interactive classes with clinical chart breakdowns',
        'Timezone-synced Zoom sessions & recording archives',
        'Passing final test unlocks verifiable credential',
      ],
      prerequisites: ['Foundations of Jyotish or What is Astrology course'],
      whatYouWillLearn: [
        'Advanced predictive rules',
        'Special chart yogas and combinations',
      ],
      modules: [],
      faqs: [],
    };

    ViarStore.addCourse(newCourse);
    setIsNewCourseOpen(false);
    setNewCourseTitle('');
    loadAdminData();
  };

  const filteredEnrollments = enrollments.filter(
    (e) =>
      e.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="cosmic-bg min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Admin Console
              </span>
              <span className="text-slate-500">•</span>
              {/* PLACEHOLDER: replace with real instructor name */}
              <span className="text-xs text-slate-400">Acharya [ASTROLOGER NAME]</span>
            </div>
            <h1 className="text-3xl font-black text-white mt-1">
              Viar.in Academy Management
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Manage class schedules, Zoom/Meet links, video recordings, and student enrollments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsManualEnrollOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Enroll Student Manually</span>
            </button>
            <Link
              href="/dashboard"
              className="gold-button px-4 py-2 rounded-xl text-xs font-bold"
            >
              Switch to Student View
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <div className="cosmic-card p-5 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Enrolled Students</span>
                <Users className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">{stats.totalStudents}</p>
              <p className="text-[11px] text-emerald-400 mt-1">Across 2 Active Cohorts</p>
            </div>

            <div className="cosmic-card p-5 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Revenue</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">
                ₹{stats.totalRevenueInr.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">+ ${stats.totalRevenueUsd} USD Global</p>
            </div>

            <div className="cosmic-card p-5 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Classes Conducted</span>
                <Video className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">
                {stats.completedClasses} <span className="text-sm text-slate-400 font-normal">/ 18</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">{stats.upcomingClasses} Upcoming Live Sessions</p>
            </div>

            <div className="cosmic-card p-5 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Certificates Issued</span>
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">{stats.certificatesIssued}</p>
              <p className="text-[11px] text-amber-300 mt-1">Verified via viar.in/verify</p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition shrink-0 flex items-center gap-2 ${
              activeTab === 'schedule'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Class Schedule & Zoom Links (18 Classes)</span>
          </button>

          <button
            onClick={() => setActiveTab('roster')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition shrink-0 flex items-center gap-2 ${
              activeTab === 'roster'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Student Roster & Payments ({enrollments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('courses')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition shrink-0 flex items-center gap-2 ${
              activeTab === 'courses'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Multi-Course Catalog Architecture ({courses.length})</span>
          </button>
        </div>

        {/* TAB 1: SCHEDULE & ZOOM LINKS MANAGER */}
        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <p className="text-xs text-slate-400">
                Update meeting links or record links. Students see these instantly in their dashboards.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Cohort:</span>
                <select
                  value={selectedCohortId}
                  onChange={(e) => setSelectedCohortId(e.target.value)}
                  className="bg-white/5 border border-white/10 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none"
                >
                  {cohorts.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#0f172a]">
                      {c.batchName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className="cosmic-card p-4 sm:p-5 rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black px-2 py-0.5 rounded bg-white/10 text-amber-300">
                        Class {cls.classNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          cls.status === 'LIVE'
                            ? 'bg-amber-500 text-black'
                            : cls.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-white/5 text-slate-400'
                        }`}
                      >
                        {cls.status}
                      </span>
                      <span className="text-xs text-slate-400">Module {cls.moduleNumber}</span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-white mb-1">
                      {cls.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span>{formatInTimezone(cls.scheduledStartTime, userTz, 'short')}</span>
                      <span>•</span>
                      <span>Platform: <strong className="text-white">{cls.meetingPlatform}</strong></span>
                      {cls.passcode && <span>• Passcode: <span className="font-mono text-amber-300">{cls.passcode}</span></span>}
                      {cls.recording && (
                        <span className="text-emerald-400 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Recording Attached
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenEditClass(cls)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 flex items-center gap-1.5 transition"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Link & Recording</span>
                    </button>
                    <a
                      href={cls.joinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
                      title="Test Join Link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: ROSTER & PAYMENTS */}
        {activeTab === 'roster' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search students or payments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                onClick={() => setIsManualEnrollOpen(true)}
                className="gold-button px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Student Manually</span>
              </button>
            </div>

            <div className="cosmic-card rounded-2xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-white/5 text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/10 font-bold">
                    <tr>
                      <th className="px-6 py-4">Student</th>
                      <th className="px-6 py-4">Course / Cohort</th>
                      <th className="px-6 py-4">Enrolled At</th>
                      <th className="px-6 py-4">Payment Method</th>
                      <th className="px-6 py-4">Amount Paid</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredEnrollments.map((enr) => (
                      <tr key={enr.id} className="hover:bg-white/[0.02] transition">
                        <td className="px-6 py-4">
                          <p className="font-bold text-white">{enr.studentName}</p>
                          <p className="text-[11px] text-slate-400">{enr.studentEmail}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-white font-medium">What is Astrology</p>
                          <p className="text-[10px] text-amber-400">Cohort 01 (Autumn 2026)</p>
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {new Date(enr.enrolledAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-slate-200">{enr.paymentMethod}</p>
                          <p className="text-[10px] font-mono text-slate-500">{enr.paymentId}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-white">
                            {enr.currency === 'INR' ? `₹${enr.paymentAmount.toLocaleString()}` : `$${enr.paymentAmount}`}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {enr.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MULTI-COURSE ARCHITECTURE */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Multi-Course Catalog Engine</h3>
                <p className="text-xs text-slate-400">
                  The platform is built to support infinite courses and cohorts without changing codebase.
                </p>
              </div>

              <button
                onClick={() => setIsNewCourseOpen(true)}
                className="gold-button px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Course to Catalog</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courses.map((crs) => (
                <div key={crs.id} className="cosmic-card p-6 rounded-2xl border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-300">
                      {crs.level}
                    </span>
                    <span className="text-xs text-slate-400">
                      {crs.durationWeeks} Weeks • {crs.totalClasses} Classes
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-white">{crs.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">{crs.description}</p>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400">Tuition:</span>
                      <span className="font-bold text-white ml-1">₹{crs.priceInr.toLocaleString()} / ${crs.priceUsd}</span>
                    </div>
                    <Link
                      href={`/courses/${crs.slug}`}
                      className="text-amber-400 font-bold hover:underline"
                    >
                      View Live Page &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EDIT CLASS MODAL */}
        {editingClass && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-purple-500/40 rounded-2xl p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                    Edit Class {editingClass.classNumber} Details
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">{editingClass.title}</h3>
                </div>
                <button
                  onClick={() => setEditingClass(null)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveClass} className="space-y-4 text-xs">
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Meeting Platform</label>
                    <select
                      value={editPlatform}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditPlatform(e.target.value as 'ZOOM' | 'GOOGLE_MEET')}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                    >
                      <option value="ZOOM" className="bg-[#0f172a]">Zoom</option>
                      <option value="GOOGLE_MEET" className="bg-[#0f172a]">Google Meet</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Status</label>
                    <select
                      value={editStatus}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditStatus(e.target.value as 'UPCOMING' | 'LIVE' | 'COMPLETED')}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                    >
                      <option value="UPCOMING" className="bg-[#0f172a]">Upcoming</option>
                      <option value="LIVE" className="bg-[#0f172a]">Live Now</option>
                      <option value="COMPLETED" className="bg-[#0f172a]">Completed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Live Join Link (Zoom / Meet URL)</label>
                  <input
                    type="url"
                    required
                    value={editJoinUrl}
                    onChange={(e) => setEditJoinUrl(e.target.value)}
                    placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Meeting ID</label>
                    <input
                      type="text"
                      value={editMeetingId}
                      onChange={(e) => setEditMeetingId(e.target.value)}
                      placeholder="981 4238 5102"
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Meeting Passcode</label>
                    <input
                      type="text"
                      value={editPasscode}
                      onChange={(e) => setEditPasscode(e.target.value)}
                      placeholder="VIAR2026"
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10">
                  <label className="block text-slate-300 mb-1 font-semibold">
                    Video Recording Embed URL (YouTube, Vimeo, Bunny, or Direct MP4)
                  </label>
                  <input
                    type="url"
                    value={editVideoUrl}
                    onChange={(e) => setEditVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/embed/... or https://player.vimeo.com/video/..."
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white mb-2"
                  />
                  <p className="text-[11px] text-slate-400">
                    Adding a recording URL automatically makes the recording playable on student dashboards.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Study Notes (Markdown)</label>
                  <textarea
                    rows={4}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Key principles, chart examples, and formulas discussed in this lecture..."
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                  ></textarea>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setEditingClass(null)}
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

        {/* MANUAL ENROLL MODAL */}
        {isManualEnrollOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-amber-500/40 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-1">Manual Student Enrollment</h3>
              <p className="text-xs text-slate-400 mb-6">
                Grant offline or scholarship access to Cohort 01.
              </p>

              <form onSubmit={handleManualEnroll} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Student Full Name</label>
                  <input
                    type="text"
                    required
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="e.g. Maya Iyer"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Student Email</label>
                  <input
                    type="email"
                    required
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder="e.g. maya@example.com"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsManualEnrollOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-300 bg-white/5 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="gold-button px-5 py-2 rounded-xl font-bold"
                  >
                    Grant Enrollment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* NEW COURSE MODAL */}
        {isNewCourseOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-amber-500/40 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-1">Add New Course to Viar.in</h3>
              <p className="text-xs text-slate-400 mb-6">
                Expands the multi-course catalog immediately.
              </p>

              <form onSubmit={handleCreateCourse} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Course Title</label>
                  <input
                    type="text"
                    required
                    value={newCourseTitle}
                    onChange={(e) => setNewCourseTitle(e.target.value)}
                    placeholder="e.g. Nakshatra Deep Dive & Muhurta"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Tagline</label>
                  <input
                    type="text"
                    value={newCourseTagline}
                    onChange={(e) => setNewCourseTagline(e.target.value)}
                    placeholder="e.g. Unlock the hidden secrets of the 27 lunar mansions"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Tuition (INR)</label>
                    <input
                      type="number"
                      value={newCoursePriceInr}
                      onChange={(e) => setNewCoursePriceInr(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Tuition (USD)</label>
                    <input
                      type="number"
                      value={newCoursePriceUsd}
                      onChange={(e) => setNewCoursePriceUsd(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Weeks</label>
                    <input
                      type="number"
                      value={newCourseWeeks}
                      onChange={(e) => setNewCourseWeeks(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Total Classes</label>
                    <input
                      type="number"
                      value={newCourseClasses}
                      onChange={(e) => setNewCourseClasses(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsNewCourseOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-300 bg-white/5 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="gold-button px-5 py-2 rounded-xl font-bold"
                  >
                    Create Course
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
