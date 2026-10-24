'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  ArrowLeft,
  Plus,
  Search,
  Sparkles,
  HelpCircle,
  Trash2,
  Edit3,
  Save,
  X,
  RefreshCw,
  Clock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import {
  AsyncStateView,
  type AsyncStateStatus,
  type ErrorType,
} from '@/components/common/AsyncStateView';

interface KnowledgeEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  language: string;
  published: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

interface UnansweredQuestion {
  id: string;
  question: string;
  normalizedQuestion: string;
  count: number;
  language: string;
  lastAskedAt: string;
  status: string;
  knowledgeEntryId?: string | null;
  createdAt: string;
}

export default function AdminKnowledgePage() {
  const [activeTab, setActiveTab] = useState<'knowledge' | 'unanswered'>('knowledge');
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [unanswered, setUnanswered] = useState<UnansweredQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // New / Edit Entry Form State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formQuestion, setFormQuestion] = useState('');
  const [formAnswer, setFormAnswer] = useState('');
  const [formCategory, setFormCategory] = useState('general');
  const [formLanguage, setFormLanguage] = useState('en');
  const [formPublished, setFormPublished] = useState(true);
  const [formConvertingQuestionId, setFormConvertingQuestionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [pageStatus, setPageStatus] = useState<AsyncStateStatus>('loading');
  const [errorType, setErrorType] = useState<ErrorType>('server');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const fetchKnowledgeData = useCallback(async () => {
    setIsLoading(true);
    setPageStatus('loading');
    setErrorMessage('');
    try {
      const res = await fetch('/api/admin/knowledge');
      if (res.status === 401 || res.status === 403) {
        setPageStatus('error');
        setErrorType('auth');
        return;
      }
      if (!res.ok) {
        setPageStatus('error');
        setErrorType('server');
        return;
      }
      const data = await res.json();
      const loadedEntries = data.entries || [];
      const loadedUnanswered = data.unanswered || [];
      setEntries(loadedEntries);
      setUnanswered(loadedUnanswered);
      setPageStatus(loadedEntries.length === 0 ? 'empty' : 'success');
    } catch (err) {
      console.error('Failed to load knowledge data:', err);
      setPageStatus('error');
      setErrorType('server');
      setErrorMessage(err instanceof Error ? err.message : 'Failed to communicate with knowledge service');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKnowledgeData();
  }, [fetchKnowledgeData]);

  const handleOpenNewEntry = (initialQuestion: string = '', convertingId?: string) => {
    setEditingId(null);
    setFormQuestion(initialQuestion);
    setFormAnswer('');
    setFormCategory('general');
    setFormLanguage('en');
    setFormPublished(true);
    setFormConvertingQuestionId(convertingId || null);
    setIsEditorOpen(true);
  };

  const handleOpenEditEntry = (entry: KnowledgeEntry) => {
    setEditingId(entry.id);
    setFormQuestion(entry.question);
    setFormAnswer(entry.answer);
    setFormCategory(entry.category);
    setFormLanguage(entry.language);
    setFormPublished(entry.published);
    setFormConvertingQuestionId(null);
    setIsEditorOpen(true);
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuestion.trim() || !formAnswer.trim()) return;

    setIsSaving(true);
    setFeedbackMessage(null);

    try {
      if (editingId) {
        // Update existing entry
        const res = await fetch(`/api/admin/knowledge/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: formQuestion,
            answer: formAnswer,
            category: formCategory,
            language: formLanguage,
            published: formPublished,
          }),
        });

        if (res.ok) {
          setFeedbackMessage({ text: 'Knowledge entry updated successfully!', type: 'success' });
          setIsEditorOpen(false);
          await fetchKnowledgeData();
        } else {
          setFeedbackMessage({ text: 'Failed to update entry.', type: 'error' });
        }
      } else {
        // Create new entry
        const res = await fetch('/api/admin/knowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: formQuestion,
            answer: formAnswer,
            category: formCategory,
            language: formLanguage,
            published: formPublished,
            unansweredQuestionId: formConvertingQuestionId,
          }),
        });

        if (res.ok) {
          setFeedbackMessage({ text: 'New knowledge entry published to AI Assistant!', type: 'success' });
          setIsEditorOpen(false);
          await fetchKnowledgeData();
        } else {
          setFeedbackMessage({ text: 'Failed to create knowledge entry.', type: 'error' });
        }
      }
    } catch {
      setFeedbackMessage({ text: 'Network error saving entry.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this knowledge entry?')) return;

    try {
      const res = await fetch(`/api/admin/knowledge/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== id));
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleDismissUnanswered = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/knowledge/unanswered/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DISMISSED' }),
      });
      if (res.ok) {
        setUnanswered((prev) =>
          prev.map((u) => (u.id === id ? { ...u, status: 'DISMISSED' } : u))
        );
      }
    } catch (err) {
      console.error('Dismiss error:', err);
    }
  };

  const handleDeleteUnanswered = async (id: string) => {
    if (!window.confirm('Delete this question from log?')) return;
    try {
      const res = await fetch(`/api/admin/knowledge/unanswered/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUnanswered((prev) => prev.filter((u) => u.id !== id));
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLang = selectedLanguage === 'all' || entry.language === selectedLanguage;
    const matchesCat = selectedCategory === 'all' || entry.category === selectedCategory;
    return matchesSearch && matchesLang && matchesCat;
  });

  const pendingUnanswered = unanswered.filter((u) => u.status === 'PENDING');

  return (
    <div className="cosmic-bg min-h-screen py-10 px-4 sm:px-6 lg:px-8 text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Admin Studio</span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>AI Assistant Knowledge Studio</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Owner Only
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Teach the chatbot new answers without code and review inquiries visitors ask.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchKnowledgeData()}
              disabled={isLoading}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs font-semibold hover:bg-slate-800 transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => handleOpenNewEntry()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-bold hover:opacity-95 transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Knowledge Entry</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center justify-between ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/15 border border-red-500/30 text-red-300'
            }`}
          >
            <span>{feedbackMessage.text}</span>
            <button onClick={() => setFeedbackMessage(null)} className="opacity-70 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-white/10 gap-2">
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`px-5 py-3 font-semibold text-xs sm:text-sm border-b-2 transition flex items-center gap-2 ${
              activeTab === 'knowledge'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Active Knowledge Base</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-slate-300">
              {entries.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('unanswered')}
            className={`px-5 py-3 font-semibold text-xs sm:text-sm border-b-2 transition flex items-center gap-2 ${
              activeTab === 'unanswered'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Unanswered Inquiries</span>
            {pendingUnanswered.length > 0 && (
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-slate-950 font-bold">
                {pendingUnanswered.length} new
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: KNOWLEDGE ENTRIES */}
        {activeTab === 'knowledge' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search questions & answers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="all">All Languages (EN / HI / Hinglish)</option>
                  <option value="en">English</option>
                  <option value="hi">हिंदी (Devanagari)</option>
                  <option value="hinglish">Hinglish</option>
                </select>
              </div>

              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="all">All Categories</option>
                  <option value="general">General</option>
                  <option value="pricing">Pricing & Tuition</option>
                  <option value="syllabus">Syllabus & Modules</option>
                  <option value="instructor">Acharya Niraj Kumar</option>
                  <option value="admission">Admission & UPI</option>
                  <option value="refund">Refund Policy</option>
                  <option value="certification">Certification</option>
                </select>
              </div>
            </div>

            {/* Entries Grid with distinct Loading, Error (401/403 vs 500), Empty, and Success */}
            <AsyncStateView
              status={pageStatus}
              errorType={errorType}
              errorMessage={errorMessage}
              onRetry={fetchKnowledgeData}
              signInUrl="/login?returnUrl=/admin/knowledge"
              loadingMessage="Loading knowledge base entries..."
              emptyComponent={
                <div className="py-16 text-center cosmic-card rounded-2xl border border-white/10 p-8 space-y-3">
                  <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
                  <h3 className="text-sm font-bold text-white">No custom knowledge entries found</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    The AI assistant is currently answering from structured curriculum files and live database prices. Click &ldquo;Add Knowledge Entry&rdquo; to teach it new questions and answers.
                  </p>
                  <button
                    onClick={() => handleOpenNewEntry()}
                    className="mt-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create First Custom Entry</span>
                  </button>
                </div>
              }
            >
              {filteredEntries.length === 0 ? (
                <div className="py-12 text-center cosmic-card rounded-2xl border border-white/10 p-6 space-y-2">
                  <p className="text-sm text-slate-300">No entries match your search filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-5 rounded-2xl cosmic-card border border-white/10 space-y-3 hover:border-amber-400/40 transition flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/20">
                              {entry.category}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/5 text-slate-400">
                              {entry.language.toUpperCase()}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              entry.published
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border border-white/10'
                            }`}
                          >
                            {entry.published ? 'Live on AI' : 'Draft'}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white leading-snug">
                          Q: {entry.question}
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line line-clamp-4">
                          {entry.answer}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Updated {new Date(entry.updatedAt).toLocaleDateString()}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEditEntry(entry)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-white/5 transition"
                            title="Edit Entry"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                            title="Delete Entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AsyncStateView>
          </div>
        )}

        {/* TAB 2: UNANSWERED QUESTIONS */}
        {activeTab === 'unanswered' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-200">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold">Privacy Protection Policy:</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  All visitor inquiries logged here have phone numbers and email addresses permanently masked before storage, and questions are truncated to 150 characters. Records are automatically retained for 30 days to help you craft new FAQs.
                </p>
              </div>
            </div>

            <AsyncStateView
              status={pageStatus}
              errorType={errorType}
              errorMessage={errorMessage}
              onRetry={fetchKnowledgeData}
              signInUrl="/login?returnUrl=/admin/knowledge"
              loadingMessage="Loading unanswered visitor inquiries..."
              emptyTitle="No unanswered questions"
              emptyMessage="The AI assistant has been able to answer all visitor questions or direct them to WhatsApp!"
            >
              <div className="space-y-3">
                {unanswered.map((u) => {
                  const isPending = u.status === 'PENDING';
                  return (
                    <div
                      key={u.id}
                      className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isPending
                          ? 'bg-slate-900/90 border-amber-500/30'
                          : 'bg-slate-950/50 border-white/5 opacity-60'
                      }`}
                    >
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                            Asked {u.count} {u.count === 1 ? 'time' : 'times'}
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(u.lastAskedAt).toLocaleDateString()}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                              u.status === 'CONVERTED'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : u.status === 'DISMISSED'
                                ? 'bg-slate-800 text-slate-400'
                                : 'bg-amber-400 text-slate-950 font-bold'
                            }`}
                          >
                            {u.status === 'CONVERTED' ? 'Added to Knowledge' : u.status === 'DISMISSED' ? 'Dismissed' : 'Pending review'}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-white">{u.question}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isPending && (
                          <button
                            onClick={() => {
                              setActiveTab('knowledge');
                              handleOpenNewEntry(u.question, u.id);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5"
                          >
                            <span>Teach Assistant</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                        {isPending && (
                          <button
                            onClick={() => handleDismissUnanswered(u.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                          >
                            Dismiss
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUnanswered(u.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                          title="Delete from log"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </AsyncStateView>
          </div>
        )}

        {/* MODAL / DRAWER: NEW & EDIT KNOWLEDGE ENTRY */}
        {isEditorOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-950 border border-amber-500/30 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                  <h3 className="text-base font-bold text-white">
                    {editingId ? 'Edit Knowledge Entry' : 'Teach Assistant a New Answer'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEntry} className="space-y-4">
                {formConvertingQuestionId && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                    💡 Answering visitor question from log. Saving will mark the inquiry as <strong>CONVERTED</strong>.
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Question / Visitor Query
                  </label>
                  <input
                    type="text"
                    required
                    value={formQuestion}
                    onChange={(e) => setFormQuestion(e.target.value)}
                    placeholder="e.g. Can I pay in installments?"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-white/15 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Answer (Grounded Response)
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formAnswer}
                    onChange={(e) => setFormAnswer(e.target.value)}
                    placeholder="Enter the exact answer the AI assistant should speak..."
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-white/15 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="general">General</option>
                      <option value="pricing">Pricing & Tuition</option>
                      <option value="syllabus">Syllabus & Modules</option>
                      <option value="instructor">Acharya Niraj Kumar</option>
                      <option value="admission">Admission & UPI</option>
                      <option value="refund">Refund Policy</option>
                      <option value="certification">Certification</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Language</label>
                    <select
                      value={formLanguage}
                      onChange={(e) => setFormLanguage(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="en">English</option>
                      <option value="hi">हिंदी (Devanagari)</option>
                      <option value="hinglish">Hinglish</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="formPublished"
                    checked={formPublished}
                    onChange={(e) => setFormPublished(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-white/20 focus:ring-0"
                  />
                  <label htmlFor="formPublished" className="text-xs text-slate-300 font-medium cursor-pointer">
                    Publish immediately (AI Assistant starts using this answer right away)
                  </label>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-bold hover:opacity-95 transition disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving...' : 'Save & Publish'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
