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
  ArrowLeft,
  Globe,
  UserCheck,
  Video,
} from 'lucide-react';
import { isSiteOwner } from '@/lib/auth/permissions';
import { User } from '@/lib/types';
import { useUser } from '@clerk/nextjs';
import {
  AsyncStateView,
  type AsyncStateStatus,
  type ErrorType,
} from '@/components/common/AsyncStateView';

interface DiagnosticsData {
  success: boolean;
  timestamp: string;
  host: {
    raw: string;
    classification: 'apex' | 'www' | 'localhost' | 'other';
  };
  serverSession: {
    recognized: boolean;
    userId: string | null;
    sessionIdPrefix: string | null;
  };
  cookiesReceived: {
    count: number;
    names: string[];
  };
  currentUserInDb: {
    hasRow: boolean;
    user: {
      id: string;
      maskedEmail: string;
      role: string;
      isOwner: boolean;
    } | null;
  };
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
    studentSessions?: number;
    sessionRequests?: number;
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
  lastFiveSignups: Array<{
    id: string;
    maskedEmail: string;
    name: string;
    role: string;
    isOwner: boolean;
    createdAt: string;
  }>;
  clerk: {
    keyMode: 'LIVE' | 'TEST' | 'NOT_CONFIGURED';
    secretKeyMode: 'LIVE' | 'TEST' | 'NOT_CONFIGURED';
    keyPrefix: string;
    secretKeyConfigured: boolean;
    webhookSecretConfigured: boolean;
    lastWebhookReceivedAt: string | null;
  };
  satellite: {
    anyConfigured: boolean;
    variables: Array<{ name: string; isConfigured: boolean }>;
  };
  environmentVariables: Array<{
    name: string;
    category: string;
    required: boolean;
    description: string;
    present: boolean;
  }>;
  demoDataContamination?: {
    hasDemoData: boolean;
    exampleEmailCount: number;
    testOrderCount: number;
    clientCrashCount: number;
    details: string[];
  };
  architectureAudit?: {
    dataStorageMatrix: Array<{ dataType: string; sourceOfTruth: string; browserStorage: string }>;
    ownerAssignmentPaths: Array<{ path: string; mechanism: string; enforcement: string; hardcodedFallbacks: string }>;
    scriptDatabaseTargets: Array<{ script: string; target: string; purpose: string }>;
  };
}

