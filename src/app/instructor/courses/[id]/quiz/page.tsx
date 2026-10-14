'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  HelpCircle
} from 'lucide-react';
import InstructorNav from '@/components/InstructorNav';
import { ViarStore } from '@/lib/store';
import { Course } from '@/lib/types';

interface QuizQuestion {
  id: string;
  questionNumber: number;
  topic: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export default function InstructorQuizEditorPage() {
  const params = useParams();
  const courseId = (params?.id as string) || 'course-what-is-astrology';

  const [course, setCourse] = useState<Course | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [title, setTitle] = useState('What is Astrology — Final Graded Certification Quiz');
  const [passingPercentage, setPassingPercentage] = useState(70);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // 1. Fetch course details
    fetch(`/api/courses/${courseId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.course) {
          setCourse(data.course);
        }
      })
      .catch(() => {});

    // 2. Fetch quiz from API
    fetch(`/api/quizzes?courseId=${courseId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.quiz) {
          setTitle(data.quiz.title || 'Certification Assessment');
          setPassingPercentage(data.quiz.passingPercentage || 70);
          setDurationMinutes(data.quiz.durationMinutes || 45);
          if (Array.isArray(data.quiz.questions) && data.quiz.questions.length > 0) {
            setQuestions(data.quiz.questions);
            return;
          }
        }
        loadFallback();
      })
      .catch(() => {
        loadFallback();
      });

