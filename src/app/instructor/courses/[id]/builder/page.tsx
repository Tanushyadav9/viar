'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Video,
  Save,
  CheckCircle2,
  Calendar,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import InstructorNav from '@/components/InstructorNav';
import { ViarStore } from '@/lib/store';
import { Course, CourseModule } from '@/lib/types';
import { ULTIMATE_ASTROLOGY_MODULES } from '@/lib/data';

interface ExtendedModule extends CourseModule {
  videoUrl?: string;
  notesMarkdown?: string;
  resourcesList?: { id: string; title: string; url: string; type: string }[];
  liveSession?: {
    scheduledAt?: string;
    meetingPlatform?: 'ZOOM' | 'GOOGLE_MEET';
    joinLink?: string;
  };
}

export default function CourseModuleBuilderPage() {
  const params = useParams();
  const courseId = (params?.id as string) || 'course-what-is-astrology';

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<ExtendedModule[]>([]);
  const [activeAccordion, setActiveAccordion] = useState<number | null>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // 1. Fetch from API or ViarStore
    fetch(`/api/courses/${courseId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.course) {
          setCourse(data.course);
          const rawModules = data.course.modules || [];
          if (rawModules.length > 0) {
            setModules(rawModules);
          } else {
            // Check ViarStore or fallback to ULTIMATE_ASTROLOGY_MODULES
            const local = ViarStore.getCourseById(courseId) || ViarStore.getCourseBySlug(courseId);
            setModules(local?.modules?.length ? local.modules : (ULTIMATE_ASTROLOGY_MODULES as ExtendedModule[]));
          }
        } else {
          loadFromLocalFallback();
        }
      })
      .catch(() => {
        loadFromLocalFallback();
      });

    function loadFromLocalFallback() {
      const crs = ViarStore.getCourseById(courseId) || ViarStore.getCourseBySlug(courseId) || ViarStore.getCourses()[0];
      if (crs) {
        setCourse(crs);
        setModules(crs.modules?.length ? crs.modules : (ULTIMATE_ASTROLOGY_MODULES as ExtendedModule[]));
      }
    }
  }, [courseId]);

  const handleAddModule = () => {
    const nextNumber = modules.length + 1;
    const newMod: ExtendedModule = {
      id: `mod-${Date.now()}`,
      moduleNumber: nextNumber,
      title: `Module ${nextNumber}: New Astrological Topic`,
      description: 'Comprehensive study of astrological techniques and chart interpretation.',
      durationMinutes: 75,
      keyTopics: ['Core astrological mechanics', 'Practical chart breakdown'],
      videoUrl: '',
      notesMarkdown: `### Module ${nextNumber} Study Notes\n\n- Key Planetary Placement Rules\n- Astrological Aspects and Predictions`,
      resourcesList: [
        {
          id: `res-${Date.now()}`,
          title: `Study Reference Sheet — Module ${nextNumber} (PDF)`,
          url: `/api/courses/${course?.slug || 'what-is-astrology'}/syllabus/download`,
          type: 'PDF',
        },
      ],
      classCount: 1,
      classNumbers: [nextNumber],
    };

    const updated = [...modules, newMod];
    setModules(updated);
    setActiveAccordion(updated.length - 1);
    setSuccessMsg(`Module ${nextNumber} added. Remember to click "Save Curriculum" to persist changes.`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleUpdateModule = (index: number, updates: Partial<ExtendedModule>) => {
    setModules((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const handleDeleteModule = (index: number) => {
    if (!confirm(`Are you sure you want to remove Module ${index + 1}?`)) return;
    const updated = modules
      .filter((_, i) => i !== index)
      .map((m, idx) => ({ ...m, moduleNumber: idx + 1 }));
    setModules(updated);
    setSuccessMsg('Module removed. Click "Save Curriculum" to persist.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleMoveModule = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === modules.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const copy = [...modules];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    const renumbered = copy.map((m, idx) => ({ ...m, moduleNumber: idx + 1 }));
    setModules(renumbered);
    setActiveAccordion(targetIndex);
  };

  const handleSaveCurriculum = async () => {
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. Update in database
      const res = await fetch(`/api/courses/${course?.slug || courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modules,
          totalClasses: modules.length,
        }),
      });

      const data = await res.json();
      if (!res.ok && !data.success) {
        throw new Error(data.error || 'Failed to save curriculum to database');
      }

      // 2. Also update in ViarStore
      if (course) {
        const localCourse = ViarStore.getCourseById(course.id) || ViarStore.getCourseBySlug(course.slug);
        if (localCourse) {
          localCourse.modules = modules;
          localCourse.totalClasses = modules.length;
          // Trigger ViarStore save
          const allCourses = ViarStore.getCourses();
          const idx = allCourses.findIndex((c) => c.id === localCourse.id || c.slug === localCourse.slug);
          if (idx !== -1) {
            allCourses[idx] = localCourse;
            if (typeof window !== 'undefined') {
              localStorage.setItem('viar_courses', JSON.stringify(allCourses));
            }
          }
        }
      }

      setSuccessMsg('All modules and lessons successfully saved to the PostgreSQL database!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: unknown) {
      console.error('Save error:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Error saving to database. Local state retained.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="cosmic-bg min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <InstructorNav />

        {/* Back Link */}
        <Link
          href="/instructor/courses"
          className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Courses</span>
        </Link>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 p-6 sm:p-8 rounded-3xl cosmic-card border border-amber-500/30 bg-gradient-to-r from-[#111827] to-[#090d16]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Self-Paced Course Builder
              </span>
              <span className="text-xs text-slate-400">
                {modules.length} Modules Configured
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              {course?.title || 'Course Curriculum Builder'}
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Build your course step-by-step. Attach recorded video lecture URLs (YouTube, Vimeo, Cloudflare Stream), upload downloadable study resources, write lesson notes, and add optional live masterclasses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleAddModule}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Add Module</span>
            </button>

            <button
              onClick={handleSaveCurriculum}
              disabled={isSaving}
              className="gold-button px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving to Database...' : 'Save Curriculum'}</span>
            </button>
          </div>
        </div>

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Modules Accordion List */}
        <div className="space-y-4">
          {modules.map((mod, index) => {
            const isOpen = activeAccordion === index;
            const modNum = mod.moduleNumber || index + 1;

            return (
              <div
                key={mod.id || index}
                className="cosmic-card rounded-2xl border border-white/10 overflow-hidden transition"
              >
                {/* Module Header Bar */}
                <div
                  onClick={() => setActiveAccordion(isOpen ? null : index)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] select-none gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/30">
                      {modNum}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-bold text-white truncate">
                        {mod.title || `Module ${modNum}`}
                      </h3>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                        <span>{mod.durationMinutes || 60} mins</span>
                        <span>•</span>
                        <span>{mod.videoUrl ? 'Video Replay Attached ✓' : 'No Video Attached'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleMoveModule(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30"
                      title="Move Up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveModule(index, 'down')}
                      disabled={index === modules.length - 1}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30"
                      title="Move Down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteModule(index)}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 ml-2"
                      title="Delete Module"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Module Body Content */}
                {isOpen && (
                  <div className="p-6 pt-2 border-t border-white/5 bg-black/20 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-8">
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Module Title
                        </label>
                        <input
                          type="text"
                          value={mod.title}
                          onChange={(e) => handleUpdateModule(index, { title: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div className="md:col-span-4">
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Duration (Minutes)
                        </label>
                        <input
                          type="number"
                          value={mod.durationMinutes || 75}
                          onChange={(e) => handleUpdateModule(index, { durationMinutes: parseInt(e.target.value) || 60 })}
                          className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Module Description & Astrological Syllabus
                      </label>
                      <textarea
                        rows={3}
                        value={mod.description}
                        onChange={(e) => handleUpdateModule(index, { description: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    {/* Video Attachment Box */}
                    <div className="p-4 rounded-xl bg-[#0d131f] border border-amber-500/20 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                        <Video className="w-4 h-4 text-amber-400" />
                        <span>Recorded Video Lecture Stream (Embed URL)</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Enter your Vimeo embed URL, YouTube unlisted embed (`https://www.youtube.com/embed/...`), Cloudflare Stream iframe, or direct MP4 stream.
                      </p>
                      <input
                        type="url"
                        value={mod.videoUrl || ''}
                        onChange={(e) => handleUpdateModule(index, { videoUrl: e.target.value })}
                        placeholder="e.g. https://www.youtube.com/embed/dQw4w9WgXcQ or https://player.vimeo.com/video/..."
                        className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400 font-mono"
                      />
                      {mod.videoUrl && (
                        <div className="aspect-video max-w-sm rounded-lg overflow-hidden border border-white/10 mt-2 bg-black">
                          <iframe
                            src={mod.videoUrl}
                            title={mod.title}
                            className="w-full h-full"
                            allowFullScreen
                          />
                        </div>
                      )}
                    </div>

                    {/* Lesson Notes / Markdown */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                        <span>Lesson Study Notes & Chart Explanations (Markdown)</span>
                        <span className="text-[10px] text-slate-400">Supports headings, bullet points, and astrological formulas</span>
                      </label>
                      <textarea
                        rows={4}
                        value={mod.notesMarkdown || ''}
                        onChange={(e) => handleUpdateModule(index, { notesMarkdown: e.target.value })}
                        placeholder="### Study Summary&#10;- Planetary Dignities&#10;- Exaltation and Debilitation Rules"
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400 font-mono text-[11px]"
                      />
                    </div>

                    {/* Optional Live Session Link */}
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                        <Calendar className="w-4 h-4 text-amber-400" />
                        <span>Optional Live Q&A / Live Masterclass Session (Zoom / Google Meet)</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="url"
                          value={mod.liveSession?.joinLink || ''}
                          onChange={(e) =>
                            handleUpdateModule(index, {
                              liveSession: {
                                ...mod.liveSession,
                                joinLink: e.target.value,
                              },
                            })
                          }
                          placeholder="Zoom / Google Meet link (e.g. https://zoom.us/j/...)"
                          className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                        />
                        <input
                          type="datetime-local"
                          value={mod.liveSession?.scheduledAt || ''}
                          onChange={(e) =>
                            handleUpdateModule(index, {
                              liveSession: {
                                ...mod.liveSession,
                                scheduledAt: e.target.value,
                              },
                            })
                          }
                          className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Save CTA Bar */}
        <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Total {modules.length} modules ready for publishing in {course?.title || 'the academy'}.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleAddModule}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold"
            >
              + Add Another Module
            </button>
            <button
              onClick={handleSaveCurriculum}
              disabled={isSaving}
              className="gold-button px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Curriculum to Database'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
