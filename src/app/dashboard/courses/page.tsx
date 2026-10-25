'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  Play,
  CheckCircle2,
  Lock,
  Award,
  ArrowRight,
  ExternalLink,
  Clock,
  AlertTriangle,
  MessageCircle,
} from 'lucide-react';
import { ViarStore } from '@/lib/store';
import { User, Course } from '@/lib/types';
import { isSiteOwner } from '@/lib/auth/permissions';
import type { UserCourseStatusResult } from '@/lib/courses/enrollmentTypes';
import {
  AsyncStateView,
  type AsyncStateStatus,
  type ErrorType,
} from '@/components/common/AsyncStateView';

interface EnrolledCourseItem {
  id: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  thumbnailUrl: string;
  level: string;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  nextLessonId?: string;
  nextLessonTitle?: string;
  certificateEarned: boolean;
  certificateCode?: string;
  cohortId?: string;
  enrolledAt: string;
  amountPaid: number;
  currency: string;
}

export default function MyCoursesPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourseItem[]>([]);
  const [catalogCourses, setCatalogCourses] = useState<Course[]>([]);
  const [courseStatus, setCourseStatus] = useState<UserCourseStatusResult | null>(null);
  const [pageStatus, setPageStatus] = useState<AsyncStateStatus>('loading');
  const [errorType, setErrorType] = useState<ErrorType>('server');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const loadStudentCourses = useCallback(async () => {
    setPageStatus('loading');
    setErrorMessage('');
    let user: User | null = null;
    try {
      const syncRes = await fetch('/api/users/sync');
      if (syncRes.status === 401 || syncRes.status === 403) {
        setPageStatus('error');
        setErrorType('auth');
        return;
      }
      if (!syncRes.ok) {
        setPageStatus('error');
        setErrorType('server');
        return;
      }
      const syncData = await syncRes.json();
      if (syncData?.user) {
        user = syncData.user;
      }
    } catch (err) {
      setPageStatus('error');
      setErrorType('server');
      setErrorMessage(err instanceof Error ? err.message : 'Connection failed');
      return;
    }

    if (!user) {
      setPageStatus('error');
      setErrorType('auth');
      return;
    }
    setCurrentUser(user);

    fetch('/api/courses/what-is-astrology/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data.state) {
          setCourseStatus(data);
        }
      })
      .catch(() => {});

    const isStaff = user.role === 'ADMIN' || user.role === 'OWNER' || isSiteOwner(user);

    try {
      // 1. Fetch live courses catalog
      const coursesRes = await fetch('/api/courses');
      if (coursesRes.status === 401 || coursesRes.status === 403) {
        setPageStatus('error');
        setErrorType('auth');
        return;
      }
      if (!coursesRes.ok) {
        setPageStatus('error');
        setErrorType('server');
        return;
      }
      const coursesData = await coursesRes.json();
      const allCourses: Course[] = coursesData.success && Array.isArray(coursesData.courses)
        ? coursesData.courses
        : ViarStore.getCourses();
      setCatalogCourses(allCourses);

      // 2. Fetch live enrollments from PostgreSQL
      const enrollRes = await fetch(`/api/enrollments?userId=${user.id}`);
      if (enrollRes.status === 401 || enrollRes.status === 403) {
        setPageStatus('error');
        setErrorType('auth');
        return;
      }
      if (!enrollRes.ok) {
        setPageStatus('error');
        setErrorType('server');
        return;
      }
      const enrollData = await enrollRes.json();
      const rawEnrollments = enrollData.success && Array.isArray(enrollData.enrollments)
        ? enrollData.enrollments
        : [];

      // 3. Fetch user progress
      const progRes = await fetch(`/api/progress?userId=${user.id}`);
      if (progRes.status === 401 || progRes.status === 403) {
        setPageStatus('error');
        setErrorType('auth');
        return;
      }
      if (!progRes.ok) {
        setPageStatus('error');
        setErrorType('server');
        return;
      }
      const progData = await progRes.json();
      const completedLessonIds = new Set<string>(
        Array.isArray(progData.completedLessonIds) ? progData.completedLessonIds : []
      );

      // Match enrolled courses
      const items: EnrolledCourseItem[] = [];

      for (const crs of allCourses) {
        // Staff or actively enrolled
        const matchingEnrollment = rawEnrollments.find(
          (e: { courseId?: string; cohort?: { courseId?: string }; paymentStatus?: string; status?: string }) =>
            (e.courseId === crs.id || e.cohort?.courseId === crs.id) &&
            (e.paymentStatus !== 'REVOKED' && e.status !== 'REVOKED')
        );

        const hasAccess = isStaff || Boolean(matchingEnrollment) || (
          // Dev fallback
          user.enrolledCohortIds?.length && crs.slug === 'what-is-astrology'
        );

        if (hasAccess) {
          const totalLessons = (crs as { totalClasses?: number }).totalClasses || 23;
          let completedCount = 0;

          // Determine next incomplete lesson
          let nextLessonId = 'lesson-1-1';
          let nextLessonTitle = 'Module 1: What is Astrology';

          if (Array.isArray((crs as { modules?: unknown[] }).modules)) {
            const modules = (crs as { modules: Array<{ id: string; title: string; lessons?: Array<{ id: string; title: string }> }> }).modules;
            let foundNext = false;
            for (const m of modules) {
              if (Array.isArray(m.lessons)) {
                for (const l of m.lessons) {
                  if (completedLessonIds.has(l.id)) {
                    completedCount++;
                  } else if (!foundNext) {
                    nextLessonId = l.id;
                    nextLessonTitle = `${m.title} — ${l.title}`;
                    foundNext = true;
                  }
                }
              }
            }
          }

          const progressPct = Math.min(100, Math.round((completedCount / Math.max(1, totalLessons)) * 100));

          items.push({
            id: crs.id,
            courseId: crs.id,
            courseTitle: crs.title,
            courseSlug: crs.slug,
            thumbnailUrl: crs.thumbnailUrl || '/images/Acharya_Niraj_Kumar_Headshot.jpg',
            level: crs.level || 'Beginner',
            totalLessons,
            completedLessons: completedCount,
            progressPercentage: progressPct,
            nextLessonId,
            nextLessonTitle,
            certificateEarned: progressPct >= 100,
            cohortId: matchingEnrollment?.cohortId || 'cohort-wia-batch-1',
            enrolledAt: matchingEnrollment?.enrolledAt || new Date().toISOString(),
            amountPaid: matchingEnrollment?.amountPaid || crs.priceInr,
            currency: matchingEnrollment?.currency || 'INR',
          });
        }
      }

      setEnrolledCourses(items);
      setPageStatus(items.length === 0 ? 'empty' : 'success');
    } catch (err) {
      console.warn('Failed to load enrolled courses:', err);
      setPageStatus('error');
      setErrorType('server');
      setErrorMessage(err instanceof Error ? err.message : 'Could not load courses');
    }
  }, []);

  useEffect(() => {
    loadStudentCourses();
  }, [loadStudentCourses]);

  return (
    <div className="cosmic-bg min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
{/* Status Banners for Pending Orders or Revoked Access */}
        {courseStatus?.state === 'ORDER_CLAIMED' && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-200">
            <Clock className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
            <div className="flex-1 text-sm">
              <strong className="text-amber-300 font-semibold block">Payment Under Verification</strong>
              <span>
                Your payment for Order #{courseStatus.order?.id?.slice(0, 8)} (UTR: {courseStatus.order?.utr || 'Submitted'}) is currently being verified by Acharya Niraj Kumar. Your course lessons will unlock here as soon as bank credit is confirmed.
              </span>
            </div>
          </div>
        )}

        {courseStatus?.state === 'ORDER_PENDING' && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4 text-amber-200 flex-wrap">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
              <div className="text-sm">
                <strong className="text-amber-300 font-semibold block">Order Waiting for Payment</strong>
                <span>You have an open order for this course. Complete UPI payment to activate your access.</span>
              </div>
            </div>
            <Link
              href="/checkout?course=what-is-astrology"
              className="gold-button px-4 py-2 rounded-xl text-xs font-bold"
            >
              Resume Payment
            </Link>
          </div>
        )}

        {courseStatus?.state === 'ORDER_REJECTED' && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-4 text-red-200 flex-wrap">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
              <div className="text-sm">
                <strong className="text-red-300 font-semibold block">Payment Verification Failed</strong>
                <span>
                  {courseStatus.order?.rejectionReason ? `Reason: ${courseStatus.order.rejectionReason}` : 'Your previous payment could not be matched with bank credits.'}
                </span>
              </div>
            </div>
            <Link
              href="/checkout?course=what-is-astrology"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500/20 text-red-200 border border-red-500/30 hover:bg-red-500/30"
            >
              Try Again
            </Link>
          </div>
        )}

        {courseStatus?.state === 'ACCESS_REVOKED' && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-4 text-red-200 flex-wrap">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
              <div className="text-sm">
                <strong className="text-red-300 font-semibold block">Course Access Ended</strong>
                <span>Your access to this course has ended. Please connect with us if you need assistance.</span>
              </div>
            </div>
            <a
              href="https://wa.me/919311215564?text=Namaste%20Acharya%20ji%2C%20my%20course%20access%20has%20ended%20and%20I%20would%20like%20to%20inquire."
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 flex items-center gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Contact Us on WhatsApp</span>
            </a>
          </div>
        )}

        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">
                Student Learning Portal
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400">{currentUser?.email}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <BookOpen className="w-7 h-7 text-amber-400" />
              <span>My Enrolled Courses</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition"
            >
              Dashboard Overview
            </Link>
            <Link
              href="/dashboard/certificates"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-amber-300 bg-white/5 hover:bg-white/10 border border-amber-500/20 transition flex items-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>My Certificates</span>
            </Link>
          </div>
        </div>

        {/* Content Area with strict separation of Loading, Error (401/403 vs 500), Empty, and Success */}
        <AsyncStateView
          status={pageStatus}
          errorType={errorType}
          errorMessage={errorMessage}
          onRetry={loadStudentCourses}
          signInUrl="/login?returnUrl=/dashboard/courses"
          loadingMessage="Loading your enrolled masterclasses..."
          emptyComponent={
            /* Locked State for Non-Enrolled Visitors */
            <div className="py-12 space-y-10">
              <div className="cosmic-card p-8 sm:p-12 rounded-3xl border border-amber-500/40 text-center max-w-2xl mx-auto space-y-5 bg-gradient-to-b from-[#111827] to-[#0a0f1a]">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
                  <Lock className="w-8 h-8" />
                </div>
                <div>
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-block mb-2">
                    No Active Enrollments
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white">
                    Unlock Acharya Niraj Kumar&apos;s Vedic Astrology Masterclasses
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed max-w-md mx-auto">
                    You do not currently have an active enrollment. Explore the curriculum catalog below to begin your journey from celestial mechanics to predictive chart mastery.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 mb-1" />
                    <strong className="text-white block">23 HD Video Modules</strong>
                    <span className="text-[11px] text-slate-400">On-demand streaming</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 mb-1" />
                    <strong className="text-white block">Official Study Guides</strong>
                    <span className="text-[11px] text-slate-400">Downloadable PDFs</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 mb-1" />
                    <strong className="text-white block">Accredited Certificate</strong>
                    <span className="text-[11px] text-slate-400">Verifiable credential slug</span>
                  </div>
                </div>

                <div className="pt-4">
                  <Link
                    href="/courses"
                    className="gold-button px-8 py-3.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-xl shadow-amber-500/20 uppercase tracking-wider"
                  >
                    <span>Browse Available Courses</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Catalog Preview */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Available Courses for Admission</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {catalogCourses.slice(0, 3).map((c) => (
                    <div key={c.id} className="cosmic-card rounded-2xl border border-white/10 overflow-hidden flex flex-col justify-between">
                      <div>
                        <div className="relative h-40 w-full bg-slate-900">
                          <Image
                            src={c.thumbnailUrl || '/images/Acharya_Niraj_Kumar_Headshot.jpg'}
                            alt={c.title}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold bg-black/70 text-amber-300 border border-amber-500/30">
                            {c.level}
                          </div>
                        </div>
                        <div className="p-5 space-y-2">
                          <h4 className="text-sm font-bold text-white line-clamp-1">{c.title}</h4>
                          <p className="text-xs text-slate-400 line-clamp-2">{c.description}</p>
                        </div>
                      </div>
                      <div className="p-5 pt-0 border-t border-white/5 flex items-center justify-between">
                        <span className="text-sm font-black text-amber-300">₹{c.priceInr}</span>
                        <Link
                          href={`/courses/${c.slug}`}
                          className="gold-button px-3.5 py-1.5 rounded-lg text-xs font-bold"
                        >
                          Enroll Now
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          }
        >
          {/* Enrolled Courses Grid */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {enrolledCourses.map((enr) => (
                <div
                  key={enr.id}
                  className="cosmic-card p-6 sm:p-7 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-[#121827] via-[#0e1422] to-[#0a0f1a] shadow-xl flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-4">
                    {/* Header info */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {enr.level}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Enrolled: {new Date(enr.enrolledAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-white">
                          {enr.courseTitle}
                        </h3>
                      </div>

                      {enr.certificateEarned ? (
                        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0" title="Certificate Earned">
                          <Award className="w-5 h-5 text-amber-400" />
                        </div>
                      ) : null}
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-300">Curriculum Progress</span>
                        <span className="text-amber-300 font-bold">{enr.progressPercentage}% Complete</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
                          style={{ width: `${enr.progressPercentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>{enr.completedLessons} of {enr.totalLessons} Lessons Finished</span>
                        <span>{enr.totalLessons - enr.completedLessons} Remaining</span>
                      </div>
                    </div>

                    {/* Next Lesson Box */}
                    {enr.nextLessonTitle && enr.progressPercentage < 100 && (
                      <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block mb-0.5">
                            Up Next
                          </span>
                          <p className="text-xs text-slate-200 font-semibold truncate">
                            {enr.nextLessonTitle}
                          </p>
                        </div>
                        <Link
                          href={`/dashboard/courses/${enr.cohortId}?lesson=${enr.nextLessonId}`}
                          className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 shrink-0 transition"
                          title="Play Next Lesson"
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
                    <Link
                      href={`/dashboard/courses/${enr.cohortId}`}
                      className="gold-button px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-md shadow-amber-500/15"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{enr.progressPercentage > 0 ? 'Resume Course' : 'Start Course'}</span>
                    </Link>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/courses/${enr.cohortId}/quiz`}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center gap-1.5"
                      >
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span>Final Exam</span>
                      </Link>
                      <Link
                        href={`/courses/${enr.courseSlug}`}
                        target="_blank"
                        className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition"
                        title="View Course Page"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AsyncStateView>

      </div>
    </div>
  );
}
