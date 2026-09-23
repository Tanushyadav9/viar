'use client';

import {
  Course,
  Cohort,
  ScheduledClass,
  FinalTest,
  TestSubmission,
  Certificate,
  Enrollment,
  User,
  NotifyMeLead,
  ClassDiscussionComment,
  AdminSection,
  StaffPermission,
  StaffAccessLevel,
} from './types';
import {
  INITIAL_COURSES,
  INITIAL_COHORTS,
  SCHEDULED_CLASSES_FLAGSHIP,
  INITIAL_FINAL_TEST,
  DEMO_USERS,
  DEMO_CERTIFICATES,
  DEMO_ENROLLMENTS,
} from './data';
import { getUserLocalTimezone } from './timezones';
import { isSiteOwner, ADMIN_SECTIONS } from './auth/permissions';

const STORAGE_KEYS = {
  COURSES: 'viar_courses',
  COHORTS: 'viar_cohorts',
  CLASSES: 'viar_classes',
  FINAL_TEST: 'viar_final_test',
  SUBMISSIONS: 'viar_submissions',
  CERTIFICATES: 'viar_certificates',
  ENROLLMENTS: 'viar_enrollments',
  CURRENT_USER: 'viar_current_user',
  TIMEZONE: 'viar_preferred_timezone',
  WATCHED_CLASSES: 'viar_watched_classes',
  NOTIFY_LEADS: 'viar_notify_leads',
  DISCUSSIONS: 'viar_class_discussions',
  STAFF_PERMISSIONS: 'viar_staff_permissions',
  STAFF_USERS: 'viar_staff_users',
};

const DEFAULT_CLASS_DISCUSSIONS: ClassDiscussionComment[] = [
  {
    id: 'comm-1',
    sessionId: 'cls-1',
    authorName: 'Rohan Mehra',
    authorRole: 'STUDENT',
    comment: 'Acharya ji, when calculating the exact degree of the Lagna at dawn, does the local apparent sunrise time take precedence over standard civil tables?',
    createdAt: '2026-10-04T05:30:00.000Z',
    instructorReply: {
      authorName: 'Acharya Niraj Kumar',
      comment: 'Excellent inquiry Rohan. True local apparent solar dawn is always the authentic baseline in classical Jyotish. In Class 3 we will compute the exact Chara Khanda ascendant adjustments for any latitude.',
      repliedAt: '2026-10-04T08:15:00.000Z',
    },
  },
  {
    id: 'comm-2',
    sessionId: 'cls-1',
    authorName: 'Ananya Iyer',
    authorRole: 'STUDENT',
    comment: 'The explanation of Prarabdha Karma versus Kriyamana Karma completely clarified why two charts with similar planetary signs experience divergent life directions. Thank you for this mathematical rigor!',
    createdAt: '2026-10-05T12:00:00.000Z',
  },
];

function getStorageItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return fallback;
  }
}

function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