    function loadFallback() {
      const t = ViarStore.getFinalTest();
      setTitle(t.title);
      setPassingPercentage(t.passingPercentage);
      setDurationMinutes(t.durationMinutes);
      setQuestions(t.questions as QuizQuestion[]);
    }
  }, [courseId]);

  const handleAddQuestion = () => {
    const nextNum = questions.length + 1;
    const newQ: QuizQuestion = {
      id: `q-${Date.now()}`,
      questionNumber: nextNum,
      topic: 'Vedic Astrology Principles',
      question: `New Question ${nextNum}: What is the astrological principle governing...?`,
      options: [
        'First potential interpretation or planetary angle',
        'Second potential interpretation (Correct Option)',
        'Third option based on classical texts',
        'Fourth option reflecting alternative traditions',
      ],
      correctOptionIndex: 1,
      explanation: 'Detailed classical Jyotish reference explaining why this option is correct.',
    };

    setQuestions([...questions, newQ]);
    setSuccessMsg(`Question ${nextNum} added. Click "Save Quiz to Database" to persist.`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleUpdateQuestion = (index: number, updates: Partial<QuizQuestion>) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, text: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const opts = [...copy[qIndex].options];
      opts[optIndex] = text;
      copy[qIndex] = { ...copy[qIndex], options: opts };
      return copy;
    });
  };

  const handleDeleteQuestion = (index: number) => {
    if (!confirm(`Are you sure you want to delete Question ${index + 1}?`)) return;
    const filtered = questions
      .filter((_, i) => i !== index)
      .map((q, idx) => ({ ...q, questionNumber: idx + 1 }));
    setQuestions(filtered);
    setSuccessMsg('Question deleted. Click "Save Quiz to Database" to persist.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSaveQuiz = async () => {
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course?.id || courseId,
          title,
          passingPercentage: Number(passingPercentage),
          durationMinutes: Number(durationMinutes),
          questions,
        }),
      });

      const data = await res.json();
      if (!res.ok && !data.success) {
        throw new Error(data.error || 'Failed to save quiz to database');
      }

      // Also sync to ViarStore
      const currentTest = ViarStore.getFinalTest();
      currentTest.title = title;
      currentTest.passingPercentage = Number(passingPercentage);
      currentTest.durationMinutes = Number(durationMinutes);
      currentTest.totalQuestions = questions.length;
      currentTest.questions = questions as unknown as typeof currentTest.questions;
      if (typeof window !== 'undefined') {
        localStorage.setItem('viar_final_test', JSON.stringify(currentTest));
      }

      setSuccessMsg('Quiz and all questions saved successfully to the PostgreSQL database!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save quiz to database');
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

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 p-6 sm:p-8 rounded-3xl cosmic-card border border-amber-500/30 bg-gradient-to-r from-[#111827] to-[#090d16]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Final Exam &amp; Certification Builder
              </span>
              <span className="text-xs text-slate-400">
                {questions.length} Questions Configured
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Certification Assessment Builder
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Configure the graded certification exam for &ldquo;{course?.title || 'Astrology Masterclass'}&rdquo;. Add, edit, or delete questions. The answer key is verified securely on the server upon student submission.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleAddQuestion}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Add Question</span>
            </button>

            <button
              onClick={handleSaveQuiz}
              disabled={isSaving}
              className="gold-button px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving to Database...' : 'Save Quiz to Database'}</span>
            </button>
          </div>
        </div>

        {/* Global Settings: Passing Threshold & Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 cosmic-card p-5 rounded-2xl border border-white/10">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Assessment Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Passing Percentage Required (%)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={50}
                max={100}
                value={passingPercentage}
                onChange={(e) => setPassingPercentage(parseInt(e.target.value) || 70)}
                className="w-20 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold text-center focus:outline-none focus:border-amber-400"
              />
              <span className="text-xs text-slate-400">Passing threshold (Default: 70%)</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Time Limit (Minutes)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={10}
                max={180}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 45)}
                className="w-20 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold text-center focus:outline-none focus:border-amber-400"
              />
              <span className="text-xs text-slate-400">Minutes allotted</span>
            </div>
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

        {/* Questions List */}
        <div className="space-y-6">
          {questions.map((q, qIndex) => (
            <div
              key={q.id || qIndex}
              className="cosmic-card p-6 sm:p-8 rounded-2xl border border-white/10 space-y-4 relative"
            >
              {/* Question Header & Delete */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/30">
                    {qIndex + 1}
                  </span>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                      Question {qIndex + 1}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={q.topic}
                    onChange={(e) => handleUpdateQuestion(qIndex, { topic: e.target.value })}
                    placeholder="Topic tag (e.g. Planetary Dignities)"
                    className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-[11px] focus:outline-none focus:border-amber-400 w-44"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(qIndex)}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300"
                    title="Delete Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Question Prompt
                </label>
                <textarea
                  rows={2}
                  value={q.question}
                  onChange={(e) => handleUpdateQuestion(qIndex, { question: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* 4 Multiple Choice Options with Correct Answer Selector */}
              <div className="space-y-2.5 pt-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Multiple-Choice Options (Select the Radio Button next to the Correct Answer):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {q.options.map((optText, optIndex) => {
                    const isCorrect = q.correctOptionIndex === optIndex;

                    return (
                      <div
                        key={optIndex}
                        className={`p-3 rounded-xl border flex items-center gap-3 transition ${
                          isCorrect
                            ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/30'
                            : 'bg-white/[0.02] border-white/5'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`correct-option-${qIndex}`}
                          checked={isCorrect}
                          onChange={() => handleUpdateQuestion(qIndex, { correctOptionIndex: optIndex })}
                          className="w-4 h-4 text-emerald-500 focus:ring-emerald-400 accent-emerald-500 cursor-pointer shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={optText}
                            onChange={(e) => handleUpdateOption(qIndex, optIndex, e.target.value)}
                            placeholder={`Option ${optIndex + 1}`}
                            className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        {isCorrect && (
                          <span className="text-[10px] font-bold text-emerald-400 shrink-0">
                            CORRECT ✓
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Explanation Text */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Correct Answer Explanation (Revealed to student after completing exam)</span>
                </label>
                <input
                  type="text"
                  value={q.explanation || ''}
                  onChange={(e) => handleUpdateQuestion(qIndex, { explanation: e.target.value })}
                  placeholder="Explain why this answer is correct according to classical Parashari principles..."
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Save Bar */}
        <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Total {questions.length} questions ready. Server-side grading validates these questions.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleAddQuestion}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold"
            >
              + Add Question
            </button>
            <button
              onClick={handleSaveQuiz}
              disabled={isSaving}
              className="gold-button px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Quiz to Database'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
