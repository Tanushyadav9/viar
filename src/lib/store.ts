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
};

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

  // Watched / Attendance Tracking
  getWatchedClassIds(): string[] {
    return getStorageItem<string[]>(STORAGE_KEYS.WATCHED_CLASSES, ['cls-1', 'cls-2', 'cls-3', 'cls-4']);
  },

  isClassWatched(classId: string): boolean {
    const watched = this.getWatchedClassIds();
    return watched.includes(classId);
  },

  toggleClassWatched(classId: string): boolean {
    const watched = this.getWatchedClassIds();
    const index = watched.indexOf(classId);
    let isNowWatched = false;
    if (index >= 0) {
      watched.splice(index, 1);
      isNowWatched = false;
    } else {
      watched.push(classId);
      isNowWatched = true;
    }
    setStorageItem(STORAGE_KEYS.WATCHED_CLASSES, watched);
    return isNowWatched;
  },

  getCourseProgress(cohortId: string): {
    completedClasses: number;
    totalClasses: number;
    percentage: number;
    canTakeQuiz: boolean;
  } {
    const classes = this.getClasses(cohortId);
    const watchedIds = new Set(this.getWatchedClassIds());

    // A class counts toward completion if it has status COMPLETED or is marked watched
    let completedCount = 0;
    classes.forEach((c) => {
      if (c.status === 'COMPLETED' || watchedIds.has(c.id)) {
        completedCount++;
      }
    });

    const total = classes.length || 18;
    const percentage = Math.round((completedCount / total) * 100);
    const canTakeQuiz = completedCount >= total;

    return {
      completedClasses: completedCount,
      totalClasses: total,
      percentage,
      canTakeQuiz,
    };
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
        /* PLACEHOLDER: replace with real content */
        courseTitle: 'What is Astrology — Foundations of Vedic Astrology',
        cohortBatchName: 'Batch — Starting [Month Year]',
        issueDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        scorePercentage,
        grade,
        /* PLACEHOLDER: replace with real content */
        instructorName: 'Acharya [ASTROLOGER NAME]',
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
    return getStorageItem<User>(STORAGE_KEYS.CURRENT_USER, DEMO_USERS[0]);
  },

  setCurrentUser(user: User): void {
    setStorageItem(STORAGE_KEYS.CURRENT_USER, user);
  },

  switchUserRole(role: 'STUDENT' | 'ADMIN'): User {
    const target = DEMO_USERS.find((u) => u.role === role) || DEMO_USERS[0];
    this.setCurrentUser(target);
    return target;
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
  },
};
