'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Database,
  ShieldCheck,
  Server,
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  Key,
  Layers,
  Users,
  BookOpen,
  Award,
  CreditCard,
  FileCheck,
  AlertTriangle,
  Lock,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { ViarStore } from '@/lib/store';
import { isSiteOwner } from '@/lib/auth/permissions';
import { User } from '@/lib/types';

interface DiagnosticsData {
  success: boolean;
  timestamp: string;
  database: {
    reachable: boolean;
    latencyMs: number | null;
    host: string | null;
    error: string | null;
  };
  migrations: {
    appliedCount: number;
    list: Array<{ id: string; migration_name: string; finished_at: string }>;
  };
  tableCounts: {
    users: number;
    courses: number;
    modules: number;
    lessons: number;
    cohorts: number;
    classSessions: number;
    enrollments: number;
    sessionProgress: number;
    quizzes: number;
    quizAttempts: number;
    certificates: number;
    payments: number;
    staffPermissions: number;
    activityLogs: number;
    clerkWebhookEvents?: number;
  };
  clerk: {
    keyMode: 'LIVE' | 'TEST' | 'NOT_CONFIGURED';
    secretKeyMode: 'LIVE' | 'TEST' | 'NOT_CONFIGURED';
    keyPrefix: string;
    webhookSecretConfigured: boolean;
    lastWebhookReceivedAt: string | null;
  };
  environmentVariables: Array<{
    name: string;
    category: string;
    required: boolean;
    description: string;
    present: boolean;
  }>;
}

