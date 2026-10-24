'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Users,
  BarChart3,
  ArrowRight,
  History,
  Home
} from 'lucide-react';

export default function InstructorNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Admin Home', href: '/admin', icon: Home, exact: true },
    { label: 'Courses & Curriculum', href: '/instructor/courses', icon: BookOpen },
    { label: 'Students & Roster', href: '/instructor/students', icon: Users },
    { label: 'Revenue & Analytics', href: '/instructor/analytics', icon: BarChart3 },
    { label: 'Activity Log', href: '/instructor/activity', icon: History },
  ];

  return (
    <div className="mb-8 pb-4 border-b border-white/10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Admin Home
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-slate-400">Course & Academy Management</span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1">
            Admin Home
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition inline-flex items-center gap-1.5"
          >
            <span>Student Portal</span>
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
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
