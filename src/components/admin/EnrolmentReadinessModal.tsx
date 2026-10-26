'use client';

import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Video,
  FileQuestion,
  CreditCard,
  Mail,
  UserCheck,
  Lock,
} from 'lucide-react';
import type { Course } from '@/lib/types';

interface EnrolmentReadinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  course: Course;
  realVideosCount: number;
  totalLessonsCount: number;
  examQuestionCount: number;
  priceSet: boolean;
  upiSet: boolean;
  contactSet: boolean;
  studentTestDone: boolean;
}

export default function EnrolmentReadinessModal({
  isOpen,
  onClose,
  onConfirm,
  course,
  realVideosCount,
  totalLessonsCount,
  examQuestionCount,
  priceSet,
  upiSet,
  contactSet,
  studentTestDone,
}: EnrolmentReadinessModalProps) {
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Checklist criteria checks
  const criteria = [
    {
      id: 'videos',
      title: 'Lessons with Real Content',
      detail:
        realVideosCount > 0
          ? `${realVideosCount} of ${totalLessonsCount} lessons have verified video lectures.`
          : `${totalLessonsCount} lessons, 0 with a video. (Upload videos in course builder to mark ready).`,
      isMet: realVideosCount > 0 && realVideosCount >= Math.min(10, totalLessonsCount),
      icon: <Video className="w-4 h-4" />,
    },
    {
      id: 'exam',
      title: 'Certification Exam',
      detail:
        examQuestionCount >= 20
          ? `${examQuestionCount} of 20 official exam questions active in question bank.`
          : `${examQuestionCount} of 20 questions configured. Target 20 questions for student certification.`,
      isMet: examQuestionCount >= 20,
      icon: <FileQuestion className="w-4 h-4" />,
    },
    {
      id: 'payments',
      title: 'Tuition & Payment Settings',
      detail:
        priceSet && upiSet
          ? `Tuition price locked (₹${course.priceInr.toLocaleString('en-IN')}) and UPI QR/VPA active.`
          : 'Tuition price or bank UPI settings are incomplete.',
      isMet: priceSet && upiSet,
      icon: <CreditCard className="w-4 h-4" />,
    },
    {
      id: 'contact',
      title: 'Public Contact Information',
      detail: contactSet
        ? 'Public WhatsApp number & verified inquiry email confirmed.'
        : 'Academy contact information is missing or unverified.',
      isMet: contactSet,
      icon: <Mail className="w-4 h-4" />,
    },
    {
      id: 'test_student',
      title: 'Student Test Run Completed',
      detail: studentTestDone
        ? 'Verified walkthrough of student checkout and portal access completed.'
        : 'No student test purchase or enrollment verified yet.',
      isMet: studentTestDone,
      icon: <UserCheck className="w-4 h-4" />,
    },
  ];

  const allMet = criteria.every((c) => c.isMet);
  const isConfirmMatch = confirmationInput.trim().toUpperCase() === 'CONFIRM';
  const canActivate = allMet || isConfirmMatch;

  const handleActivate = async () => {
    if (!canActivate || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update enrolment settings.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl cosmic-card rounded-2xl border border-white/10 shadow-2xl overflow-hidden bg-[#0a0e1a] text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Enrolment Launch Readiness</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Review launch checklist before enabling online registrations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Checklist Items */}
          <div className="space-y-3">
            {criteria.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition flex items-start gap-3 ${
                  item.isMet
                    ? 'bg-emerald-500/[0.05] border-emerald-500/20'
                    : 'bg-amber-500/[0.05] border-amber-500/25'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {item.isMet ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      {item.title}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.isMet
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {item.isMet ? 'Ready' : 'Incomplete'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Warning & Confirmation Requirement if any incomplete */}
          {!allMet && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-200 leading-relaxed">
                  <strong className="text-amber-100 font-bold block mb-1">
                    Course Content Incomplete:
                  </strong>
                  Some launch items are not yet ready (for example, real lecture videos have not been uploaded).
                  You may still activate enrolments to test or accept pre-registrations, but only after typing{' '}
                  <strong className="text-white font-mono bg-amber-500/30 px-1 py-0.5 rounded">
                    CONFIRM
                  </strong>{' '}
                  below.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Type <strong className="text-amber-300 font-mono">CONFIRM</strong> to authorize opening enrolments:
                </label>
                <input
                  type="text"
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  placeholder="CONFIRM"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-amber-500/40 text-white font-mono text-xs focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-white/[0.02] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleActivate}
            disabled={!canActivate || isSubmitting}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              canActivate && !isSubmitting
                ? 'gold-button text-black font-extrabold shadow-lg shadow-amber-500/20 cursor-pointer'
                : 'bg-white/10 text-slate-400 border border-white/10 cursor-not-allowed opacity-60'
            }`}
          >
            {isSubmitting ? (
              <span>Updating...</span>
            ) : allMet ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-950" />
                <span>Open Enrolments</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>I Understand, Open Enrolments</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
