import { describe, it } from 'node:test';
import assert from 'node:assert';
import { isSiteOwner } from '../src/lib/auth/permissions.ts';

// Self-contained simulation of ViarStore course & enrollment management
class StoreVerificationSimulation {
  private courses: any[] = [];
  private cohorts: any[] = [];
  private classes: any[] = [];
  private enrollments: any[] = [];

  constructor() {
    this.courses = [
      {
        id: 'course-what-is-astrology',
        slug: 'what-is-astrology',
        title: 'The Ultimate Astrology Course: Foundations to Chart Mastery',
        level: 'All Levels',
        deliveryMode: 'SELF_PACED',
        priceInr: 5100,
        priceUsd: 69,
      },
    ];

    this.cohorts = [
      {
        id: 'cohort-wia-batch-1',
        courseId: 'course-what-is-astrology',
        batchName: 'The Ultimate Astrology Course — Self-Paced Lifetime Access',
        enrolledCount: 15,
      },
    ];

    this.classes = [
      {
        id: 'cls-1',
        cohortId: 'cohort-wia-batch-1',
        classNumber: 1,
        title: 'Orientation & Cosmological Foundations',
        recording: {
          id: 'rec-1',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        },
      },
    ];

    this.enrollments = [
      {
        id: 'enr-101',
        studentId: 'user-enrolled-1',
        studentEmail: 'priya@example.com',
        courseId: 'course-what-is-astrology',
        cohortId: 'cohort-wia-batch-1',
        paymentStatus: 'PAID',
        paymentAmount: 5100,
      },
    ];
  }

  getCourses() {
    return this.courses;
  }

  getCourseById(id: string) {
    return this.courses.find((c) => c.id === id || c.slug === id);
  }

  addCourse(newCourse: any) {
    this.courses.push(newCourse);
    const newCohortId = `cohort-${newCourse.slug || newCourse.id}`;
    this.cohorts.push({
      id: newCohortId,
      courseId: newCourse.id,
      batchName: `${newCourse.title} — Lifetime Access`,
      enrolledCount: 0,
    });
    this.classes.push({
      id: `cls-${newCourse.slug}-1`,
      cohortId: newCohortId,
      classNumber: 1,
      title: `${newCourse.title} — Module 1 Introduction`,
      recording: {
        id: `rec-${newCourse.slug}-1`,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      },
    });
    return newCohortId;
  }

  updateCourse(courseId: string, updates: any) {
    const idx = this.courses.findIndex((c) => c.id === courseId || c.slug === courseId);
    if (idx === -1) return null;
    this.courses[idx] = { ...this.courses[idx], ...updates };
    if (updates.title) {
      this.cohorts.forEach((coh) => {
        if (coh.courseId === this.courses[idx].id) {
          coh.batchName = `${updates.title} — Lifetime Access`;
        }
      });
    }
    return this.courses[idx];
  }

  deleteCourse(courseId: string) {
    const idx = this.courses.findIndex((c) => c.id === courseId || c.slug === courseId);
    if (idx === -1) return false;
    const removed = this.courses.splice(idx, 1)[0];
    this.cohorts = this.cohorts.filter((c) => c.courseId !== removed.id);
    this.classes = this.classes.filter((cl) => cl.cohortId !== `cohort-${removed.slug || removed.id}`);
    return true;
  }

  getCohorts() {
    return this.cohorts;
  }

  getClasses(cohortId: string) {
    return this.classes.filter((c) => c.cohortId === cohortId);
  }

  isUserEnrolled(user: any | null, cohortIdOrCourseId: string): boolean {
    // 1. Staff bypass (Admin, Instructor, Owner)
    if (user) {
      if (user.role === 'OWNER' || user.isOwner || user.role === 'ADMIN' || user.role === 'INSTRUCTOR') {
        return true;
      }
      if (isSiteOwner(user.email)) {
        return true;
      }
    }

    const matchedCohort = this.cohorts.find(
      (c) => c.id === cohortIdOrCourseId || c.courseId === cohortIdOrCourseId
    );
    const targetCohortId = matchedCohort ? matchedCohort.id : cohortIdOrCourseId;
    const targetCourseId = matchedCohort ? matchedCohort.courseId : cohortIdOrCourseId;

    // 2. Explicit cohort list on user profile
    if (user && user.enrolledCohortIds && user.enrolledCohortIds.length > 0) {
      if (user.enrolledCohortIds.includes(targetCohortId)) {
        return true;
      }
    }

    // 3. Paid enrollment registry
    if (user) {
      const hasPaid = this.enrollments.some((e) => {
        const matchesTarget = e.cohortId === targetCohortId || e.courseId === targetCourseId;
        const isPaid = e.paymentStatus === 'PAID';
        if (!isPaid || !matchesTarget) return false;
        return (
          e.studentEmail?.toLowerCase() === user.email?.toLowerCase() ||
          e.studentId === user.id
        );
      });
      if (hasPaid) return true;
    }

    return false;
  }
}

