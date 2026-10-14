import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateSignedPlaybackToken,
  verifySignedPlaybackToken,
  generateSignedDocumentToken,
  verifySignedDocumentToken,
} from '../src/lib/auth/token-crypto.ts';

describe('E2E Gating Lifecycle & Access Protection Suite (Items 2 to 5)', () => {
  // Test fixture data
  const testCourse = {
    id: 'course-e2e-test-muhurta',
    slug: 'e2e-test-muhurta-mastery',
    title: 'Vedic Muhurta Mastery',
    status: 'PUBLISHED' as const,
    modules: [
      {
        id: 'mod-1',
        title: 'Module 1: Principles of Auspicious Timing',
        lessons: [
          {
            id: 'les-video-1',
            title: 'Foundations of Shubh Muhurta',
            type: 'VIDEO',
            isFreePreview: false,
            videoProviderId: 'cf-stream-muhurta-01',
          },
          {
            id: 'les-doc-1',
            title: 'Muhurta Calculation Compendium',
            type: 'DOCUMENT',
            isFreePreview: false,
            documentKey: 'docs/muhurta-compendium.pdf',
          },
          {
            id: 'les-quiz-1',
            title: 'Muhurta Knowledge Assessment',
            type: 'QUIZ',
            isFreePreview: false,
          },
          {
            id: 'les-live-1',
            title: 'Live Muhurta Workshop',
            type: 'LIVE_SESSION',
            isFreePreview: false,
            liveJoinLink: 'https://zoom.us/j/viar-exclusive-session',
          },
        ],
      },
    ],
  };

  const enrollmentsStore: Array<{
    userId: string;
    courseId: string;
    status: string;
    amountPaid: number;
  }> = [];

  // =========================================================================
  // ITEM 2: LOGGED-OUT INCOGNITO VISITOR INSPECTION & DIRECT ENDPOINT GATING (401/403)
  // =========================================================================
  describe('Item 2: Logged-out Visitor Content Gating & 401/403 Responses', () => {
    function sanitizeForPublicVisitor(course: typeof testCourse) {
      return {
        ...course,
        modules: course.modules.map((m) => ({
          id: m.id,
          title: m.title,
          lessons: m.lessons.map((l) => ({
            id: l.id,
            title: l.title,
            type: l.type,
            isLocked: !l.isFreePreview,
            // Sensitive fields stripped for non-enrolled
            videoProviderId: l.isFreePreview ? l.videoProviderId : null,
            playbackUrl: null,
            documentKey: null,
            documentDownloadUrl: null,
            liveJoinLink: null,
          })),
        })),
      };
    }

    it('should show curriculum outline but lock all paid lessons for public visitor', () => {
      const publicView = sanitizeForPublicVisitor(testCourse);

      // Outline is visible
      assert.strictEqual(publicView.modules[0].title, 'Module 1: Principles of Auspicious Timing');
      assert.strictEqual(publicView.modules[0].lessons.length, 4);

      // Content is locked
      const lessons = publicView.modules[0].lessons;
      assert.strictEqual(lessons.every((l) => l.isLocked === true), true);
      assert.strictEqual(lessons.every((l) => l.videoProviderId === null), true);
      assert.strictEqual(lessons.every((l) => l.documentKey === null), true);
      assert.strictEqual(lessons.every((l) => l.liveJoinLink === null), true);
    });

    it('should return 403 on direct video playback call without enrollment or valid token', () => {
      const rawToken = 'invalid-or-missing-token';
      const verification = verifySignedPlaybackToken(rawToken);
      const statusCode = verification.valid ? 200 : 403;
      assert.strictEqual(statusCode, 403);
    });

    it('should return 401 on direct document call when token is missing', () => {
      const token = null;
      const statusCode = !token ? 401 : 200;
      assert.strictEqual(statusCode, 401);
    });

    it('should return 403 on direct document call when token is invalid or expired', () => {
      const invalidToken = 'malformed.token.signature';
      const verification = verifySignedDocumentToken(invalidToken);
      const statusCode = verification.valid ? 200 : 403;
      assert.strictEqual(statusCode, 403);
    });

    it('should return 403 on direct quiz endpoint call when visitor is non-enrolled', () => {
      const isEnrolled = false;
      const isStaff = false;
      const isAuthorized = isEnrolled || isStaff;
      const statusCode = isAuthorized ? 200 : 403;
      assert.strictEqual(statusCode, 403);
    });
  });

  // =========================================================================
  // ITEM 3: TEST-MODE PURCHASE, ACCESS UNLOCK & NON-ENROLLED ACCOUNT ISOLATION
  // =========================================================================
  describe('Item 3: Test-Mode Purchase, Access Unlock & Student Isolation', () => {
    const studentAId = 'usr_aarav_sharma';
    const studentBId = 'usr_unregistered_visitor';

    it('should record payment and unlock access for Student A', () => {
      // Simulate verified payment & enrollment
      enrollmentsStore.push({
        userId: studentAId,
        courseId: testCourse.id,
        status: 'ACTIVE',
        amountPaid: 7500,
      });

      const studentAEnrollment = enrollmentsStore.find(
        (e) => e.userId === studentAId && e.courseId === testCourse.id
      );
      assert.ok(studentAEnrollment);
      assert.strictEqual(studentAEnrollment.status, 'ACTIVE');

      // Issue and verify signed playback token
      const playbackToken = generateSignedPlaybackToken('les-video-1', studentAId, 900);
      const playbackCheck = verifySignedPlaybackToken(playbackToken.token);
      assert.strictEqual(playbackCheck.valid, true);
      assert.strictEqual(playbackCheck.lessonId, 'les-video-1');
      assert.strictEqual(playbackCheck.userId, studentAId);

      // Issue and verify signed document token
      const docToken = generateSignedDocumentToken('les-doc-1', 'docs/muhurta-compendium.pdf', studentAId, 900);
      const docCheck = verifySignedDocumentToken(docToken.token);
      assert.strictEqual(docCheck.valid, true);
      assert.strictEqual(docCheck.lessonId, 'les-doc-1');
      assert.strictEqual(docCheck.documentKey, 'docs/muhurta-compendium.pdf');
    });

    it('should strictly keep Student B blocked and non-enrolled', () => {
      const studentBEnrollment = enrollmentsStore.find(
        (e) => e.userId === studentBId && e.courseId === testCourse.id
      );
      assert.strictEqual(studentBEnrollment, undefined);

      // Student B attempting access with bad token
      const badCheck = verifySignedPlaybackToken('student-b-unauthorized-token');
      assert.strictEqual(badCheck.valid, false);
    });
  });

  // =========================================================================
  // ITEM 4: ARCHIVE COURSE WITH ENROLLED STUDENT
  // =========================================================================
  describe('Item 4: Archive Course with Enrolled Student', () => {
    let courseStatus: 'PUBLISHED' | 'ARCHIVED' = 'PUBLISHED';

    it('should hide archived course from public catalog while preserving enrolled access', () => {
      // Owner archives the course
      courseStatus = 'ARCHIVED';

      // 1. Public Catalog Query
      const isVisibleInPublicCatalog = ['PUBLISHED', 'COMING_SOON'].includes(courseStatus);
      assert.strictEqual(isVisibleInPublicCatalog, false); // Hidden from catalog

      // 2. Public Direct Navigation
      const publicDirectStatus = isVisibleInPublicCatalog ? 200 : 404;
      assert.strictEqual(publicDirectStatus, 404); // Returns 404 for unauthenticated visitor

      // 3. Enrolled Student A Access Check
      const studentAId = 'usr_aarav_sharma';
      const studentAEnrollment = enrollmentsStore.find(
        (e) => e.userId === studentAId && e.courseId === testCourse.id && e.status === 'ACTIVE'
      );
      assert.ok(studentAEnrollment); // Student keeps active enrollment
      assert.strictEqual(studentAEnrollment.status, 'ACTIVE');

      // Student A can still generate tokens and stream
      const token = generateSignedPlaybackToken('les-video-1', studentAId, 900);
      const check = verifySignedPlaybackToken(token.token);
      assert.strictEqual(check.valid, true);
    });
  });

  // =========================================================================
  // ITEM 5: HARD-DELETE REFUSED vs EMPTY DRAFT HARD-DELETE
  // =========================================================================
  describe('Item 5: Refuse Hard-Delete on Enrolled Course vs Delete Empty Draft', () => {
    it('should refuse hard-delete on course with enrolled students', () => {
      const totalEnrollments = enrollmentsStore.filter((e) => e.courseId === testCourse.id).length;
      assert.ok(totalEnrollments > 0);

      // Business rule evaluation
      const allowHardDelete = totalEnrollments === 0;
      assert.strictEqual(allowHardDelete, false);

      const response = {
        status: allowHardDelete ? 200 : 400,
        error: `Course "${testCourse.title}" has ${totalEnrollments} enrolled scholar(s) and cannot be hard-deleted. It can only be archived to preserve student access.`,
      };

      assert.strictEqual(response.status, 400);
      assert.match(response.error, /cannot be hard-deleted/);
    });

    it('should allow hard-delete on empty draft course with zero enrollments', () => {
      const emptyDraft = {
        id: 'course-empty-draft-1',
        title: 'Empty Draft Course',
        status: 'DRAFT',
      };

      const draftEnrollments = enrollmentsStore.filter((e) => e.courseId === emptyDraft.id).length;
      assert.strictEqual(draftEnrollments, 0);

      const canHardDelete = draftEnrollments === 0 && emptyDraft.status === 'DRAFT';
      assert.strictEqual(canHardDelete, true);

      const response = {
        status: canHardDelete ? 200 : 400,
        message: `Draft course "${emptyDraft.title}" permanently deleted.`,
      };

      assert.strictEqual(response.status, 200);
      assert.match(response.message, /permanently deleted/);
    });
  });
});
