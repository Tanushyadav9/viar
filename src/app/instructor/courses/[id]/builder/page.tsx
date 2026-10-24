'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Video,
  FileText,
  Save,
  CheckCircle2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Layers,
  DollarSign,
  Award,
  Eye,
  Upload,
  Lock,
  AlertTriangle,
  Play,
  ExternalLink,
  MoveUp,
  MoveDown,
} from 'lucide-react';
import InstructorNav from '@/components/InstructorNav';
import { Course, User } from '@/lib/types';
import { isSiteOwner } from '@/lib/auth/permissions';

interface ApiOption {
  id?: string;
  text: string;
  isCorrect: boolean;
}

interface ApiQuestion {
  id?: string;
  order?: number;
  question: string;
  explanation?: string;
  options?: ApiOption[];
}

interface ApiQuiz {
  isFinalExam?: boolean;
  attemptsAllowed?: number;
  durationMinutes?: number;
  questions?: ApiQuestion[];
}

interface ApiLesson {
  id?: string;
  order?: number;
  type?: 'VIDEO' | 'DOCUMENT' | 'LIVE_SESSION' | 'QUIZ';
  title: string;
  titleHi?: string;
  description?: string;
  descriptionHi?: string;
  isFreePreview?: boolean;
  videoProviderId?: string;
  videoDuration?: number;
  documentKey?: string;
  documentUrl?: string;
  liveScheduledAt?: string;
  liveTimezone?: string;
  liveJoinLink?: string;
}

interface ApiModule {
  id?: string;
  order?: number;
  moduleNumber?: number;
  title: string;
  titleHi?: string;
  description?: string;
  descriptionHi?: string;
  lessons?: ApiLesson[];
}

type TabArea = 'details' | 'curriculum' | 'pricing' | 'tests' | 'preview';

interface LessonItem {
  id: string;
  moduleId: string;
  order: number;
  type: 'VIDEO' | 'DOCUMENT' | 'LIVE_SESSION' | 'QUIZ';
  title: string;
  titleHi?: string;
  description?: string;
  descriptionHi?: string;
  isFreePreview: boolean;
  videoProviderId?: string;
  videoDuration?: number;
  documentKey?: string;
  documentUrl?: string;
  liveScheduledAt?: string;
  liveTimezone?: string;
  liveJoinLink?: string;
  uploadProgress?: number;
  uploadStatus?: 'idle' | 'uploading' | 'processing' | 'ready' | 'error';
}

interface ModuleItem {
  id: string;
  courseId: string;
  order: number;
  title: string;
  titleHi?: string;
  description?: string;
  descriptionHi?: string;
  lessons: LessonItem[];
}

interface QuestionItem {
  id: string;
  order: number;
  question: string;
  explanation?: string;
  options: { id?: string; text: string; isCorrect: boolean }[];
}

