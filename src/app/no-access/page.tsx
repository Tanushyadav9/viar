import React, { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldAlert, ArrowLeft, Home, UserCheck, Lock } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface NoAccessProps {
  searchParams?: {
    reason?: string;
    area?: string;
  };
}

function NoAccessContent({ searchParams }: NoAccessProps) {
  const reason = searchParams?.reason;
  const area = searchParams?.area;

  let title = 'Access Restricted';
  let description =
    'You do not have permission to view or access the requested area on VIAR. Please return to your student dashboard or log in with an authorized account.';

  if (reason === 'owner_only') {
    title = 'Site Owner Access Required';
    description =
      'This section is strictly reserved for the Site Owner (Acharya Niraj Kumar). Staff members and students cannot view or modify team permissions, payment credentials, or audit logs.';
  } else if (reason === 'admin_restricted') {
    title = 'Administrative Access Restricted';
    description =
      'The administration console is restricted to the Site Owner and authorized staff members. Your account does not possess active administrative permissions.';
  } else if (reason === 'instructor_restricted') {
    title = 'Instructor Access Restricted';
    description =
      'The instructor studio requires instructor credentials. Please return to your student learning dashboard.';
  } else if (area) {
    title = `${area.charAt(0).toUpperCase() + area.slice(1)} Access Restricted`;
    description = `You do not have granted permissions for the ${area} section. Access can only be granted by the Site Owner via /admin/team.`;
  }

  return (
    <div className="cosmic-bg min-h-screen py-16 sm:py-24 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-3 mb-4 group">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-amber-500/30 p-1 flex items-center justify-center group-hover:scale-105 transition shadow-lg shadow-amber-500/10 shrink-0">
              <Image
                src="/images/logo-icon.png"
                alt="VIAR Logo"
                width={40}
                height={40}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div className="text-left">
              <span className="text-2xl font-black tracking-wider text-white block leading-none">
                VIAR<span className="text-amber-400">.IN</span>
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block mt-0.5">
                Vihangam Academy
              </span>
            </div>
          </Link>
        </div>

        {/* Access Restricted Card */}
        <div className="cosmic-card p-6 sm:p-10 rounded-3xl border border-red-500/30 bg-slate-900/80 shadow-2xl space-y-6 text-center backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto text-red-400 shadow-lg shadow-red-500/10">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-red-500/10 border border-red-500/20 text-red-400 mb-3">
              <Lock className="w-3.5 h-3.5" /> 403 Forbidden
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white">{title}</h1>
            <p className="text-sm text-slate-300 mt-3 leading-relaxed">{description}</p>
          </div>

          <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-500/20"
            >
              <ArrowLeft className="w-4 h-4" /> Go to Dashboard
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs transition"
            >
              <Home className="w-4 h-4" /> Return to Home
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-semibold text-xs transition"
            >
              <UserCheck className="w-4 h-4" /> Switch Account
            </Link>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] text-slate-500 mt-6">
          VIAR Security Policy &bull; Server Source of Truth &bull; Role-Based Access Control
        </p>
      </div>
    </div>
  );
}

export default function NoAccessPage(props: NoAccessProps) {
  return (
    <Suspense fallback={<div className="cosmic-bg min-h-screen" />}>
      <NoAccessContent {...props} />
    </Suspense>
  );
}