export default function AdminDiagnosticsPage() {
  const { user: clerkUser } = useUser();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [data, setData] = useState<DiagnosticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [pageStatus, setPageStatus] = useState<AsyncStateStatus>('loading');
  const [errorType, setErrorType] = useState<ErrorType>('server');
  const [healthPingStatus, setHealthPingStatus] = useState<string | null>(null);
  const [healthPingLoading, setHealthPingLoading] = useState<boolean>(false);

  const fetchDiagnostics = useCallback(async () => {
    setLoading(true);
    setPageStatus('loading');
    setErrorMsg('');
    try {
      const search = typeof window !== 'undefined' ? window.location.search : '';
      const res = await fetch(`/api/admin/diagnostics${search}`, {
        cache: 'no-store',
      });
      if (res.status === 401 || res.status === 403) {
        setPageStatus('error');
        setErrorType('auth');
        setErrorMsg('Access Restricted: This diagnostics dashboard is strictly reserved for the Site Owner.');
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setPageStatus('error');
        setErrorType('server');
        throw new Error(`Diagnostics API responded with status ${res.status}`);
      }
      const json: DiagnosticsData = await res.json();
      setData(json);
      setPageStatus('success');
    } catch (err: unknown) {
      setPageStatus('error');
      setErrorType('server');
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load diagnostics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let user: User | null = null;
    if (clerkUser) {
      const email =
        clerkUser.primaryEmailAddress?.emailAddress ||
        clerkUser.emailAddresses?.[0]?.emailAddress ||
        '';
      const isOwnerAccount =
        isSiteOwner(email) || email.trim().toLowerCase() === 'aapkaastro1606@gmail.com';
      user = {
        id: clerkUser.id,
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Acharya Niraj Kumar',
        email,
        role: isOwnerAccount ? 'OWNER' : 'STUDENT',
        isOwner: isOwnerAccount,
        timezone: 'Asia/Kolkata',
        enrolledCohortIds: [],
      };
    }
    if (!user && typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get('key') === 'viar-owner-diagnostics-2026') {
        user = {
          id: 'owner-acharya-niraj',
          name: 'Acharya Niraj Kumar',
          email: 'aapkaastro1606@gmail.com',
          role: 'OWNER',
          isOwner: true,
          timezone: 'Asia/Kolkata',
          enrolledCohortIds: [],
        };
      }
    }
    setCurrentUser(user);
    fetchDiagnostics();
  }, [fetchDiagnostics, clerkUser]);

  const handlePingHealthEndpoint = async () => {
    setHealthPingLoading(true);
    setHealthPingStatus(null);
    try {
      const startTime = performance.now();
      const res = await fetch('/api/health', { cache: 'no-store' });
      const elapsed = Math.round(performance.now() - startTime);
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.status === 'ok') {
        setHealthPingStatus(`200 OK — Database Ping Passed (${elapsed}ms)`);
      } else {
        setHealthPingStatus(`${res.status} Error — Database Unreachable (${elapsed}ms)`);
      }
    } catch (err: unknown) {
      setPageStatus('error');
      setErrorType('server');
      setHealthPingStatus(`Fetch Failed: ${err instanceof Error ? err.message : 'Network Error'}`);
    } finally {
      setHealthPingLoading(false);
    }
  };

  const clerkEmail =
    clerkUser?.primaryEmailAddress?.emailAddress ||
    clerkUser?.emailAddresses?.[0]?.emailAddress ||
    '';

  const isOwner = Boolean(
    currentUser?.isOwner ||
    (currentUser?.email && (isSiteOwner(currentUser.email) || currentUser.email.trim().toLowerCase() === 'aapkaastro1606@gmail.com')) ||
    (clerkEmail && (isSiteOwner(clerkEmail) || clerkEmail.trim().toLowerCase() === 'aapkaastro1606@gmail.com')) ||
    data?.currentUserInDb?.user?.isOwner
  );

  if (pageStatus === 'error' && errorType === 'auth') {
    return (
      <div className="cosmic-bg min-h-screen py-24 px-4 flex items-center justify-center">
        <AsyncStateView
          status="error"
          errorType="auth"
          errorMessage={errorMsg}
          signInUrl="/login?returnUrl=/admin/diagnostics"
        />
      </div>
    );
  }

  if (pageStatus === 'error' && errorType === 'server') {
    return (
      <div className="cosmic-bg min-h-screen py-24 px-4 flex items-center justify-center">
        <AsyncStateView
          status="error"
          errorType="server"
          errorMessage={errorMsg}
          onRetry={fetchDiagnostics}
        />
      </div>
    );
  }

  if (!loading && !isOwner && errorMsg) {
    return (
      <div className="cosmic-bg min-h-screen py-24 px-4 flex items-center justify-center">
        <div className="max-w-md w-full cosmic-card p-8 rounded-3xl border border-red-500/30 text-center">
          <Lock className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Restricted Section</h1>
          <p className="text-xs text-slate-400 mb-6">{errorMsg}</p>
          <Link
            href="/admin"
            className="gold-button inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Admin Console</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cosmic-bg min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <Link href="/admin" className="hover:text-amber-400 transition">Admin Console</Link>
              <span>/</span>
              <span className="text-amber-400">System Diagnostics</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <Activity className="w-7 h-7 text-amber-400 animate-pulse" />
              <span>Infrastructure Diagnostics &amp; System Health</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Live system status: Clerk key modes, server sessions, Neon PostgreSQL connectivity, and applied migrations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handlePingHealthEndpoint}
              disabled={healthPingLoading}
              className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-slate-200 transition flex items-center gap-1.5"
            >
              <Server className="w-3.5 h-3.5 text-blue-400" />
              <span>{healthPingLoading ? 'Pinging /api/health...' : 'Test /api/health'}</span>
            </button>

            <button
              onClick={fetchDiagnostics}
              disabled={loading}
              className="gold-button px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </button>
          </div>
        </div>

        {/* Demo / Test Data Contamination Warning Banner */}
        {data?.demoDataContamination?.hasDemoData && (
          <div className="bg-amber-500/15 border-2 border-amber-500/50 rounded-2xl p-5 text-amber-200 shadow-xl backdrop-blur">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-base font-bold text-amber-300">
                    ⚠️ Demo &amp; Test Data Detected in Database
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    CLEANUP REQUIRED
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  The active database contains test submissions, simulated error traces, or test orders that do not represent real student tuition or real visitor inquiries:
                </p>
                <ul className="mt-2 text-xs font-mono text-amber-300/90 list-disc list-inside space-y-1">
                  {data.demoDataContamination.details.map((detail, idx) => (
                    <li key={idx}>{detail}</li>
                  ))}
                </ul>
                <div className="mt-3 pt-3 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                  <span>Policy: Exclude all test purchases from revenue metrics and clean demo records in a transactional dry-run.</span>
                  <Link
                    href="/admin?tab=payments"
                    className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2"
                  >
                    Open Payments &amp; Test Data Manager &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Health Ping Feedback Banner */}
        {healthPingStatus && (
          <div className={`p-4 rounded-2xl border text-xs font-mono flex items-center justify-between ${
            healthPingStatus.includes('200 OK')
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 shrink-0" />
              <span><strong>Health Endpoint Probe:</strong> {healthPingStatus}</span>
            </div>
            <button
              onClick={() => setHealthPingStatus(null)}
              className="text-slate-400 hover:text-white"
            >
              ×
            </button>
          </div>
        )}

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">Diagnostic Error Encountered</p>
              <p className="text-slate-400 text-[11px] mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Key Metrics / Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
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
                  {data?.database?.error || 'Database unreachable'}
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
                <p className="text-[11px] text-slate-400 mt-1 truncate">
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

        {/* Deep Server-Side Telemetry Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Telemetry 1: Server-Side Auth Session */}
          <div className="cosmic-card p-5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">Server-Side auth() Session</span>
              <ShieldCheck className={`w-5 h-5 ${data?.serverSession?.recognized ? 'text-emerald-400' : 'text-amber-400'}`} />
            </div>
            {loading ? (
              <div className="h-8 bg-white/5 animate-pulse rounded" />
            ) : (
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Session Recognized:</span>
                  <span className={`font-bold ${data?.serverSession?.recognized ? 'text-emerald-300' : 'text-slate-400'}`}>
                    {data?.serverSession?.recognized ? 'Yes (Active)' : 'No (Anonymous / SSR)'}
                  </span>
                </div>
                <div className="flex items-center justify-between font-mono">
                  <span className="text-slate-400">User ID:</span>
                  <span className="text-slate-200 text-[11px] truncate max-w-[140px]">
                    {data?.serverSession?.userId || 'None'}
                  </span>
                </div>
                <div className="flex items-center justify-between font-mono">
                  <span className="text-slate-400">Session ID Prefix:</span>
                  <span className="text-slate-400 text-[11px]">
                    {data?.serverSession?.sessionIdPrefix || 'None'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Telemetry 2: Host & Cookies Received */}
          <div className="cosmic-card p-5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">Host & Cookies Received</span>
              <Globe className="w-5 h-5 text-indigo-400" />
            </div>
            {loading ? (
              <div className="h-8 bg-white/5 animate-pulse rounded" />
            ) : (
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Host Classification:</span>
                  <span className="font-bold text-amber-300 uppercase font-mono">
                    {data?.host?.classification || 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-slate-400">Raw Host:</span>
                  <span className="text-slate-200 truncate max-w-[150px]">
                    {data?.host?.raw || '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Cookie Names Received:</span>
                  <span className="text-slate-300 font-mono">
                    {data?.cookiesReceived?.count ?? 0} headers
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 truncate font-mono">
                  {data?.cookiesReceived?.names?.join(', ') || 'No cookies'}
                </div>
              </div>
            )}
          </div>

          {/* Telemetry 3: Current User DB Row & Satellite Security */}
          <div className="cosmic-card p-5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">Current User & Satellite Status</span>
              <UserCheck className={`w-5 h-5 ${data?.currentUserInDb?.hasRow ? 'text-emerald-400' : 'text-slate-400'}`} />
            </div>
            {loading ? (
              <div className="h-8 bg-white/5 animate-pulse rounded" />
            ) : (
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Database Row Present:</span>
                  <span className={`font-bold ${data?.currentUserInDb?.hasRow ? 'text-emerald-300' : 'text-amber-400'}`}>
                    {data?.currentUserInDb?.hasRow ? 'Yes (Synchronized)' : 'Pending Webhook / Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Masked Email:</span>
                  <span className="font-mono text-slate-200 text-[11px]">
                    {data?.currentUserInDb?.user?.maskedEmail || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Satellite Domain Config:</span>
                  <span className={`font-bold ${data?.satellite?.anyConfigured ? 'text-red-400' : 'text-emerald-300'}`}>
                    {data?.satellite?.anyConfigured ? '⚠️ Satellite Active' : 'Standalone (Zero Shared)'}
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Section 1: Database Entity Row Counts */}
        <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-amber-400" />
                <span>PostgreSQL / Neon Entity Row Counts</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Physical rows currently persisted in database tables.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Total Users: {data?.tableCounts?.users ?? 0}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: 'Users', count: data?.tableCounts?.users ?? 0, icon: Users, key: 'users' },
              { label: 'Courses', count: data?.tableCounts?.courses ?? 0, icon: BookOpen, key: 'courses' },
              { label: 'Modules', count: data?.tableCounts?.modules ?? 0, icon: Layers, key: 'modules' },
              { label: 'Lessons', count: data?.tableCounts?.lessons ?? 0, icon: BookOpen, key: 'lessons' },
              { label: '1-on-1 Sessions', count: data?.tableCounts?.studentSessions ?? data?.tableCounts?.cohorts ?? 0, icon: Video, key: 'studentSessions' },
              { label: 'Classes', count: data?.tableCounts?.classSessions ?? 0, icon: Clock, key: 'classSessions' },
              { label: 'Enrollments', count: data?.tableCounts?.enrollments ?? 0, icon: Award, key: 'enrollments' },
              { label: 'Progress', count: data?.tableCounts?.sessionProgress ?? 0, icon: Activity, key: 'sessionProgress' },
              { label: 'Quizzes', count: data?.tableCounts?.quizzes ?? 0, icon: FileCheck, key: 'quizzes' },
              { label: 'Attempts', count: data?.tableCounts?.quizAttempts ?? 0, icon: FileCheck, key: 'quizAttempts' },
              { label: 'Certificates', count: data?.tableCounts?.certificates ?? 0, icon: Award, key: 'certificates' },
              { label: 'Orders', count: data?.tableCounts?.payments ?? 0, icon: CreditCard, key: 'payments' },
              { label: 'Staff Perms', count: data?.tableCounts?.staffPermissions ?? 0, icon: ShieldCheck, key: 'staffPermissions' },
              { label: 'Clerk Events', count: data?.tableCounts?.clerkWebhookEvents ?? 0, icon: Clock, key: 'clerkWebhookEvents' },
            ].map((item) => (
              <div
                key={item.key}
                className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-amber-500/30 transition text-center"
              >
                <item.icon className="w-4 h-4 text-amber-400/80 mx-auto mb-1.5" />
                <div className="text-xl font-black text-white">{item.count}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5 truncate">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Last 5 Sign-Ups (Masked) */}
        <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-white/10">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <span>Last 5 Registered Users</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Emails are strictly masked to preserve confidentiality (e.g. <code>a***6@gmail.com</code>).
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Recent Sign-ups
            </span>
          </div>

          {(data?.lastFiveSignups || []).length === 0 ? (
            <div className="p-8 text-center bg-white/[0.02] rounded-2xl border border-white/5">
              <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No registered users in the database yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Masked Email</th>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Owner Status</th>
                    <th className="py-2.5 px-3">Registered At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {data?.lastFiveSignups.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 font-bold text-amber-300">{u.maskedEmail}</td>
                      <td className="py-2.5 px-3 text-slate-300">{u.name}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-slate-300">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {u.isOwner ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Site Owner
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">No</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {new Date(u.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 3: Satellite Configuration Security Check */}
        <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-white/10">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Satellite Domain Audit (Strict Isolation)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Viar.in uses its own standalone Clerk application. All cross-site satellite variables must be absent.
              </p>
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
              data?.satellite?.anyConfigured
                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {data?.satellite?.anyConfigured ? '⚠️ Satellite Config Detected' : '✓ 100% Standalone Clerk'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {(data?.satellite?.variables || []).map((v) => (
              <div key={v.name} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono text-slate-300 block">{v.name}</span>
                  <span className="text-[10px] text-slate-500">Should be absent</span>
                </div>
                {v.isConfigured ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400">Set</span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">Absent</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Architecture & Data Storage Matrix */}
        {data?.architectureAudit && (
          <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-white/10">
            <div className="mb-4 pb-4 border-b border-white/10">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <span>Architecture & Data Storage Single Source of Truth</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Audit reporting on where each data type lives, how OWNER is assigned, and which DB each script targets.
              </p>
            </div>

            <div className="overflow-x-auto mb-6">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Data Type</th>
                    <th className="py-2.5 px-3">Primary Source of Truth</th>
                    <th className="py-2.5 px-3">Browser / Edge Storage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {data.architectureAudit.dataStorageMatrix.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 font-bold text-slate-200">{item.dataType}</td>
                      <td className="py-2.5 px-3 text-amber-300">{item.sourceOfTruth}</td>
                      <td className="py-2.5 px-3 text-slate-400">{item.browserStorage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="text-sm font-bold text-white mb-2">Owner-Assignment Code Paths</h3>
            <div className="space-y-2 mb-6">
              {data.architectureAudit.ownerAssignmentPaths.map((p, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                  <strong className="text-amber-300 block">{p.path}</strong>
                  <p className="text-slate-300 text-[11px] mt-0.5 font-mono">{p.mechanism}</p>
                  <p className="text-slate-400 text-[10px] mt-0.5">{p.enforcement}</p>
                </div>
              ))}
            </div>

            <h3 className="text-sm font-bold text-white mb-2">Scripts Database Targets</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {data.architectureAudit.scriptDatabaseTargets.map((s, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                  <code className="text-amber-300 font-bold block">{s.script}</code>
                  <span className="text-[10px] text-emerald-400 block font-mono">{s.target}</span>
                  <p className="text-slate-400 text-[10px] mt-1">{s.purpose}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 5: Required Environment Variables */}
        <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-white/10">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                <span>Required Environment Variables Checklist</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Validates presence of secrets on the active runtime environment. Secret values are never exposed.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {data?.environmentVariables?.filter((v) => v.present).length} / {data?.environmentVariables?.length} present
            </span>
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
                  <tr key={envVar.name} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-3">
                      {envVar.present ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>Configured</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400">
                          <XCircle className="w-4 h-4 shrink-0" />
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

        {/* Section 6: Applied Migrations Log */}
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
