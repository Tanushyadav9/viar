'use client';
import AdminHelpBox from '@/components/admin/AdminHelpBox';

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
  Clock,
} from 'lucide-react';
import InstructorNav from '@/components/InstructorNav';
import { Course, User } from '@/lib/types';
import { isSiteOwner } from '@/lib/auth/permissions';
import { formatInTimezone, getUserLocalTimezone, COMMON_TIMEZONES } from '@/lib/timezones';

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
  status?: 'DRAFT' | 'PUBLISHED' | 'HIDDEN' | 'ARCHIVED';
  title: string;
  titleHi?: string;
  description?: string;
  descriptionHi?: string;
  isFreePreview?: boolean;
  videoProviderId?: string;
  videoDuration?: number;
  isExternalVideo?: boolean;
  externalVideoUrl?: string;
  documentKey?: string;
  documentUrl?: string;
  notesMarkdown?: string;
  liveScheduledAt?: string;
  liveTimezone?: string;
  durationMinutes?: number;
  liveJoinLink?: string;
  meetingPlatform?: 'GOOGLE_MEET' | 'ZOOM';
  agenda?: string;
  recordingUrl?: string;
  recordingStreamId?: string;
}

interface ApiModule {
  id?: string;
  order?: number;
  status?: 'DRAFT' | 'PUBLISHED' | 'HIDDEN' | 'ARCHIVED';
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
  status: 'DRAFT' | 'PUBLISHED' | 'HIDDEN' | 'ARCHIVED';
  title: string;
  titleHi?: string;
  description?: string;
  descriptionHi?: string;
  isFreePreview: boolean;
  videoProviderId?: string;
  videoDuration?: number;
  isExternalVideo?: boolean;
  externalVideoUrl?: string;
  documentKey?: string;
  documentUrl?: string;
  notesMarkdown?: string;
  liveScheduledAt?: string;
  liveTimezone?: string;
  durationMinutes?: number;
  liveJoinLink?: string;
  meetingPlatform?: 'GOOGLE_MEET' | 'ZOOM';
  agenda?: string;
  recordingUrl?: string;
  recordingStreamId?: string;
  uploadProgress?: number;
  uploadStatus?: 'idle' | 'uploading' | 'processing' | 'ready' | 'error';
}

interface ModuleItem {
  id: string;
  courseId: string;
  order: number;
  status: 'DRAFT' | 'PUBLISHED' | 'HIDDEN' | 'ARCHIVED';
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

interface VideoHostConfig {
  configured: boolean;
  missing: string[];
  message?: string;
  hasSubdomain?: boolean;
}

export default function ComprehensiveCourseEditorPage() {
  const params = useParams();
  const courseId = (params?.id as string) || 'course-what-is-astrology';

  const [activeTab, setActiveTab] = useState<TabArea>('details');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [userTz, setUserTz] = useState('Asia/Kolkata');

  // Video Host Configuration state
  const [videoHostConfig, setVideoHostConfig] = useState<VideoHostConfig | null>(null);

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
  const [acceptingEnrollments, setAcceptingEnrollments] = useState(false);

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

  // Autosave state
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    itemType: 'MODULE' | 'LESSON';
    id: string;
    title: string;
    mIdx: number;
    lIdx?: number;
  } | null>(null);

