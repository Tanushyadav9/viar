'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Video } from 'lucide-react';
import SessionsManager from '@/components/admin/SessionsManager';

export default function AdminSessionsPage() {
  return (
    <div className="min-h-screen cosmic-bg bg-slate-950 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Back to Admin Home / मुख्य पोर्टल</span>
          </Link>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Video className="w-3.5 h-3.5 text-amber-400" />
            <span>1-on-1 Mentorship Sessions</span>
          </div>
        </div>

        {/* Sessions Manager Component */}
        <SessionsManager />
      </div>
    </div>
  );
}
