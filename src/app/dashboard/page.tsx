'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Sparkles,
  Video,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  Award,
  ExternalLink,
  ChevronRight,
  Play,
  Download,
  AlertCircle,
  Share2,
  Globe,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ViarStore } from '@/lib/store';
import {
  Course,
  Cohort,
  ScheduledClass,
  FinalTest,
  Certificate,
  TestSubmission,
  User
} from '@/lib/types';
import {
  formatInTimezone,
  getUserLocalTimezone,
  generateGoogleCalendarUrl,
} from '@/lib/timezones';

function StudentDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams?.get('error');
  const initialTab = (searchParams?.get('tab') as 'schedule' | 'recordings' | 'exam' | 'certificate') || 'schedule';
  const justEnrolled = searchParams?.get('enrolled') === 'true';

  const [activeTab, setActiveTab] = useState<'schedule' | 'recordings' | 'exam' | 'certificate'>(initialTab);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [classes, setClasses] = useState<ScheduledClass[]>([]);
  const [finalTest, setFinalTest] = useState<FinalTest | null>(null);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [selectedClassForNotes, setSelectedClassForNotes] = useState<ScheduledClass | null>(null);
  const [userTz, setUserTz] = useState<string>('Asia/Kolkata');

  // Exam States
  const [examAnswers, setExamAnswers] = useState<Record<string, number>>({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examResult, setExamResult] = useState<TestSubmission | null>(null);
  const [isSubmittingExam, setIsSubmittingExam] = useState(false);

  const loadData = useCallback(() => {
    // Fail-Closed: If URL indicates an authorization failure, NEVER load protected data
    if (errorParam === 'unauthorized_role') {
      router.replace('/login?error=unauthorized_role');
      return;
    }

    const user = ViarStore.getCurrentUser();
    if (!user) {
      router.push('/login?returnUrl=/dashboard');
      return;
    }
    setCurrentUser(user);

    const flagship = ViarStore.getCourseBySlug('what-is-astrology');
    if (flagship) setCourse(flagship);

    const cohorts = ViarStore.getCohorts('course-what-is-astrology');
    if (cohorts.length > 0) {
      const c = cohorts[0];
      setCohort(c);
      const cls = ViarStore.getClasses(c.id);
      setClasses(cls);
      setFinalTest(ViarStore.getFinalTest(c.id));

      const cert = ViarStore.getStudentCertificate(user.id, c.id);
      if (cert) setCertificate(cert);
    }

    setUserTz(ViarStore.getTimezone() || getUserLocalTimezone());
  }, [router, errorParam]);

  useEffect(() => {
    loadData();

    const handleTzChange = () => {
      const tz = ViarStore.getTimezone();
      setUserTz(tz);
    };
    const handleRoleChange = () => {
      loadData();
    };

    window.addEventListener('timezone-changed', handleTzChange);
    window.addEventListener('user-role-changed', handleRoleChange);
    return () => {
      window.removeEventListener('timezone-changed', handleTzChange);
      window.removeEventListener('user-role-changed', handleRoleChange);
    };
  }, [loadData]);

  // Find next class
  const nextClass = classes.find((c) => c.status === 'LIVE') || classes.find((c) => c.status === 'UPCOMING') || classes[0];
  const completedClasses = classes.filter((c) => c.status === 'COMPLETED');
  const recordedClasses = classes.filter((c) => !!c.recording);

  // Exam Answer Handling
  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (examSubmitted) return;
    setExamAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmitExam = () => {
    if (!finalTest || !currentUser || !cohort) return;
    setIsSubmittingExam(true);

    setTimeout(() => {
      const { submission, certificate: newCert } = ViarStore.submitFinalTest({
        cohortId: cohort.id,
        studentId: currentUser.id,
        studentName: currentUser.name,
        studentEmail: currentUser.email,
        answers: examAnswers,
      });

      setExamResult(submission);
      setExamSubmitted(true);
      setIsSubmittingExam(false);

      if (newCert) {
        setCertificate(newCert);
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });

        // Trigger certificate issuance transactional email
        fetch('/api/certificates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentName: newCert.studentName,
            studentEmail: newCert.studentEmail,
            courseTitle: newCert.courseTitle,
            grade: newCert.grade,
            scorePercentage: newCert.scorePercentage,
            certificateCode: newCert.verificationCode,
            cohortId: cohort.id,
          }),
        }).catch((err) => console.error('Certificate email dispatch error:', err));
      }
    }, 1000);
  };

  // Fail-Closed Guard: If authorization failed, NEVER render protected dashboard content
  if (errorParam === 'unauthorized_role') {
    return (
      <div className="cosmic-bg min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full cosmic-card p-8 rounded-3xl border border-red-500/30 text-center shadow-2xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-white">Access Denied</h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            You do not have the required authorization or role to access this section.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            <Link
              href="/"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition"
            >
              Return Home
            </Link>
            <Link
              href="/login"
              className="gold-button px-4 py-2 rounded-xl text-xs font-bold transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cosmic-bg min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Welcome & Just Enrolled Banner */}
        {justEnrolled && (
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-emerald-900/60 to-emerald-950/80 border border-emerald-500/40 shadow-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Welcome to Cohort 01, {currentUser?.name}!
                </h3>
                <p className="text-xs sm:text-sm text-emerald-200">
                  Your enrollment is confirmed. Live class links, timezone schedule, and course materials are all ready below.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">
                Student Learning Portal
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400 font-mono">
                {currentUser?.email}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              {course?.title || 'What is Astrology: Foundational Immersion'}
            </h1>
            <p className="text-xs text-amber-300 mt-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>
                Schedule displayed in your local timezone: <strong>{userTz}</strong> (Change anytime in top navigation)
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href={`/dashboard/courses/${cohort?.id || 'cohort-wia-batch-1'}`}
              className="gold-button px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>All 18 Classes & Replays</span>
            </Link>
            <Link
              href="/dashboard/certificates"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Certificates</span>
            </Link>
            <Link
              href="/dashboard/payments"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition"
            >
              Receipts
            </Link>
          </div>
        </div>

        {/* Hero Next Live Class Card */}
        {nextClass && (
          <div className="mb-10 bg-gradient-to-r from-[#141b2d] via-[#101726] to-[#0c111d] rounded-2xl border border-amber-500/40 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    {nextClass.status === 'LIVE' ? 'Class In Session / Starting Now' : 'Upcoming Live Session'}
                  </span>
                  <span className="text-xs text-slate-400">• Class {nextClass.classNumber} of 18</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white mb-2">
                  {nextClass.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mb-4">
                  {nextClass.description}
                </p>

                {/* Time in local timezone */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      Local Time: <strong className="text-white">{formatInTimezone(nextClass.scheduledStartTime, userTz, 'short')}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                    <Video className="w-3.5 h-3.5 text-amber-400" />
                    <span>Platform: <strong>{nextClass.meetingPlatform}</strong></span>
                  </div>
                  {nextClass.passcode && (
                    <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                      <span>Passcode: <strong className="font-mono text-amber-300">{nextClass.passcode}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                <a
                  href={nextClass.joinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gold-button px-6 py-3.5 rounded-xl text-center text-sm font-bold shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  <Video className="w-4 h-4" />
                  <span>Join Live on {nextClass.meetingPlatform}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <a
                  href={generateGoogleCalendarUrl(
                    `Viar.in: Class ${nextClass.classNumber} - ${nextClass.title}`,
                    nextClass.description,
                    nextClass.joinUrl,
                    nextClass.scheduledStartTime,
                    nextClass.durationMinutes
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 text-center transition flex items-center justify-center gap-2"
                >
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Add to Google Calendar</span>
                </a>
              </div>

            </div>
          </div>
        )}

        {/* Attendance Policy Notice (No Attendance-Gate per Business Model) */}
        <div className="mb-8 p-4 rounded-xl bg-white/[0.02] border border-white/10 flex items-start gap-3 text-xs text-slate-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p>
            <strong className="text-white">Zero Attendance Penalty:</strong> Watching recordings counts identically to attending live. Your completion and certificate are unlocked exclusively by scoring 70%+ on the <strong>Final Certification Exam</strong>.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition shrink-0 flex items-center gap-2 ${
              activeTab === 'schedule'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Class Schedule (18 Classes)</span>
          </button>

          <button
            onClick={() => setActiveTab('recordings')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition shrink-0 flex items-center gap-2 ${
              activeTab === 'recordings'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>HD Recordings & Notes ({recordedClasses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('exam')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition shrink-0 flex items-center gap-2 ${
              activeTab === 'exam'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Final Certification Exam</span>
            {examSubmitted && (
              <span className="ml-1 text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                Completed
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('certificate')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition shrink-0 flex items-center gap-2 ${
              activeTab === 'certificate'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>My Certificate</span>
          </button>
        </div>

        {/* TAB 1: SCHEDULE */}
        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-slate-400">
                Displaying all 18 classes in <strong className="text-white">{userTz}</strong>.
              </p>
              <span className="text-xs text-amber-300">
                {completedClasses.length} of 18 classes completed
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {classes.map((cls) => {
                const isCompleted = cls.status === 'COMPLETED';
                const isLive = cls.status === 'LIVE';

                return (
                  <div
                    key={cls.id}
                    className={`p-5 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isLive
                        ? 'border-amber-500/60 bg-amber-500/5'
                        : isCompleted
                        ? 'border-white/5 bg-white/[0.01]'
                        : 'border-white/10 bg-[#0c101c]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className={`text-xs font-black px-2.5 py-0.5 rounded ${
                            isLive
                              ? 'bg-amber-500 text-black'
                              : isCompleted
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-white/10 text-slate-300'
                          }`}
                        >
                          Class {cls.classNumber}
                        </span>
                        <span className="text-xs text-slate-400">Module {cls.moduleNumber}</span>
                        {isLive && (
                          <span className="text-xs font-bold text-amber-400 animate-pulse">
                            ● Live Now
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-white mb-1">
                        {cls.title}
                      </h3>
                      <p className="text-xs text-slate-400 max-w-2xl mb-2">{cls.description}</p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1 text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          {formatInTimezone(cls.scheduledStartTime, userTz, 'short')}
                        </span>
                        <span>•</span>
                        <span>{cls.durationMinutes} mins</span>
                        <span>•</span>
                        <span>Platform: {cls.meetingPlatform}</span>
                        {cls.passcode && <span>• Passcode: <span className="font-mono text-white">{cls.passcode}</span></span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {isCompleted && cls.recording ? (
                        <button
                          onClick={() => {
                            setSelectedClassForNotes(cls);
                            setActiveTab('recordings');
                          }}
                          className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-amber-300 border border-amber-500/20 flex items-center gap-1.5 transition"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Watch Recording</span>
                        </button>
                      ) : (
                        <a
                          href={cls.joinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                            isLive
                              ? 'gold-button shadow-lg shadow-amber-500/20'
                              : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                          }`}
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Link ({cls.meetingPlatform})</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: RECORDINGS & NOTES */}
        {activeTab === 'recordings' && (
          <div className="space-y-8">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Class HD Video Recordings & Reference Handouts</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Missed any live class? Access every past lecture with complete markdown study notes and slides.
                </p>
              </div>
              <span className="text-xs font-bold text-amber-400 bg-black/40 px-3 py-1.5 rounded-lg border border-amber-500/30">
                {recordedClasses.length} Sessions Available
              </span>
            </div>

            {/* Selected Class Player Modal or Section */}
            {selectedClassForNotes && selectedClassForNotes.recording && (
              <div className="cosmic-card p-6 sm:p-8 rounded-2xl border border-amber-500/40 bg-[#0b0e17] mb-8">
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Now Viewing Class {selectedClassForNotes.classNumber} Recording
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                      {selectedClassForNotes.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedClassForNotes(null)}
                    className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 border border-white/10"
                  >
                    Close Viewer
                  </button>
                </div>

                {/* Video Embed Player */}
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black/80 border border-white/10 mb-6 relative">
                  <iframe
                    src={selectedClassForNotes.recording.videoUrl}
                    title={selectedClassForNotes.title}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                </div>

                {/* Study Notes & Downloads */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-8 space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-amber-300">
                      Lecture Summary & Study Notes
                    </h4>
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {selectedClassForNotes.recording.notesMarkdown}
                    </div>

                    <div className="space-y-2">
                      <h5 className="text-xs font-bold text-white uppercase tracking-wider">Key Takeaways</h5>
                      {selectedClassForNotes.recording.keyTakeaways.map((takeaway, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{takeaway}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-4 space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                      Class Handouts
                    </h4>
                    {selectedClassForNotes.recording.resources.length > 0 ? (
                      <div className="space-y-2">
                        {selectedClassForNotes.recording.resources.map((res) => (
                          <div
                            key={res.id}
                            className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                              <span className="text-white truncate font-medium">{res.title}</span>
                            </div>
                            <button
                              onClick={() => alert(`Downloading ${res.title}`)}
                              className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[11px] font-bold flex items-center gap-1 shrink-0 ml-2"
                            >
                              <Download className="w-3 h-3" />
                              <span>{res.size || 'PDF'}</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">No additional PDF handouts for this session.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Recordings List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recordedClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="cosmic-card p-5 rounded-2xl border border-white/10 flex flex-col justify-between hover:border-amber-500/30 transition group cursor-pointer"
                  onClick={() => setSelectedClassForNotes(cls)}
                >
                  <div>
                    <div className="aspect-video w-full rounded-xl bg-[#07090e] border border-white/10 relative flex items-center justify-center mb-4 group-hover:border-amber-500/40 transition overflow-hidden">
                      <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center group-hover:scale-110 transition">
                        <Play className="w-5 h-5 ml-0.5 text-amber-400" />
                      </div>
                      <span className="absolute bottom-2 right-2 text-[10px] font-mono bg-black/80 px-2 py-0.5 rounded text-slate-300">
                        {cls.recording?.durationMinutes} mins
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-amber-400">Class {cls.classNumber}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-xs text-slate-400">Module {cls.moduleNumber}</span>
                    </div>

                    <h4 className="text-sm font-bold text-white mb-2 leading-snug">
                      {cls.title}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                      {cls.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Recorded on {cls.recording?.recordedDate}</span>
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <span>Watch</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: FINAL CERTIFICATION EXAM */}
        {activeTab === 'exam' && (
          <div className="space-y-8">
            
            {/* Exam Header */}
            <div className="cosmic-card p-6 sm:p-8 rounded-2xl border border-amber-500/30 bg-[#0d121f]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="w-5 h-5 text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                      Final Certification Examination
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white">
                    What is Astrology — Comprehensive Test
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    20 Questions • 45 Minutes • Passing threshold: 70% (14 correct answers)
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-slate-400">Questions</p>
                    <p className="text-base font-bold text-white">20</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-slate-400">Pass Score</p>
                    <p className="text-base font-bold text-amber-400">70%</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-slate-400">Answered</p>
                    <p className="text-base font-bold text-emerald-400">
                      {Object.keys(examAnswers).length} / 20
                    </p>
                  </div>
                </div>
              </div>

              {/* Exam Result Notification if already taken */}
              {examSubmitted && examResult && (
                <div
                  className={`mt-6 p-6 rounded-2xl border ${
                    examResult.isPassed
                      ? 'bg-emerald-950/60 border-emerald-500/40'
                      : 'bg-red-950/60 border-red-500/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black text-white flex items-center gap-2">
                        {examResult.isPassed ? (
                          <>
                            <Award className="w-5 h-5 text-amber-400" />
                            <span>Congratulations! You Passed with {examResult.scorePercentage}%</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-5 h-5 text-red-400" />
                            <span>Score: {examResult.scorePercentage}% — Minimum 70% Required</span>
                          </>
                        )}
                      </h3>
                      <p className="text-xs text-slate-300 mt-1">
                        You answered {examResult.score} of 20 questions correctly.
                        {examResult.isPassed
                          ? ' Your verified certificate of completion has been issued!'
                          : ' Please review the explanations below and re-test.'}
                      </p>
                    </div>

                    {examResult.isPassed && (
                      <button
                        onClick={() => setActiveTab('certificate')}
                        className="gold-button px-5 py-2.5 rounded-xl text-xs font-bold shrink-0"
                      >
                        View & Download Certificate &rarr;
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Question List */}
            {finalTest && (
              <div className="space-y-6">
                {finalTest.questions.map((q) => {
                  const selectedOption = examAnswers[q.id];
                  const isCorrect = selectedOption === q.correctOptionIndex;

                  return (
                    <div
                      key={q.id}
                      className="cosmic-card p-6 rounded-2xl border border-white/10 space-y-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                            {q.questionNumber}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            Topic: {q.topic}
                          </span>
                        </div>
                        {examSubmitted && (
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                              isCorrect
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {isCorrect ? 'Correct (+1)' : 'Incorrect'}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-white leading-relaxed">
                        {q.question}
                      </h3>

                      {/* Options */}
                      <div className="space-y-2">
                        {q.options.map((opt, optIndex) => {
                          const isSelected = selectedOption === optIndex;
                          const isTheCorrectOption = optIndex === q.correctOptionIndex;

                          let optionStyle = 'border-white/10 bg-white/[0.02] text-slate-300 hover:bg-white/5';
                          if (examSubmitted) {
                            if (isTheCorrectOption) {
                              optionStyle = 'border-emerald-500 bg-emerald-500/20 text-emerald-200 font-semibold';
                            } else if (isSelected && !isTheCorrectOption) {
                              optionStyle = 'border-red-500 bg-red-500/20 text-red-200';
                            }
                          } else if (isSelected) {
                            optionStyle = 'border-amber-500 bg-amber-500/15 text-white font-bold';
                          }

                          return (
                            <button
                              key={optIndex}
                              type="button"
                              disabled={examSubmitted}
                              onClick={() => handleSelectOption(q.id, optIndex)}
                              className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm flex items-start gap-3 transition ${optionStyle}`}
                            >
                              <span
                                className={`w-5 h-5 rounded-full border flex items-center justify-center text-[11px] shrink-0 mt-0.5 ${
                                  isSelected ? 'border-amber-400 text-amber-300 font-bold' : 'border-slate-600 text-slate-400'
                                }`}
                              >
                                {String.fromCharCode(65 + optIndex)}
                              </span>
                              <span>{opt}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation if submitted */}
                      {examSubmitted && (
                        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-slate-300">
                          <p className="font-bold text-amber-300 mb-1">Astronomical / Vedic Explanation:</p>
                          <p className="leading-relaxed">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Submit Examination Button */}
                {!examSubmitted ? (
                  <div className="p-6 rounded-2xl cosmic-card border border-amber-500/30 text-center space-y-4">
                    <p className="text-xs text-slate-400">
                      You have selected answers for{' '}
                      <strong className="text-white">{Object.keys(examAnswers).length}</strong> of 20 questions.
                    </p>
                    <button
                      onClick={handleSubmitExam}
                      disabled={isSubmittingExam}
                      className="gold-button px-8 py-4 rounded-xl font-bold text-sm shadow-xl shadow-amber-500/20 inline-flex items-center gap-2"
                    >
                      {isSubmittingExam ? (
                        <>
                          <Sparkles className="w-4 h-4 animate-spin" />
                          <span>Grading Exam & Generating Credential...</span>
                        </>
                      ) : (
                        <>
                          <Award className="w-4 h-4" />
                          <span>Submit Final Exam for Certification</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="text-center pt-4">
                    <button
                      onClick={() => {
                        setExamSubmitted(false);
                        setExamAnswers({});
                        setExamResult(null);
                      }}
                      className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-white/5 border border-white/10"
                    >
                      Reset & Retake Practice Exam
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* TAB 4: CERTIFICATE */}
        {activeTab === 'certificate' && (
          <div className="space-y-8">
            {certificate ? (
              <div className="max-w-4xl mx-auto">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-white">Your Verified Credential</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Certificate ID: <strong className="font-mono text-amber-300">{certificate.verificationCode}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/verify/${certificate.verificationCode}`}
                      target="_blank"
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 flex items-center gap-1.5 transition"
                    >
                      <Share2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Public Verification Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>

                    <button
                      onClick={() => window.print()}
                      className="gold-button px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Print / Save PDF</span>
                    </button>
                  </div>
                </div>

                {/* Authentic Certificate Template */}
                <div className="p-8 sm:p-12 rounded-3xl bg-[#090d16] border-4 border-amber-500/40 shadow-2xl relative overflow-hidden text-center">
                  
                  {/* Decorative corner borders */}
                  <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-amber-400/60"></div>
                  <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-amber-400/60"></div>
                  <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-amber-400/60"></div>
                  <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-amber-400/60"></div>

                  {/* Academy Brand Header */}
                  <div className="mb-6">
                    <div className="inline-flex items-center justify-center gap-2 mb-2">
                      <Sparkles className="w-6 h-6 text-amber-400" />
                      <span className="text-3xl font-black tracking-widest text-white">
                        VIAR<span className="text-amber-400">.IN</span> ACADEMY
                      </span>
                      <Sparkles className="w-6 h-6 text-amber-400" />
                    </div>
                    <p className="text-xs uppercase tracking-widest text-amber-300 font-semibold">
                      Affiliated with Aapka Astro (aapkaastro.com)
                    </p>
                  </div>

                  <p className="text-xs uppercase tracking-widest text-slate-400 font-medium mb-4">
                    This is to certify that
                  </p>

                  <h3 className="text-3xl sm:text-4xl font-serif font-black text-amber-300 mb-4 tracking-wide">
                    {certificate.studentName}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed mb-6">
                    has successfully completed the 18 live masterclasses, rigorous chart reading practicum, and achieved a grade of{' '}
                    <strong className="text-white">{certificate.grade} ({certificate.scorePercentage}%)</strong> in the final examination of:
                  </p>

                  <h4 className="text-xl sm:text-2xl font-black text-white mb-8 border-y border-amber-500/30 py-3 max-w-xl mx-auto">
                    {certificate.courseTitle}
                  </h4>

                  {/* Signature and Verification Footer */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-white/10 items-end max-w-2xl mx-auto text-left">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Date of Award</p>
                      <p className="text-xs font-semibold text-white">{certificate.issueDate}</p>
                    </div>

                    <div className="text-center">
                      {/* PLACEHOLDER: replace with real content */}
                      <div className="font-serif italic text-base text-amber-400 mb-1">
                        {certificate.instructorName}
                      </div>
                      <div className="w-32 h-[1px] bg-amber-500/40 mx-auto mb-1"></div>
                      <p className="text-[11px] font-bold text-white">{certificate.instructorName}</p>
                      <p className="text-[10px] text-slate-400">{certificate.instructorTitle}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Verification Hash</p>
                      <p className="text-xs font-mono font-bold text-amber-300">{certificate.verificationCode}</p>
                      <p className="text-[9px] text-slate-500">Verify at viar.in/verify</p>
                    </div>
                  </div>

                </div>

              </div>
            ) : (
              <div className="cosmic-card p-12 rounded-2xl border border-white/10 text-center max-w-xl mx-auto space-y-4">
                <Award className="w-12 h-12 text-slate-500 mx-auto" />
                <h3 className="text-lg font-bold text-white">Certificate Pending Final Exam</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your graduation certificate will be automatically issued here once you take the 20-question final exam and score 70% or higher.
                </p>
                <button
                  onClick={() => setActiveTab('exam')}
                  className="gold-button px-6 py-2.5 rounded-xl text-xs font-bold"
                >
                  Go to Final Examination Portal
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default function StudentDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="cosmic-bg min-h-screen flex items-center justify-center p-4">
          <Sparkles className="w-8 h-8 text-amber-400 animate-spin" />
        </div>
      }
    >
      <StudentDashboardContent />
    </Suspense>
  );
}
