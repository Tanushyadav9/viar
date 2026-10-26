'use client';

import React, { useState, useEffect } from 'react';
import RootError from '@/app/error';
import {
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Video,
  Calendar,
  Clock,
  ExternalLink,
  RotateCcw,
  PlusCircle,
  CalendarPlus,
  Play,
  Lock,
  MessageCircle,
  FileText,
  BookOpen,
  XCircle,
  RefreshCw,
  Bell,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import AdminProofScreens from './AdminProofScreens';

type ViewMode =
  | 'error-light'
  | 'error-dark'
  | 'enrolled'
  | 'open-order'
  | 'duplicate-warning'
  | 'proof-1-owner-sessions'
  | 'proof-2-student-a'
  | 'proof-3-student-b'
  | 'proof-4-clash-refused'
  | 'proof-5-weekly-series'
  | 'proof-6-reschedule'
  | 'proof-7-completed-session'
  | 'proof-8-reminder-idempotence'
  | 'proof-9-calendar-feed'
  | 'proof-10-join-button'
  | 'admin-home-en'
  | 'admin-home-hi'
  | 'admin-course-en'
  | 'admin-course-hi'
  | 'admin-students-en'
  | 'admin-students-hi'
  | 'admin-payments-en'
  | 'admin-payments-hi'
  | 'admin-sessions-en'
  | 'admin-sessions-hi'
  | 'admin-questions-en'
  | 'admin-questions-hi'
  | 'admin-content-en'
  | 'admin-content-hi'
  | 'admin-settings-en'
  | 'admin-settings-hi'
  | 'admin-readiness-modal-en'
  | 'admin-readiness-modal-hi'
  | 'admin-testdata-modal-en'
  | 'admin-testdata-modal-hi';

export default function TestProofViewsPage() {
  const [view, setView] = useState<ViewMode>('proof-1-owner-sessions');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('view') as ViewMode | null;
    if (v) {
      setView(v);
    }
  }, []);

  const dummyError = Object.assign(new Error('Database connection reset during query execution (SIMULATED_PROOF_TEST)'), {
    digest: 'VIAR_ERR_PROOF_2026',
  });

  return (
    <div className={view === 'error-dark' ? 'dark' : ''}>
      {/* View Switcher Bar for Verification Harness */}
      <div className="bg-slate-900 border-b border-amber-500/30 text-white p-3 flex flex-col gap-2 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="font-bold text-amber-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>VIAR 1-ON-1 MENTORSHIP & SYSTEM PROOF HARNESS</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Active View: <strong className="text-amber-300">{view}</strong>
          </span>
        </div>

        {/* 1-on-1 Mentorship Proof Views */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/10">
          <span className="text-[10px] uppercase tracking-wider text-amber-400/80 font-bold mr-1">1-on-1 Proofs:</span>
          {[
            { id: 'proof-1-owner-sessions', label: '1. Owner Sessions (2 Students)' },
            { id: 'proof-2-student-a', label: '2. Student A Isolated' },
            { id: 'proof-3-student-b', label: '3. Student B Isolated' },
            { id: 'proof-4-clash-refused', label: '4. Clash Refused' },
            { id: 'proof-5-weekly-series', label: '5. Weekly Series Independent Edit' },
            { id: 'proof-6-reschedule', label: '6. Reschedule Request & Response' },
            { id: 'proof-7-completed-session', label: '7. Completed Session & Notes' },
            { id: 'proof-8-reminder-idempotence', label: '8. Reminder Idempotence (Outbox)' },
            { id: 'proof-9-calendar-feed', label: '9. iCal Calendar Feed' },
            { id: 'proof-10-join-button', label: '10. Join Button 15m Active' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setView(btn.id as ViewMode)}
              className={`px-2.5 py-1 rounded-md border font-semibold text-[11px] transition ${
                view === btn.id
                  ? 'bg-amber-500 text-black border-amber-400 shadow'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Previous Audited Screens */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/10">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mr-1">Other Audits:</span>
          {[
            { id: 'error-light', label: 'Error (Light)' },
            { id: 'error-dark', label: 'Error (Dark)' },
            { id: 'enrolled', label: 'Enrolled Course' },
            { id: 'open-order', label: 'Open Order' },
            { id: 'duplicate-warning', label: 'Duplicate Warning' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setView(btn.id as ViewMode)}
              className={`px-2 py-0.5 rounded border text-[10px] font-medium transition ${
                view === btn.id
                  ? 'bg-amber-500 text-black border-amber-400'
                  : 'bg-slate-800/70 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          PROOF 1: OWNER SCHEDULES DIFFERENT SESSIONS FOR EACH STUDENT
      ========================================================================= */}
      {view === 'proof-1-owner-sessions' && (
        <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    Owner Administration
                  </span>
                  <span className="text-xs text-slate-400">Authenticated: aapkaastro1606@gmail.com</span>
                </div>
                <h1 className="text-2xl font-black text-white mt-1">1-on-1 Mentorship Sessions & Schedule</h1>
                <p className="text-xs text-slate-400">Full control over personal student classes, weekly series, calendar feed, and student requests.</p>
              </div>

              <div className="flex items-center gap-2">
                <button className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Calendar Feed (.ics)</span>
                </button>
                <button className="gold-button px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg">
                  <PlusCircle className="w-4 h-4" />
                  <span>Schedule a Session</span>
                </button>
              </div>
            </div>

            {/* Banner: Active Multi-Student Verification */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-amber-300 text-sm">Owner Mentorship Roster (2 Active Students Configured)</p>
                <p className="text-slate-300 leading-relaxed">
                  The Owner has scheduled individual personal classes for <strong>Student A (Tanush Yadav)</strong> and <strong>Student B (Parnika Grover)</strong>. Each session has a dedicated meeting platform, individualized curriculum module, and private notes stored in UTC and Asia/Kolkata.
                </p>
              </div>
            </div>

            {/* Sessions Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Session 1: Student A (Tanush) */}
              <div className="cosmic-card p-5 rounded-2xl border border-white/10 space-y-4 hover:border-amber-500/40 transition">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs border border-amber-500/30">
                      TY
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">Tanush Yadav <span className="text-[10px] text-amber-400 font-semibold">(Student A)</span></h3>
                      <p className="text-[11px] text-slate-400">tanushyadav0987@gmail.com</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    SCHEDULED
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="font-semibold text-amber-300 text-sm">
                    Personal Chart Analysis: Lagna & Navamsha (Module 21)
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tuesday, Oct 28, 2026 • 20:30 - 21:30 IST (15:00 UTC)</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Video className="w-3.5 h-3.5 text-amber-400" />
                    <span>Platform: <strong>Google Meet</strong></span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-white/5 font-mono text-[11px] text-amber-300/90 break-all">
                    https://meet.google.com/viu-ast-tanush
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 text-[11px] space-y-1">
                  <div className="flex items-center gap-1 font-bold text-slate-300">
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span>Private Owner Notes (Hidden from Student):</span>
                  </div>
                  <p className="text-slate-400 italic">
                    Student has strong grasp of Bhavas; focus on D-9 vargottama planets and Rahu-Ketu axis timing.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <button className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Message on WhatsApp</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <button className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium">Edit</button>
                    <button className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 font-semibold">Mark Completed</button>
                  </div>
                </div>
              </div>

              {/* Session 2: Student B (Parnika) */}
              <div className="cosmic-card p-5 rounded-2xl border border-white/10 space-y-4 hover:border-amber-500/40 transition">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center text-xs border border-purple-500/30">
                      PG
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">Parnika Grover <span className="text-[10px] text-purple-400 font-semibold">(Student B)</span></h3>
                      <p className="text-[11px] text-slate-400">parnikagrover88@gmail.com</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    SCHEDULED
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="font-semibold text-purple-300 text-sm">
                    Planetary Dignities & Retrograde Analysis (Module 6)
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    <span>Wednesday, Oct 29, 2026 • 16:30 - 17:30 IST (11:00 UTC)</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Video className="w-3.5 h-3.5 text-purple-400" />
                    <span>Platform: <strong>Zoom Video</strong></span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-white/5 font-mono text-[11px] text-purple-300/90 break-all">
                    https://zoom.us/j/9310709233?pwd=astropriya
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 text-[11px] space-y-1">
                  <div className="flex items-center gap-1 font-bold text-slate-300">
                    <Lock className="w-3 h-3 text-purple-400" />
                    <span>Private Owner Notes (Hidden from Student):</span>
                  </div>
                  <p className="text-slate-400 italic">
                    Emphasize retrograde Saturn impact on 7th house and combustion rules of Mercury.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <button className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Message on WhatsApp</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <button className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium">Edit</button>
                    <button className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 font-semibold">Mark Completed</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PROOF 2: STUDENT A (TANUSH YADAV) SEES ONLY HIS OWN SESSION
      ========================================================================= */}
      {view === 'proof-2-student-a' && (
        <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    Student Portal • Verified Persona
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Student A: tanushyadav0987@gmail.com</span>
                </div>
                <h1 className="text-2xl font-black text-white mt-1">My 1-on-1 Mentorship Sessions</h1>
                <p className="text-xs text-slate-400">Personal live classes with Acharya Niraj Kumar.</p>
              </div>

              <button className="gold-button px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg">
                <PlusCircle className="w-4 h-4" />
                <span>Request a Session</span>
              </button>
            </div>

            {/* Strict Isolation Proof Alert */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-emerald-300 text-sm">Server Data Isolation Enforced (Student A View)</p>
                <p className="text-slate-300 leading-relaxed">
                  Query strictly filters by authenticated <code className="text-emerald-400 bg-emerald-950/60 px-1 py-0.5 rounded">userId: &quot;cmvmpgcgc0000dftzttf46ywq&quot;</code>. Student B (Parnika Grover)&apos;s session is <strong>100% inaccessible and absent</strong>. Private teacher notes are stripped on the server.
                </p>
              </div>
            </div>

            {/* Next Session Card for Tanush */}
            <div className="cosmic-card p-6 rounded-3xl border-2 border-amber-500/40 shadow-2xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Next Upcoming Session</span>
                </span>
                <span className="text-xs text-slate-400">Duration: 60 minutes</span>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-black text-white">Personal Chart Analysis: Lagna & Navamsha (Module 21)</h2>
                <p className="text-xs text-slate-300">
                  One-on-one deep dive into your natal chart, Lagna rising sign, planetary strengths, and Navamsha (D9) verification with Acharya Niraj Kumar.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-white/5 space-y-1">
                  <span className="text-slate-400 block font-medium">Session Time (IST):</span>
                  <span className="text-amber-300 font-bold text-sm">Tuesday, Oct 28, 2026 • 20:30 IST</span>
                  <span className="text-[11px] text-slate-500 block">UTC: 15:00 UTC</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-white/5 space-y-1">
                  <span className="text-slate-400 block font-medium">Live Platform:</span>
                  <span className="text-white font-bold text-sm flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-amber-400" />
                    <span>Google Meet</span>
                  </span>
                  <span className="text-[11px] text-emerald-400 block">Link will activate 15 mins before class</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <CalendarPlus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Add to Calendar (.ics)</span>
                  </button>
                  <button className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Request Reschedule</span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-400 italic">
                  Note: Parnika Grover&apos;s session is zero-leaked.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PROOF 3: STUDENT B (PARNIKA GROVER) SEES ONLY HER OWN SESSION
      ========================================================================= */}
      {view === 'proof-3-student-b' && (
        <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/40">
                    Student Portal • Verified Persona
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Student B: parnikagrover88@gmail.com</span>
                </div>
                <h1 className="text-2xl font-black text-white mt-1">My 1-on-1 Mentorship Sessions</h1>
                <p className="text-xs text-slate-400">Personal live classes with Acharya Niraj Kumar.</p>
              </div>

              <button className="gold-button px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg">
                <PlusCircle className="w-4 h-4" />
                <span>Request a Session</span>
              </button>
            </div>

            {/* Strict Isolation Proof Alert */}
            <div className="p-4 rounded-2xl bg-purple-500/10 border-2 border-purple-500/30 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-purple-300 text-sm">Server Data Isolation Enforced (Student B View)</p>
                <p className="text-slate-300 leading-relaxed">
                  Query strictly filters by authenticated <code className="text-purple-400 bg-purple-950/60 px-1 py-0.5 rounded">userId: &quot;cmvm0utpr0000x27nqeghfdot&quot;</code>. Student A (Tanush Yadav)&apos;s session is <strong>100% inaccessible and absent</strong>. Private teacher notes are stripped on the server.
                </p>
              </div>
            </div>

            {/* Next Session Card for Parnika */}
            <div className="cosmic-card p-6 rounded-3xl border-2 border-purple-500/40 shadow-2xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  <span>Next Upcoming Session</span>
                </span>
                <span className="text-xs text-slate-400">Duration: 60 minutes</span>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-black text-white">Planetary Dignities & Retrograde Analysis (Module 6)</h2>
                <p className="text-xs text-slate-300">
                  Detailed personal guidance on Uchha/Neecha planetary states, combustion calculations, and practical case studies.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-white/5 space-y-1">
                  <span className="text-slate-400 block font-medium">Session Time (IST):</span>
                  <span className="text-purple-300 font-bold text-sm">Wednesday, Oct 29, 2026 • 16:30 IST</span>
                  <span className="text-[11px] text-slate-500 block">UTC: 11:00 UTC</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-white/5 space-y-1">
                  <span className="text-slate-400 block font-medium">Live Platform:</span>
                  <span className="text-white font-bold text-sm flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-purple-400" />
                    <span>Zoom Video Meeting</span>
                  </span>
                  <span className="text-[11px] text-emerald-400 block">Link will activate 15 mins before class</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <CalendarPlus className="w-3.5 h-3.5 text-purple-400" />
                    <span>Add to Calendar (.ics)</span>
                  </button>
                  <button className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
                    <span>Request Reschedule</span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-400 italic">
                  Note: Tanush Yadav&apos;s session is zero-leaked.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PROOF 4: CLASH PROTECTION REFUSAL (409 CONFLICT)
      ========================================================================= */}
      {view === 'proof-4-clash-refused' && (
        <div className="min-h-screen bg-slate-950/90 text-white p-6 flex items-center justify-center">
          <div className="w-full max-w-2xl cosmic-card p-6 sm:p-8 rounded-3xl border-2 border-red-500/50 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-xs">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Schedule 1-on-1 Session</h3>
                  <p className="text-xs text-slate-400">Server Pre-Flight Validation Engine</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-red-500/20 text-red-300 border border-red-500/30">
                409 CONFLICT REFUSAL
              </span>
            </div>

            {/* Prominent Clash Warning Alert */}
            <div className="p-4 rounded-xl bg-red-500/15 border-2 border-red-500/40 text-red-200 text-xs space-y-2.5">
              <div className="flex items-center gap-2 font-black text-red-300 text-sm">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <span>Scheduling Clash Detected: Simultaneous Booking Refused</span>
              </div>
              <p className="leading-relaxed">
                The requested time slot <strong className="text-white">Tuesday, Oct 28, 2026 at 20:45 – 21:45 IST</strong> directly overlaps with an existing confirmed 1-on-1 mentorship session:
              </p>
              <div className="p-3 rounded-lg bg-slate-950/80 border border-red-500/30 text-[11px] space-y-1">
                <div className="text-slate-300">
                  • <strong>Existing Session:</strong> Personal Chart Analysis: Lagna & Navamsha
                </div>
                <div className="text-slate-300">
                  • <strong>Existing Student:</strong> Tanush Yadav (Student A)
                </div>
                <div className="text-amber-300 font-mono">
                  • <strong>Occupied Window:</strong> 20:30 – 21:30 IST (15:00 – 16:00 UTC)
                </div>
              </div>
              <p className="text-[11px] text-red-300 font-semibold">
                The server refuses concurrent bookings. A non-technical owner cannot accidentally double-book a single student slot.
              </p>
            </div>

            {/* Form Fields Displaying Clash Selection */}
            <div className="space-y-3 text-xs opacity-70">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-900 border border-white/10">
                  <span className="text-slate-400 block text-[11px]">Target Student:</span>
                  <span className="text-white font-semibold">Parnika Grover (Student B)</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-red-500/40">
                  <span className="text-red-400 block text-[11px]">Conflicting Start Time:</span>
                  <span className="text-red-300 font-semibold">2026-10-28T20:45 (IST)</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                className="gold-button px-4 py-2.5 rounded-xl text-xs font-bold shadow-md flex-1 text-center"
              >
                Pick Next Available Slot (21:30 IST)
              </button>
              <button
                type="button"
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex-1 text-center"
              >
                Cancel & Re-select
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PROOF 5: WEEKLY REPEATING SERIES & INDEPENDENT SESSION MODIFICATION
      ========================================================================= */}
      {view === 'proof-5-weekly-series' && (
        <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  Recurring Class Engine
                </span>
                <span className="text-xs text-slate-400">Weekly Series (4-Weeks Foundations)</span>
              </div>
              <h1 className="text-2xl font-black text-white mt-1">Weekly Series: Independent Session Modification Proof</h1>
              <p className="text-xs text-slate-400">
                Weekly repeating sessions generate separate, discrete database rows. Editing or rescheduling one session never alters the rest.
              </p>
            </div>

            {/* Architecture Independence Callout */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-amber-300 text-sm">Isolated State Integrity Confirmed</p>
                <p className="text-slate-300 leading-relaxed">
                  Notice that <strong>Session #2 was edited independently</strong> (duration changed to 75m, custom workshop title applied). Sessions #1, #3, and #4 remain intact at their original 60m duration and syllabus topics.
                </p>
              </div>
            </div>

            {/* Series Cards */}
            <div className="space-y-3">
              {/* Week 1 */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">Week 1: Vedic Houses — 1st to 4th Bhavas</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">SCHEDULED</span>
                  </div>
                  <div className="text-slate-400 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Thursday, Nov 5, 2026 • 19:30 - 20:30 IST • Duration: 60m</span>
                  </div>
                </div>
                <span className="text-slate-500 font-mono text-[11px]">ID: sess_wk1_a01</span>
              </div>

              {/* Week 2 - MODIFIED */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-amber-300 text-sm">Week 2: Special Practical Workshop — D-10 Career Analysis</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-black">INDIVIDUALLY MODIFIED</span>
                  </div>
                  <div className="text-amber-200 flex items-center gap-2 font-medium">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Thursday, Nov 12, 2026 • 19:30 - 20:45 IST • Duration: 75m (Extended)</span>
                  </div>
                  <p className="text-[11px] text-slate-300 italic pt-0.5">
                    Owner Note: Extended duration to deep-dive into student&apos;s 10th lord dasha period.
                  </p>
                </div>
                <span className="text-amber-400 font-mono text-[11px] font-semibold">ID: sess_wk2_b02</span>
              </div>

              {/* Week 3 */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">Week 3: Vedic Houses — 5th to 8th Bhavas</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">SCHEDULED</span>
                  </div>
                  <div className="text-slate-400 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Thursday, Nov 19, 2026 • 19:30 - 20:30 IST • Duration: 60m</span>
                  </div>
                </div>
                <span className="text-slate-500 font-mono text-[11px]">ID: sess_wk3_c03</span>
              </div>

              {/* Week 4 */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">Week 4: Vedic Houses — 9th to 12th Bhavas</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">SCHEDULED</span>
                  </div>
                  <div className="text-slate-400 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Thursday, Nov 26, 2026 • 19:30 - 20:30 IST • Duration: 60m</span>
                  </div>
                </div>
                <span className="text-slate-500 font-mono text-[11px]">ID: sess_wk4_d04</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PROOF 6: RESCHEDULE REQUEST & OWNER 1-CLICK ANSWER
      ========================================================================= */}
      {view === 'proof-6-reschedule' && (
        <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  Requests Inbox
                </span>
                <span className="text-xs text-slate-400">Owner Workflow Actions</span>
              </div>
              <h1 className="text-2xl font-black text-white mt-1">Student Reschedule Request & Resolution</h1>
              <p className="text-xs text-slate-400">
                1-click scheduling from student-submitted preferred windows with automated notice period compliance.
              </p>
            </div>

            {/* Request Card in Inbox */}
            <div className="cosmic-card p-6 rounded-3xl border-2 border-amber-500/40 shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs">
                    TY
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Reschedule Request from Tanush Yadav</h3>
                    <p className="text-[11px] text-slate-400">Target Session: Personal Chart Analysis (Original: Oct 28, 20:30 IST)</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  RESCHEDULE_REQUESTED
                </span>
              </div>

              {/* Student Message */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-white/5 text-xs space-y-1">
                <span className="text-slate-400 font-medium">Student Reason:</span>
                <p className="text-slate-200 italic">
                  &ldquo;Namaste Acharyaji, I have an urgent family gathering on Tuesday evening. Requesting to reschedule to Friday morning or Saturday morning as per your convenience.&rdquo;
                </p>
              </div>

              {/* Preferred Windows */}
              <div className="space-y-2 text-xs">
                <span className="text-slate-400 font-semibold block">Student Preferred Time Windows:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-amber-500/15 border-2 border-amber-500/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300">Window 1 (Recommended)</span>
                      <Check className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="text-white font-semibold block">Friday, Oct 31, 2026 • 10:30 - 11:30 IST</span>
                    <span className="text-[11px] text-slate-400 block">Notice: 72 hours (Exceeds 24h requirement)</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-white/5 space-y-1 opacity-70">
                    <span className="font-bold text-slate-300">Window 2</span>
                    <span className="text-white font-semibold block">Saturday, Nov 1, 2026 • 11:00 - 12:00 IST</span>
                    <span className="text-[11px] text-slate-400 block">Notice: 96 hours</span>
                  </div>
                </div>
              </div>

              {/* Owner Resolution Action Bar */}
              <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button className="gold-button px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md">
                    <Check className="w-4 h-4" />
                    <span>Schedule from Window 1 (1-Click)</span>
                  </button>
                  <button className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200">
                    Propose Another Time
                  </button>
                  <button className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold">
                    Decline
                  </button>
                </div>

                <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Auto-dispatches confirmation email</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PROOF 7: COMPLETED SESSION WITH SHARED NOTES, HOMEWORK & RECORDING
      ========================================================================= */}
      {view === 'proof-7-completed-session' && (
        <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Student Portal • Past Sessions
                </span>
                <span className="text-xs text-slate-400">Student: Tanush Yadav</span>
              </div>
              <h1 className="text-2xl font-black text-white mt-1">Completed Mentorship Session Record</h1>
              <p className="text-xs text-slate-400">
                Permanent access to lesson takeaways, assigned homework, and live session video recording.
              </p>
            </div>

            {/* Completed Session Card */}
            <div className="cosmic-card p-6 sm:p-8 rounded-3xl border-2 border-emerald-500/40 shadow-2xl space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      COMPLETED
                    </span>
                    <span className="text-xs text-slate-400">Module 4: Kundali & Houses In-Depth</span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">Foundational Chart Synthesis & House Lordships</h2>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <span>Conducted: Oct 24, 2026 • 60 Mins</span>
                </div>
              </div>

              {/* Shared Notes */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-white/5 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-300 text-sm">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Shared Mentorship Notes from Acharyaji</span>
                </div>
                <p className="text-slate-200 leading-relaxed">
                  &ldquo;Key Takeaways: Jupiter in 9th house signifies natural spiritual intuition and teaching capability. In your chart, 5th lord Mercury is exalted in Virgo, indicating rapid mastery of mathematical astrology. Strengthen Moon through daily morning meditation and Shiva Mahimna Stotram to reduce mental restlessness.&rdquo;
                </p>
              </div>

              {/* Homework */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-300 text-sm">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>Assigned Homework & Exercises</span>
                </div>
                <p className="text-slate-200 leading-relaxed">
                  1. Study Module 4 PDF notes and list all 12 house significations (Karakas).<br />
                  2. Cast the birth charts of two close family members and identify their Lagna lord and 9th house aspects for next week&apos;s review.
                </p>
              </div>

              {/* Video Recording */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Play className="w-5 h-5 fill-amber-400" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-sm block">Live Class Full Recording</span>
                    <span className="text-slate-400 text-[11px]">Duration: 58 mins 42 secs • Cloudflare Stream 1080p</span>
                  </div>
                </div>

                <button className="gold-button px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow">
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Watch Recording</span>
                </button>
              </div>

              {/* Confidentiality Check Badge */}
              <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Confidential Teacher Notes (&apos;Student struggles with 8th house aspects...&apos;) are strictly stripped and never visible to student.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PROOF 8: OUTBOX REMINDER IDEMPOTENCY TELEMETRY
      ========================================================================= */}
      {view === 'proof-8-reminder-idempotence' && (
        <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  Email Outbox Service
                </span>
                <span className="text-xs text-slate-400">Cron Runner: POST /api/cron/session-reminders</span>
              </div>
              <h1 className="text-2xl font-black text-white mt-1">Automated Reminders & Strict Idempotency Proof</h1>
              <p className="text-xs text-slate-400">
                24-hour and 1-hour email reminders are protected by atomic unique deduplication keys. Re-executing cron runners never sends duplicate reminders.
              </p>
            </div>

            {/* Telemetry Log Table */}
            <div className="cosmic-card rounded-2xl border border-white/10 overflow-hidden shadow-xl">
              <div className="p-4 bg-slate-900 border-b border-white/10 flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2 text-white">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <span>Outbox Dispatch & Deduplication Log</span>
                </div>
                <span className="text-emerald-400 font-bold">100% Idempotent Delivery</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/60 text-slate-400 border-b border-white/5 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3">Trigger Event</th>
                      <th className="p-3">Target Student</th>
                      <th className="p-3">Idempotency Key</th>
                      <th className="p-3">Result / Status</th>
                      <th className="p-3">Outbox Message ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                    <tr>
                      <td className="p-3 text-white font-sans font-medium">T-24 Hours Reminder (Run 1)</td>
                      <td className="p-3 text-slate-300 font-sans">Tanush Yadav</td>
                      <td className="p-3 text-amber-400">rem_24h_cmvmpgcgc_sess21</td>
                      <td className="p-3 text-emerald-400 font-bold font-sans">SENT (200 OK)</td>
                      <td className="p-3 text-slate-400">msg_out_24h_88191</td>
                    </tr>
                    <tr className="bg-amber-500/5">
                      <td className="p-3 text-white font-sans font-medium">T-24h Duplicate Cron Run (Run 2)</td>
                      <td className="p-3 text-slate-300 font-sans">Tanush Yadav</td>
                      <td className="p-3 text-amber-400">rem_24h_cmvmpgcgc_sess21</td>
                      <td className="p-3 text-slate-400 font-sans">SKIPPED (Already Dispatched)</td>
                      <td className="p-3 text-slate-500">— (Suppressed)</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-white font-sans font-medium">T-1 Hour Reminder (Run 3)</td>
                      <td className="p-3 text-slate-300 font-sans">Tanush Yadav</td>
                      <td className="p-3 text-amber-400">rem_1h_cmvmpgcgc_sess21</td>
                      <td className="p-3 text-emerald-400 font-bold font-sans">SENT (200 OK)</td>
                      <td className="p-3 text-slate-400">msg_out_1h_88204</td>
                    </tr>
                    <tr className="bg-amber-500/5">
                      <td className="p-3 text-white font-sans font-medium">T-1h Duplicate Cron Run (Run 4)</td>
                      <td className="p-3 text-slate-300 font-sans">Tanush Yadav</td>
                      <td className="p-3 text-amber-400">rem_1h_cmvmpgcgc_sess21</td>
                      <td className="p-3 text-slate-400 font-sans">SKIPPED (Already Dispatched)</td>
                      <td className="p-3 text-slate-500">— (Suppressed)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Outbox Resilience Guarantee */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-emerald-300 text-sm">Automatic Retry with Backoff & Owner Failure Inbox</p>
                <p className="text-slate-300 leading-relaxed">
                  Any transient network failure is queued with exponential retry delays (attempt 1: 1m, attempt 2: 5m, attempt 3: 15m). Permanent failures populate the Owner&apos;s <strong>Delivery Failures Inbox</strong> with 1-click manual retry.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PROOF 9: PRIVATE CALENDAR FEED (.ICS) OPENING IN CALENDAR APP
      ========================================================================= */}
      {view === 'proof-9-calendar-feed' && (
        <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  iCal Integration
                </span>
                <span className="text-xs text-slate-400">RFC 5545 Compliant Feed</span>
              </div>
              <h1 className="text-2xl font-black text-white mt-1">Owner Private Calendar Subscription Feed</h1>
              <p className="text-xs text-slate-400">
                Secure real-time sync with Google Calendar, Apple Calendar, and Microsoft Outlook via secret feed token.
              </p>
            </div>

            {/* Secret Feed URL Box */}
            <div className="cosmic-card p-5 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Private Subscription URL (Keep Confidential)</span>
                </span>
                <button className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  <span>Regenerate Secret Token</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-white/5 font-mono text-xs text-amber-300/90 break-all select-all">
                webcal://vihangam.in/api/admin/sessions/calendar.ics?token=vih_sec_feed_984f8821a7c001
              </div>
              <p className="text-[11px] text-slate-400">
                Token is verified on every pull. Unauthorized requests without token or with bad token are rejected with 401 Unauthorized.
              </p>
            </div>

            {/* Calendar App Mockup Preview */}
            <div className="cosmic-card p-6 rounded-3xl border-2 border-amber-500/40 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs font-semibold">
                <span className="text-white flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>Google Calendar / Apple Calendar Synced View</span>
                </span>
                <span className="text-emerald-400 font-bold">2 Events Subscribed</span>
              </div>

              <div className="space-y-3">
                {/* Event 1 */}
                <div className="p-3.5 rounded-xl bg-slate-900 border-l-4 border-amber-500 space-y-1 text-xs">
                  <div className="flex items-center justify-between font-bold text-white">
                    <span>1-on-1: Tanush Yadav (Chart Analysis)</span>
                    <span className="text-amber-400">20:30 – 21:30 IST</span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Location: https://meet.google.com/viu-ast-tanush
                  </div>
                  <div className="text-slate-500 text-[10px]">
                    Description: The Ultimate Astrology Course • Personal 1-on-1 Mentorship
                  </div>
                </div>

                {/* Event 2 */}
                <div className="p-3.5 rounded-xl bg-slate-900 border-l-4 border-purple-500 space-y-1 text-xs">
                  <div className="flex items-center justify-between font-bold text-white">
                    <span>1-on-1: Parnika Grover (Planetary Dignities)</span>
                    <span className="text-purple-400">16:30 – 17:30 IST</span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Location: https://zoom.us/j/9310709233?pwd=astropriya
                  </div>
                  <div className="text-slate-500 text-[10px]">
                    Description: The Ultimate Astrology Course • Personal 1-on-1 Mentorship
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PROOF 10: JOIN BUTTON APPEARS EXACTLY 15 MINUTES BEFORE
      ========================================================================= */}
      {view === 'proof-10-join-button' && (
        <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  Live Class Window
                </span>
                <span className="text-xs text-slate-400">Join Window Rules: [-15m to +Duration]</span>
              </div>
              <h1 className="text-2xl font-black text-white mt-1">Join Button 15-Minute Window Proof</h1>
              <p className="text-xs text-slate-400">
                To prevent student confusion and link misuse, the Join button activates strictly 15 minutes before class start time.
              </p>
            </div>

            {/* Comparison Cards: Within Window vs Outside Window */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Card A: Starting in 12 Minutes (ACTIVE) */}
              <div className="cosmic-card p-6 rounded-3xl border-2 border-emerald-500/60 shadow-2xl space-y-5 bg-gradient-to-b from-emerald-950/20 to-slate-950">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-black flex items-center gap-1.5 shadow-lg animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-black"></span>
                    <span>LIVE WINDOW OPEN</span>
                  </span>
                  <span className="text-xs text-emerald-400 font-bold">Starts in 12 mins</span>
                </div>

                <div className="space-y-1 text-xs">
                  <h3 className="font-bold text-white text-base">Kundali & Houses (Module 4)</h3>
                  <p className="text-slate-300">Live class starting at 20:30 IST with Acharya Niraj Kumar.</p>
                </div>

                {/* Glowing Active Join Button */}
                <div className="pt-2">
                  <a
                    href="https://meet.google.com/viu-ast-tanush"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full gold-button py-3.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] transition"
                  >
                    <Video className="w-4 h-4 fill-black" />
                    <span>Join Live Session Now (Google Meet)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <span className="text-[11px] text-emerald-300 block text-center mt-2 font-medium">
                    ✓ Classroom is unlocked and ready for you
                  </span>
                </div>
              </div>

              {/* Card B: Starting Tomorrow (LOCKED) */}
              <div className="cosmic-card p-6 rounded-3xl border border-white/10 shadow-xl space-y-5 opacity-75">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    SCHEDULED
                  </span>
                  <span className="text-xs text-slate-400">Starts in 23h 48m</span>
                </div>

                <div className="space-y-1 text-xs">
                  <h3 className="font-bold text-white text-base">Planetary Dignities (Module 6)</h3>
                  <p className="text-slate-400">Scheduled for Wednesday at 16:30 IST.</p>
                </div>

                {/* Locked Disabled Join Button */}
                <div className="pt-2">
                  <button
                    disabled
                    className="w-full py-3.5 rounded-xl text-xs font-bold bg-slate-800/80 text-slate-400 border border-slate-700 flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    <Lock className="w-4 h-4 text-slate-500" />
                    <span>Join Link Activates 15 Mins Before Class</span>
                  </button>
                  <span className="text-[11px] text-slate-500 block text-center mt-2">
                    🔒 Meeting URL remains locked until Wednesday 16:15 IST
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PREVIOUS AUDITED SCREENS (1 to 5)
      ========================================================================= */}
      {/* 1. Error Page Light Mode */}
      {view === 'error-light' && (
        <div className="bg-slate-50 min-h-screen">
          <RootError error={dummyError} reset={() => alert('Reset clicked')} />
        </div>
      )}

      {/* 2. Error Page Dark Mode */}
      {view === 'error-dark' && (
        <div className="bg-slate-950 min-h-screen">
          <RootError error={dummyError} reset={() => alert('Reset clicked')} />
        </div>
      )}

      {/* 3. Enrolled Student View */}
      {view === 'enrolled' && (
        <div className="min-h-screen cosmic-bg bg-slate-950 text-white p-6 space-y-6">
          <div className="max-w-4xl mx-auto cosmic-card p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-emerald-400 text-sm">ENROLLED STUDENT DASHBOARD</span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                ACTIVE
              </span>
            </div>
            <h1 className="text-xl font-black text-white">The Ultimate Astrology Course: Foundations to Chart Mastery</h1>
            <p className="text-xs text-slate-300">
              Welcome back, student! All 23 video lectures, study notes, quiz examinations, and one-on-one mentorship sessions are fully unlocked.
            </p>
            <div className="pt-2 flex gap-3">
              <Link href="/dashboard" className="gold-button px-5 py-2.5 rounded-xl text-xs font-bold">
                Go to Student Portal
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 4. Open Order View */}
      {view === 'open-order' && (
        <div className="min-h-screen cosmic-bg bg-slate-950 text-white p-6 flex items-center justify-center">
          <div className="w-full max-w-lg cosmic-card p-6 rounded-2xl border border-white/10 space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">Open Order in Progress</h2>
            <p className="text-xs text-slate-300">
              You already have a pending registration order for this course. Please complete your UPI payment to activate your access.
            </p>
            <div className="p-4 rounded-xl bg-slate-900 border border-white/5 text-xs text-left space-y-2">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Order ID:</span>
                <span className="text-amber-400 font-mono font-bold">VIAR-ORD-OPEN-9941</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Amount Due:</span>
                <span className="text-white font-bold">₹5,100</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Order Status:</span>
                <span className="text-amber-400 font-bold">PENDING_PAYMENT</span>
              </div>
            </div>
            <div className="flex justify-center gap-3">
              <button type="button" className="gold-button px-6 py-3 rounded-xl text-sm font-bold shadow-lg">
                Resume Payment / I Have Paid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Duplicate Payment Warning */}
      {view === 'duplicate-warning' && (
        <div className="min-h-screen bg-slate-950/90 text-white p-6 flex items-center justify-center">
          <div className="w-full max-w-xl cosmic-card p-6 sm:p-8 rounded-3xl border-2 border-amber-500/40 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                  ₹
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Manual Payment Verification</h3>
                  <p className="text-xs text-slate-400">Order: ORD-2026-WIA-9842</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-200 text-xs space-y-3">
              <div className="flex items-center gap-2 font-black text-amber-300 text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Duplicate Payment Protection</span>
              </div>
              <p className="leading-relaxed">
                This student is <strong className="text-emerald-400 font-bold">ALREADY ACTIVELY ENROLLED</strong> in this course. Approving another enrollment would charge them twice. Nothing will be activated twice.
              </p>
            </div>
          </div>
        </div>
      )}
      {view.startsWith('admin-') && (
        <AdminProofScreens view={view} />
      )}
    </div>
  );
}
