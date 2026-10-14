'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  RefreshCw,
  Clock,
  User
} from 'lucide-react';
import InstructorNav from '@/components/InstructorNav';

interface ActivityRecord {
  id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  action: string;
  entityType: string;
  entityId: string;
  reason?: string;
  details?: Record<string, unknown>;
  createdAt: string;
  course?: { title: string; slug: string };
}

export default function InstructorActivityLogPage() {
  const [logs, setLogs] = useState<ActivityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/activity');
      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.warn('Failed to fetch activity logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesFilter = entityFilter === 'ALL' || log.entityType === entityFilter;
    const matchesSearch =
      (log.action || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.userEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.reason || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.course?.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getActionBadgeColor = (action: string) => {
    if (action.includes('PUBLISHED') || action.includes('GRANTED')) {
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    }
    if (action.includes('REVOKED') || action.includes('DELETED')) {
      return 'bg-red-500/20 text-red-300 border-red-500/30';
    }
    if (action.includes('ARCHIVED')) {
      return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    }
    if (action.includes('DUPLICATED')) {
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
    return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  };

  return (
    <div className="cosmic-bg min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <InstructorNav />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Audit Trail
              </span>
              <span className="text-xs text-slate-400">
                {logs.length} Total Administrative Events
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              System Activity &amp; Audit Log
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Chronological ledger recording administrative operations: who changed what, when, and required justification reasons for manual admissions, tuition changes, and course archival.
            </p>
          </div>

          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 flex items-center gap-2 self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Audit Log</span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
            {['ALL', 'COURSE', 'ENROLLMENT', 'MODULE', 'LESSON'].map((type) => (
              <button
                key={type}
                onClick={() => setEntityFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition capitalize ${
                  entityFilter === type
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {type.toLowerCase()}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by action, email, or reason..."
              className="pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400 w-full sm:w-72"
            />
          </div>
        </div>

        {/* Activity Feed */}
        <div className="cosmic-card rounded-2xl border border-white/10 overflow-hidden shadow-xl">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">No activity logs recorded yet.</p>
              <p className="text-xs text-slate-500 mt-1">Actions performed across the admin panel will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-5 hover:bg-white/[0.02] transition space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>

                      <span className="text-xs font-semibold text-white">
                        {log.entityType} ({log.entityId.slice(0, 16)}...)
                      </span>

                      {log.course && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] bg-white/5 text-amber-300 font-medium">
                          {log.course.title}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{new Date(log.createdAt).toLocaleString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}</span>
                    </div>
                  </div>

                  {/* Actor & Reason */}
                  <div className="text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                      <User className="w-3 h-3 text-slate-500" />
                      <span>By: <strong className="text-slate-200">{log.userEmail || 'System / Site Owner'}</strong></span>
                    </div>

                    {log.reason && (
                      <div className="text-xs text-amber-200/90 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                        <span className="font-semibold text-amber-300">Justification Reason:</span> {log.reason}
                      </div>
                    )}
                  </div>

                  {/* Metadata / Details */}
                  {log.details && Object.keys(log.details).length > 0 && (
                    <details className="text-[11px] text-slate-400">
                      <summary className="cursor-pointer hover:text-slate-200">
                        View Audit Details
                      </summary>
                      <pre className="mt-1 p-2 rounded bg-black/40 text-[10px] text-slate-300 font-mono overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
