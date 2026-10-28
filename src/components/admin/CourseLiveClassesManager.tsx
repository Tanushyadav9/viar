'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Video,
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ExternalLink,
  Lock,
  RefreshCw,
  Play,
  Copy,
  X,
  HelpCircle,
  AlertCircle,
  Layers,
  Check,
} from 'lucide-react';
import {
  isValidMeetingLink,
  INVALID_LINK_MESSAGE_EN,
  INVALID_LINK_MESSAGE_HI,
} from '@/lib/courses/meetingLinkValidation';

interface LiveClassRecord {
  id: string;
  moduleId: string;
  moduleTitle: string;
  moduleOrder: number;
  courseId: string;
  courseTitle: string;
  order: number;
  title: string;
  titleHi?: string | null;
  agenda?: string | null;
  dateIst: string;
  timeIst: string;
  displayIst: string;
  scheduledStartTimeUtc: string | null;
  timezone: string;
  durationMinutes: number;
  provider: 'GOOGLE_MEET' | 'ZOOM';
  meetingLink: string;
  isLinkValid?: boolean;
  linkValidationError?: string | null;
  zoomPasscode?: string | null;
  privateHostNotes?: string | null;
  notesPdf?: string | null;
  status: 'DRAFT' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  recordingUrl?: string | null;
  recordingStreamId?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ModuleOption {
  id: string;
  title: string;
  order: number;
}

interface CourseLiveClassesManagerProps {
  isOwner?: boolean;
}

export function CourseLiveClassesManager(props: CourseLiveClassesManagerProps = {}) {
  const isOwner = props.isOwner !== false;
  const [activeSubTab, setActiveSubTab] = useState<'upcoming' | 'past'>('upcoming');
  const [upcomingClasses, setUpcomingClasses] = useState<LiveClassRecord[]>([]);
  const [pastClasses, setPastClasses] = useState<LiveClassRecord[]>([]);
  const [modules, setModules] = useState<ModuleOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<LiveClassRecord | null>(null);

  // Form Fields
  const [formModuleId, setFormModuleId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formTitleHi, setFormTitleHi] = useState('');
  const [formAgenda, setFormAgenda] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('18:00');
  const [formDuration, setFormDuration] = useState(60);
  const [formProvider, setFormProvider] = useState<'GOOGLE_MEET' | 'ZOOM'>('GOOGLE_MEET');
  const [formMeetingLink, setFormMeetingLink] = useState('');
  const [formZoomPasscode, setFormZoomPasscode] = useState('');
  const [formPrivateHostNotes, setFormPrivateHostNotes] = useState('');
  const [formNotesPdf, setFormNotesPdf] = useState('');
  const [formStatus, setFormStatus] = useState<'DRAFT' | 'SCHEDULED'>('SCHEDULED');
  const [formRecordingUrl, setFormRecordingUrl] = useState('');

  // Conflict / Clash state
  const [clashError, setClashError] = useState<{ en: string; hi: string } | null>(null);

  // Quick Recording Modal state
  const [recordingModalClass, setRecordingModalClass] = useState<LiveClassRecord | null>(null);
  const [recordingInputUrl, setRecordingInputUrl] = useState('');

  // Cancellation Modal state
  const [cancellationClass, setCancellationClass] = useState<LiveClassRecord | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  // Copied link toast state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Live modal link validation
  const liveLinkVal = formMeetingLink.trim() ? isValidMeetingLink(formMeetingLink, formProvider) : null;

  // Load modules for dropdown
  const loadModules = useCallback(async () => {
    try {
      const res = await fetch('/api/courses/what-is-astrology/curriculum');
      if (res.ok) {
        const data = await res.json();
        if (data?.course?.modules && Array.isArray(data.course.modules)) {
          const list = data.course.modules.map((m: { id: string; title: string; order: number }) => ({
            id: m.id,
            title: m.title,
            order: m.order,
          }));
          setModules(list);
          if (list.length > 0 && !formModuleId) {
            setFormModuleId(list[0].id);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load modules:', e);
    }
  }, [formModuleId]);

  // Load Live Classes from API
  const loadLiveClasses = useCallback(async () => {
    setIsLoading(true);
    setClashError(null);
    try {
      const res = await fetch('/api/admin/courses/live-classes');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUpcomingClasses(data.upcoming || []);
          setPastClasses(data.past || []);
        }
      }
    } catch (err) {
      console.error('Failed to load live classes:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLiveClasses();
    loadModules();
  }, [loadLiveClasses, loadModules]);

  // Handle open modal for new schedule
  const handleOpenScheduleModal = () => {
    setEditingClass(null);
    setClashError(null);
    setFormTitle('');
    setFormTitleHi('');
    setFormAgenda('');
    // Default to tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    setFormDate(`${yyyy}-${mm}-${dd}`);
    setFormStartTime('18:00');
    setFormDuration(60);
    setFormProvider('GOOGLE_MEET');
    setFormMeetingLink('');
    setFormZoomPasscode('');
    setFormPrivateHostNotes('');
    setFormNotesPdf('');
    setFormStatus('SCHEDULED');
    setFormRecordingUrl('');
    if (modules.length > 0) {
      setFormModuleId(modules[0].id);
    }
    setIsModalOpen(true);
  };

  // Handle open modal for edit
  const handleOpenEditModal = (cls: LiveClassRecord) => {
    setEditingClass(cls);
    setClashError(null);
    setFormModuleId(cls.moduleId);
    setFormTitle(cls.title);
    setFormTitleHi(cls.titleHi || '');
    setFormAgenda(cls.agenda || '');
    setFormDate(cls.dateIst || '');
    setFormStartTime(cls.timeIst || '18:00');
    setFormDuration(cls.durationMinutes || 60);
    setFormProvider(cls.provider || 'GOOGLE_MEET');
    setFormMeetingLink(cls.meetingLink || '');
    setFormZoomPasscode(cls.zoomPasscode || '');
    setFormPrivateHostNotes(cls.privateHostNotes || '');
    setFormNotesPdf(cls.notesPdf || '');
    setFormStatus(cls.status === 'DRAFT' ? 'DRAFT' : 'SCHEDULED');
    setFormRecordingUrl(cls.recordingUrl || '');
    setIsModalOpen(true);
  };

  // Submit Schedule / Update
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setClashError(null);

    // Validate meeting link
    if (formStatus === 'SCHEDULED') {
      if (!formMeetingLink || !formMeetingLink.trim()) {
        setClashError({
          en: 'A live class cannot be published without a valid meeting link. Save as Draft or paste a real Google Meet or Zoom link.',
          hi: 'बिना मीटिंग लिंक के लाइव कक्षा पब्लिश नहीं की जा सकती। ड्राफ्ट के रूप में सहेजें या वैध लिंक पेस्ट करें।',
        });
        return;
      }
      const val = isValidMeetingLink(formMeetingLink, formProvider);
      if (!val.valid) {
        setClashError({
          en: val.error || INVALID_LINK_MESSAGE_EN,
          hi: val.errorHi || INVALID_LINK_MESSAGE_HI,
        });
        return;
      }
    } else if (formMeetingLink && formMeetingLink.trim()) {
      const val = isValidMeetingLink(formMeetingLink, formProvider);
      if (!val.valid) {
        setClashError({
          en: val.error || INVALID_LINK_MESSAGE_EN,
          hi: val.errorHi || INVALID_LINK_MESSAGE_HI,
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (editingClass) {
        // Update / Reschedule
        const res = await fetch(`/api/admin/courses/live-classes/${editingClass.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: {
              moduleId: formModuleId,
              title: formTitle,
              titleHi: formTitleHi || null,
              agenda: formAgenda || null,
              date: formDate,
              startTime: formStartTime,
              durationMinutes: formDuration,
              provider: formProvider,
              meetingLink: formMeetingLink || null,
              zoomPasscode: formZoomPasscode || null,
              privateHostNotes: formPrivateHostNotes || null,
              notesPdf: formNotesPdf || null,
              status: formStatus,
              recordingUrl: formRecordingUrl || null,
            },
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          if (res.status === 409 && data.clash) {
            setClashError({
              en: data.clash.messageEn || data.error,
              hi: data.clash.messageHi || 'समय का टकराव: इस समय दूसरी कक्षा निर्धारित है।',
            });
            return;
          }
          throw new Error(data.error || 'Failed to update live class.');
        }

        setFeedbackMessage({
          type: 'success',
          text: data.isRescheduled
            ? `Live class rescheduled! ${data.notifiedCount || 0} active students notified via outbox.`
            : 'Live class details updated successfully.',
        });
      } else {
        // Create new live class
        const res = await fetch('/api/admin/courses/live-classes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            moduleId: formModuleId,
            title: formTitle,
            titleHi: formTitleHi || null,
            agenda: formAgenda || null,
            date: formDate,
            startTime: formStartTime,
            durationMinutes: formDuration,
            provider: formProvider,
            meetingLink: formMeetingLink || null,
            zoomPasscode: formZoomPasscode || null,
            privateHostNotes: formPrivateHostNotes || null,
            notesPdf: formNotesPdf || null,
            status: formStatus,
            recordingUrl: formRecordingUrl || null,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          if (res.status === 409 && data.clash) {
            setClashError({
              en: data.clash.messageEn || data.error,
              hi: data.clash.messageHi || 'समय का टकराव: इस समय दूसरी कक्षा निर्धारित है।',
            });
            return;
          }
          throw new Error(data.error || 'Failed to schedule live class.');
        }

        setFeedbackMessage({
          type: 'success',
          text: formStatus === 'DRAFT'
            ? 'Live class saved as Draft.'
            : 'Live class scheduled and published successfully! Visible to enrolled students.',
        });
      }

      setIsModalOpen(false);
      loadLiveClasses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed.';
      setClashError({ en: msg, hi: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Mark Completed with optional recording
  const handleMarkCompleted = async (cls: LiveClassRecord) => {
    const confirmComplete = window.confirm(
      `Mark "${cls.title}" as completed? Students who missed it will be able to watch the recording once added.`
    );
    if (!confirmComplete) return;

    try {
      const res = await fetch(`/api/admin/courses/live-classes/${cls.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: { status: 'COMPLETED' },
        }),
      });
      if (res.ok) {
        setFeedbackMessage({ type: 'success', text: `Class "${cls.title}" marked as Completed.` });
        loadLiveClasses();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit Cancellation
  const handleConfirmCancellation = async () => {
    if (!cancellationClass) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/courses/live-classes/${cancellationClass.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: { status: 'CANCELLED' },
          cancellationReason: cancellationReason || 'Session cancelled by Institute.',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedbackMessage({
          type: 'success',
          text: `Live class cancelled. ${data.notifiedCount || 0} active students notified via outbox.`,
        });
        setCancellationClass(null);
        setCancellationReason('');
        loadLiveClasses();
      } else {
        alert(data.error || 'Failed to cancel live class.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Recording URL
  const handleSaveRecordingUrl = async () => {
    if (!recordingModalClass) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/courses/live-classes/${recordingModalClass.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            recordingUrl: recordingInputUrl.trim() || null,
            status: 'COMPLETED',
          },
        }),
      });
      if (res.ok) {
        setFeedbackMessage({
          type: 'success',
          text: 'Class recording saved! Students can now watch this session.',
        });
        setRecordingModalClass(null);
        setRecordingInputUrl('');
        loadLiveClasses();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = (id: string, link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-red-500/20 text-red-300 border border-red-500/40'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Non-technical Help Panel (Bilingual EN/HI) */}
      <div className="cosmic-card p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] space-y-2">
        <div className="flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="text-slate-200">
              <strong className="text-amber-300">💡 How live classes work:</strong> A live class is an interactive lesson inside the course curriculum. All approved students attend together via one meeting link.
              You can save as a <strong>Draft</strong> without a link, but publishing requires a real Google Meet or Zoom link. Overlapping classes are blocked automatically.
            </p>
            <p className="text-slate-400 text-[11px]">
              <strong className="text-amber-400/90">लाइव कक्षाएं कैसे काम करती हैं:</strong> लाइव कक्षा पाठ्यक्रम का हिस्सा है। सभी स्वीकृत विद्यार्थी एक ही मीटिंग लिंक से जुड़ते हैं। बिना लिंक के ड्राफ्ट बनाया जा सकता है, पर पब्लिश करने के लिए असली गूगल मीट या ज़ूम लिंक आवश्यक है।
            </p>
          </div>
        </div>
      </div>

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Subtab Switcher: Upcoming vs Past */}
          <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setActiveSubTab('upcoming')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                activeSubTab === 'upcoming'
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Upcoming &amp; Scheduled</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/30">
                {upcomingClasses.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('past')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                activeSubTab === 'past'
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>Past &amp; Recordings</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/30">
                {pastClasses.length}
              </span>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenScheduleModal}
          className="gold-button px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Live Class (लाइव कक्षा जोड़ें)</span>
        </button>
      </div>

      {/* Class List Render */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
          <span>Loading live classes...</span>
        </div>
      ) : activeSubTab === 'upcoming' ? (
        // UPCOMING CLASSES
        upcomingClasses.length === 0 ? (
          <div className="p-10 rounded-2xl border border-dashed border-white/10 text-center space-y-3 bg-white/[0.02]">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">No Upcoming Live Classes Scheduled</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Schedule your next live interactive session for course students. Approved students will see the schedule and meeting link in their portal timetable.
              </p>
            </div>
            <button
              onClick={handleOpenScheduleModal}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule First Class</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {upcomingClasses.map((cls) => {
              const isDraft = cls.status === 'DRAFT';
              const isLinkValid = cls.meetingLink ? isValidMeetingLink(cls.meetingLink, cls.provider).valid : false;
              const hasInvalidLink = Boolean(cls.meetingLink && !isLinkValid);
              return (
                <div
                  key={cls.id}
                  className={`cosmic-card p-5 rounded-2xl border transition space-y-4 ${
                    hasInvalidLink
                      ? 'border-red-500/50 hover:border-red-500/80 bg-red-500/[0.02]'
                      : 'border-white/10 hover:border-amber-500/40'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          <span>{cls.moduleTitle}</span>
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isDraft
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {isDraft ? 'Draft (Not Published)' : 'Scheduled & Published'}
                        </span>

                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/5 text-slate-300 border border-white/10">
                          {cls.provider === 'ZOOM' ? 'Zoom' : 'Google Meet'}
                        </span>

                        {hasInvalidLink && (
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/40 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-red-400" />
                            <span>Invalid link</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-bold text-white flex items-center gap-2">
                        <span>{cls.title}</span>
                        {cls.titleHi && (
                          <span className="text-xs font-normal text-slate-400">({cls.titleHi})</span>
                        )}
                      </h4>

                      {cls.agenda && (
                        <p className="text-xs text-slate-300 line-clamp-2 max-w-2xl">
                          {cls.agenda}
                        </p>
                      )}

                      {/* Invalid link warning & block publishing indicator */}
                      {hasInvalidLink && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-200 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-red-300 block mb-0.5">Publishing Blocked (Invalid Link):</strong>
                            <p className="text-[11px] text-red-200/90 leading-relaxed">
                              {INVALID_LINK_MESSAGE_EN}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Timetable Badges */}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="font-semibold">{cls.displayIst} IST</span>
                        </div>
                        <div className="text-slate-400 text-xs">
                          Duration: <strong className="text-white">{cls.durationMinutes} mins</strong>
                        </div>
                        {cls.zoomPasscode && (
                          <div className="text-xs text-slate-400">
                            Passcode: <strong className="font-mono text-amber-300">{cls.zoomPasscode}</strong>
                          </div>
                        )}
                        {cls.notesPdf && (
                          <a
                            href={cls.notesPdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-sky-400 hover:underline flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Notes PDF Attached</span>
                          </a>
                        )}
                      </div>

                      {/* Private Host Notes Warning */}
                      {isOwner && cls.privateHostNotes && (
                        <div className="p-2.5 rounded-lg bg-red-500/[0.06] border border-red-500/20 text-[11px] text-red-200/90 flex items-start gap-2">
                          <Lock className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-red-300">Private Host Notes (Hidden from students):</strong> {cls.privateHostNotes}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action buttons on card */}
                    <div className="flex flex-wrap lg:flex-col items-center lg:items-end gap-2 shrink-0">
                      {cls.meetingLink ? (
                        <div className="flex items-center gap-1.5">
                          <a
                            href={cls.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center gap-1.5 transition shadow"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Open Meeting</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopyLink(cls.id, cls.meetingLink)}
                            title="Copy meeting link"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition"
                          >
                            {copiedId === cls.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-amber-400/80 italic">Awaiting meeting link</span>
                      )}

                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(cls)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 flex items-center gap-1 transition"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit / Reschedule</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMarkCompleted(cls)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 transition"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Complete</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setCancellationClass(cls);
                            setCancellationReason('');
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 transition"
                          title="Cancel live class"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        // PAST CLASSES & RECORDINGS
        pastClasses.length === 0 ? (
          <div className="p-10 rounded-2xl border border-dashed border-white/10 text-center space-y-2 bg-white/[0.02]">
            <Play className="w-8 h-8 text-slate-500 mx-auto" />
            <h4 className="text-sm font-bold text-white">No Past Classes Yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Completed classes appear here. You can add video recording links so students who missed the session can watch.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pastClasses.map((cls) => {
              const hasRecording = Boolean(cls.recordingUrl);
              return (
                <div
                  key={cls.id}
                  className="cosmic-card p-5 rounded-2xl border border-white/10 space-y-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-slate-300">
                          {cls.moduleTitle}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            cls.status === 'CANCELLED'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {cls.status}
                        </span>
                        {hasRecording ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Recording Active</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-amber-400" />
                            <span>Awaiting Recording</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-bold text-white">{cls.title}</h4>

                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>Conducted on: <strong className="text-slate-200">{cls.displayIst} IST</strong></span>
                        <span>•</span>
                        <span>Duration: <strong className="text-slate-200">{cls.durationMinutes} mins</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasRecording ? (
                        <>
                          <a
                            href={cls.recordingUrl!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 transition"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Watch Recording</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              setRecordingModalClass(cls);
                              setRecordingInputUrl(cls.recordingUrl || '');
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition"
                          >
                            Update URL
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setRecordingModalClass(cls);
                            setRecordingInputUrl('');
                          }}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center gap-1.5 transition shadow"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Add Recording Link</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* SCHEDULE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0b0f17] border border-amber-500/30 rounded-2xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Video className="w-5 h-5 text-amber-400" />
                  <span>{editingClass ? 'Edit / Reschedule Live Class' : 'Schedule New Live Class (नई लाइव कक्षा)'}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  {editingClass
                    ? 'Rescheduling will notify all approved students by email through the outbox.'
                    : 'Interactive cohort lesson inside the course curriculum.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Clash Error Banner */}
            {clashError && (
              <div className="p-4 rounded-xl bg-red-500/10 border-2 border-red-500/40 text-red-200 text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold text-red-300">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{clashError.en}</span>
                </div>
                {clashError.hi && (
                  <p className="text-red-300/80 text-[11px] pl-6">{clashError.hi}</p>
                )}
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Module Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Belongs to Module <span className="text-amber-400">*</span>
                </label>
                <select
                  value={formModuleId}
                  onChange={(e) => setFormModuleId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                >
                  {modules.map((m) => (
                    <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                      Module {m.order}: {m.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title (EN & HI) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Lesson Title (English) <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Navamsha (D9) Chart Synthesis"
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Lesson Title (Hindi / हिंदी)
                  </label>
                  <input
                    type="text"
                    value={formTitleHi}
                    onChange={(e) => setFormTitleHi(e.target.value)}
                    placeholder="उदा. नवांश (D9) चक्र विश्लेषण"
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Agenda / Syllabus Topics */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Agenda &amp; Topics Covered (सत्र की रूपरेखा)
                </label>
                <textarea
                  value={formAgenda}
                  onChange={(e) => setFormAgenda(e.target.value)}
                  rows={2}
                  placeholder="Key topics, planetary aspects, and live chart readings to be covered..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Date, Start Time (IST), Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Date (दिनांक) <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Start Time (IST / भारतीय समय) <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-amber-400 block mt-0.5">Stored as UTC, entered in IST</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Duration (Minutes) <span className="text-amber-400">*</span>
                  </label>
                  <select
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value={45} className="bg-slate-900">45 Minutes</option>
                    <option value={60} className="bg-slate-900">60 Minutes (1 Hour)</option>
                    <option value={75} className="bg-slate-900">75 Minutes</option>
                    <option value={90} className="bg-slate-900">90 Minutes (1.5 Hours)</option>
                    <option value={120} className="bg-slate-900">120 Minutes (2 Hours)</option>
                  </select>
                </div>
              </div>

              {/* Provider & Meeting Link */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Provider <span className="text-amber-400">*</span>
                  </label>
                  <select
                    value={formProvider}
                    onChange={(e) => setFormProvider(e.target.value as 'GOOGLE_MEET' | 'ZOOM')}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="GOOGLE_MEET" className="bg-slate-900">Google Meet</option>
                    <option value="ZOOM" className="bg-slate-900">Zoom</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Meeting Link {formStatus === 'SCHEDULED' && <span className="text-amber-400">*</span>}
                    </label>
                    <div className="flex items-center gap-2">
                      {formMeetingLink.trim() && (
                        <button
                          type="button"
                          onClick={() => {
                            let target = formMeetingLink.trim();
                            if (!target.startsWith('http://') && !target.startsWith('https://')) {
                              target = 'https://' + target;
                            }
                            window.open(target, '_blank', 'noopener,noreferrer');
                          }}
                          className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Test link</span>
                        </button>
                      )}
                      <a
                        href="https://meet.google.com/new"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-slate-400 hover:text-slate-200 underline"
                      >
                        Create meeting
                      </a>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={formMeetingLink}
                    onChange={(e) => setFormMeetingLink(e.target.value)}
                    placeholder={
                      formProvider === 'GOOGLE_MEET'
                        ? 'Paste real Google Meet link (https://meet.google.com/abc-defg-hij)'
                        : 'Paste real Zoom link (https://zoom.us/j/1234567890)'
                    }
                    required={formStatus === 'SCHEDULED'}
                    className={`w-full px-3 py-2 rounded-xl bg-white/5 border text-white text-xs focus:outline-none font-mono ${
                      formMeetingLink.trim() && !liveLinkVal?.valid
                        ? 'border-red-500 focus:border-red-400'
                        : formMeetingLink.trim() && liveLinkVal?.valid
                        ? 'border-emerald-500 focus:border-emerald-400'
                        : 'border-white/10 focus:border-amber-400'
                    }`}
                  />

                  {/* Real-time Validation Feedback */}
                  {formMeetingLink.trim() && !liveLinkVal?.valid && (
                    <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-[11px] text-red-300 flex items-start gap-1.5 mt-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-red-300">Invalid link:</strong> {liveLinkVal?.error || INVALID_LINK_MESSAGE_EN}
                      </div>
                    </div>
                  )}

                  {formMeetingLink.trim() && liveLinkVal?.valid && (
                    <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Valid {liveLinkVal.provider === 'ZOOM' ? 'Zoom' : 'Google Meet'} link confirmed</span>
                    </div>
                  )}

                  {!formMeetingLink.trim() && (
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {formStatus === 'DRAFT'
                        ? 'Optional for Drafts. Must be valid Google Meet or Zoom link to publish.'
                        : 'Required to publish. Real Google Meet codes look like abc-defg-hij.'}
                    </span>
                  )}
                </div>
              </div>

              {/* Optional Zoom Passcode & Notes PDF */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Zoom Passcode (Optional)
                  </label>
                  <input
                    type="text"
                    value={formZoomPasscode}
                    onChange={(e) => setFormZoomPasscode(e.target.value)}
                    placeholder="e.g. 123456"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Notes PDF / Material URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formNotesPdf}
                    onChange={(e) => setFormNotesPdf(e.target.value)}
                    placeholder="https://.../notes.pdf"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Private Host Notes (Owner/Staff only) */}
              <div>
                <label className="block text-xs font-semibold text-red-300 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-red-400" />
                  <span>Private Host Notes (Acharya ji / Staff only — Strictly hidden from students)</span>
                </label>
                <textarea
                  value={formPrivateHostNotes}
                  onChange={(e) => setFormPrivateHostNotes(e.target.value)}
                  rows={2}
                  placeholder="Private talking points, chart references, student questions to follow up on..."
                  className="w-full px-3.5 py-2 rounded-xl bg-red-500/[0.04] border border-red-500/20 text-white text-xs focus:outline-none focus:border-red-400"
                />
              </div>

              {/* Status (Draft vs Scheduled) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Publishing Status <span className="text-amber-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormStatus('DRAFT')}
                    className={`p-3 rounded-xl border text-left transition ${
                      formStatus === 'DRAFT'
                        ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                        : 'border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <span className="text-xs font-bold block">Save as Draft</span>
                    <span className="text-[10px] text-slate-400 block">Can save without meeting link. Not shown to students yet.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormStatus('SCHEDULED')}
                    className={`p-3 rounded-xl border text-left transition ${
                      formStatus === 'SCHEDULED'
                        ? 'border-emerald-400 bg-emerald-500/10 text-emerald-300'
                        : 'border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <span className="text-xs font-bold block">Scheduled &amp; Published</span>
                    <span className="text-[10px] text-slate-400 block">Requires meeting link. Visible to all approved students.</span>
                  </button>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="gold-button px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingClass ? 'Save Changes & Notify' : formStatus === 'DRAFT' ? 'Save Draft' : 'Schedule Live Class'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK RECORDING MODAL */}
      {recordingModalClass && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0f17] border border-amber-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Play className="w-4 h-4 text-amber-400" />
                <span>Add Class Recording Link</span>
              </h3>
              <button
                type="button"
                onClick={() => setRecordingModalClass(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Paste the video URL for <strong>&quot;{recordingModalClass.title}&quot;</strong>. Students who missed this live class can watch the recording, which counts the same as attending.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Recording Video URL (Cloudflare Stream, YouTube unlisted, etc.)
              </label>
              <input
                type="url"
                value={recordingInputUrl}
                onChange={(e) => setRecordingInputUrl(e.target.value)}
                placeholder="https://customer-xxx.cloudflarestream.com/... or https://..."
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setRecordingModalClass(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRecordingUrl}
                disabled={isSubmitting || !recordingInputUrl.trim()}
                className="gold-button px-5 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Recording'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCELLATION MODAL */}
      {cancellationClass && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0f17] border border-red-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Cancel Live Class</span>
              </h3>
              <button
                type="button"
                onClick={() => setCancellationClass(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you want to cancel <strong>&quot;{cancellationClass.title}&quot;</strong> scheduled for {cancellationClass.displayIst} IST?
              All enrolled students will receive an email notification through the outbox.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Reason for Cancellation (विद्यार्थियों को भेजा जाने वाला कारण)
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={2}
                placeholder="e.g. Rescheduled due to festival holiday; new time will be announced shortly."
                className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-red-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setCancellationClass(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleConfirmCancellation}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Cancelling...' : 'Confirm Cancellation & Notify'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
