'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ExternalLink,
  Activity,
  Phone,
  HelpCircle,
  FileText,
  Image as ImageIcon,
  DollarSign,
  BookOpen,
  Calendar,
  Users,
  Award,
  BarChart3,
  ShieldCheck,
  Clock,
  CheckCircle2,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { AdminSection } from '@/lib/types';

export interface AdminTile {
  id: string;
  section: AdminSection;
  title: string;
  helpText: string;
  icon: React.ReactNode;
  badge?: string;
  ownerOnly?: boolean;
  actionPayload?: {
    tab: AdminSection;
    subview?: string;
    collection?: string;
  };
}

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
  recentActivities?: RecentActivityItem[];
}

export default function AdminHomeHub({
  isOwner,
  userEmail,
  allowedSections,
  onSelectSection,
  pendingOrdersCount = 0,
  recentActivities = [],
}: AdminHomeHubProps) {
  // Plain-language tiles designed for non-technical site management
  const ALL_TILES: AdminTile[] = [
    {
      id: 'tile-contact',
      section: 'content',
      title: 'Change Phone Number & Social Links',
      helpText: 'Update WhatsApp number, contact phone, admissions email, and office hours.',
      icon: <Phone className="w-6 h-6 text-emerald-400" />,
      actionPayload: { tab: 'content', collection: 'site_settings' },
    },
    {
      id: 'tile-faq',
      section: 'content',
      title: 'Edit FAQ & Student Questions',
      helpText: 'Update answers to frequently asked questions in English & Hindi.',
      icon: <HelpCircle className="w-6 h-6 text-amber-400" />,
      actionPayload: { tab: 'content', collection: 'faqs' },
    },
    {
      id: 'tile-hero',
      section: 'content',
      title: 'Edit Homepage Headlines & Banners',
      helpText: 'Change the main hero announcement, welcoming badge, and action buttons.',
      icon: <Sparkles className="w-6 h-6 text-amber-300" />,
      actionPayload: { tab: 'content', collection: 'hero' },
    },
    {
      id: 'tile-content-studio',
      section: 'content',
      title: 'Content Studio (All Pages)',
      helpText: 'Add, edit, hide, or translate any text, bio, or testimonial across the website.',
      icon: <FileText className="w-6 h-6 text-indigo-400" />,
      badge: 'Core Hub',
      actionPayload: { tab: 'content' },
    },
    {
      id: 'tile-media',
      section: 'media',
      title: 'Media Library & Site Assets',
      helpText: 'Upload, manage, and optimize images, student awards, and photos up to 5 MB.',
      icon: <ImageIcon className="w-6 h-6 text-sky-400" />,
      actionPayload: { tab: 'media' },
    },
    {
      id: 'tile-payments',
      section: 'payments',
      title: 'See Payments Waiting for Approval',
      helpText: 'Review student UPI receipts, check UTR numbers, and approve enrollments.',
      icon: <DollarSign className="w-6 h-6 text-emerald-400" />,
      badge: pendingOrdersCount > 0 ? `${pendingOrdersCount} Waiting` : undefined,
      actionPayload: { tab: 'payments' },
    },
    {
      id: 'tile-courses',
      section: 'courses',
      title: 'Course Catalog & Syllabi',
      helpText: 'Update course descriptions, 23-module syllabi, and student pricing.',
      icon: <BookOpen className="w-6 h-6 text-purple-400" />,
      actionPayload: { tab: 'courses' },
    },
    {
      id: 'tile-cohorts',
      section: 'cohorts',
      title: 'Cohorts, Schedule & Live Class Links',
      helpText: 'Manage batch start dates, Zoom / Google Meet links, and lecture replays.',
      icon: <Calendar className="w-6 h-6 text-blue-400" />,
      actionPayload: { tab: 'cohorts' },
    },
    {
      id: 'tile-students',
      section: 'students',
      title: 'Student Roster & Enrollments',
      helpText: 'Look up registered students, verify course access, or manually enroll a student.',
      icon: <Users className="w-6 h-6 text-amber-400" />,
      actionPayload: { tab: 'students' },
    },
    {
      id: 'tile-quizzes',
      section: 'quizzes',
      title: 'Quizzes & Certificate Registry',
      helpText: 'Inspect final 20-question certification exams and cryptographic certificate codes.',
      icon: <Award className="w-6 h-6 text-amber-300" />,
      actionPayload: { tab: 'quizzes' },
    },
    {
      id: 'tile-analytics',
      section: 'analytics',
      title: 'Platform Analytics & Telemetry',
      helpText: 'Track student completion rates, video watch progress, and engagement.',
      icon: <BarChart3 className="w-6 h-6 text-cyan-400" />,
      actionPayload: { tab: 'analytics' },
    },
    {
      id: 'tile-staff',
      section: 'staff',
      title: 'Manage Team & Staff Roles',
      helpText: 'Assign specific section permissions to team members and assistants.',
      icon: <ShieldCheck className="w-6 h-6 text-amber-400" />,
      ownerOnly: true,
      badge: 'Owner Only',
      actionPayload: { tab: 'staff' },
    },
  ];

  // Filter tiles strictly based on user permissions
  const visibleTiles = ALL_TILES.filter((tile) => {
    if (tile.ownerOnly && !isOwner) return false;
    if (isOwner) return true;
    return allowedSections.includes(tile.section);
  });

  return (
    <div className="space-y-10">
      
      {/* Top Banner & Quick Controls */}
      <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-white/10 relative overflow-hidden bg-gradient-to-r from-[#0d121f] via-[#111728] to-[#0d121f]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {isOwner ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Site Owner & Master Astrologer Hub
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  Delegated Staff Console
                </span>
              )}
              <span className="text-slate-500">•</span>
              <span className="text-xs font-mono text-slate-400">{userEmail}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Control Centre &amp; Content Studio
            </h1>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Welcome, Acharya Ji. Manage everything visitors see on VIAR.in directly from your browser.
              Click any tile below to edit text, approve payments, or upload photos.
            </p>
          </div>

          {/* Quick Action Links */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 transition flex items-center gap-2"
            >
              <Eye className="w-4 h-4 text-amber-400" />
              <span>View Live Site</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>

            {isOwner && (
              <Link
                href="/admin/diagnostics"
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition flex items-center gap-2"
              >
                <Activity className="w-4 h-4 text-amber-400" />
                <span>Diagnostics</span>
              </Link>
            )}

            {isOwner && (
              <Link
                href="/admin/knowledge"
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>AI Knowledge</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid of Large Plain-Language Tiles */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>What would you like to manage?</span>
          </h2>
          <span className="text-xs text-slate-400">
            {visibleTiles.length} sections available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleTiles.map((tile) => (
            <button
              key={tile.id}
              onClick={() => {
                if (tile.actionPayload) {
                  onSelectSection(tile.actionPayload.tab, {
                    collection: tile.actionPayload.collection,
                  });
                } else {
                  onSelectSection(tile.section);
                }
              }}
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
                <span>Open Section</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="cosmic-card p-6 sm:p-8 rounded-2xl border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Recent Activity &amp; Audit Trail</h2>
          </div>
          <span className="text-xs text-slate-400">Automatic tamper-proof log</span>
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
          <div className="text-center py-8 text-slate-400 text-sm">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <p>System operational. All content is synced with the database and defaults.</p>
            <p className="text-xs text-slate-500 mt-1">Changes made in Content Studio will appear here in real-time.</p>
          </div>
        )}
      </div>

    </div>
  );
}