export const ViarStore = {
  // Courses
  getCourses(): Course[] {
    return getStorageItem<Course[]>(STORAGE_KEYS.COURSES, INITIAL_COURSES);
  },

  getCourseBySlug(slug: string): Course | undefined {
    const courses = this.getCourses();
    return courses.find((c) => c.slug === slug);
  },

  getCourseById(id: string): Course | undefined {
    const courses = this.getCourses();
    return courses.find((c) => c.id === id);
  },

  addCourse(newCourse: Course): void {
    const courses = this.getCourses();
    courses.push(newCourse);
    setStorageItem(STORAGE_KEYS.COURSES, courses);
  },

  // Cohorts
  getCohorts(courseId?: string): Cohort[] {
    const cohorts = getStorageItem<Cohort[]>(STORAGE_KEYS.COHORTS, INITIAL_COHORTS);
    if (courseId) {
      return cohorts.filter((c) => c.courseId === courseId);
    }
    return cohorts;
  },

  getCohortById(cohortId: string): Cohort | undefined {
    const cohorts = this.getCohorts();
    return cohorts.find((c) => c.id === cohortId);
  },

  // Classes
  getClasses(cohortId?: string): ScheduledClass[] {
    const classes = getStorageItem<ScheduledClass[]>(
      STORAGE_KEYS.CLASSES,
      SCHEDULED_CLASSES_FLAGSHIP
    );
    if (cohortId) {
      return classes.filter((c) => c.cohortId === cohortId);
    }
    return classes;
  },

  getClassById(classId: string): ScheduledClass | undefined {
    const classes = this.getClasses();
    return classes.find((c) => c.id === classId);
  },

  updateClass(classId: string, updates: Partial<ScheduledClass>): ScheduledClass | null {
    const classes = this.getClasses();
    const index = classes.findIndex((c) => c.id === classId);
    if (index === -1) return null;

    classes[index] = { ...classes[index], ...updates };
    setStorageItem(STORAGE_KEYS.CLASSES, classes);
    return classes[index];
  },

  addClassRecording(
    classId: string,
    recordingData: NonNullable<ScheduledClass['recording']>
  ): boolean {
    const classes = this.getClasses();
    const index = classes.findIndex((c) => c.id === classId);
    if (index === -1) return false;

    classes[index].recording = recordingData;
    classes[index].status = 'COMPLETED';
    setStorageItem(STORAGE_KEYS.CLASSES, classes);
    return true;
  },

  // Final Exam
  getFinalTest(cohortId?: string): FinalTest {
    const test = getStorageItem<FinalTest>(STORAGE_KEYS.FINAL_TEST, INITIAL_FINAL_TEST);
    if (cohortId && test.cohortId !== cohortId) {
      return { ...test, cohortId };
    }
    return test;
  },

  submitFinalTest(submission: {
    cohortId: string;
    studentId: string;
    studentName: string;
    studentEmail: string;
    answers: Record<string, number>;
  }): { submission: TestSubmission; certificate?: Certificate } {
    const test = this.getFinalTest(submission.cohortId);
    let correctCount = 0;

    test.questions.forEach((q) => {
      if (submission.answers[q.id] === q.correctOptionIndex) {
        correctCount++;
      }
    });

    const scorePercentage = Math.round((correctCount / test.totalQuestions) * 100);
    const isPassed = scorePercentage >= test.passingPercentage;
    const submissionId = `sub-${Date.now()}`;

    let certificate: Certificate | undefined = undefined;

    if (isPassed) {
      const codeRandom = Math.floor(1000 + Math.random() * 9000);
      const verificationCode = `VIAR-2026-WIA-${codeRandom}`;
      const certId = `cert-${Date.now()}`;

      let grade: 'Distinction' | 'Merit' | 'Pass' = 'Pass';
      if (scorePercentage >= 90) grade = 'Distinction';
      else if (scorePercentage >= 80) grade = 'Merit';

      certificate = {
        id: certId,
        verificationCode,
        studentId: submission.studentId,
        studentName: submission.studentName,
        studentEmail: submission.studentEmail,
        courseId: test.courseId,
        courseTitle: 'What is Astrology — Foundations of Vedic Astrology',
        cohortBatchName: 'Batch 1 — Starting October 2026',
        issueDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        scorePercentage,
        grade,
        instructorName: 'Acharya Niraj Kumar',
        instructorTitle: 'Founder, Aapka Astro & Master Astrologer',
        verificationUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://viar.in'}/verify/${verificationCode}`,
      };

      const certs = this.getCertificates();
      certs.unshift(certificate);
      setStorageItem(STORAGE_KEYS.CERTIFICATES, certs);
    }

    const testSubmission: TestSubmission = {
      id: submissionId,
      testId: test.id,
      cohortId: submission.cohortId,
      studentId: submission.studentId,
      studentName: submission.studentName,
      studentEmail: submission.studentEmail,
      answers: submission.answers,
      score: correctCount,
      totalQuestions: test.totalQuestions,
      scorePercentage,
      isPassed,
      submittedAt: new Date().toISOString(),
      certificateId: certificate?.id,
    };

    const allSubmissions = getStorageItem<TestSubmission[]>(STORAGE_KEYS.SUBMISSIONS, []);
    allSubmissions.unshift(testSubmission);
    setStorageItem(STORAGE_KEYS.SUBMISSIONS, allSubmissions);

    return { submission: testSubmission, certificate };
  },

  getCertificates(): Certificate[] {
    return getStorageItem<Certificate[]>(STORAGE_KEYS.CERTIFICATES, DEMO_CERTIFICATES);
  },

  getCertificateByCode(code: string): Certificate | undefined {
    const certs = this.getCertificates();
    return certs.find((c) => c.verificationCode.toLowerCase() === code.trim().toLowerCase());
  },

  getStudentCertificate(studentId: string, cohortId?: string): Certificate | undefined {
    const certs = this.getCertificates();
    return certs.find((c) => c.studentId === studentId && (!cohortId || c.cohortBatchName.length > 0));
  },

  // Enrollments
  getEnrollments(): Enrollment[] {
    return getStorageItem<Enrollment[]>(STORAGE_KEYS.ENROLLMENTS, DEMO_ENROLLMENTS);
  },

  createEnrollment(params: {
    studentName: string;
    studentEmail: string;
    courseId: string;
    cohortId: string;
    amount: number;
    currency: 'INR' | 'USD';
    paymentMethod: string;
  }): Enrollment {
    const enrollments = this.getEnrollments();
    const newEnrollment: Enrollment = {
      id: `enr-${Date.now()}`,
      studentId: `user-${Date.now()}`,
      studentName: params.studentName,
      studentEmail: params.studentEmail,
      courseId: params.courseId,
      cohortId: params.cohortId,
      enrolledAt: new Date().toISOString(),
      paymentStatus: 'PAID',
      paymentAmount: params.amount,
      currency: params.currency,
      paymentMethod: params.paymentMethod,
      paymentId: `pay_${Date.now()}_viar`,
    };

    enrollments.unshift(newEnrollment);
    setStorageItem(STORAGE_KEYS.ENROLLMENTS, enrollments);

    // Increment cohort count
    const cohorts = this.getCohorts();
    const targetCohort = cohorts.find((c) => c.id === params.cohortId);
    if (targetCohort) {
      targetCohort.enrolledCount += 1;
      setStorageItem(STORAGE_KEYS.COHORTS, cohorts);
    }

    // Also auto set as current active student user
    const newUser: User = {
      id: newEnrollment.studentId,
      name: newEnrollment.studentName,
      email: newEnrollment.studentEmail,
      role: 'STUDENT',
      timezone: this.getTimezone(),
      enrolledCohortIds: [params.cohortId],
    };
    this.setCurrentUser(newUser);

    return newEnrollment;
  },

  // User & Session
  getCurrentUser(): User {
    const raw = getStorageItem<User>(STORAGE_KEYS.CURRENT_USER, DEMO_USERS[0]);
    // Deliberate Site Owner evaluation strictly against verified owner emails
    const isOwner = isSiteOwner(raw.email);
    
    // Look up dynamically granted active permissions (soft-revoked ones excluded)
    const activePerms = this.getActiveStaffPermissions(raw.id).map((p) => p.section as AdminSection);
    const userPerms = activePerms.length > 0 ? activePerms : (raw.staffSections || []);

    // Prevent non-owners from possessing OWNER role
    const sanitizedRole: User['role'] = isOwner
      ? 'OWNER'
      : (raw.role === 'OWNER' ? 'STUDENT' : raw.role);

    return {
      ...raw,
      isOwner,
      role: sanitizedRole,
      staffSections: isOwner ? [...ADMIN_SECTIONS] : userPerms,
    };
  },

  setCurrentUser(user: User): void {
    const isOwner = isSiteOwner(user.email);
    const sanitizedRole: User['role'] = isOwner
      ? 'OWNER'
      : (user.role === 'OWNER' ? 'STUDENT' : user.role);

    const enriched: User = {
      ...user,
      isOwner,
      role: sanitizedRole,
      staffSections: isOwner ? [...ADMIN_SECTIONS] : (user.staffSections || []),
    };
    setStorageItem(STORAGE_KEYS.CURRENT_USER, enriched);
  },

  switchUserRole(role: 'STUDENT' | 'ADMIN' | 'STAFF' | 'OWNER'): User {
    let target: User;
    if (role === 'OWNER' || role === 'ADMIN') {
      target = DEMO_USERS.find((u) => u.isOwner) || DEMO_USERS[1];
    } else if (role === 'STAFF') {
      target = DEMO_USERS.find((u) => u.id === 'user-staff-content') || DEMO_USERS[2] || DEMO_USERS[1];
    } else {
      target = DEMO_USERS.find((u) => u.role === 'STUDENT') || DEMO_USERS[0];
    }
    this.setCurrentUser(target);
    return target;
  },

  // --------------------------------------------------------------------------
  // Staff Roles & Section Permissions (Zero-Cost RBAC via Postgres/Store)
  // --------------------------------------------------------------------------
  getStaffPermissions(userId?: string): StaffPermission[] {
    const defaultPerms: StaffPermission[] = [
      {
        id: 'perm-1',
        userId: 'user-staff-content',
        section: 'courses',
        accessLevel: 'MANAGE',
        grantedByUserId: 'ask@aapkaastro.com',
        grantedAt: '2026-09-20T10:00:00.000Z',
        revokedAt: null,
      },
      {
        id: 'perm-2',
        userId: 'user-staff-content',
        section: 'quizzes',
        accessLevel: 'MANAGE',
        grantedByUserId: 'ask@aapkaastro.com',
        grantedAt: '2026-09-20T10:00:00.000Z',
        revokedAt: null,
      },
    ];
    const all = getStorageItem<StaffPermission[]>(STORAGE_KEYS.STAFF_PERMISSIONS, defaultPerms);
    if (!userId) return all;
    return all.filter((p) => p.userId === userId);
  },

  getActiveStaffPermissions(userId?: string): StaffPermission[] {
    const all = this.getStaffPermissions(userId);
    return all.filter((p) => !p.revokedAt);
  },

  getStaffUsers(): User[] {
    const defaultStaff = DEMO_USERS.filter((u) => u.isOwner || (u.staffSections && u.staffSections.length > 0));
    return getStorageItem<User[]>(STORAGE_KEYS.STAFF_USERS, defaultStaff);
  },

  setStaffSections(
    userId: string,
    sections: (AdminSection | string)[],
    accessLevel: StaffAccessLevel = 'MANAGE',
    grantedByUserId: string = 'ask@aapkaastro.com'
  ): void {
    const allPerms = this.getStaffPermissions();
    const nowIso = new Date().toISOString();
    const validSections = sections.filter((s) => s.toLowerCase() !== 'staff');
    const validNormalized = validSections.map((s) => s.toLowerCase());

    const otherUserPerms = allPerms.filter((p) => p.userId !== userId);
    const existingUserPerms = allPerms.filter((p) => p.userId === userId);

    // Soft-revoke permissions no longer in selected list; reactivate or update existing ones
    const updatedUserPerms: StaffPermission[] = existingUserPerms.map((perm) => {
      const norm = perm.section.toLowerCase();
      if (!validNormalized.includes(norm)) {
        return perm.revokedAt ? perm : { ...perm, revokedAt: nowIso };
      } else {
        return { ...perm, revokedAt: null, accessLevel };
      }
    });

    // Add newly selected sections
    for (const sec of validNormalized) {
      const existing = updatedUserPerms.find((p) => p.section.toLowerCase() === sec);
      if (!existing) {
        updatedUserPerms.push({
          id: `perm-${Date.now()}-${sec}`,
          userId,
          section: sec,
          accessLevel,
          grantedByUserId,
          grantedAt: nowIso,
          revokedAt: null,
          createdAt: nowIso,
          updatedAt: nowIso,
        });
      }
    }

    setStorageItem(STORAGE_KEYS.STAFF_PERMISSIONS, [...otherUserPerms, ...updatedUserPerms]);

    // Update staff users list
    const staffUsers = this.getStaffUsers();
    const updatedUsers = staffUsers.map((u) => {
      if (u.id === userId) {
        return { ...u, staffSections: validNormalized as AdminSection[] };
      }
      return u;
    });
    setStorageItem(STORAGE_KEYS.STAFF_USERS, updatedUsers);

    // If current user is this user, update current user too
    const current = this.getCurrentUser();
    if (current.id === userId) {
      this.setCurrentUser({ ...current, staffSections: validNormalized as AdminSection[] });
    }
  },

  softRevokeStaffPermission(permissionId: string): boolean {
    const allPerms = this.getStaffPermissions();
    const nowIso = new Date().toISOString();
    let updated = false;

    const modified = allPerms.map((p) => {
      if (p.id === permissionId && !p.revokedAt) {
        updated = true;
        return { ...p, revokedAt: nowIso };
      }
      return p;
    });

    if (updated) {
      setStorageItem(STORAGE_KEYS.STAFF_PERMISSIONS, modified);
    }
    return updated;
  },

  addStaffMember(params: {
    name: string;
    email: string;
    sections: (AdminSection | string)[];
    accessLevel?: StaffAccessLevel;
  }): User {
    const newId = `user-staff-${Date.now()}`;
    const validSections = params.sections.filter((s) => s.toLowerCase() !== 'staff');
    const validNormalized = validSections.map((s) => s.toLowerCase()) as AdminSection[];
    const newUser: User = {
      id: newId,
      name: params.name,
      email: params.email.trim().toLowerCase(),
      role: 'ADMIN',
      isOwner: false,
      staffSections: validNormalized,
      timezone: 'Asia/Kolkata',
      enrolledCohortIds: [],
    };

    const staffUsers = this.getStaffUsers();
    staffUsers.push(newUser);
    setStorageItem(STORAGE_KEYS.STAFF_USERS, staffUsers);

    // Set permissions with audit trail
    this.setStaffSections(newId, validNormalized, params.accessLevel || 'MANAGE');

    return newUser;
  },

  removeStaffMember(userId: string): boolean {
    const nowIso = new Date().toISOString();
    // Soft-revoke rather than delete to preserve audit trail
    const allPerms = this.getStaffPermissions();
    const updatedPerms = allPerms.map((p) => {
      if (p.userId === userId && !p.revokedAt) {
        return { ...p, revokedAt: nowIso };
      }
      return p;
    });
    setStorageItem(STORAGE_KEYS.STAFF_PERMISSIONS, updatedPerms);

    const staffUsers = this.getStaffUsers().filter((u) => u.id !== userId);
    setStorageItem(STORAGE_KEYS.STAFF_USERS, staffUsers);
    return true;
  },

  // Timezone preference
  getTimezone(): string {
    return getStorageItem<string>(STORAGE_KEYS.TIMEZONE, getUserLocalTimezone());
  },

  setTimezone(tz: string): void {
    setStorageItem(STORAGE_KEYS.TIMEZONE, tz);
  },

  // Admin stats
  getAdminStats() {
    const enrollments = this.getEnrollments();
    const classes = this.getClasses();
    const certs = this.getCertificates();
    const cohorts = this.getCohorts();

    const totalRevenueInr = enrollments
      .filter((e) => e.currency === 'INR')
      .reduce((acc, curr) => acc + curr.paymentAmount, 0);

    const totalRevenueUsd = enrollments
      .filter((e) => e.currency === 'USD')
      .reduce((acc, curr) => acc + curr.paymentAmount, 0);

    return {
      totalStudents: enrollments.length,
      totalRevenueInr,
      totalRevenueUsd,
      completedClasses: classes.filter((c) => c.status === 'COMPLETED').length,
      upcomingClasses: classes.filter((c) => c.status !== 'COMPLETED').length,
      certificatesIssued: certs.length,
      activeCohorts: cohorts.filter((c) => c.status === 'ENROLLING' || c.status === 'IN_PROGRESS')
        .length,
    };
  },

  // --------------------------------------------------------------------------
  // Course Completion & Watched Checklist (Requirement 6.2)
  // No distinction between attending live and watching recording.
  // --------------------------------------------------------------------------
  getWatchedClassIds(): string[] {
    return getStorageItem<string[]>(STORAGE_KEYS.WATCHED_CLASSES, []);
  },

  isClassWatched(classId: string): boolean {
    const ids = this.getWatchedClassIds();
    return ids.includes(classId);
  },

  toggleClassWatched(classId: string): boolean {
    const ids = this.getWatchedClassIds();
    let updated: string[];
    let isNowWatched: boolean;
    if (ids.includes(classId)) {
      updated = ids.filter((id) => id !== classId);
      isNowWatched = false;
    } else {
      updated = [...ids, classId];
      isNowWatched = true;
    }
    setStorageItem(STORAGE_KEYS.WATCHED_CLASSES, updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('session-progress-updated', { detail: { classId, isNowWatched } }));
    }
    return isNowWatched;
  },

  markClassAttended(classId: string): boolean {
    // Both live attendance and recording replay record identically in SessionProgress
    const ids = this.getWatchedClassIds();
    if (!ids.includes(classId)) {
      setStorageItem(STORAGE_KEYS.WATCHED_CLASSES, [...ids, classId]);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('session-progress-updated', { detail: { classId, isNowWatched: true } }));
      }
    }
    return true;
  },

  getCourseProgress(cohortId: string): {
    totalClasses: number;
    completedCount: number;
    completedClasses: number;
    percentage: number;
    allSessionsComplete: boolean;
    canTakeQuiz: boolean;
  } {
    const classes = this.getClasses(cohortId);
    if (classes.length === 0) return { totalClasses: 18, completedCount: 0, completedClasses: 0, percentage: 0, allSessionsComplete: false, canTakeQuiz: false };

    const watchedIds = new Set(this.getWatchedClassIds());
    let completedCount = 0;

    classes.forEach((cls) => {
      if (watchedIds.has(cls.id) || cls.status === 'COMPLETED') {
        completedCount++;
      }
    });

    const percentage = Math.round((completedCount / classes.length) * 100);
    const allSessionsComplete = completedCount >= classes.length;
    return {
      totalClasses: classes.length,
      completedCount,
      completedClasses: completedCount,
      percentage,
      allSessionsComplete,
      canTakeQuiz: allSessionsComplete,
    };
  },

  /**
   * Final Quiz Unlock Logic (Requirement 6.2)
   * Unlocks either once all sessions are marked complete, or once the cohort's
   * end date has passed (configurable per course/cohort).
   */
  isQuizUnlocked(cohortId: string): { isUnlocked: boolean; reason?: string } {
    const cohort = this.getCohortById(cohortId) || this.getCohorts()[0];
    if (!cohort) return { isUnlocked: true };

    const course = this.getCourseById(cohort.courseId);
    const condition = course?.quizUnlockCondition || 'ALL_SESSIONS_COMPLETED';

    if (condition === 'COHORT_END_DATE_PASSED') {
      const now = Date.now();
      const endMs = new Date(cohort.endDate).getTime();
      if (now >= endMs) {
        return { isUnlocked: true };
      } else {
        return {
          isUnlocked: false,
          reason: `Certification exam unlocks when the 9-week cohort formally concludes on ${new Date(cohort.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.`,
        };
      }
    }

    // Default: ALL_SESSIONS_COMPLETED
    const progress = this.getCourseProgress(cohortId);
    if (progress.allSessionsComplete) {
      return { isUnlocked: true };
    } else {
      return {
        isUnlocked: false,
        reason: `Complete all ${progress.totalClasses} classes (attend live or mark recordings watched) to unlock the final certification exam. (${progress.completedCount}/${progress.totalClasses} completed).`,
      };
    }
  },

  // --------------------------------------------------------------------------
  // Catalog "Notify Me" Lead Capture (Requirement 6.3)
  // --------------------------------------------------------------------------
  saveNotifyMeLead(lead: { courseId: string; courseTitle: string; email: string }): NotifyMeLead {
    const leads = getStorageItem<NotifyMeLead[]>(STORAGE_KEYS.NOTIFY_LEADS, []);
    const newLead: NotifyMeLead = {
      id: `lead-${Date.now()}`,
      courseId: lead.courseId,
      courseTitle: lead.courseTitle,
      email: lead.email,
      createdAt: new Date().toISOString(),
    };
    leads.unshift(newLead);
    setStorageItem(STORAGE_KEYS.NOTIFY_LEADS, leads);
    return newLead;
  },

  getNotifyMeLeads(courseId?: string): NotifyMeLead[] {
    const leads = getStorageItem<NotifyMeLead[]>(STORAGE_KEYS.NOTIFY_LEADS, []);
    if (!courseId) return leads;
    return leads.filter((l) => l.courseId === courseId);
  },

  // --------------------------------------------------------------------------
  // Per-Session Q&A & Discussion Space (Requirement 3: Beat Astrotalk)
  // --------------------------------------------------------------------------
  getDiscussionComments(sessionId: string): ClassDiscussionComment[] {
    const all = getStorageItem<ClassDiscussionComment[]>(STORAGE_KEYS.DISCUSSIONS, DEFAULT_CLASS_DISCUSSIONS);
    return all.filter((c) => c.sessionId === sessionId);
  },

  addDiscussionComment(params: {
    sessionId: string;
    authorName: string;
    authorRole?: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
    comment: string;
  }): ClassDiscussionComment {
    const all = getStorageItem<ClassDiscussionComment[]>(STORAGE_KEYS.DISCUSSIONS, DEFAULT_CLASS_DISCUSSIONS);
    const newComment: ClassDiscussionComment = {
      id: `comm-${Date.now()}`,
      sessionId: params.sessionId,
      authorName: params.authorName,
      authorRole: params.authorRole || 'STUDENT',
      comment: params.comment,
      createdAt: new Date().toISOString(),
    };
    all.push(newComment);
    setStorageItem(STORAGE_KEYS.DISCUSSIONS, all);
    return newComment;
  },

  // Reset demo data
  resetToDefaults(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.COURSES);
    localStorage.removeItem(STORAGE_KEYS.COHORTS);
    localStorage.removeItem(STORAGE_KEYS.CLASSES);
    localStorage.removeItem(STORAGE_KEYS.FINAL_TEST);
    localStorage.removeItem(STORAGE_KEYS.SUBMISSIONS);
    localStorage.removeItem(STORAGE_KEYS.CERTIFICATES);
    localStorage.removeItem(STORAGE_KEYS.ENROLLMENTS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.STAFF_PERMISSIONS);
    localStorage.removeItem(STORAGE_KEYS.STAFF_USERS);
  },
};
