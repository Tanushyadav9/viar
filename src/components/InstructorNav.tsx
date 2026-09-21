'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck,
  BookOpen,
  Users,
  BarChart3,
  ArrowRight
} from 'lucide-react';

export default function InstructorNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Overview', href: '/instructor', icon: ShieldCheck, exact: true },
    { label: 'Courses & Cohorts', href: '/instructor/courses', icon: BookOpen },
    { label: 'Students & Roster', href: '/instructor/students', icon: Users },
    { label: 'Revenue & Analytics', href: '/instructor/analytics', icon: BarChart3 },
  ];

  return (
    <div className="mb-8 pb-4 border-b border-white/10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Instructor Dashboard
            </span>
            <span className="text-slate-500">•</span>
            {/* PLACEHOLDER: replace with real instructor name */}
            <span className="text-xs text-slate-400">Acharya [ASTROLOGER NAME]</span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1">
            Academy Management System
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition inline-flex items-center gap-1.5"
          >
            <span>Switch to Student View</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                isActive
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
