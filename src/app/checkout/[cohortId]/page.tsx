import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, Lock, Check, LogIn, UserCheck, MessageCircle } from 'lucide-react';
import { getServerAuthUser } from '@/lib/auth/serverAuth';
import { getUserCourseStatus } from '@/lib/courses/enrollmentStatus';
import CheckoutClient from './CheckoutClient';

interface Props {
  params: {
    cohortId: string;
  };
}

export default async function CheckoutPage({ params }: Props) {
  const auth = await getServerAuthUser();
  const cohortId = params.cohortId || 'cohort-wia-batch-1';

  // 1. Not signed in: render sign-in prompt on server
  if (!auth.isAuthenticated || !auth.userId) {
    return (
      <div className="cosmic-bg min-h-screen py-16 flex items-center justify-center px-4">
        <div className="cosmic-card p-8 rounded-3xl border border-white/10 max-w-lg w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Please Sign In to Enroll</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              To lock your enrollment and link your course vault to your personal student account, please sign in or register below.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-left text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>The Ultimate Astrology Course: Foundations to Chart Mastery</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>₹5,100 INR • One-Time Tuition</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Instant course unlock upon Owner payment verification</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/login?redirect=/checkout/${cohortId}`}
              className="gold-button flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In with Account</span>
            </Link>
            <Link
              href={`/signup?redirect=/checkout/${cohortId}`}
              className="px-5 py-3 rounded-xl text-xs font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>Create Free Account</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Resolve authoritative status on server
  const status = await getUserCourseStatus({
    userId: auth.userId,
    userEmail: auth.email,
    courseSlugOrId: cohortId,
  });

  // 3. Approved and enrolled: REDIRECT TO COURSE, NEVER SHOW PAYMENT OR QR
  if (status.state === 'ENROLLED') {
    redirect(`/dashboard/courses/${status.cohortId || cohortId}`);
  }

  // 4. Access revoked: No payment unless Owner restores access
  if (status.state === 'ACCESS_REVOKED') {
    return (
      <div className="cosmic-bg min-h-screen py-16 flex items-center justify-center px-4">
        <div className="cosmic-card p-8 rounded-3xl border border-red-500/30 max-w-lg w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Course Access Ended</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              Your previous access to this course has ended or been revoked. Direct online checkout is disabled for this account. Please connect with Acharya Niraj Kumar on WhatsApp to restore access.
            </p>
          </div>
          <a
            href={status.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="gold-button w-full py-3.5 rounded-2xl text-center font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Contact on WhatsApp (+91 93112 15564)</span>
          </a>
        </div>
      </div>
    );
  }

  const userSummary = auth.dbUser
    ? {
        id: auth.dbUser.id,
        name: auth.dbUser.name,
        email: auth.dbUser.email,
        phone: auth.dbUser.phone,
      }
    : auth.userId
    ? {
        id: auth.userId,
        name: null,
        email: auth.email || null,
        phone: null,
      }
    : null;

  return (
    <CheckoutClient
      cohortId={cohortId}
      initialStatus={status}
      currentUser={userSummary}
    />
  );
}