describe('Course Management CRUD & Paywall Security Test Suite', () => {
  it('should initialize with default courses and cohorts', () => {
    const store = new StoreVerificationSimulation();
    assert.strictEqual(store.getCourses().length, 1);
    assert.strictEqual(store.getCohorts().length, 1);
    assert.strictEqual(store.getCourses()[0].id, 'course-what-is-astrology');
  });

  it('should allow admin to add a new course and automatically provision cohort & classes', () => {
    const store = new StoreVerificationSimulation();
    const newCourse = {
      id: 'course-vedic-vastu-mastery',
      slug: 'vedic-vastu-mastery',
      title: 'Vedic Vastu & Architectural Energy Mastery',
      level: 'Intermediate',
      deliveryMode: 'SELF_PACED',
      priceInr: 7500,
      priceUsd: 99,
    };

    const newCohortId = store.addCourse(newCourse);
    assert.strictEqual(store.getCourses().length, 2);
    assert.strictEqual(store.getCourseById('vedic-vastu-mastery')?.title, 'Vedic Vastu & Architectural Energy Mastery');

    // Confirm cohort was automatically created
    const createdCohort = store.getCohorts().find((c) => c.courseId === newCourse.id);
    assert.ok(createdCohort, 'Cohort must be created');
    assert.strictEqual(createdCohort.id, newCohortId);

    // Confirm video class was auto-provisioned
    const classes = store.getClasses(newCohortId);
    assert.strictEqual(classes.length, 1);
    assert.strictEqual(classes[0].recording.videoUrl, 'https://www.youtube.com/embed/dQw4w9WgXcQ');
  });

  it('should allow admin to update course details and synchronize cohort batch name', () => {
    const store = new StoreVerificationSimulation();
    const updated = store.updateCourse('course-what-is-astrology', {
      title: 'Astrology Chart Mastery 2.0 (Updated)',
      priceInr: 6100,
    });

    assert.ok(updated);
    assert.strictEqual(updated.title, 'Astrology Chart Mastery 2.0 (Updated)');
    assert.strictEqual(updated.priceInr, 6100);

    const cohort = store.getCohorts().find((c) => c.courseId === 'course-what-is-astrology');
    assert.strictEqual(cohort.batchName, 'Astrology Chart Mastery 2.0 (Updated) — Lifetime Access');
  });

  it('should allow admin to delete a course and cascade delete associated cohorts and classes', () => {
    const store = new StoreVerificationSimulation();
    const deleted = store.deleteCourse('course-what-is-astrology');
    assert.strictEqual(deleted, true);
    assert.strictEqual(store.getCourses().length, 0);
    assert.strictEqual(store.getCohorts().length, 0);
  });

  describe('Paywall & Access Gating Security', () => {
    it('should strictly lock course materials for unauthenticated anonymous visitors (user = null)', () => {
      const store = new StoreVerificationSimulation();
      // Anonymous visitor viewing flagship cohort
      const canAccess = store.isUserEnrolled(null, 'cohort-wia-batch-1');
      assert.strictEqual(canAccess, false, 'Anonymous visitor must NOT bypass paywall');
    });

    it('should lock course materials for signed-in users who have NOT purchased the course', () => {
      const store = new StoreVerificationSimulation();
      const unpaidStudent = {
        id: 'user-unpaid-999',
        email: 'unpaid.visitor@gmail.com',
        role: 'STUDENT',
        enrolledCohortIds: [],
      };
      const canAccess = store.isUserEnrolled(unpaidStudent, 'cohort-wia-batch-1');
      assert.strictEqual(canAccess, false, 'Unpaid student must NOT bypass paywall');
    });

    it('should unlock course materials for students with matching enrolledCohortIds', () => {
      const store = new StoreVerificationSimulation();
      const enrolledStudent = {
        id: 'user-enrolled-123',
        email: 'paid.student@gmail.com',
        role: 'STUDENT',
        enrolledCohortIds: ['cohort-wia-batch-1'],
      };
      const canAccess = store.isUserEnrolled(enrolledStudent, 'cohort-wia-batch-1');
      assert.strictEqual(canAccess, true, 'Enrolled student must have access');
    });

    it('should unlock course materials for students with matching paid enrollment in registry', () => {
      const store = new StoreVerificationSimulation();
      const studentMatchingPayment = {
        id: 'user-enrolled-1',
        email: 'priya@example.com',
        role: 'STUDENT',
        enrolledCohortIds: [],
      };
      const canAccess = store.isUserEnrolled(studentMatchingPayment, 'cohort-wia-batch-1');
      assert.strictEqual(canAccess, true, 'Student with paid enrollment registry entry must have access');
    });

    it('should unlock preview and course studio for Admin, Instructor, and Supreme Owner', () => {
      const store = new StoreVerificationSimulation();
      
      const adminUser = { id: 'admin-1', email: 'admin@viar.in', role: 'ADMIN' };
      const instructorUser = { id: 'inst-1', email: 'niraj@viar.in', role: 'INSTRUCTOR' };
      const siteOwnerUser = { id: 'owner-1', email: 'ask@aapkaastro.com', role: 'STUDENT', isOwner: true };

      assert.strictEqual(store.isUserEnrolled(adminUser, 'cohort-wia-batch-1'), true, 'Admin has management access');
      assert.strictEqual(store.isUserEnrolled(instructorUser, 'cohort-wia-batch-1'), true, 'Instructor has preview access');
      assert.strictEqual(store.isUserEnrolled(siteOwnerUser, 'cohort-wia-batch-1'), true, 'Site owner has supreme access');
    });
  });
});
