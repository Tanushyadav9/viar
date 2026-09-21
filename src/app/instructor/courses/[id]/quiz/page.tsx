'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import InstructorNav from '@/components/InstructorNav';
import { ViarStore } from '@/lib/store';
import { FinalTest, Course } from '@/lib/types';

export default function InstructorQuizEditorPage() {
  const params = useParams();
  const courseId = (params?.id as string) || 'course-what-is-astrology';

  const [test, setTest] = useState<FinalTest | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [passingPercentage, setPassingPercentage] = useState(70);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const crs = ViarStore.getCourseById(courseId) || ViarStore.getCourses()[0];
    if (crs) setCourse(crs);

    const t = ViarStore.getFinalTest();
    setTest(t);
    setPassingPercentage(t.passingPercentage);
  }, [courseId]);

  const handleUpdatePassingPercentage = (val: number) => {
    setPassingPercentage(val);
    if (test) {
      test.passingPercentage = val;
    }
    setSuccessMsg('Passing threshold updated to ' + val + '%');
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  if (!test) {
    return (
      <div className="min-h-screen cosmic-bg flex items-center justify-center p-4">
        <Sparkles className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

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

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Final Exam Builder
              </span>
              <span className="text-xs text-slate-400">{test.questions.length} Questions</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Certification Assessment Builder
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Configure the graded quiz for &ldquo;{course?.title || 'What is Astrology'}&rdquo;. Students must pass to earn verified certificates.
            </p>
          </div>

          <div className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.04] border border-white/10 shrink-0">
            <div>
              <label className="text-[11px] text-slate-400 block font-semibold">Passing Threshold:</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  min={50}
                  max={100}
                  value={passingPercentage}
                  onChange={(e) => handleUpdatePassingPercentage(parseInt(e.target.value) || 70)}
                  className="w-16 px-2 py-1 rounded-lg bg-[#111827] border border-white/20 text-center font-bold text-amber-300 text-sm focus:outline-none"
                />
                <span className="text-xs font-bold text-white">% Required</span>
              </div>
            </div>
          </div>
        </div>

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Questions List */}
        <div className="space-y-4">
          {test.questions.map((q, idx) => (
            <div
              key={q.id}
              className="cosmic-card p-6 rounded-2xl border border-white/10 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      {q.question}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {q.explanation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 ml-10 pt-2">
                {q.options.map((opt, optIdx) => {
                  const isCorrect = optIdx === q.correctOptionIndex;
                  return (
                    <div
                      key={optIdx}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                        isCorrect
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-semibold'
                          : 'bg-white/[0.02] border-white/5 text-slate-300'
                      }`}
                    >
                      <span>{opt}</span>
                      {isCorrect && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-300">
                          Correct
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
