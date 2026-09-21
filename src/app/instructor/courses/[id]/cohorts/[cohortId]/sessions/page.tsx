'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  ArrowLeft,
  ExternalLink,
  Edit,
  Play
} from 'lucide-react';
import InstructorNav from '@/components/InstructorNav';
import { ViarStore } from '@/lib/store';
import { ScheduledClass, Cohort } from '@/lib/types';
import { formatInTimezone } from '@/lib/timezones';

export default function InstructorSessionsPage() {
  const params = useParams();
  const courseId = (params?.id as string) || 'course-what-is-astrology';
  const cohortId = (params?.cohortId as string) || 'cohort-wia-batch-1';

  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [classes, setClasses] = useState<ScheduledClass[]>([]);
  const [editingClass, setEditingClass] = useState<ScheduledClass | null>(null);
  
  // Form states
  const [joinUrl, setJoinUrl] = useState('');
  const [meetingId, setMeetingId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [recordingUrl, setRecordingUrl] = useState('');
  const [notesMarkdown, setNotesMarkdown] = useState('');
  const [classStatus, setClassStatus] = useState<'UPCOMING' | 'LIVE' | 'COMPLETED'>('UPCOMING');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const coh = ViarStore.getCohortById(cohortId) || ViarStore.getCohorts()[0];
    if (coh) setCohort(coh);

    const list = ViarStore.getClasses(cohortId);
    setClasses(list);
  }, [cohortId]);

  const handleOpenEdit = (cls: ScheduledClass) => {
    setEditingClass(cls);
    setJoinUrl(cls.joinUrl || '');
    setMeetingId(cls.meetingId || '');
    setPasscode(cls.passcode || '');
    setRecordingUrl(cls.recording?.videoUrl || '');
    setNotesMarkdown(cls.recording?.notesMarkdown || '');
    setClassStatus(cls.status);
  };

  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;

    const updates: Partial<ScheduledClass> = {
      joinUrl,
      meetingId,
      passcode,
      status: classStatus,
    };

    if (recordingUrl) {
      updates.recording = {
        id: `rec-${editingClass.id}`,
        videoUrl: recordingUrl,
        provider: recordingUrl.includes('vimeo') ? 'VIMEO' : 'YOUTUBE',
        durationMinutes: editingClass.durationMinutes || 75,
        recordedDate: new Date().toISOString().split('T')[0],
        notesMarkdown,
        keyTakeaways: ['Key takeaways summarized by instructor'],
        resources: [],
      };
      updates.status = 'COMPLETED';
    }

    ViarStore.updateClass(editingClass.id, updates);
    setClasses(ViarStore.getClasses(cohortId));
    setEditingClass(null);
    setSuccessMsg(`Class ${editingClass.classNumber} updated successfully!`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="cosmic-bg min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <InstructorNav />

        {/* Back Link */}
        <Link
          href={`/instructor/courses/${courseId}/cohorts`}
          className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Cohorts</span>
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {cohort?.batchName || 'Cohort Batch 01'}
              </span>
              <span className="text-xs text-slate-400">18 Masterclasses</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Class Session Management (Zoom Links & Recordings)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Paste Zoom or Google Meet links before class. After showtime, attach the HD recording and summary notes.
            </p>
          </div>

          <Link
            href={`/dashboard/courses/${cohortId}`}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition shrink-0 flex items-center gap-1.5"
          >
            <span>Preview Student Classroom</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Edit Modal */}
        {editingClass && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-amber-500/40 max-w-xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Editing Class {editingClass.classNumber} of 18
                  </span>
                  <h3 className="text-xl font-bold text-white mt-0.5">{editingClass.title}</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {editingClass.durationMinutes} mins
                </span>
              </div>

              <form onSubmit={handleSaveSession} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Class Status
                  </label>
                  <select
                    value={classStatus}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setClassStatus(e.target.value as 'UPCOMING' | 'LIVE' | 'COMPLETED')}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
                  >
                    <option value="UPCOMING">UPCOMING (Scheduled)</option>
                    <option value="LIVE">LIVE (Starting Now / In Session)</option>
                    <option value="COMPLETED">COMPLETED (Archive Ready)</option>
                  </select>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                    1. Live Class Join Details (Zoom / Google Meet)
                  </span>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Zoom / Google Meet Join URL
                    </label>
                    <input
                      type="url"
                      required
                      value={joinUrl}
                      onChange={(e) => setJoinUrl(e.target.value)}
                      placeholder="https://zoom.us/j/98142385102?pwd=..."
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Meeting ID</label>
                      <input
                        type="text"
                        value={meetingId}
                        onChange={(e) => setMeetingId(e.target.value)}
                        placeholder="981 4238 5102"
                        className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Passcode</label>
                      <input
                        type="text"
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                        placeholder="VIAR2026"
                        className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                    2. Post-Class Recording & Notes
                  </span>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      HD Video Recording URL (YouTube / Vimeo / Cloud Embed)
                    </label>
                    <input
                      type="url"
                      value={recordingUrl}
                      onChange={(e) => setRecordingUrl(e.target.value)}
                      placeholder="https://www.youtube.com/embed/..."
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Class Notes / Summary (Markdown Supported)
                    </label>
                    <textarea
                      rows={3}
                      value={notesMarkdown}
                      onChange={(e) => setNotesMarkdown(e.target.value)}
                      placeholder="### Key Takeaways from Class..."
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none"
                    ></textarea>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setEditingClass(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="gold-button px-6 py-2.5 rounded-xl text-xs font-bold"
                  >
                    Save Session Settings
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 18 Classes Grid */}
        <div className="space-y-3">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="cosmic-card p-5 rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-amber-500/30 transition"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-sm border border-amber-500/30 shrink-0">
                  {cls.classNumber}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{cls.title}</h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        cls.status === 'COMPLETED'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : cls.status === 'LIVE'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {cls.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Scheduled: {formatInTimezone(cls.scheduledStartTime, 'Asia/Kolkata', 'short')} IST ({cls.durationMinutes} mins)
                  </p>
                  <p className="text-xs text-slate-500 truncate max-w-xl mt-0.5">
                    Link: {cls.joinUrl}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {cls.recording && (
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    <Play className="w-3 h-3 fill-current" />
                    <span>Recording Attached</span>
                  </span>
                )}

                <button
                  onClick={() => handleOpenEdit(cls)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition inline-flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5 text-amber-400" />
                  <span>Configure Link / Replay</span>
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
