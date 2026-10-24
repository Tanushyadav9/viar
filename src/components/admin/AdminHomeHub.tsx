'use client';

import React from 'react';
import Link from 'next/link';
import {
  ExternalLink,
  BookOpen,
  Users,
  DollarSign,
  HelpCircle,
  FileText,
  Settings,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { AdminSection } from '@/lib/types';
import AdminHelpBox from './AdminHelpBox';

export interface RecentActivityItem {
  id: string;
  type: 'content' | 'payment' | 'enrollment';
  title: string;
  description: string;
  timestamp: string | Date;
  author?: string;
}

interface AdminHomeHubProps {
  isOwner: boolean;
  userEmail: string;
  allowedSections: AdminSection[];
  onSelectSection: (section: AdminSection, options?: { collection?: string }) => void;
  pendingOrdersCount?: number;
  pendingStudentsCount?: number;
  pendingQuestionsCount?: number;
  liveClassesTodayCount?: number;
  recentActivities?: RecentActivityItem[];
}

export default function AdminHomeHub({
  isOwner,
  userEmail,
  onSelectSection,
  pendingOrdersCount = 0,
  pendingStudentsCount = 0,
  pendingQuestionsCount = 0,
  liveClassesTodayCount = 0,
  recentActivities = [],
}: AdminHomeHubProps) {
  // Flagship Course ID for direct course editor access
  const flagshipCourseId = 'course-what-is-astrology';

  // 6 Plain Tiles as explicitly specified
  const PLAIN_TILES = [
    {
      id: 'tile-course',
      title: 'Course',
      helpText: 'Edit modules, video lessons, notes, and enrolment status for the astrology course.',
      icon: <BookOpen className="w-6 h-6 text-purple-400" />,
      action: () => {
        window.location.href = `/instructor/courses/${flagshipCourseId}/builder`;
      },
    },
    {
      id: 'tile-students',
      title: 'Students',
      helpText: 'View enrolled scholars, course completion progress, or manually grant access.',
      icon: <Users className="w-6 h-6 text-amber-400" />,
      action: () => onSelectSection('students'),
    },
    {
      id: 'tile-payments',
      title: 'Payments',
      badge: pendingOrdersCount > 0 ? `${pendingOrdersCount} Waiting` : undefined,
      helpText: 'Check student UPI transaction references (UTR) and approve access.',
      icon: <DollarSign className="w-6 h-6 text-emerald-400" />,
      action: () => onSelectSection('payments'),
    },
    {
      id: 'tile-questions',
      title: 'Questions',
      badge: pendingQuestionsCount > 0 ? `${pendingQuestionsCount} Waiting` : undefined,
      helpText: 'Review questions asked by visitors and train the AI assistant with verified answers.',
      icon: <HelpCircle className="w-6 h-6 text-sky-400" />,
      action: () => {
        window.location.href = '/admin/knowledge';
      },
    },
    {
      id: 'tile-content',
      title: 'Site content',
      helpText: 'Change website headlines, promotional banners, instructor bio, and FAQs.',
      icon: <FileText className="w-6 h-6 text-indigo-400" />,
      action: () => onSelectSection('content'),
    },
    {
      id: 'tile-settings',
      title: 'Settings',
      helpText: 'Manage receiving UPI IDs, admissions WhatsApp helpline, and team permissions.',
      icon: <Settings className="w-6 h-6 text-slate-300" />,
      action: () => onSelectSection('staff'),
    },
  ];

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-white/10 relative overflow-hidden bg-gradient-to-r from-[#0d121f] via-[#111728] to-[#0d121f]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                {isOwner ? 'Platform Owner' : 'Academy Staff'}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs font-mono text-slate-400">{userEmail}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Admin Home
            </h1>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Welcome, Acharya Ji. Manage course curriculum, verify student payments, review visitor questions, and update site content from this central hub.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 transition flex items-center gap-2"
            >
              <Eye className="w-4 h-4 text-amber-400" />
              <span>View Live Website</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Bilingual Help Box */}
      <AdminHelpBox
        titleEn="Welcome to Admin Home"
        titleHi="एडमिन होम में आपका स्वागत है"
        descriptionEn="This unified administration center allows you to operate your astrology academy without technical complexity. Below, the 'Needs your attention' panel alerts you to pending student actions, followed by six straightforward tiles to manage each section of the site."
        descriptionHi="यह एकीकृत प्रशासन केंद्र आपको बिना किसी तकनीकी जटिलता के अपने ज्योतिष संस्थान का संचालन करने की सुविधा देता है। नीचे 'ध्यान देने योग्य कार्य' पैनल आपको लंबित कार्यों के प्रति सचेत करता है, जिसके बाद वेबसाइट के प्रत्येक भाग को प्रबंधित करने के लिए छह स्पष्ट टाइलें दी गई हैं।"
        tipsEn={[
          'Check "Payments" to verify student bank UTRs and approve course access.',
          'Open "Course" to edit lesson videos, upload handouts, or toggle enrolments.',
          'Visit "Questions" to see what visitors are asking the chatbot and add custom answers.',
        ]}
        tipsHi={[
          'विद्यार्थियों के बैंक UTR को सत्यापित करने और कोर्स एक्सेस स्वीकृत करने के लिए "Payments" देखें।',
          'पाठ वीडियो संपादित करने, नोट्स अपलोड करने या नामांकन चालू/बंद करने के लिए "Course" खोलें।',
          'आगंतुक चैटबॉट से क्या पूछ रहे हैं यह देखने और नए उत्तर जोड़ने के लिए "Questions" पर जाएं।',
        ]}
      />

      {/* 3. "Needs your attention" Panel */}
      <div className="cosmic-card p-6 sm:p-7 rounded-3xl border border-amber-500/30 bg-[#0e1322]/90 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              Needs your attention
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Live queue status
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Payments waiting to be checked */}
          <div
            onClick={() => onSelectSection('payments')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
              pendingOrdersCount > 0
                ? 'bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/15'
                : 'bg-white/[0.03] border-white/10 hover:border-white/20'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400">Payments to check</span>
                <DollarSign className={`w-4 h-4 ${pendingOrdersCount > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
              </div>
              <div className="text-2xl font-black text-white">
                {pendingOrdersCount}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
              <span className={pendingOrdersCount > 0 ? 'text-amber-300 font-bold' : 'text-emerald-400'}>
                {pendingOrdersCount > 0 ? 'Claims awaiting UTR check' : 'Queue is clear'}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          {/* Card 2: Students waiting for access */}
          <div
            onClick={() => onSelectSection('payments')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
              (pendingStudentsCount || pendingOrdersCount) > 0
                ? 'bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/15'
                : 'bg-white/[0.03] border-white/10 hover:border-white/20'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400">Students awaiting access</span>
                <Users className={`w-4 h-4 ${(pendingStudentsCount || pendingOrdersCount) > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
              </div>
              <div className="text-2xl font-black text-white">
                {pendingStudentsCount || pendingOrdersCount}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
              <span className={(pendingStudentsCount || pendingOrdersCount) > 0 ? 'text-amber-300 font-bold' : 'text-emerald-400'}>
                {(pendingStudentsCount || pendingOrdersCount) > 0 ? 'Awaiting activation' : 'All scholars active'}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          {/* Card 3: Questions waiting for an answer */}
          <div
            onClick={() => {
              window.location.href = '/admin/knowledge?tab=unanswered';
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
              pendingQuestionsCount > 0
                ? 'bg-sky-500/10 border-sky-500/40 hover:bg-sky-500/15'
                : 'bg-white/[0.03] border-white/10 hover:border-white/20'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400">Unanswered questions</span>
                <HelpCircle className={`w-4 h-4 ${pendingQuestionsCount > 0 ? 'text-sky-400' : 'text-slate-500'}`} />
              </div>
              <div className="text-2xl font-black text-white">
                {pendingQuestionsCount}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
              <span className={pendingQuestionsCount > 0 ? 'text-sky-300 font-bold' : 'text-emerald-400'}>
                {pendingQuestionsCount > 0 ? 'Visitor queries to review' : 'Zero unhandled queries'}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          {/* Card 4: Live classes today or tomorrow */}
          <div
            className="p-4 rounded-2xl border border-white/10 bg-white/[0.03] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400">Live classes (Today / Tomorrow)</span>
                <Calendar className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-white">
                {liveClassesTodayCount}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">
                100% Self-Paced (On-demand video)
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>

        </div>
      </div>

      {/* 4. The 6 Plain Tiles (Each with one line of help) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Manage Institute</span>
          </h2>
          <span className="text-xs text-slate-400">
            6 straightforward sections
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {PLAIN_TILES.map((tile) => (
            <button
              key={tile.id}
              onClick={tile.action}
              className="cosmic-card p-6 rounded-2xl border border-white/10 hover:border-amber-500/40 hover:bg-white/[0.04] transition-all text-left flex flex-col justify-between group relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:bg-amber-500/10 group-hover:border-amber-500/30 transition">
                    {tile.icon}
                  </div>
                  {tile.badge && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {tile.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-amber-300 transition mb-2">
                  {tile.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4">
                  {tile.helpText}
                </p>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-amber-300 transition">
                <span>Open {tile.title}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 5. Recent Activity Trail */}
      <div className="cosmic-card p-6 sm:p-8 rounded-2xl border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Recent Activity &amp; Audit Trail</h2>
          </div>
          <span className="text-xs text-slate-400">Live tamper-proof log</span>
        </div>

        {recentActivities && recentActivities.length > 0 ? (
          <div className="divide-y divide-white/5 space-y-3">
            {recentActivities.slice(0, 6).map((activity) => (
              <div key={activity.id} className="pt-3 first:pt-0 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400 mt-2 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">{activity.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{activity.description}</p>
                    {activity.author && (
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        By {activity.author}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-slate-500 whitespace-nowrap shrink-0">
                  {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-sm space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-white">No recent audit events</p>
            <p className="text-xs text-slate-400">
              When student payments are approved, curriculum is edited, or settings are updated, records will appear here in real time.
            </p>
            <p className="text-[11px] text-slate-500 pt-1">
              (हाल की कोई गतिविधि नहीं है। भुगतान स्वीकृत होने या पाठ्यक्रम संपादित होने पर रिकॉर्ड यहाँ दिखाई देंगे।)
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