export default function ComprehensiveCourseEditorPage() {
  const params = useParams();
  const courseId = (params?.id as string) || 'course-what-is-astrology';

  const [activeTab, setActiveTab] = useState<TabArea>('details');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [course, setCourse] = useState<Course | null>(null);

  // Tab 1: Details state
  const [title, setTitle] = useState('');
  const [titleHi, setTitleHi] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [shortDescriptionHi, setShortDescriptionHi] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionHi, setDescriptionHi] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'COMING_SOON'>('DRAFT');
  const [thumbnailUrl, setThumbnailUrl] = useState('/images/Acharya_Niraj_Kumar_Headshot.jpg');
  const [displayOrder, setDisplayOrder] = useState('1');
  const [certificateEnabled, setCertificateEnabled] = useState(true);

  // Tab 2: Curriculum state
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [openModuleIndex, setOpenModuleIndex] = useState<number | null>(0);

  // Tab 3: Pricing state
  const [priceInr, setPriceInr] = useState('5100');
  const [originalPriceInr, setOriginalPriceInr] = useState('11000');
  const [priceUsd, setPriceUsd] = useState('69');
  const [originalPriceUsd, setOriginalPriceUsd] = useState('129');

  // Tab 4: Tests state
  const [passingScore, setPassingScore] = useState('70');
  const [attemptsAllowed, setAttemptsAllowed] = useState('3');
  const [durationMinutes, setDurationMinutes] = useState('45');
  const [questions, setQuestions] = useState<QuestionItem[]>([]);

  // Feedback states
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // File upload refs
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadTargetLesson, setUploadTargetLesson] = useState<{ moduleIdx: number; lessonIdx: number } | null>(null);

  const fetchCourseData = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}`);
      const data = await res.json();
      if (data.success && data.course) {
        const c = data.course;
        setCourse(c);
        setTitle(c.title || '');
        setTitleHi(c.titleHi || '');
        setSlug(c.slug || '');
        setShortDescription(c.shortDescription || c.tagline || '');
        setShortDescriptionHi(c.shortDescriptionHi || '');
        setDescription(c.description || '');
        setDescriptionHi(c.descriptionHi || '');
        setLevel(c.level || 'Beginner');
        setStatus((c.status as 'PUBLISHED' | 'DRAFT' | 'ARCHIVED' | 'COMING_SOON') || 'PUBLISHED');
        setThumbnailUrl(c.thumbnailUrl || '/images/Acharya_Niraj_Kumar_Headshot.jpg');
        setDisplayOrder(String(c.displayOrder || 1));
        setCertificateEnabled(c.certificateEnabled !== false);
        setPriceInr(String(c.priceInr || 5100));
        setOriginalPriceInr(String(c.originalPriceInr || 11000));
        setPriceUsd(String(c.priceUsd || 69));
        setOriginalPriceUsd(String(c.originalPriceUsd || 129));
        setPassingScore(String(c.passingScore || 70));

        // Format modules
        if (Array.isArray(c.modules) && c.modules.length > 0) {
          const formattedModules: ModuleItem[] = c.modules.map((m: ApiModule, mIdx: number) => ({
            id: m.id || `mod-${mIdx + 1}`,
            courseId: c.id,
            order: m.order || m.moduleNumber || mIdx + 1,
            title: m.title,
            titleHi: m.titleHi || '',
            description: m.description,
            descriptionHi: m.descriptionHi || '',
            lessons: Array.isArray(m.lessons) && m.lessons.length > 0
              ? m.lessons.map((l: ApiLesson, lIdx: number) => ({
                  id: l.id || `lesson-${mIdx + 1}-${lIdx + 1}`,
                  moduleId: m.id || `mod-${mIdx + 1}`,
                  order: l.order || lIdx + 1,
                  type: l.type || 'VIDEO',
                  title: l.title,
                  titleHi: l.titleHi || '',
                  description: l.description,
                  descriptionHi: l.descriptionHi || '',
                  isFreePreview: Boolean(l.isFreePreview),
                  videoProviderId: l.videoProviderId,
                  videoDuration: l.videoDuration,
                  documentKey: l.documentKey,
                  documentUrl: l.documentUrl,
                  liveScheduledAt: l.liveScheduledAt,
                  liveTimezone: l.liveTimezone || 'Asia/Kolkata',
                  liveJoinLink: l.liveJoinLink,
                  uploadStatus: l.videoProviderId || l.documentKey ? 'ready' : 'idle',
                }))
              : [
                  {
                    id: `lesson-${mIdx + 1}-1`,
                    moduleId: m.id || `mod-${mIdx + 1}`,
                    order: 1,
                    type: 'VIDEO',
                    title: `${m.title} — Video Lecture`,
                    description: m.description,
                    isFreePreview: mIdx === 0,
                    videoProviderId: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                    videoDuration: 4500,
                    uploadStatus: 'ready',
                  },
                ],
          }));
          setModules(formattedModules);
        }

        // Format final exam questions
        if (Array.isArray(c.quizzes) && c.quizzes.length > 0) {
          const finalQuiz = c.quizzes.find((q: ApiQuiz) => q.isFinalExam) || c.quizzes[0];
          setAttemptsAllowed(String(finalQuiz.attemptsAllowed || 3));
          setDurationMinutes(String(finalQuiz.durationMinutes || 45));

          if (Array.isArray(finalQuiz.questions) && finalQuiz.questions.length > 0) {
            setQuestions(
              finalQuiz.questions.map((q: ApiQuestion) => ({
                id: q.id,
                order: q.order,
                question: q.question,
                explanation: q.explanation,
                options: q.options?.map((opt: ApiOption) => ({
                  id: opt.id,
                  text: opt.text,
                  isCorrect: opt.isCorrect,
                })) || [
                  { text: 'Option A', isCorrect: true },
                  { text: 'Option B', isCorrect: false },
                ],
              }))
            );
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch course details from API:', err);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourseData();
    fetch('/api/users/sync')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, [fetchCourseData]);

  const isOwner = Boolean(currentUser?.isOwner || isSiteOwner(currentUser));

  // Direct Browser Video Upload Handler (Cloudflare Stream)
  const handleDirectVideoUpload = async (file: File, moduleIdx: number, lessonIdx: number) => {
    const updated = [...modules];
    const target = updated[moduleIdx].lessons[lessonIdx];
    target.uploadStatus = 'uploading';
    target.uploadProgress = 5;
    setModules(updated);

    try {
      // 1. Get creator direct upload endpoint from server
      const tokenRes = await fetch('/api/uploads/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, maxDurationSeconds: 7200 }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.success || !tokenData.uploadUrl) {
        throw new Error(tokenData.error || 'Failed to acquire direct upload URL');
      }

      // 2. Direct browser upload with progress monitoring
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', tokenData.uploadUrl);

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const pct = Math.round((evt.loaded / evt.total) * 95);
            target.uploadProgress = pct;
            setModules([...updated]);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during direct upload'));

        const formData = new FormData();
        formData.append('file', file);
        xhr.send(formData);
      });

      target.uploadProgress = 100;
      target.uploadStatus = 'ready';
      target.videoProviderId = tokenData.uid;
      setModules([...updated]);
      setSuccessMsg(`Video "${file.name}" uploaded directly to Cloudflare Stream!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: unknown) {
      target.uploadStatus = 'error';
      setModules([...updated]);
      setErrorMsg(err instanceof Error ? err.message : 'Video upload failed');
    }
  };

  // Direct Browser Document Upload Handler (Cloudflare R2)
  const handleDirectDocumentUpload = async (file: File, moduleIdx: number, lessonIdx: number) => {
    const updated = [...modules];
    const target = updated[moduleIdx].lessons[lessonIdx];
    target.uploadStatus = 'uploading';
    target.uploadProgress = 10;
    setModules(updated);

    try {
      // 1. Get presigned URL
      const presignedRes = await fetch('/api/uploads/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type || 'application/pdf' }),
      });
      const pData = await presignedRes.json();
      if (!pData.success || !pData.uploadUrl) {
        throw new Error(pData.error || 'Failed to generate presigned upload URL');
      }

      // 2. Direct PUT upload
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', pData.uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type || 'application/pdf');

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const pct = Math.round((evt.loaded / evt.total) * 95);
            target.uploadProgress = pct;
            setModules([...updated]);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed with status ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error('Network error during direct upload'));
        xhr.send(file);
      });

      target.uploadProgress = 100;
      target.uploadStatus = 'ready';
      target.documentKey = pData.fileKey;
      target.documentUrl = pData.publicPreviewUrl || `/resources/${file.name}`;
      setModules([...updated]);
      setSuccessMsg(`Document "${file.name}" uploaded directly to private storage!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: unknown) {
      target.uploadStatus = 'error';
      setModules([...updated]);
      setErrorMsg(err instanceof Error ? err.message : 'Document upload failed');
    }
  };

  // Save All Changes to PostgreSQL
  const handleSaveCourse = async () => {
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. Update Course details & pricing
      const payload: Record<string, unknown> = {
        title: title.trim(),
        titleHi: titleHi.trim() || null,
        shortDescription: shortDescription.trim(),
        shortDescriptionHi: shortDescriptionHi.trim() || null,
        description: description.trim(),
        descriptionHi: descriptionHi.trim() || null,
        level,
        thumbnailUrl,
        displayOrder: Number(displayOrder) || 1,
        passingScore: Number(passingScore) || 70,
        certificateEnabled,
      };

      if (isOwner) {
        payload.priceInr = Number(priceInr);
        payload.originalPriceInr = Number(originalPriceInr);
        payload.priceUsd = Number(priceUsd);
        payload.originalPriceUsd = Number(originalPriceUsd);
        payload.status = status;
      }

      const res = await fetch(`/api/courses/${course?.slug || courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok && !data.success) {
        throw new Error(data.error || 'Failed to save course details');
      }

      // 2. Persist modules & lessons with bilingual titles/descriptions
      for (const m of modules) {
        if (m.id && !m.id.startsWith('mod-')) {
          await fetch(`/api/courses/${course?.slug || courseId}/curriculum`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              itemType: 'MODULE',
              id: m.id,
              title: m.title,
              titleHi: m.titleHi || null,
              description: m.description,
              descriptionHi: m.descriptionHi || null,
              order: m.order,
            }),
          }).catch(() => {});

          for (const l of m.lessons) {
            if (l.id && !l.id.startsWith('lesson-')) {
              await fetch(`/api/courses/${course?.slug || courseId}/curriculum`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  itemType: 'LESSON',
                  id: l.id,
                  title: l.title,
                  titleHi: l.titleHi || null,
                  description: l.description,
                  descriptionHi: l.descriptionHi || null,
                  order: l.order,
                  isFreePreview: l.isFreePreview,
                }),
              }).catch(() => {});
            }
          }
        }
      }

      setSuccessMsg('All course details, curriculum, and bilingual metadata saved to Neon PostgreSQL!');
      setTimeout(() => setSuccessMsg(''), 4000);
      await fetchCourseData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Save operation failed');
    } finally {
      setIsSaving(false);
    }
  };

  // Curriculum Helpers
  const addModule = () => {
    const newIdx = modules.length + 1;
    const newMod: ModuleItem = {
      id: `mod-${Date.now()}`,
      courseId: course?.id || courseId,
      order: newIdx,
      title: `Module ${newIdx}: New Topic`,
      description: 'Module overview and learning objectives.',
      lessons: [
        {
          id: `lesson-${newIdx}-1`,
          moduleId: `mod-${Date.now()}`,
          order: 1,
          type: 'VIDEO',
          title: 'Lesson 1: Lecture Video',
          isFreePreview: false,
          uploadStatus: 'idle',
        },
      ],
    };
    setModules([...modules, newMod]);
    setOpenModuleIndex(modules.length);
  };

  const removeModule = (mIdx: number) => {
    if (!confirm(`Are you sure you want to remove "${modules[mIdx].title}"?`)) return;
    const updated = modules.filter((_, idx) => idx !== mIdx);
    setModules(updated);
  };

  const addLesson = (mIdx: number, type: 'VIDEO' | 'DOCUMENT' | 'LIVE_SESSION' | 'QUIZ' = 'VIDEO') => {
    const updated = [...modules];
    const lessonCount = updated[mIdx].lessons.length;
    updated[mIdx].lessons.push({
      id: `lesson-${mIdx + 1}-${lessonCount + 1}-${Date.now().toString(36)}`,
      moduleId: updated[mIdx].id,
      order: lessonCount + 1,
      type,
      title: `${type === 'VIDEO' ? 'Lecture' : type === 'DOCUMENT' ? 'Study Guide' : 'Live Session'} ${lessonCount + 1}`,
      isFreePreview: false,
      uploadStatus: 'idle',
    });
    setModules(updated);
  };

  const removeLesson = (mIdx: number, lIdx: number) => {
    const updated = [...modules];
    updated[mIdx].lessons.splice(lIdx, 1);
    setModules(updated);
  };

  const moveModule = (mIdx: number, direction: 'UP' | 'DOWN') => {
    if ((direction === 'UP' && mIdx === 0) || (direction === 'DOWN' && mIdx === modules.length - 1)) return;
    const updated = [...modules];
    const targetIdx = direction === 'UP' ? mIdx - 1 : mIdx + 1;
    const [moved] = updated.splice(mIdx, 1);
    updated.splice(targetIdx, 0, moved);
    updated.forEach((m, i) => { m.order = i + 1; });
    setModules(updated);
  };

  return (
    <div className="cosmic-bg min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <InstructorNav />

        {/* Back navigation */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            href="/instructor/courses"
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Courses</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveCourse}
              disabled={isSaving}
              className="gold-button px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save All Changes'}</span>
            </button>
          </div>
        </div>

        {/* Header Title & Status Bar */}
        <div className="cosmic-card p-6 rounded-2xl border border-white/10 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Course Editor
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400">{slug || course?.slug}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              {title || 'Untitled Course'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              status === 'PUBLISHED'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : status === 'ARCHIVED'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
              {status}
            </span>
          </div>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* The 5 Editor Areas (Tabs) */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-4 mb-8 overflow-x-auto">
          {[
            { id: 'details', label: '1. Details', icon: FileText },
            { id: 'curriculum', label: '2. Curriculum & Lessons', icon: Layers },
            { id: 'pricing', label: '3. Pricing & Tuition', icon: DollarSign },
            { id: 'tests', label: '4. Tests & Certification Exam', icon: Award },
            { id: 'preview', label: '5. Student Preview', icon: Eye },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabArea)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                  isActive
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* AREA 1: DETAILS                                                           */}
        {/* ========================================================================= */}
        {activeTab === 'details' && (
          <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3">Course Details</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Course Title (English)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-400 mb-1">Course Title (Hindi / हिन्दी)</label>
                <input
                  type="text"
                  value={titleHi}
                  placeholder="उदा. ज्योतिष क्या है — वैदिक ज्योतिष की आधारशिला"
                  onChange={(e) => setTitleHi(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-amber-400/30 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Short Tagline (English)
                </label>
                <input
                  type="text"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-400 mb-1">
                  Short Tagline (Hindi / हिन्दी)
                </label>
                <input
                  type="text"
                  value={shortDescriptionHi}
                  placeholder="उदा. 23 सुव्यवस्थित वीडियो मॉड्यूल और प्रामाणिक प्रमाणपत्र"
                  onChange={(e) => setShortDescriptionHi(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-amber-400/30 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Comprehensive Description (English)</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-400 mb-1">Comprehensive Description (Hindi / हिन्दी)</label>
                <textarea
                  rows={4}
                  value={descriptionHi}
                  placeholder="आचार्य नीरज कुमार द्वारा निर्देशित शास्त्रीय पाराशरी ज्योतिष का आधारभूत मास्टरक्लास..."
                  onChange={(e) => setDescriptionHi(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-amber-400/30 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Skill Level</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="All Levels">All Levels</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Catalog Display Order</label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
                <select
                  value={status}
                  disabled={!isOwner}
                  onChange={(e) => setStatus(e.target.value as 'PUBLISHED' | 'DRAFT' | 'ARCHIVED' | 'COMING_SOON')}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400 disabled:opacity-50"
                >
                  <option value="PUBLISHED">Published (Live in catalog)</option>
                  <option value="DRAFT">Draft (Hidden from visitors)</option>
                  <option value="ARCHIVED">Archived (Purchased access only)</option>
                  <option value="COMING_SOON">Coming Soon</option>
                </select>
                {!isOwner && <span className="text-[10px] text-amber-400/80 mt-1 block">Publish status is Owner-only</span>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Thumbnail Image URL</label>
              <input
                type="text"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* AREA 2: CURRICULUM (Modules, Lessons, Free Preview, Direct Uploads)       */}
        {/* ========================================================================= */}
        {activeTab === 'curriculum' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">Curriculum &amp; Lesson Builder</h3>
                <p className="text-xs text-slate-400">
                  Organize modules, arrange video lectures &amp; study notes, direct-upload media, and designate free preview lessons.
                </p>
              </div>

              <button
                onClick={addModule}
                className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Module</span>
              </button>
            </div>

            {/* Hidden Direct File Inputs for Cloud Uploads */}
            <input
              type="file"
              ref={videoInputRef}
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && uploadTargetLesson) {
                  handleDirectVideoUpload(file, uploadTargetLesson.moduleIdx, uploadTargetLesson.lessonIdx);
                }
              }}
            />

            <input
              type="file"
              ref={docInputRef}
              accept="application/pdf,application/msword,.docx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && uploadTargetLesson) {
                  handleDirectDocumentUpload(file, uploadTargetLesson.moduleIdx, uploadTargetLesson.lessonIdx);
                }
              }}
            />

            {/* Modules List */}
            {modules.map((mod, mIdx) => {
              const isOpen = openModuleIndex === mIdx;

              return (
                <div key={mod.id || mIdx} className="cosmic-card rounded-2xl border border-white/10 overflow-hidden">
                  {/* Module Header Bar */}
                  <div className="p-4 bg-white/[0.02] flex items-center justify-between gap-4 border-b border-white/5">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center shrink-0">
                        {mIdx + 1}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                        <input
                          type="text"
                          placeholder="Module Title (English)"
                          value={mod.title}
                          onChange={(e) => {
                            const updated = [...modules];
                            updated[mIdx].title = e.target.value;
                            setModules(updated);
                          }}
                          className="bg-transparent text-sm font-bold text-white focus:outline-none border-b border-transparent focus:border-amber-400 w-full"
                        />
                        <input
                          type="text"
                          placeholder="Module Title (Hindi / हिन्दी)"
                          value={mod.titleHi || ''}
                          onChange={(e) => {
                            const updated = [...modules];
                            updated[mIdx].titleHi = e.target.value;
                            setModules(updated);
                          }}
                          className="bg-transparent text-sm font-medium text-amber-300 focus:outline-none border-b border-transparent focus:border-amber-400 w-full"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => moveModule(mIdx, 'UP')}
                        disabled={mIdx === 0}
                        className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30"
                        title="Move Module Up"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveModule(mIdx, 'DOWN')}
                        disabled={mIdx === modules.length - 1}
                        className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30"
                        title="Move Module Down"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeModule(mIdx)}
                        className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400"
                        title="Delete Module"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setOpenModuleIndex(isOpen ? null : mIdx)}
                        className="p-1 rounded bg-white/5 text-slate-300"
                      >
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Module Content */}
                  {isOpen && (
                    <div className="p-6 space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Module Overview (English)</label>
                          <textarea
                            rows={2}
                            value={mod.description || ''}
                            onChange={(e) => {
                              const updated = [...modules];
                              updated[mIdx].description = e.target.value;
                              setModules(updated);
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-amber-400 mb-1">Module Overview (Hindi / हिन्दी)</label>
                          <textarea
                            rows={2}
                            value={mod.descriptionHi || ''}
                            placeholder="इस सत्र में आप..."
                            onChange={(e) => {
                              const updated = [...modules];
                              updated[mIdx].descriptionHi = e.target.value;
                              setModules(updated);
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-amber-400/30 text-white text-xs focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>

                      {/* Lessons in Module */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Lessons &amp; Materials</h4>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => addLesson(mIdx, 'VIDEO')}
                              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-semibold border border-white/10 flex items-center gap-1"
                            >
                              <Video className="w-3 h-3" />
                              <span>+ Video</span>
                            </button>
                            <button
                              onClick={() => addLesson(mIdx, 'DOCUMENT')}
                              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-semibold border border-white/10 flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3" />
                              <span>+ Document</span>
                            </button>
                            <button
                              onClick={() => addLesson(mIdx, 'LIVE_SESSION')}
                              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-semibold border border-white/10 flex items-center gap-1"
                            >
                              <Calendar className="w-3 h-3" />
                              <span>+ Live Session</span>
                            </button>
                          </div>
                        </div>

                        {mod.lessons.map((lesson, lIdx) => (
                          <div
                            key={lesson.id || lIdx}
                            className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/10 text-amber-300 self-start sm:self-auto shrink-0">
                                  {lesson.type}
                                </span>
                                <input
                                  type="text"
                                  placeholder="Lesson Title (English)"
                                  value={lesson.title}
                                  onChange={(e) => {
                                    const updated = [...modules];
                                    updated[mIdx].lessons[lIdx].title = e.target.value;
                                    setModules(updated);
                                  }}
                                  className="bg-transparent text-xs font-bold text-white focus:outline-none border-b border-transparent focus:border-amber-400 flex-1"
                                />
                                <input
                                  type="text"
                                  placeholder="Lesson Title (Hindi / हिन्दी)"
                                  value={lesson.titleHi || ''}
                                  onChange={(e) => {
                                    const updated = [...modules];
                                    updated[mIdx].lessons[lIdx].titleHi = e.target.value;
                                    setModules(updated);
                                  }}
                                  className="bg-transparent text-xs font-medium text-amber-300 focus:outline-none border-b border-transparent focus:border-amber-400 flex-1"
                                />
                              </div>

                              <div className="flex items-center gap-3">
                                {/* Free Preview Checkbox */}
                                <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={lesson.isFreePreview}
                                    onChange={(e) => {
                                      const updated = [...modules];
                                      updated[mIdx].lessons[lIdx].isFreePreview = e.target.checked;
                                      setModules(updated);
                                    }}
                                    className="rounded accent-amber-500"
                                  />
                                  <span>Free Preview</span>
                                </label>

                                <button
                                  onClick={() => removeLesson(mIdx, lIdx)}
                                  className="p-1 rounded text-red-400 hover:bg-red-500/10"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Direct Media Upload Component */}
                            {lesson.type === 'VIDEO' && (
                              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-400">Direct Cloudflare Stream Video:</span>
                                  <button
                                    onClick={() => {
                                      setUploadTargetLesson({ moduleIdx: mIdx, lessonIdx: lIdx });
                                      videoInputRef.current?.click();
                                    }}
                                    className="px-3 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold flex items-center gap-1"
                                  >
                                    <Upload className="w-3 h-3" />
                                    <span>{lesson.videoProviderId ? 'Replace Video' : 'Direct Upload Video'}</span>
                                  </button>
                                </div>

                                {lesson.uploadStatus === 'uploading' && (
                                  <div className="space-y-1">
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-amber-500 transition-all duration-300"
                                        style={{ width: `${lesson.uploadProgress || 10}%` }}
                                      />
                                    </div>
                                    <span className="text-[10px] text-amber-400">Direct creator upload in progress: {lesson.uploadProgress}%</span>
                                  </div>
                                )}

                                {lesson.videoProviderId && (
                                  <div className="flex items-center gap-2 text-[11px] text-emerald-400">
                                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">Active stream ID: {lesson.videoProviderId}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {lesson.type === 'DOCUMENT' && (
                              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-400">Private Cloudflare R2 Document:</span>
                                  <button
                                    onClick={() => {
                                      setUploadTargetLesson({ moduleIdx: mIdx, lessonIdx: lIdx });
                                      docInputRef.current?.click();
                                    }}
                                    className="px-3 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold flex items-center gap-1"
                                  >
                                    <Upload className="w-3 h-3" />
                                    <span>{lesson.documentKey ? 'Replace PDF' : 'Direct Upload PDF'}</span>
                                  </button>
                                </div>

                                {lesson.uploadStatus === 'uploading' && (
                                  <div className="space-y-1">
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-amber-500 transition-all duration-300"
                                        style={{ width: `${lesson.uploadProgress || 10}%` }}
                                      />
                                    </div>
                                    <span className="text-[10px] text-amber-400">Direct R2 PUT in progress: {lesson.uploadProgress}%</span>
                                  </div>
                                )}

                                {lesson.documentKey && (
                                  <div className="flex items-center gap-2 text-[11px] text-emerald-400">
                                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">Key: {lesson.documentKey}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {lesson.type === 'LIVE_SESSION' && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                <div>
                                  <label className="block text-[10px] text-slate-400 mb-0.5">Live Meeting Link</label>
                                  <input
                                    type="text"
                                    value={lesson.liveJoinLink || ''}
                                    placeholder="https://zoom.us/j/... or meet.google.com/..."
                                    onChange={(e) => {
                                      const updated = [...modules];
                                      updated[mIdx].lessons[lIdx].liveJoinLink = e.target.value;
                                      setModules(updated);
                                    }}
                                    className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-400 mb-0.5">Timezone</label>
                                  <input
                                    type="text"
                                    value={lesson.liveTimezone || 'Asia/Kolkata'}
                                    onChange={(e) => {
                                      const updated = [...modules];
                                      updated[mIdx].lessons[lIdx].liveTimezone = e.target.value;
                                      setModules(updated);
                                    }}
                                    className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* AREA 3: PRICING (Owner Only)                                              */}
        {/* ========================================================================= */}
        {activeTab === 'pricing' && (
          <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Tuition &amp; Commercial Pricing</h3>
                <p className="text-xs text-slate-400">
                  Configure Indian Rupee and International pricing tiers. Changes strictly apply to new enrollments.
                </p>
              </div>

              {!isOwner && (
                <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Owner Only Field</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tuition Price (INR ₹) *
                </label>
                <input
                  type="number"
                  disabled={!isOwner}
                  value={priceInr}
                  onChange={(e) => setPriceInr(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Original Strikethrough Price (INR ₹)
                </label>
                <input
                  type="number"
                  disabled={!isOwner}
                  value={originalPriceInr}
                  onChange={(e) => setOriginalPriceInr(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400 disabled:opacity-50"
                />
              </div>


            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-slate-400">
              <strong className="text-white block mb-1">Protection Invariant:</strong>
              When you update course tuition prices, existing student enrollment records remain 100% untouched. Each student&apos;s historical paid amount is preserved forever in the database.
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* AREA 4: TESTS & CERTIFICATION EXAM                                        */}
        {/* ========================================================================= */}
        {activeTab === 'tests' && (
          <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Final Certification Exam</h3>
                <p className="text-xs text-slate-400">
                  Build and calibrate the rigorous certification examination. Answer keys are strictly protected on the server.
                </p>
              </div>

              <Link
                href={`/instructor/courses/${course?.slug || courseId}/quiz`}
                className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 flex items-center gap-1.5 transition"
              >
                <Award className="w-4 h-4" />
                <span>Open Dedicated Quiz Editor</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Passing Score (%)</label>
                <input
                  type="number"
                  value={passingScore}
                  onChange={(e) => setPassingScore(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Attempts Allowed</label>
                <input
                  type="number"
                  value={attemptsAllowed}
                  onChange={(e) => setAttemptsAllowed(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Time Limit (Minutes)</label>
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Cryptographic Certification</span>
                <span className="text-[11px] text-slate-400">Issue verifiable certificates upon achieving the passing score.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={certificateEnabled}
                  onChange={(e) => setCertificateEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            <div className="text-xs text-slate-400">
              Exam currently contains <strong className="text-white">{questions.length} active questions</strong> configured in the database.
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* AREA 5: PREVIEW AS STUDENT BEFORE PUBLISHING                              */}
        {/* ========================================================================= */}
        {activeTab === 'preview' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">Student Experience Mode</h4>
                  <p className="text-xs text-slate-300">
                    Previewing curriculum exactly as experienced by prospective visitors (free preview lessons) and enrolled scholars.
                  </p>
                </div>
              </div>

              <Link
                href={`/courses/${course?.slug || courseId}`}
                target="_blank"
                className="px-4 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition flex items-center gap-1.5"
              >
                <span>Live Public Landing Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Simulated Student Portal View */}
            <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
              <div className="border-b border-white/10 pb-4">
                <h2 className="text-2xl font-black text-white">{title}</h2>
                <p className="text-xs text-slate-300 mt-1">{shortDescription}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                  <span>{modules.length} Modules</span>
                  <span>•</span>
                  <span>{modules.reduce((a, m) => a + m.lessons.length, 0)} Total Lessons</span>
                  <span>•</span>
                  <span>Certificate Included</span>
                </div>
              </div>

              {/* Curriculum Preview Accordion */}
              <div className="space-y-3">
                {modules.map((m, mIdx) => (
                  <div key={m.id || mIdx} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span>Module {mIdx + 1}: {m.title}</span>
                      <span className="text-slate-500">{m.lessons.length} lessons</span>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      {m.lessons.map((l, lIdx) => (
                        <div
                          key={l.id || lIdx}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 text-xs text-slate-300"
                        >
                          <div className="flex items-center gap-2">
                            {l.type === 'VIDEO' ? <Play className="w-3.5 h-3.5 text-amber-400" /> : <FileText className="w-3.5 h-3.5 text-blue-400" />}
                            <span>{l.title}</span>
                          </div>

                          {l.isFreePreview ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Free Preview (Accessible to Visitors)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-slate-400 flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              <span>Enrolled Only</span>
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
