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
  Search,
  ShieldCheck,
  Lock,
  Trash2,
  Sparkles,
  FileText,
  Check,
  X,
} from 'lucide-react';
import { ViarStore } from '@/lib/store';
import {
  ScheduledClass,
  Cohort,
  Course,
  Enrollment,
  Certificate,
  User,
  AdminSection,
} from '@/lib/types';
import {
  isSiteOwner,
  hasSectionPermission,
  getUserAllowedSections,
  ADMIN_SECTIONS,
  ADMIN_SECTIONS_META,
} from '@/lib/auth/permissions';
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<AdminSection>('SCHEDULE');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [classes, setClasses] = useState<ScheduledClass[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
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

  // Add Staff Member Modal
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffSections, setNewStaffSections] = useState<AdminSection[]>(['CONTENT']);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  const loadAdminData = React.useCallback(() => {
    setStats(ViarStore.getAdminStats());
    setCohorts(ViarStore.getCohorts());
    setCourses(ViarStore.getCourses());
    setClasses(ViarStore.getClasses(selectedCohortId));
    setEnrollments(ViarStore.getEnrollments());
    setCertificates(ViarStore.getCertificates());
    setCurrentUser(ViarStore.getCurrentUser());
    setStaffUsers(ViarStore.getStaffUsers());
  }, [selectedCohortId]);

  useEffect(() => {
    loadAdminData();
    setUserTz(ViarStore.getTimezone() || getUserLocalTimezone());

    const handleTzChange = () => {
      setUserTz(ViarStore.getTimezone());
    };
    const handleRoleChange = () => {
      loadAdminData();
    };

    window.addEventListener('timezone-changed', handleTzChange);
    window.addEventListener('user-role-changed', handleRoleChange);
    return () => {
      window.removeEventListener('timezone-changed', handleTzChange);
      window.removeEventListener('user-role-changed', handleRoleChange);
    };
  }, [loadAdminData]);

  const isOwner = isSiteOwner(currentUser);
  const allowedSections = getUserAllowedSections(currentUser);
  const isCurrentTabAllowed = hasSectionPermission(currentUser, activeTab);

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
      instructor: {
        name: 'Acharya Niraj Kumar',
        title: 'Founder, Aapka Astro & Master Astrologer',
        bio: 'Leading authentic Vedic Astrology mentor with 15+ years of institutional lineage.',
        experienceYears: 15,
        studentsTaught: 5000,
        avatarUrl: '/images/Acharya_Niraj_Kumar.jpg',
        aapkaAstroUrl: 'https://aapkaastro.com',
      },
      highlights: [
        'Weekly live interactive Zoom masterclasses',
        'Direct chart critique and oral exams',
      ],
      prerequisites: ['Foundational understanding of 12 rashis and 9 grahas'],
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

  const handleToggleStaffSection = (userId: string, section: AdminSection) => {
    if (!isOwner) return;
    const staff = staffUsers.find((u) => u.id === userId);
    if (!staff) return;

    const currentSections = staff.staffSections || [];
    const updated = currentSections.includes(section)
      ? currentSections.filter((s) => s !== section)
      : [...currentSections, section];

    ViarStore.setStaffSections(userId, updated);
    loadAdminData();
  };

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !newStaffEmail) return;

    ViarStore.addStaffMember({
      name: newStaffName,
      email: newStaffEmail,
      sections: newStaffSections,
    });

    setNewStaffName('');
    setNewStaffEmail('');
    setNewStaffSections(['CONTENT']);
    setIsAddStaffOpen(false);
    loadAdminData();
  };

  const handleRemoveStaff = (userId: string) => {
    if (!isOwner) return;
    if (confirm('Revoke all admin permissions for this staff member?')) {
      ViarStore.removeStaffMember(userId);
      loadAdminData();
    }
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
        
        {/* Header with Role & Account Identification */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              {isOwner ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Site Owner & Master Astrologer
                </span>
              ) : currentUser?.staffSections && currentUser.staffSections.length > 0 ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-purple-400" />
                  Delegated Staff Member (Restricted Access)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-500/20 text-slate-300 border border-slate-500/30">
                  Student Account
                </span>
              )}
              <span className="text-slate-500">•</span>
              <span className="text-xs font-mono text-slate-300">{currentUser?.email || 'guest'}</span>
            </div>

            <h1 className="text-3xl font-black text-white">
              Viar.in Academy Management
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {isOwner
                ? 'Full administrative control over all 8 modules, class schedules, financial telemetry, and staff delegations.'
                : `Section-restricted console. You currently have access to: ${allowedSections.map((s) => ADMIN_SECTIONS_META[s]?.shortTitle).join(', ') || 'None'}.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/instructor"
              className="gold-button px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <span>Open Instructor Suite &rarr;</span>
            </Link>

            {hasSectionPermission(currentUser, 'STUDENTS') && (
              <button
                onClick={() => setIsManualEnrollOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Enroll Student</span>
              </button>
            )}

            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
            >
              Student View
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

        {/* Tab Navigation with Dynamic Permission Locks */}
        <div className="flex border-b border-white/10 mb-8 overflow-x-auto gap-1">
          {ADMIN_SECTIONS.map((sec) => {
            // Hide STAFF tab from non-owners completely
            if (sec === 'STAFF' && !isOwner) return null;

            const isAllowed = hasSectionPermission(currentUser, sec);
            const meta = ADMIN_SECTIONS_META[sec];
            const isActive = activeTab === sec;

            return (
              <button
                key={sec}
                onClick={() => setActiveTab(sec)}
                className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition shrink-0 flex items-center gap-2 ${
                  isActive
                    ? 'border-purple-400 text-purple-300'
                    : isAllowed
                    ? 'border-transparent text-slate-400 hover:text-white'
                    : 'border-transparent text-slate-500 hover:text-slate-400 opacity-60'
                }`}
              >
                {!isAllowed && <Lock className="w-3 h-3 text-amber-400/70" />}
                {sec === 'SCHEDULE' && <Calendar className="w-4 h-4" />}
                {sec === 'RECORDINGS' && <Video className="w-4 h-4" />}
                {sec === 'COURSES' && <BookOpen className="w-4 h-4" />}
                {sec === 'STUDENTS' && <Users className="w-4 h-4" />}
                {sec === 'REVENUE' && <DollarSign className="w-4 h-4" />}
                {sec === 'CERTIFICATES' && <Award className="w-4 h-4" />}
                {sec === 'CONTENT' && <FileText className="w-4 h-4" />}
                {sec === 'STAFF' && <ShieldCheck className="w-4 h-4 text-amber-400" />}

                <span>{meta.shortTitle}</span>
                {sec === 'STAFF' && (
                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-extrabold">
                    Owner
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ACCESS RESTRICTED STATE (When staff lacks permission for a clicked section) */}
        {!isCurrentTabAllowed && (
          <div className="cosmic-card p-10 rounded-2xl border border-red-500/30 bg-red-950/10 text-center max-w-xl mx-auto my-12 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Section Access Restricted</h2>
            <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
              Your staff account (<span className="text-white font-mono">{currentUser?.email}</span>) does not have permission to view or manage the <strong className="text-amber-300">{ADMIN_SECTIONS_META[activeTab]?.title}</strong> module.
            </p>
            <div className="p-3 bg-white/5 rounded-xl text-xs text-slate-400 border border-white/10 mb-6 text-left">
              <p className="font-semibold text-slate-300 mb-1">Per-Site Security Policy:</p>
              <p>Staff permissions are strictly isolated per-site and granted by the Site Owner (<span className="text-amber-300">ask@aapkaastro.com</span>). Contact Acharya Niraj Kumar to request authorization.</p>
            </div>
            {allowedSections.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                <span className="text-xs text-slate-400 self-center">Switch to authorized section:</span>
                {allowedSections.map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setActiveTab(sec)}
                    className="gold-button px-3.5 py-1.5 rounded-lg text-xs font-bold"
                  >
                    {ADMIN_SECTIONS_META[sec]?.shortTitle}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 1: SCHEDULE */}
        {isCurrentTabAllowed && activeTab === 'SCHEDULE' && (
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

        {/* TAB 2: RECORDINGS */}
        {isCurrentTabAllowed && activeTab === 'RECORDINGS' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">Lecture Recordings & Knowledge Vault</h3>
                <p className="text-xs text-slate-400">
                  Manage Cloudflare Stream, Vimeo, or YouTube recordings. Students access replays immediately.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classes.map((cls) => (
                <div key={cls.id} className="cosmic-card p-5 rounded-2xl border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300">Class {cls.classNumber}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${cls.recording ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                      {cls.recording ? 'REPLAY READY' : 'PENDING UPLOAD'}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-sm">{cls.title}</h4>
                  {cls.recording ? (
                    <div className="space-y-2 text-xs text-slate-400">
                      <p className="truncate font-mono bg-white/5 p-2 rounded-lg text-slate-300">
                        {cls.recording.videoUrl}
                      </p>
                      <p className="line-clamp-2 text-slate-400">{cls.recording.notesMarkdown || 'No study notes attached.'}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No recording uploaded yet for this session.</p>
                  )}
                  <button
                    onClick={() => handleOpenEditClass(cls)}
                    className="w-full mt-2 gold-button py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>{cls.recording ? 'Update Video Link & Notes' : 'Attach Recording'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: COURSES */}
        {isCurrentTabAllowed && activeTab === 'COURSES' && (
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

        {/* TAB 4: STUDENTS / ROSTER */}
        {isCurrentTabAllowed && activeTab === 'STUDENTS' && (
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

        {/* TAB 5: REVENUE */}
        {isCurrentTabAllowed && activeTab === 'REVENUE' && (
          <div className="space-y-6">
            <div className="cosmic-card p-6 rounded-2xl border border-white/10">
              <h3 className="text-lg font-bold text-white mb-2">Financial Breakdown & Payment Gateways</h3>
              <p className="text-xs text-slate-400 mb-6">
                Real-time tuition receipts verified against Razorpay (Domestic UPI/Cards) and Stripe (International).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Indian Rupees (Razorpay)</span>
                  <p className="text-2xl font-black text-amber-300 mt-1">₹{stats?.totalRevenueInr.toLocaleString()}</p>
                  <p className="text-[10px] text-emerald-400 mt-1">Zero platform fee loss</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">US Dollars (Stripe)</span>
                  <p className="text-2xl font-black text-emerald-300 mt-1">${stats?.totalRevenueUsd}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Global students via international cards</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Paid Enrollments</span>
                  <p className="text-2xl font-black text-purple-300 mt-1">{enrollments.filter(e => e.paymentAmount > 0).length}</p>
                  <p className="text-[10px] text-slate-400 mt-1">100% verified via webhook signatures</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: CERTIFICATES */}
        {isCurrentTabAllowed && activeTab === 'CERTIFICATES' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Official Certificate Registry</h3>
                <p className="text-xs text-slate-400">
                  Issued certificates with cryptographic verification codes. Publicly verifiable at viar.in/verify.
                </p>
              </div>
            </div>

            <div className="cosmic-card rounded-2xl border border-white/10 overflow-hidden">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-white/5 text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/10 font-bold">
                  <tr>
                    <th className="px-6 py-4">Verification Code</th>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Score & Grade</th>
                    <th className="px-6 py-4">Issued Date</th>
                    <th className="px-6 py-4">Public URL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {certificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                          {cert.verificationCode}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-white">{cert.studentName}</p>
                        <p className="text-[10px] text-slate-400">{cert.studentEmail}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-500/20 text-emerald-300">
                          {cert.scorePercentage}% • {cert.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">{cert.issueDate}</td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/verify/${cert.verificationCode}`}
                          target="_blank"
                          className="text-amber-400 hover:underline flex items-center gap-1"
                        >
                          <span>Verify</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: CONTENT & CURATION */}
        {isCurrentTabAllowed && activeTab === 'CONTENT' && (
          <div className="space-y-6">
            <div className="cosmic-card p-6 rounded-2xl border border-white/10">
              <h3 className="text-lg font-bold text-white mb-1">Marketing, FAQs & Content Curation</h3>
              <p className="text-xs text-slate-400 mb-6">
                Curate student testimonials, Instagram reel embeds, and public FAQs without changing any site code.
              </p>

              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs text-purple-200 mb-4">
                <span className="font-bold">Staff Delegation Note:</span> Staff members assigned to <strong>CONTENT</strong> can edit homepage reels, student testimonials, and blog articles without accessing tuition revenue or student personal emails.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <h4 className="font-bold text-white text-sm mb-2">Featured Instagram Reel</h4>
                  <p className="text-xs text-slate-400 mb-3">Embed URL: https://www.instagram.com/reel/C7x9V... (Aapka Astro)</p>
                  <button className="gold-button px-3 py-1.5 rounded-lg text-xs font-bold">Edit Reel Embed</button>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <h4 className="font-bold text-white text-sm mb-2">Student Reviews & Trust Indicators</h4>
                  <p className="text-xs text-slate-400 mb-3">12 published reviews • Average 4.95 / 5.0 stars</p>
                  <button className="gold-button px-3 py-1.5 rounded-lg text-xs font-bold">Manage Reviews</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: STAFF ROLES & PERMISSIONS (OWNER ONLY) */}
        {isCurrentTabAllowed && activeTab === 'STAFF' && isOwner && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">Staff Roles & Delegated Permissions</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Owner Exclusive
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Grant team members access to specific admin sections. Free Postgres-backed RBAC with zero Clerk add-on fees.
                </p>
              </div>

              <button
                onClick={() => setIsAddStaffOpen(true)}
                className="gold-button px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Staff Member</span>
              </button>
            </div>

            {/* Architectural & Cost Callout */}
            <div className="cosmic-card p-5 rounded-2xl border border-amber-500/30 bg-amber-950/10 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Zero-Cost RBAC Architecture vs Paid Clerk Organizations</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Clerk charges an expensive monthly subscription plus add-on fees for custom organization roles. We built this permission system inside your existing free Neon PostgreSQL database (<code className="text-amber-300">StaffPermission</code> table) and verified it in application code.
              </p>
              <div className="pt-2 border-t border-amber-500/20 flex flex-wrap gap-4 text-[11px] text-slate-400">
                <span>• <strong>Isolated Scope:</strong> Permissions here apply strictly to Viar.in. Staff have zero access to Aapka Astro or DOW Consulting.</span>
                <span>• <strong>Owner Anchor:</strong> Anchored to <code className="text-amber-200">ask@aapkaastro.com</code>. Cannot be overridden by employees.</span>
              </div>
            </div>

            {/* Owner Anchor Card */}
            <div className="cosmic-card p-5 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/20 to-purple-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-white text-sm">Acharya Niraj Kumar</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Supreme Owner Anchor
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-mono">ask@aapkaastro.com</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Permanent full access to all 8 modules. Sole authorized account that can delegate staff roles.
                </p>
              </div>
              <div className="shrink-0">
                <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>All Sections Unlocked</span>
                </span>
              </div>
            </div>

            {/* Staff Permissions Table */}
            <div className="cosmic-card rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">Active Staff Members ({staffUsers.filter(u => !u.isOwner).length})</h4>
                  <p className="text-[11px] text-slate-400">Toggle individual section checkboxes to grant or revoke real-time access.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-white/5 text-[10px] uppercase tracking-wider text-slate-400 border-b border-white/10 font-bold">
                    <tr>
                      <th className="px-6 py-4">Staff Member</th>
                      <th className="px-3 py-4 text-center">Schedule</th>
                      <th className="px-3 py-4 text-center">Recordings</th>
                      <th className="px-3 py-4 text-center">Courses</th>
                      <th className="px-3 py-4 text-center">Students</th>
                      <th className="px-3 py-4 text-center">Revenue</th>
                      <th className="px-3 py-4 text-center">Certificates</th>
                      <th className="px-3 py-4 text-center">Content</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {staffUsers.filter(u => !u.isOwner).length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-8 text-center text-slate-500">
                          No delegated staff members yet. Click &quot;Add Staff Member&quot; to assign your first employee.
                        </td>
                      </tr>
                    ) : (
                      staffUsers
                        .filter((u) => !u.isOwner)
                        .map((staff) => {
                          const sections = staff.staffSections || [];
                          return (
                            <tr key={staff.id} className="hover:bg-white/[0.02] transition">
                              <td className="px-6 py-4">
                                <p className="font-bold text-white">{staff.name}</p>
                                <p className="text-[11px] font-mono text-slate-400">{staff.email}</p>
                              </td>

                              {(
                                [
                                  'SCHEDULE',
                                  'RECORDINGS',
                                  'COURSES',
                                  'STUDENTS',
                                  'REVENUE',
                                  'CERTIFICATES',
                                  'CONTENT',
                                ] as AdminSection[]
                              ).map((sec) => {
                                const isChecked = sections.includes(sec);
                                return (
                                  <td key={sec} className="px-3 py-4 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleStaffSection(staff.id, sec)}
                                      className={`w-7 h-7 rounded-lg border flex items-center justify-center mx-auto transition ${
                                        isChecked
                                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                                          : 'bg-white/5 border-white/10 text-slate-600 hover:border-white/30'
                                      }`}
                                      title={`Toggle ${ADMIN_SECTIONS_META[sec]?.shortTitle}`}
                                    >
                                      {isChecked ? <Check className="w-4 h-4" /> : <X className="w-3.5 h-3.5 opacity-30" />}
                                    </button>
                                  </td>
                                );
                              })}

                              <td className="px-6 py-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStaff(staff.id)}
                                  className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition"
                                  title="Revoke All Access"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
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
        )}

        {/* ADD STAFF MEMBER MODAL */}
        {isAddStaffOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-amber-500/40 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Add Staff Member</h3>
                  <p className="text-xs text-slate-400">Grant section-restricted admin permissions for Viar.in.</p>
                </div>
                <button
                  onClick={() => setIsAddStaffOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddStaffSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Employee Full Name</label>
                  <input
                    type="text"
                    required
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    placeholder="e.g. Priya Verma"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Employee Email</label>
                  <input
                    type="email"
                    required
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    placeholder="e.g. priya.staff@viar.in"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-2 font-semibold">Select Authorized Admin Sections</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        'CONTENT',
                        'RECORDINGS',
                        'COURSES',
                        'SCHEDULE',
                        'STUDENTS',
                        'REVENUE',
                        'CERTIFICATES',
                      ] as AdminSection[]
                    ).map((sec) => {
                      const isSelected = newStaffSections.includes(sec);
                      return (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => {
                            setNewStaffSections((prev) =>
                              prev.includes(sec) ? prev.filter((s) => s !== sec) : [...prev, sec]
                            );
                          }}
                          className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                            isSelected
                              ? 'bg-purple-500/20 border-purple-500/40 text-purple-200'
                              : 'bg-white/5 border-white/10 text-slate-400'
                          }`}
                        >
                          <span className="font-semibold">{ADMIN_SECTIONS_META[sec]?.shortTitle}</span>
                          {isSelected ? (
                            <Check className="w-3.5 h-3.5 text-purple-300" />
                          ) : (
                            <span className="w-3.5 h-3.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsAddStaffOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-300 bg-white/5 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="gold-button px-5 py-2 rounded-xl font-bold"
                  >
                    Grant Staff Access
                  </button>
                </div>
              </form>
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