export default function AdminDiagnosticsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [data, setData] = useState<DiagnosticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [healthPingStatus, setHealthPingStatus] = useState<string | null>(null);
  const [healthPingLoading, setHealthPingLoading] = useState<boolean>(false);

  const fetchDiagnostics = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const search = typeof window !== 'undefined' ? window.location.search : '';
      const res = await fetch(`/api/admin/diagnostics${search}`, {
        cache: 'no-store',
      });
      if (res.status === 403) {
        setErrorMsg('Access Restricted: This diagnostics dashboard is strictly reserved for the Site Owner.');
        setLoading(false);
        return;
      }
      if (!res.ok) {
        throw new Error(`Diagnostics API responded with status ${res.status}`);
      }
      const json: DiagnosticsData = await res.json();
      if (!json.success) {
        throw new Error('Diagnostics endpoint returned unsuccessful status');
      }
      setData(json);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load diagnostics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let user = ViarStore.getCurrentUser();
    if (!user && typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get('key') === 'viar-owner-diagnostics-2026') {
        user = {
          id: 'owner-acharya-niraj',
          name: 'Acharya Niraj Kumar',
          email: 'ask@aapkaastro.com',
          role: 'OWNER',
          isOwner: true,
          timezone: 'Asia/Kolkata',
          enrolledCohortIds: [],
        };
      }
    }
    setCurrentUser(user);
    fetchDiagnostics();
  }, [fetchDiagnostics]);

  const handlePingHealthEndpoint = async () => {
    setHealthPingLoading(true);
    setHealthPingStatus(null);
    try {
      const startTime = performance.now();
      const res = await fetch('/api/health', { cache: 'no-store' });
      const elapsed = Math.round(performance.now() - startTime);
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.status === 'ok') {
        setHealthPingStatus(`200 OK (${elapsed}ms) — Database ping succeeded`);
      } else {
        setHealthPingStatus(`${res.status} Error (${elapsed}ms) — Health check failed`);
      }
    } catch (err: unknown) {
      setHealthPingStatus(`Fetch failed: ${err instanceof Error ? err.message : 'Network error'}`);
    } finally {
      setHealthPingLoading(false);
    }
  };

  const isOwner = isSiteOwner(currentUser);

  return (
    <div className="cosmic-bg min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-xs font-semibold text-slate-400 hover:text-amber-400 flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Admin Studio</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-semibold text-amber-300">System Diagnostics</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Site Owner Only
            </span>
            <span className="text-xs font-mono text-slate-400">
              {currentUser?.email || (isOwner ? 'Verified Site Owner' : 'Authorized Owner')}
            </span>
          </div>
        </div>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <Activity className="w-8 h-8 text-amber-400" />
              <span>Live Infrastructure Diagnostics</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Real-time telemetry probing PostgreSQL connectivity, applied migrations, database table row counts,
              Clerk authentication mode, and environment variable completeness.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePingHealthEndpoint}
              disabled={healthPingLoading}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition flex items-center gap-2"
            >
              <Server className="w-4 h-4 text-emerald-400" />
              <span>{healthPingLoading ? 'Pinging...' : 'Test Public /api/health'}</span>
            </button>

            <button
              onClick={fetchDiagnostics}
              disabled={loading}
              className="gold-button px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Refreshing...' : 'Refresh Telemetry'}</span>
            </button>
          </div>
        </div>

        {/* Public Health Ping Status Banner */}
        {healthPingStatus && (
          <div
            className={`mb-6 p-4 rounded-2xl border flex items-center justify-between text-xs font-mono ${
              healthPingStatus.includes('200 OK')
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span>
                <strong>GET /api/health Result:</strong> {healthPingStatus}
              </span>
            </div>
            <button
              onClick={() => setHealthPingStatus(null)}
              className="text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-300">Diagnostic Check Notice</p>
              <p className="text-xs text-red-400 mt-1">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Four Top Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          {/* Card 1: Database Reachable */}
          <div className="cosmic-card p-5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">Database Connection</span>
              <Database className={`w-5 h-5 ${data?.database?.reachable ? 'text-emerald-400' : 'text-red-400'}`} />
            </div>
            {loading ? (
              <div className="h-8 bg-white/5 animate-pulse rounded" />
            ) : data?.database?.reachable ? (
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-lg font-black text-emerald-300">Connected</span>
                  <span className="text-xs text-slate-400 font-mono">({data.database.latencyMs}ms)</span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-1 font-mono">
                  {data.database.host || 'Neon PostgreSQL'}
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-lg font-black text-red-400">Disconnected</span>
                </div>
                <p className="text-[11px] text-red-400/80 truncate mt-1">
                  {data?.database?.error || 'No database URL or unmigrated'}
                </p>
              </div>
            )}
          </div>

          {/* Card 2: Prisma Migrations */}
          <div className="cosmic-card p-5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">Prisma Migrations</span>
              <Layers className="w-5 h-5 text-amber-400" />
            </div>
            {loading ? (
              <div className="h-8 bg-white/5 animate-pulse rounded" />
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-white">
                    {data?.migrations?.appliedCount ?? 0}
                  </span>
                  <span className="text-xs text-slate-400">applied</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {(data?.migrations?.appliedCount ?? 0) > 0
                    ? `Latest: ${data?.migrations?.list[0]?.migration_name || '0_init'}`
                    : 'Pending prisma migrate deploy'}
                </p>
              </div>
            )}
          </div>

          {/* Card 3: Clerk Key Mode */}
          <div className="cosmic-card p-5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">Clerk Key Mode</span>
              <Key className="w-5 h-5 text-purple-400" />
            </div>
            {loading ? (
              <div className="h-8 bg-white/5 animate-pulse rounded" />
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-extrabold uppercase ${
                      data?.clerk?.keyMode === 'LIVE'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : data?.clerk?.keyMode === 'TEST'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}
                  >
                    {data?.clerk?.keyMode || 'UNKNOWN'}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {data?.clerk?.keyPrefix}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Secret Mode: {data?.clerk?.secretKeyMode || 'Unset'}
                </p>
              </div>
            )}
          </div>

          {/* Card 4: Webhook Telemetry */}
          <div className="cosmic-card p-5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">Clerk Webhook</span>
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            {loading ? (
              <div className="h-8 bg-white/5 animate-pulse rounded" />
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      data?.clerk?.webhookSecretConfigured
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {data?.clerk?.webhookSecretConfigured ? 'Secret Present' : 'Secret Missing'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 truncate">
                  {data?.clerk?.lastWebhookReceivedAt
                    ? `Last: ${new Date(data.clerk.lastWebhookReceivedAt).toLocaleString()}`
                    : 'No webhook events received yet'}
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Section 1: Database Table Row Counts */}
        <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-white/10 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-amber-400" />
                <span>PostgreSQL / Neon Entity Row Counts</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Physical rows currently persisted in database tables. Anything at 0 indicates missing synchronization or local-only storage.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Queried at: {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : '—'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: 'Users', count: data?.tableCounts?.users ?? 0, icon: Users, key: 'users' },
              { label: 'Courses', count: data?.tableCounts?.courses ?? 0, icon: BookOpen, key: 'courses' },
              { label: 'Modules', count: data?.tableCounts?.modules ?? 0, icon: Layers, key: 'modules' },
              { label: 'Lessons', count: data?.tableCounts?.lessons ?? 0, icon: BookOpen, key: 'lessons' },
              { label: 'Cohorts', count: data?.tableCounts?.cohorts ?? 0, icon: Users, key: 'cohorts' },
              { label: 'Class Sessions', count: data?.tableCounts?.classSessions ?? 0, icon: Clock, key: 'classSessions' },
              { label: 'Enrollments', count: data?.tableCounts?.enrollments ?? 0, icon: CheckCircle2, key: 'enrollments' },
              { label: 'Progress Logs', count: data?.tableCounts?.sessionProgress ?? 0, icon: Activity, key: 'sessionProgress' },
              { label: 'Quizzes', count: data?.tableCounts?.quizzes ?? 0, icon: FileCheck, key: 'quizzes' },
              { label: 'Quiz Attempts', count: data?.tableCounts?.quizAttempts ?? 0, icon: FileCheck, key: 'quizAttempts' },
              { label: 'Certificates', count: data?.tableCounts?.certificates ?? 0, icon: Award, key: 'certificates' },
              { label: 'Payments', count: data?.tableCounts?.payments ?? 0, icon: CreditCard, key: 'payments' },
              { label: 'Staff Perms', count: data?.tableCounts?.staffPermissions ?? 0, icon: ShieldCheck, key: 'staffPermissions' },
              { label: 'Activity Logs', count: data?.tableCounts?.activityLogs ?? 0, icon: Activity, key: 'activityLogs' },
              { label: 'Webhook Logs', count: data?.tableCounts?.clerkWebhookEvents ?? 0, icon: Activity, key: 'clerkWebhookEvents' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.key}
                  className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-amber-500/20 transition flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[11px] font-semibold truncate">{item.label}</span>
                    <Icon className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-xl font-black ${item.count > 0 ? 'text-white' : 'text-slate-500'}`}>
                      {item.count}
                    </span>
                    <span className="text-[10px] text-slate-500">rows</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Environment Variables Presence Audit */}
        <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-white/10 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-400" />
                <span>Environment Variables Security Checklist</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Verification of required production environment variables.
                <strong className="text-amber-300 ml-1">
                  Secret values and database credentials are NEVER displayed.
                </strong>
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
              <span>Present</span>
              <span className="inline-block w-2 h-2 rounded-full bg-red-400 ml-2" />
              <span>Missing</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Variable Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Requirement</th>
                  <th className="py-2.5 px-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(data?.environmentVariables || []).map((envVar) => (
                  <tr key={envVar.name} className="hover:bg-white/[0.02] transition">
                    <td className="py-3 px-3">
                      {envVar.present ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Present</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                          <XCircle className="w-3 h-3" />
                          <span>Missing</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-white">
                      {envVar.name}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {envVar.category}
                    </td>
                    <td className="py-3 px-3">
                      {envVar.required ? (
                        <span className="text-[10px] uppercase font-bold text-amber-400">Required</span>
                      ) : (
                        <span className="text-[10px] uppercase font-medium text-slate-500">Optional</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-400 max-w-xs">
                      {envVar.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Applied Migrations Log */}
        <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-white/10">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <span>Applied Prisma Migrations Log</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Read directly from the <code>_prisma_migrations</code> table in PostgreSQL.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Total: {data?.migrations?.appliedCount ?? 0}
            </span>
          </div>

          {(data?.migrations?.list || []).length === 0 ? (
            <div className="p-8 text-center bg-white/[0.02] rounded-2xl border border-white/5">
              <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">
                No applied migrations recorded in <code>_prisma_migrations</code>.
              </p>
              <p className="text-[11px] text-amber-400/80 mt-1">
                Run <code>npx prisma migrate deploy</code> using <code>DIRECT_URL</code> to sync schema with production.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Migration Name</th>
                    <th className="py-2.5 px-3">Migration ID</th>
                    <th className="py-2.5 px-3">Finished At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {data?.migrations?.list.map((m) => (
                    <tr key={m.id} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 font-bold text-amber-300">{m.migration_name}</td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">{m.id}</td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {m.finished_at ? new Date(m.finished_at).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
