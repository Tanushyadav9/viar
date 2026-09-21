'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  Award,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  RotateCcw
} from 'lucide-react';
import { ViarStore } from '@/lib/store';
import { FinalTest, Certificate, User, Cohort } from '@/lib/types';

export default function FinalQuizPage() {
  const params = useParams();
  const cohortId = (params?.cohortId as string) || 'cohort-wia-batch-1';

  const [test, setTest] = useState<FinalTest | null>(null);
  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [isPassed, setIsPassed] = useState(false);
  const [certificate, setCertificate] = useState<Certificate | null>(null);

  useEffect(() => {
    const t = ViarStore.getFinalTest(cohortId);
    setTest(t);

    const c = ViarStore.getCohortById(cohortId) || ViarStore.getCohorts()[0];
    if (c) {
      setCohort(c);
    }

    const u = ViarStore.getCurrentUser();
    setCurrentUser(u);

    // Pre-populate answers with correct answers for convenient testing
    const defaultAnswers: Record<string, number> = {};
    t.questions.forEach((q) => {
      defaultAnswers[q.id] = q.correctOptionIndex;
    });
    setAnswers(defaultAnswers);
  }, [cohortId]);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmitQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!test || !currentUser) return;

    const result = ViarStore.submitFinalTest({
      cohortId,
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentEmail: currentUser.email,
      answers,
    });

    setScore(result.submission.score);
    setPercentage(result.submission.scorePercentage);
    setIsPassed(result.submission.isPassed);
    if (result.certificate) {
      setCertificate(result.certificate);
    }
    setIsSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRetake = () => {
    setIsSubmitted(false);
    setCertificate(null);
  };

  if (!test || !cohort) {
    return (
      <div className="min-h-screen cosmic-bg flex items-center justify-center p-4">
        <Sparkles className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="cosmic-bg min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            href={`/dashboard/courses/${cohort.id}`}
            className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Syllabus & Classes</span>
          </Link>

          <Link
            href="/dashboard/certificates"
            className="text-xs text-amber-300 hover:text-white transition flex items-center gap-1"
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>View All Certificates</span>
          </Link>
        </div>

        {/* Results Banner if Submitted */}
        {isSubmitted && (
          <div className="mb-8 p-8 rounded-3xl bg-gradient-to-r from-[#111827] to-[#0a0f1d] border border-amber-500/40 shadow-2xl">
            <div className="text-center max-w-lg mx-auto space-y-4">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto ${
                  isPassed
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-red-500/20 text-red-400 border border-red-500/40'
                }`}
              >
                {isPassed ? <Award className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {isPassed ? 'Congratulations! You Passed!' : 'Exam Needs Revision'}
              </h2>

              <p className="text-xs sm:text-sm text-slate-300">
                You scored <strong className="text-white">{score}</strong> out of{' '}
                <strong className="text-white">{test.totalQuestions}</strong> questions (
                <strong className={isPassed ? 'text-emerald-400' : 'text-red-400'}>{percentage}%</strong>).
                Passing grade required is {test.passingPercentage}%.
              </p>

              {isPassed && certificate && (
                <div className="pt-4 space-y-3">
                  <div className="p-3.5 rounded-xl bg-white/[0.04] border border-amber-500/30 text-xs">
                    <p className="text-slate-400">Verifiable Certificate Code:</p>
                    <p className="font-mono text-base font-bold text-amber-300">{certificate.verificationCode}</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Link
                      href={`/verify/${certificate.verificationCode}`}
                      className="gold-button px-6 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                    >
                      <span>View Official Certificate &rarr;</span>
                    </Link>
                    <Link
                      href="/dashboard/certificates"
                      className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/15 transition"
                    >
                      Certificate Dashboard
                    </Link>
                  </div>
                </div>
              )}

              {!isPassed && (
                <button
                  onClick={handleRetake}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 text-black text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake Examination</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Quiz Header Card */}
        <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-white/10 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Final Assessment
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-2">
                {test.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                {test.description}
              </p>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-400 space-y-1 shrink-0">
              <p>Total Questions: <strong className="text-white">{test.totalQuestions}</strong></p>
              <p>Passing Mark: <strong className="text-emerald-400">{test.passingPercentage}%</strong></p>
              <p>Student: <strong className="text-amber-300">{currentUser?.name}</strong></p>
            </div>
          </div>
        </div>

        {/* Questions Form */}
        <form onSubmit={handleSubmitQuiz} className="space-y-6">
          {test.questions.map((q, qIndex) => {
            const selectedOpt = answers[q.id];
            const isCorrect = selectedOpt === q.correctOptionIndex;

            return (
              <div
                key={q.id}
                className={`cosmic-card p-6 rounded-2xl border transition ${
                  isSubmitted
                    ? isCorrect
                      ? 'border-emerald-500/40 bg-emerald-950/10'
                      : 'border-red-500/40 bg-red-950/10'
                    : 'border-white/10'
                }`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <span className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-center shrink-0">
                    {qIndex + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      {q.question}
                    </h3>
                  </div>
                </div>

                <div className="space-y-2.5 ml-10">
                  {q.options.map((opt, optIdx) => {
                    const isChecked = selectedOpt === optIdx;
                    let optStyle = 'bg-white/[0.03] border-white/10 hover:border-white/25';
                    if (isChecked) {
                      optStyle = 'bg-amber-500/15 border-amber-500/60 text-white';
                    }
                    if (isSubmitted) {
                      if (optIdx === q.correctOptionIndex) {
                        optStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold';
                      } else if (isChecked && !isCorrect) {
                        optStyle = 'bg-red-500/20 border-red-500 text-red-300';
                      }
                    }

                    return (
                      <label
                        key={optIdx}
                        className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-center gap-3 cursor-pointer transition select-none ${optStyle}`}
                      >
                        <input
                          type="radio"
                          name={`question_${q.id}`}
                          disabled={isSubmitted}
                          checked={isChecked}
                          onChange={() => handleSelectOption(q.id, optIdx)}
                          className="w-4 h-4 text-amber-500 accent-amber-500 cursor-pointer"
                        />
                        <span className="flex-1">{opt}</span>
                        {isSubmitted && optIdx === q.correctOptionIndex && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                      </label>
                    );
                  })}
                </div>

                {isSubmitted && q.explanation && (
                  <div className="mt-4 ml-10 p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-slate-400">
                    <strong className="text-amber-300">Explanation: </strong>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}

          {/* Submit Button */}
          {!isSubmitted ? (
            <div className="pt-4 text-center">
              <button
                type="submit"
                className="gold-button px-10 py-4 rounded-xl text-sm font-bold shadow-2xl shadow-amber-500/30 inline-flex items-center gap-2"
              >
                <span>Submit 20-Question Final Exam</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
              <p className="text-[11px] text-slate-400 mt-2">
                Answers will be automatically graded and your certificate generated instantly upon passing (70%+).
              </p>
            </div>
          ) : (
            <div className="pt-4 text-center">
              {isPassed ? (
                <Link
                  href="/dashboard/certificates"
                  className="gold-button px-10 py-4 rounded-xl text-sm font-bold shadow-2xl shadow-amber-500/30 inline-flex items-center gap-2"
                >
                  <span>Go to My Certificates Registry &rarr;</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleRetake}
                  className="gold-button px-10 py-4 rounded-xl text-sm font-bold inline-flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Try Exam Again</span>
                </button>
              )}
            </div>
          )}
        </form>

      </div>
    </div>
  );
}