  // File upload refs
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadTargetLesson, setUploadTargetLesson] = useState<{ moduleIdx: number; lessonIdx: number } | null>(null);

  useEffect(() => {
    setUserTz(getUserLocalTimezone());
  }, []);

  // Fetch Video Host Config
  useEffect(() => {
    fetch('/api/admin/video-config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success) {
          setVideoHostConfig({
            configured: Boolean(data.configured),
            missing: data.missing || [],
            message: data.message,
            hasSubdomain: Boolean(data.hasSubdomain),
          });
        }
      })
      .catch(() => {});
  }, []);

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
        setAcceptingEnrollments(Boolean(c.acceptingEnrollments));
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
            order: m.order || mIdx + 1,
            status: (m.status as 'DRAFT' | 'PUBLISHED' | 'HIDDEN' | 'ARCHIVED') || 'PUBLISHED',
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
                  status: (l.status as 'DRAFT' | 'PUBLISHED' | 'HIDDEN' | 'ARCHIVED') || 'PUBLISHED',
                  title: l.title,
                  titleHi: l.titleHi || '',
                  description: l.description,
                  descriptionHi: l.descriptionHi || '',
                  isFreePreview: Boolean(l.isFreePreview),
                  videoProviderId: l.videoProviderId,
                  videoDuration: l.videoDuration,
                  isExternalVideo: Boolean(l.isExternalVideo),
                  externalVideoUrl: l.externalVideoUrl || (l.isExternalVideo ? l.videoProviderId : ''),
                  documentKey: l.documentKey,
                  documentUrl: l.documentUrl,
                  notesMarkdown: l.notesMarkdown || '',
                  liveScheduledAt: l.liveScheduledAt || '',
                  liveTimezone: l.liveTimezone || 'Asia/Kolkata',
                  durationMinutes: l.durationMinutes || 60,
                  liveJoinLink: l.liveJoinLink || '',
                  meetingPlatform: l.meetingPlatform || 'GOOGLE_MEET',
                  agenda: l.agenda || '',
                  recordingUrl: l.recordingUrl || '',
                  recordingStreamId: l.recordingStreamId || '',
                  uploadStatus: l.videoProviderId || l.documentKey ? 'ready' : 'idle',
                }))
              : [],
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
                id: q.id || `q-${Math.random().toString(36).substring(2, 7)}`,
                order: q.order || 1,
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

  // Debounced Autosave for Drafts
  const triggerAutoSave = useCallback((updatedModules: ModuleItem[]) => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setAutoSaveStatus('saving');
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        for (const m of updatedModules) {
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
                status: m.status,
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
                    type: l.type,
                    status: l.status,
                    isFreePreview: l.isFreePreview,
                    videoProviderId: l.videoProviderId,
                    videoDuration: l.videoDuration,
                    isExternalVideo: l.isExternalVideo,
                    externalVideoUrl: l.externalVideoUrl,
                    documentKey: l.documentKey,
                    documentUrl: l.documentUrl,
                    notesMarkdown: l.notesMarkdown,
                    liveScheduledAt: l.liveScheduledAt,
                    liveTimezone: l.liveTimezone,
                    durationMinutes: l.durationMinutes,
                    liveJoinLink: l.liveJoinLink,
                    meetingPlatform: l.meetingPlatform,
                    agenda: l.agenda,
                    recordingUrl: l.recordingUrl,
                  }),
                }).catch(() => {});
              }
            }
          }
        }
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 3000);
      } catch {
        setAutoSaveStatus('idle');
      }
    }, 1500);
  }, [course?.slug, courseId]);

  // Direct Browser Video Upload Handler (Cloudflare Stream)
  const handleDirectVideoUpload = async (file: File, moduleIdx: number, lessonIdx: number) => {
    const updated = [...modules];
    const target = updated[moduleIdx].lessons[lessonIdx];
    target.uploadStatus = 'uploading';
    target.uploadProgress = 5;
    setModules(updated);

    try {
      const tokenRes = await fetch('/api/uploads/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, maxDurationSeconds: 7200 }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.success || !tokenData.uploadUrl) {
        throw new Error(tokenData.error || 'Failed to acquire direct upload URL');
      }

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
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed with status ${xhr.status}`));
        };

        xhr.onerror = () => reject(new Error('Network error during direct upload'));

        const formData = new FormData();
        formData.append('file', file);
        xhr.send(formData);
      });

      target.uploadProgress = 100;
      target.uploadStatus = 'ready';
      target.videoProviderId = tokenData.uid;
      target.isExternalVideo = false;
      setModules([...updated]);
      triggerAutoSave(updated);
      setSuccessMsg(`Video "${file.name}" uploaded directly to Cloudflare Stream!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: unknown) {
      target.uploadStatus = 'error';
      setModules([...updated]);
      setErrorMsg(err instanceof Error ? err.message : 'Video upload failed');
    }
  };

  // Direct Browser Document Upload Handler (Cloudflare R2 / Storage)
  const handleDirectDocumentUpload = async (file: File, moduleIdx: number, lessonIdx: number) => {
    const updated = [...modules];
    const target = updated[moduleIdx].lessons[lessonIdx];
    target.uploadStatus = 'uploading';
    target.uploadProgress = 10;
    setModules(updated);

    try {
      const presignedRes = await fetch('/api/uploads/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type || 'application/pdf' }),
      });
      const pData = await presignedRes.json();
      if (!pData.success || !pData.uploadUrl) {
        throw new Error(pData.error || 'Failed to generate presigned upload URL');
      }

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
      triggerAutoSave(updated);
      setSuccessMsg(`Document "${file.name}" uploaded directly to private storage!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: unknown) {
      target.uploadStatus = 'error';
      setModules([...updated]);
      setErrorMsg(err instanceof Error ? err.message : 'Document upload failed');
    }
  };

  // Manual Full Save
  const handleSaveCourse = async () => {
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
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
        payload.acceptingEnrollments = acceptingEnrollments;
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

      for (const m of modules) {
        if (m.id.startsWith('mod-')) {
          const modRes = await fetch(`/api/courses/${course?.slug || courseId}/curriculum`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              itemType: 'MODULE',
              title: m.title,
              titleHi: m.titleHi || null,
              description: m.description,
              descriptionHi: m.descriptionHi || null,
              order: m.order,
              status: m.status,
            }),
          });
          const modData = await modRes.json();
          if (modData?.module?.id) {
            m.id = modData.module.id;
          }
        } else {
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
              status: m.status,
            }),
          }).catch(() => {});
        }

        for (const l of m.lessons) {
          if (l.id.startsWith('lesson-')) {
            const lRes = await fetch(`/api/courses/${course?.slug || courseId}/curriculum`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                itemType: 'LESSON',
                moduleId: m.id,
                title: l.title,
                titleHi: l.titleHi || null,
                description: l.description,
                descriptionHi: l.descriptionHi || null,
                order: l.order,
                type: l.type,
                status: l.status,
                isFreePreview: l.isFreePreview,
                videoProviderId: l.videoProviderId,
                videoDuration: l.videoDuration,
                isExternalVideo: l.isExternalVideo,
                externalVideoUrl: l.externalVideoUrl,
                documentKey: l.documentKey,
                documentUrl: l.documentUrl,
                notesMarkdown: l.notesMarkdown,
                liveScheduledAt: l.liveScheduledAt,
                liveTimezone: l.liveTimezone,
                durationMinutes: l.durationMinutes,
                liveJoinLink: l.liveJoinLink,
                meetingPlatform: l.meetingPlatform,
                agenda: l.agenda,
                recordingUrl: l.recordingUrl,
              }),
            });
            const lData = await lRes.json();
            if (lData?.lesson?.id) {
              l.id = lData.lesson.id;
            }
          } else {
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
                type: l.type,
                status: l.status,
                isFreePreview: l.isFreePreview,
                videoProviderId: l.videoProviderId,
                videoDuration: l.videoDuration,
                isExternalVideo: l.isExternalVideo,
                externalVideoUrl: l.externalVideoUrl,
                documentKey: l.documentKey,
                documentUrl: l.documentUrl,
                notesMarkdown: l.notesMarkdown,
                liveScheduledAt: l.liveScheduledAt,
                liveTimezone: l.liveTimezone,
                durationMinutes: l.durationMinutes,
                liveJoinLink: l.liveJoinLink,
                meetingPlatform: l.meetingPlatform,
                agenda: l.agenda,
                recordingUrl: l.recordingUrl,
              }),
            }).catch(() => {});
          }
        }
      }

      setSuccessMsg('All course details and curriculum saved to PostgreSQL!');
      setTimeout(() => setSuccessMsg(''), 4000);
      await fetchCourseData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Save operation failed');
    } finally {
      setIsSaving(false);
    }
  };

  // Add Module
  const addModule = () => {
    const newIdx = modules.length + 1;
    const newMod: ModuleItem = {
      id: `mod-${Date.now()}`,
      courseId: course?.id || courseId,
      order: newIdx,
      status: 'PUBLISHED',
      title: `Module ${newIdx}: New Topic`,
      description: 'Module overview and learning objectives.',
      lessons: [],
    };
    const updated = [...modules, newMod];
    setModules(updated);
    setOpenModuleIndex(modules.length);
    triggerAutoSave(updated);
  };

  // Add Lesson with 4 explicit types
  const addLesson = (mIdx: number, type: 'VIDEO' | 'DOCUMENT' | 'LIVE_SESSION' | 'QUIZ' = 'VIDEO') => {
    const updated = [...modules];
    const lessonCount = updated[mIdx].lessons.length;
    const typeLabel =
      type === 'VIDEO'
        ? 'Recorded Lecture'
        : type === 'LIVE_SESSION'
        ? 'Live Class'
        : type === 'DOCUMENT'
        ? 'Study Notes & PDF'
        : 'Lesson Assessment';

    updated[mIdx].lessons.push({
      id: `lesson-${mIdx + 1}-${lessonCount + 1}-${Date.now().toString(36)}`,
      moduleId: updated[mIdx].id,
      order: lessonCount + 1,
      type,
      status: 'PUBLISHED',
      title: `${typeLabel} ${lessonCount + 1}`,
      isFreePreview: false,
      uploadStatus: 'idle',
      liveTimezone: 'Asia/Kolkata',
      durationMinutes: type === 'LIVE_SESSION' ? 90 : 60,
      meetingPlatform: 'GOOGLE_MEET',
    });
    setModules(updated);
    triggerAutoSave(updated);
  };

  // Move Module
  const moveModule = async (mIdx: number, direction: 'UP' | 'DOWN') => {
    if ((direction === 'UP' && mIdx === 0) || (direction === 'DOWN' && mIdx === modules.length - 1)) return;
    const updated = [...modules];
    const targetIdx = direction === 'UP' ? mIdx - 1 : mIdx + 1;
    const [moved] = updated.splice(mIdx, 1);
    updated.splice(targetIdx, 0, moved);
    updated.forEach((m, i) => {
      m.order = i + 1;
    });
    setModules(updated);

    // Persist reorder to server
    const payload = updated.filter((m) => !m.id.startsWith('mod-')).map((m) => ({ id: m.id, order: m.order }));
    if (payload.length > 0) {
      await fetch(`/api/courses/${course?.slug || courseId}/curriculum/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType: 'MODULE', items: payload }),
      }).catch(() => {});
    }
  };

  // Move Lesson
  const moveLesson = async (mIdx: number, lIdx: number, direction: 'UP' | 'DOWN') => {
    const lessons = modules[mIdx].lessons;
    if ((direction === 'UP' && lIdx === 0) || (direction === 'DOWN' && lIdx === lessons.length - 1)) return;
    const updated = [...modules];
    const targetIdx = direction === 'UP' ? lIdx - 1 : lIdx + 1;
    const [moved] = updated[mIdx].lessons.splice(lIdx, 1);
    updated[mIdx].lessons.splice(targetIdx, 0, moved);
    updated[mIdx].lessons.forEach((l, i) => {
      l.order = i + 1;
    });
    setModules(updated);

    const payload = updated[mIdx].lessons
      .filter((l) => !l.id.startsWith('lesson-'))
      .map((l) => ({ id: l.id, order: l.order, moduleId: updated[mIdx].id }));
    if (payload.length > 0) {
      await fetch(`/api/courses/${course?.slug || courseId}/curriculum/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType: 'LESSON', items: payload }),
      }).catch(() => {});
    }
  };

  // Toggle Lesson Status (Draft <-> Published)
  const toggleLessonStatus = (mIdx: number, lIdx: number) => {
    const updated = [...modules];
    const currentStatus = updated[mIdx].lessons[lIdx].status;
    const newStatus = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    updated[mIdx].lessons[lIdx].status = newStatus;
    setModules(updated);
    triggerAutoSave(updated);
  };

  // Toggle Module Status (Draft <-> Published)
  const toggleModuleStatus = (mIdx: number) => {
    const updated = [...modules];
    const currentStatus = updated[mIdx].status;
    const newStatus = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    updated[mIdx].status = newStatus;
    setModules(updated);
    triggerAutoSave(updated);
  };

  // Execute Confirmed Delete (with Archive on progress invariant)
  const executeConfirmedDelete = async () => {
    if (!deleteModal) return;
    const { itemType, id, mIdx, lIdx } = deleteModal;

    // If local unsaved item, delete immediately
    if (id.startsWith('mod-') || id.startsWith('lesson-')) {
      const updated = [...modules];
      if (itemType === 'MODULE') {
        updated.splice(mIdx, 1);
      } else if (lIdx !== undefined) {
        updated[mIdx].lessons.splice(lIdx, 1);
      }
      setModules(updated);
      setDeleteModal(null);
      setSuccessMsg('Unsaved item removed.');
      setTimeout(() => setSuccessMsg(''), 3000);
      return;
    }

    try {
      const res = await fetch(
        `/api/courses/${course?.slug || courseId}/curriculum?itemType=${itemType}&id=${encodeURIComponent(id)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete curriculum item');
      }

      if (data.archived) {
        setSuccessMsg(data.message || 'Item had student progress; it was archived instead of deleted.');
      } else {
        setSuccessMsg(data.message || 'Item deleted permanently.');
      }
      setTimeout(() => setSuccessMsg(''), 5000);
      await fetchCourseData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleteModal(null);
    }
  };

  return (
    <div className="cosmic-bg min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <InstructorNav />

        {/* Navigation & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 flex items-center gap-1.5 transition shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Admin Home</span>
            </Link>

            <Link
              href="/instructor/courses"
              className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition ml-2"
            >
              <span>+ Add another course (Draft)</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {autoSaveStatus === 'saving' && (
              <span className="text-xs text-amber-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Autosaving draft...</span>
              </span>
            )}
            {autoSaveStatus === 'saved' && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Draft autosaved</span>
              </span>
            )}

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

        {/* Bilingual Guidance Box */}
        <AdminHelpBox
          titleEn="Course Content & Curriculum Editor"
          titleHi="पाठ्यक्रम सामग्री एवं पाठ्यचर्या संपादक"
          descriptionEn="Manage all real course materials. Add, edit, reorder, hide, and delete modules and lessons. Lessons with student progress are automatically archived rather than deleted. Preview your course exactly as students see it before publishing."
          descriptionHi="वास्तविक पाठ्यक्रम सामग्री का प्रबंधन करें। मॉड्यूल और पाठ जोड़ें, संपादित करें, क्रम बदलें, छिपाएं या हटाएं। छात्र प्रगति वाले पाठ हटाए जाने के बजाय स्वतः सुरक्षित रूप से संग्रहीत (archived) हो जाते हैं।"
          tipsEn={[
            'Four lesson types supported: Recorded lesson, Live class, Study Notes & PDF, and Quiz.',
            'Live classes store timezone and are shown to students in their local timezone and in IST.',
            'Direct Cloudflare Stream uploads generate protected signed playback links. External link mode requires deliberate Owner activation.',
            'Every delete requires confirmation; lessons with progress are safely archived to protect student certificates.',
          ]}
          tipsHi={[
            'चार प्रकार के पाठ समर्थित हैं: रिकॉर्डेड वीडियो, लाइव क्लास, अध्ययन नोट्स (PDF), और परीक्षा।',
            'लाइव क्लास छात्र के स्थानीय समय क्षेत्र तथा भारतीय मानक समय (IST) दोनों में प्रदर्शित होती है।',
            'हटाने से पहले हमेशा पुष्टि मांगी जाती है; प्रगति वाले पाठ सुरक्षित रूप से संग्रहीत किए जाते हैं।',
          ]}
        />

        {/* Delete Confirmation Modal */}
        {deleteModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="cosmic-card max-w-md w-full p-6 rounded-3xl border border-red-500/40 bg-[#0e1322] space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-white">Confirm Deletion</h3>
                <p className="text-xs text-slate-300">
                  Are you sure you want to delete <strong className="text-amber-300">&ldquo;{deleteModal.title}&rdquo;</strong>?
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-slate-400 leading-relaxed">
                <strong className="text-white block mb-0.5">Progress Protection Invariant:</strong>
                If any student has progress or watch history on this lesson, it will be <strong>safely archived</strong> instead of deleted, preserving student completion records and certificates.
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeConfirmedDelete}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/30 transition"
                >
                  Confirm Delete / Archive
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pre-Launch Checklist */}
        <div className="cosmic-card p-6 sm:p-7 rounded-3xl border border-amber-500/30 bg-[#0e1322]/95 mb-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Pre-Launch Checklist
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-xs text-slate-400">Enrolment Governance</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Ready to open enrolments?
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Complete these 6 verification steps before accepting student enrollments. Enrolments stay off by default for platform security.
              </p>
            </div>

            {/* Accepting Enrolments Master Toggle */}
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-4 shrink-0">
              <div>
                <span className="block text-xs font-bold text-white">Accepting Enrolments</span>
                <span className="text-[10px] text-slate-400">
                  {acceptingEnrollments ? 'Enrolments are currently OPEN' : 'Enrolments are currently OFF'}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptingEnrollments}
                  onChange={(e) => setAcceptingEnrollments(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>

          {/* The 6 Checklist Items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">
                  Lessons published ({modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0)} of {modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0)})
                </span>
                <p className="text-[11px] text-slate-400">
                  All modules and lessons saved to database.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">
                  Videos uploaded &amp; ready
                </span>
                <p className="text-[11px] text-slate-400">
                  Cloudflare Stream signed videos &amp; external media verified.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">
                  Price set (₹{Number(priceInr || 5100).toLocaleString('en-IN')})
                </span>
                <p className="text-[11px] text-slate-400">
                  One-time transparent tuition with ₹11,000 crossed out.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">
                  Test as student done
                </span>
                <p className="text-[11px] text-slate-400">
                  Verified through end-to-end checkout &amp; student portal.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">
                  Payment settings set
                </span>
                <p className="text-[11px] text-slate-400">
                  UPI ID: 9310709233m@pnb • Helpline active.
                </p>
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
              acceptingEnrollments ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                acceptingEnrollments ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {acceptingEnrollments ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="text-[10px] font-bold">6</span>}
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">
                  &ldquo;Accepting enrolments&rdquo; switched on
                </span>
                <p className={`text-[11px] ${acceptingEnrollments ? 'text-emerald-300 font-semibold' : 'text-amber-300'}`}>
                  {acceptingEnrollments ? 'Enrolments are ON (Active)' : 'Enrolments OFF by default (Click toggle to turn ON)'}
                </p>
              </div>
            </div>
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Course URL Slug</label>
                <input
                  type="text"
                  disabled
                  value={slug || course?.slug || 'what-is-astrology'}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs focus:outline-none cursor-not-allowed"
                />
              </div>

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
                <label className="block text-xs font-semibold text-slate-300 mb-1">Short Tagline (English)</label>
                <input
                  type="text"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-400 mb-1">Short Tagline (Hindi / हिन्दी)</label>
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
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* AREA 2: CURRICULUM (4 Lesson Types, Real DB Persistence, Signed Video)    */}
        {/* ========================================================================= */}
        {activeTab === 'curriculum' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">Sections &amp; Curriculum Builder</h3>
                <p className="text-xs text-slate-400">
                  Manage modules and lessons. Choose from 4 lesson types: Recorded Lecture, Live Class, Study Notes &amp; PDF, and Quiz.
                </p>
              </div>

              <button
                onClick={addModule}
                className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Section (Module)</span>
              </button>
            </div>

            {/* Hidden File Inputs */}
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
                    <div className="flex items-center gap-3 flex-1 min-w-0">
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
                            triggerAutoSave(updated);
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
                            triggerAutoSave(updated);
                          }}
                          className="bg-transparent text-sm font-medium text-amber-300 focus:outline-none border-b border-transparent focus:border-amber-400 w-full"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Module Status Toggle */}
                      <button
                        onClick={() => toggleModuleStatus(mIdx)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                          mod.status === 'PUBLISHED'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}
                        title="Click to toggle Published vs Draft"
                      >
                        {mod.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                      </button>

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
                        onClick={() => setDeleteModal({ isOpen: true, itemType: 'MODULE', id: mod.id, title: mod.title, mIdx })}
                        className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400"
                        title="Delete Section (requires confirmation)"
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
                              triggerAutoSave(updated);
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
                              triggerAutoSave(updated);
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-amber-400/30 text-white text-xs focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>

                      {/* Lessons in Module */}
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                            Lessons in Section ({mod.lessons.length})
                          </h4>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => addLesson(mIdx, 'VIDEO')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30 flex items-center gap-1"
                            >
                              <Video className="w-3 h-3" />
                              <span>+ Recorded</span>
                            </button>
                            <button
                              onClick={() => addLesson(mIdx, 'LIVE_SESSION')}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[11px] font-semibold border border-amber-500/30 flex items-center gap-1"
                            >
                              <Calendar className="w-3 h-3" />
                              <span>+ Live Class</span>
                            </button>
                            <button
                              onClick={() => addLesson(mIdx, 'DOCUMENT')}
                              className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-[11px] font-semibold border border-blue-500/30 flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3" />
                              <span>+ Notes &amp; PDF</span>
                            </button>
                            <button
                              onClick={() => addLesson(mIdx, 'QUIZ')}
                              className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-[11px] font-semibold border border-purple-500/30 flex items-center gap-1"
                            >
                              <Award className="w-3 h-3" />
                              <span>+ Quiz</span>
                            </button>
                          </div>
                        </div>

                        {mod.lessons.length === 0 ? (
                          <div className="p-6 rounded-xl bg-white/[0.02] border border-dashed border-white/10 text-center text-xs text-slate-400">
                            No lessons added to this section yet. Click one of the buttons above to add a Recorded Lecture, Live Class, Notes/PDF, or Quiz.
                          </div>
                        ) : (
                          mod.lessons.map((lesson, lIdx) => (
                            <div
                              key={lesson.id || lIdx}
                              className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-4"
                            >
                              {/* Top Bar: Type, Titles, Status, Reorder, Delete */}
                              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5">
                                <div className="flex items-center gap-2">
                                  {/* Type Switcher */}
                                  <select
                                    value={lesson.type}
                                    onChange={(e) => {
                                      const updated = [...modules];
                                      updated[mIdx].lessons[lIdx].type = e.target.value as 'VIDEO' | 'DOCUMENT' | 'LIVE_SESSION' | 'QUIZ';
                                      setModules(updated);
                                      triggerAutoSave(updated);
                                    }}
                                    className="px-2 py-1 rounded bg-[#111827] border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider text-amber-300 focus:outline-none"
                                  >
                                    <option value="VIDEO">Recorded Lesson</option>
                                    <option value="LIVE_SESSION">Live Class</option>
                                    <option value="DOCUMENT">Notes &amp; PDF</option>
                                    <option value="QUIZ">Quiz / Assessment</option>
                                  </select>

                                  {/* Draft / Published Toggle */}
                                  <button
                                    onClick={() => toggleLessonStatus(mIdx, lIdx)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                                      lesson.status === 'PUBLISHED'
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    }`}
                                    title="Click to toggle Draft vs Published"
                                  >
                                    {lesson.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                                  </button>
                                </div>

                                <div className="flex items-center gap-2">
                                  {/* Free Preview Toggle */}
                                  <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={lesson.isFreePreview}
                                      onChange={(e) => {
                                        const updated = [...modules];
                                        updated[mIdx].lessons[lIdx].isFreePreview = e.target.checked;
                                        setModules(updated);
                                        triggerAutoSave(updated);
                                      }}
                                      className="rounded accent-amber-500"
                                    />
                                    <span className="text-[11px]">Free Preview</span>
                                  </label>

                                  {/* Reorder */}
                                  <button
                                    onClick={() => moveLesson(mIdx, lIdx, 'UP')}
                                    disabled={lIdx === 0}
                                    className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30"
                                    title="Move Lesson Up"
                                  >
                                    <MoveUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => moveLesson(mIdx, lIdx, 'DOWN')}
                                    disabled={lIdx === mod.lessons.length - 1}
                                    className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30"
                                    title="Move Lesson Down"
                                  >
                                    <MoveDown className="w-3 h-3" />
                                  </button>

                                  {/* Delete (with confirmation) */}
                                  <button
                                    onClick={() => setDeleteModal({
                                      isOpen: true,
                                      itemType: 'LESSON',
                                      id: lesson.id,
                                      title: lesson.title,
                                      mIdx,
                                      lIdx,
                                    })}
                                    className="p-1 rounded text-red-400 hover:bg-red-500/10"
                                    title="Delete Lesson (requires confirmation)"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Title Inputs */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[10px] text-slate-400 mb-0.5">Lesson Title (English)</label>
                                  <input
                                    type="text"
                                    placeholder="Lesson Title (English)"
                                    value={lesson.title}
                                    onChange={(e) => {
                                      const updated = [...modules];
                                      updated[mIdx].lessons[lIdx].title = e.target.value;
                                      setModules(updated);
                                      triggerAutoSave(updated);
                                    }}
                                    className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] text-amber-400 mb-0.5">Lesson Title (Hindi / हिन्दी)</label>
                                  <input
                                    type="text"
                                    placeholder="पाठ का शीर्षक (हिन्दी)"
                                    value={lesson.titleHi || ''}
                                    onChange={(e) => {
                                      const updated = [...modules];
                                      updated[mIdx].lessons[lIdx].titleHi = e.target.value;
                                      setModules(updated);
                                      triggerAutoSave(updated);
                                    }}
                                    className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-amber-400/30 text-amber-200 text-xs focus:outline-none focus:border-amber-400"
                                  />
                                </div>
                              </div>

                              {/* ------------------------------------------------------------- */}
                              {/* TYPE 1: RECORDED LESSON (VIDEO + OPTIONAL NOTES)              */}
                              {/* ------------------------------------------------------------- */}
                              {lesson.type === 'VIDEO' && (
                                <div className="space-y-3 pt-1">
                                  {/* Cloudflare Stream vs External Video Mode */}
                                  {videoHostConfig && !videoHostConfig.configured ? (
                                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                                      <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                                        <span>Cloudflare Stream Host Not Configured</span>
                                      </div>
                                      <p className="text-[11px] text-slate-300">
                                        Missing: <strong className="text-amber-200">{videoHostConfig.missing.join(', ')}</strong>. Direct browser upload to Cloudflare Stream is unavailable until these variables are configured.
                                      </p>

                                      <div className="pt-2 border-t border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                          <span className="text-xs font-bold text-white block">External Video Link Mode</span>
                                          <span className="text-[10px] text-amber-300 font-semibold bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 inline-block mt-0.5">
                                            Not protected: anyone with this link can share it
                                          </span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                          <input
                                            type="checkbox"
                                            checked={Boolean(lesson.isExternalVideo)}
                                            onChange={(e) => {
                                              const updated = [...modules];
                                              updated[mIdx].lessons[lIdx].isExternalVideo = e.target.checked;
                                              setModules(updated);
                                              triggerAutoSave(updated);
                                            }}
                                            className="sr-only peer"
                                          />
                                          <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                                        </label>
                                      </div>

                                      {lesson.isExternalVideo && (
                                        <div className="pt-2">
                                          <label className="block text-[10px] text-slate-300 mb-1">
                                            External Video URL (YouTube, Vimeo, MP4)
                                          </label>
                                          <input
                                            type="text"
                                            placeholder="https://www.youtube.com/embed/... or https://player.vimeo.com/video/..."
                                            value={lesson.externalVideoUrl || lesson.videoProviderId || ''}
                                            onChange={(e) => {
                                              const updated = [...modules];
                                              updated[mIdx].lessons[lIdx].externalVideoUrl = e.target.value;
                                              updated[mIdx].lessons[lIdx].videoProviderId = e.target.value;
                                              setModules(updated);
                                              triggerAutoSave(updated);
                                            }}
                                            className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-amber-400/30 text-white text-xs"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    /* Cloudflare Stream Configured */
                                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-2">
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-300 font-semibold">Direct Cloudflare Stream Video (Protected Signed Playback):</span>
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

                                  {/* Optional Notes: Markdown + PDF */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                    <div>
                                      <label className="block text-[10px] text-slate-400 mb-0.5">Optional Lecture Notes (Markdown)</label>
                                      <textarea
                                        rows={2}
                                        value={lesson.notesMarkdown || ''}
                                        placeholder="Add key takeaways, chart formulas, or reading notes..."
                                        onChange={(e) => {
                                          const updated = [...modules];
                                          updated[mIdx].lessons[lIdx].notesMarkdown = e.target.value;
                                          setModules(updated);
                                          triggerAutoSave(updated);
                                        }}
                                        className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[10px] text-slate-400 mb-0.5">Optional Study Reference PDF</label>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="text"
                                          placeholder="PDF URL or storage key"
                                          value={lesson.documentUrl || ''}
                                          onChange={(e) => {
                                            const updated = [...modules];
                                            updated[mIdx].lessons[lIdx].documentUrl = e.target.value;
                                            setModules(updated);
                                            triggerAutoSave(updated);
                                          }}
                                          className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setUploadTargetLesson({ moduleIdx: mIdx, lessonIdx: lIdx });
                                            docInputRef.current?.click();
                                          }}
                                          className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold shrink-0"
                                          title="Upload PDF"
                                        >
                                          <Upload className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* ------------------------------------------------------------- */}
                              {/* TYPE 2: LIVE CLASS (DATE/TIME, TIMEZONE, MEET LINK, AGENDA)   */}
                              {/* ------------------------------------------------------------- */}
                              {lesson.type === 'LIVE_SESSION' && (
                                <div className="space-y-3 pt-1">
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                      <label className="block text-[10px] text-slate-400 mb-0.5">Scheduled Date &amp; Time (ISO)</label>
                                      <input
                                        type="datetime-local"
                                        value={lesson.liveScheduledAt ? lesson.liveScheduledAt.slice(0, 16) : ''}
                                        onChange={(e) => {
                                          const updated = [...modules];
                                          updated[mIdx].lessons[lIdx].liveScheduledAt = e.target.value ? new Date(e.target.value).toISOString() : '';
                                          setModules(updated);
                                          triggerAutoSave(updated);
                                        }}
                                        className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[10px] text-slate-400 mb-0.5">Timezone</label>
                                      <select
                                        value={lesson.liveTimezone || 'Asia/Kolkata'}
                                        onChange={(e) => {
                                          const updated = [...modules];
                                          updated[mIdx].lessons[lIdx].liveTimezone = e.target.value;
                                          setModules(updated);
                                          triggerAutoSave(updated);
                                        }}
                                        className="w-full px-3 py-1.5 rounded-lg bg-[#111827] border border-white/10 text-white text-xs"
                                      >
                                        {COMMON_TIMEZONES.map((t) => (
                                          <option key={t.tz} value={t.tz}>
                                            {t.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-[10px] text-slate-400 mb-0.5">Expected Duration (Minutes)</label>
                                      <input
                                        type="number"
                                        value={lesson.durationMinutes || 90}
                                        onChange={(e) => {
                                          const updated = [...modules];
                                          updated[mIdx].lessons[lIdx].durationMinutes = Number(e.target.value);
                                          setModules(updated);
                                          triggerAutoSave(updated);
                                        }}
                                        className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                                      />
                                    </div>
                                  </div>

                                  {lesson.liveScheduledAt && (
                                    <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 text-[11px] text-slate-300 flex items-center gap-2">
                                      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                      <span>
                                        Student will see: <strong className="text-white">{formatInTimezone(lesson.liveScheduledAt, userTz, 'short')}</strong> • <strong className="text-amber-300">{formatInTimezone(lesson.liveScheduledAt, 'Asia/Kolkata', 'short')} IST</strong>
                                      </span>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-[10px] text-slate-400 mb-0.5">Platform</label>
                                      <select
                                        value={lesson.meetingPlatform || 'GOOGLE_MEET'}
                                        onChange={(e) => {
                                          const updated = [...modules];
                                          updated[mIdx].lessons[lIdx].meetingPlatform = e.target.value as 'GOOGLE_MEET' | 'ZOOM';
                                          setModules(updated);
                                          triggerAutoSave(updated);
                                        }}
                                        className="w-full px-3 py-1.5 rounded-lg bg-[#111827] border border-white/10 text-white text-xs"
                                      >
                                        <option value="GOOGLE_MEET">Google Meet</option>
                                        <option value="ZOOM">Zoom</option>
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-[10px] text-slate-400 mb-0.5">
                                        Meeting Link (Google Meet or Zoom)
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="https://meet.google.com/... or https://zoom.us/j/..."
                                        value={lesson.liveJoinLink || ''}
                                        onChange={(e) => {
                                          const updated = [...modules];
                                          updated[mIdx].lessons[lIdx].liveJoinLink = e.target.value;
                                          setModules(updated);
                                          triggerAutoSave(updated);
                                        }}
                                        className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                                      />
                                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                                        Meeting links are shareable by nature and are shown only to approved students.
                                      </span>
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-[10px] text-slate-400 mb-0.5">Live Class Agenda</label>
                                    <textarea
                                      rows={2}
                                      placeholder="What will be discussed during this live session..."
                                      value={lesson.agenda || ''}
                                      onChange={(e) => {
                                        const updated = [...modules];
                                        updated[mIdx].lessons[lIdx].agenda = e.target.value;
                                        setModules(updated);
                                        triggerAutoSave(updated);
                                      }}
                                      className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                                    />
                                  </div>

                                  {/* Class Recording ("Missed Class" Video) */}
                                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                        <Video className="w-3.5 h-3.5 text-amber-400" />
                                        <span>Class Recording (&ldquo;Missed Class&rdquo; Video)</span>
                                      </span>
                                      <span className="text-[10px] text-slate-400">
                                        Attached after class ends. Shows &ldquo;Recording coming soon&rdquo; until added.
                                      </span>
                                    </div>
                                    <input
                                      type="text"
                                      placeholder="Recording Video URL or Cloudflare Stream UID (e.g. https://... or stream ID)"
                                      value={lesson.recordingUrl || ''}
                                      onChange={(e) => {
                                        const updated = [...modules];
                                        updated[mIdx].lessons[lIdx].recordingUrl = e.target.value;
                                        setModules(updated);
                                        triggerAutoSave(updated);
                                      }}
                                      className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* ------------------------------------------------------------- */}
                              {/* TYPE 3: STUDY NOTES & PDF (DOCUMENT)                          */}
                              {/* ------------------------------------------------------------- */}
                              {lesson.type === 'DOCUMENT' && (
                                <div className="space-y-3 pt-1">
                                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-slate-300 font-semibold">PDF Study Material per Lesson:</span>
                                      <button
                                        onClick={() => {
                                          setUploadTargetLesson({ moduleIdx: mIdx, lessonIdx: lIdx });
                                          docInputRef.current?.click();
                                        }}
                                        className="px-3 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold flex items-center gap-1"
                                      >
                                        <Upload className="w-3 h-3" />
                                        <span>{lesson.documentUrl ? 'Replace PDF' : 'Upload Lesson PDF'}</span>
                                      </button>
                                    </div>

                                    {lesson.documentUrl && (
                                      <div className="flex items-center gap-2 text-[11px] text-emerald-400">
                                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                        <span className="truncate">Connected: {lesson.documentUrl}</span>
                                      </div>
                                    )}
                                  </div>

                                  <div>
                                    <label className="block text-[10px] text-slate-400 mb-0.5">Study Notes Markdown</label>
                                    <textarea
                                      rows={3}
                                      placeholder="Full text study guide, Vedic quotes, chart illustrations..."
                                      value={lesson.notesMarkdown || ''}
                                      onChange={(e) => {
                                        const updated = [...modules];
                                        updated[mIdx].lessons[lIdx].notesMarkdown = e.target.value;
                                        setModules(updated);
                                        triggerAutoSave(updated);
                                      }}
                                      className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* ------------------------------------------------------------- */}
                              {/* TYPE 4: QUIZ (ASSESSMENT GRADED ON SERVER)                     */}
                              {/* ------------------------------------------------------------- */}
                              {lesson.type === 'QUIZ' && (
                                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <span className="text-xs font-bold text-purple-300 block">Lesson Quiz / Assessment</span>
                                      <span className="text-[11px] text-slate-300">
                                        Quizzes are graded strictly on the server; answer keys are protected from students.
                                      </span>
                                    </div>
                                    <Link
                                      href={`/instructor/courses/${course?.slug || courseId}/quiz`}
                                      className="px-3 py-1.5 rounded-lg bg-purple-500 text-white text-xs font-bold hover:bg-purple-600 transition flex items-center gap-1.5"
                                    >
                                      <Award className="w-3.5 h-3.5" />
                                      <span>Open Quiz Editor</span>
                                    </Link>
                                  </div>

                                  <div>
                                    <label className="block text-[10px] text-slate-400 mb-0.5">Assessment Description &amp; Instructions</label>
                                    <textarea
                                      rows={2}
                                      placeholder="Instructions for students before taking this quiz..."
                                      value={lesson.description || ''}
                                      onChange={(e) => {
                                        const updated = [...modules];
                                        updated[mIdx].lessons[lIdx].description = e.target.value;
                                        setModules(updated);
                                        triggerAutoSave(updated);
                                      }}
                                      className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        )}
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
                  Configure Indian Rupee pricing. Changes strictly apply to new enrollments.
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
                  Build and calibrate the certification examination. Answer keys are strictly protected on the server.
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
                href={`/dashboard/courses/${course?.slug || courseId}`}
                target="_blank"
                className="px-4 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition flex items-center gap-1.5"
              >
                <span>Open Student Classroom</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Simulated Student Portal View */}
            <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
              <div className="border-b border-white/10 pb-4">
                <h2 className="text-2xl font-black text-white">{title || 'The Ultimate Astrology Course'}</h2>
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
              <div className="space-y-4">
                {modules.map((m, mIdx) => (
                  <div key={m.id || mIdx} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span>Module {mIdx + 1}: {m.title}</span>
                      <div className="flex items-center gap-2">
                        {m.status === 'DRAFT' && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Section in Draft
                          </span>
                        )}
                        <span className="text-slate-500">{m.lessons.length} lessons</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      {m.lessons.map((l, lIdx) => (
                        <div
                          key={l.id || lIdx}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-black/40 text-xs text-slate-300 gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {l.type === 'LIVE_SESSION' ? (
                              <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            ) : l.type === 'DOCUMENT' ? (
                              <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            ) : l.type === 'QUIZ' ? (
                              <Award className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            ) : (
                              <Play className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <span className="font-semibold text-white block truncate">{l.title}</span>
                              {l.type === 'LIVE_SESSION' && l.liveScheduledAt && (
                                <span className="text-[10px] text-slate-400">
                                  {formatInTimezone(l.liveScheduledAt, userTz, 'short')} • {formatInTimezone(l.liveScheduledAt, 'Asia/Kolkata', 'short')} IST
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {l.status === 'DRAFT' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Draft (Hidden)
                              </span>
                            )}
                            {l.type === 'LIVE_SESSION' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/20">
                                Live Class
                              </span>
                            )}
                            {l.isFreePreview ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Free Preview
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-slate-400 flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                <span>Enrolled Only</span>
                              </span>
                            )}
                          </div>
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
