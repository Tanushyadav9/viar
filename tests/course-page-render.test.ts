import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { toCoursePublicDTO } from '../src/lib/courses/dto.ts';

test('Course Page Render Regression Test Suite', async (t) => {
  await t.test('1. Full real-shaped course converts and exposes all 23 modules and pricing', () => {
    const rawRealCourse = {
      id: 'course-real-1',
      slug: 'what-is-astrology',
      title: 'Complete Vedic Astrology: From First Principles to Real Chart Mastery',
      titleHi: 'सम्पूर्ण वैदिक ज्योतिष: मूल सिद्धांतों से कुंडली महारत',
      tagline: 'Master the sacred science of Vedic Astrology with Acharya Niraj Kumar.',
      description: 'Comprehensive 23-module self-paced masterclass covering grahas, rashis, bhavas, and dashas.',
      category: 'Vedic Astrology',
      status: 'PUBLISHED',
      isPublished: true,
      isComingSoon: false,
      acceptingEnrollments: true,
      priceInr: 5100,
      originalPriceInr: 11000,
      priceUsd: 69,
      originalPriceUsd: 129,
      durationWeeks: 12,
      totalClasses: 23,
      passingScore: 70,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
      instructor: {
        name: 'Acharya Niraj Kumar',
        title: 'Jyotish Acharya (Bharatiya Vidya Bhavan)',
        bio: '20+ years of astrological wisdom and corporate leadership.',
        experienceYears: 20,
        avatarUrl: '/images/Acharya_Niraj_Kumar_Headshot.jpg',
        aapkaAstroUrl: 'https://aapkaastro.com',
        credentials: ['Jyotish Acharya', 'Logical Vastu Expert'],
      },
      modules: Array.from({ length: 23 }, (_, i) => ({
        id: `mod-${i + 1}`,
        moduleNumber: i + 1,
        title: `Module ${i + 1}: Astrological Foundations Part ${i + 1}`,
        description: `Deep dive into module ${i + 1} topics.`,
        durationMinutes: 75,
        order: i + 1,
        isBonus: i >= 21,
        isPublished: true,
        keyTopics: ['Topic A', 'Topic B'],
        lessons: [
          {
            id: `les-${i + 1}-1`,
            moduleId: `mod-${i + 1}`,
            order: 1,
            type: 'VIDEO',
            title: `Lesson ${i + 1}.1`,
            description: 'Lesson overview',
            isPublished: true,
            isFreePreview: i === 0,
            videoDuration: 3600,
            isLocked: i !== 0,
          },
        ],
      })),
      cohorts: [
        {
          id: 'cohort-1',
          courseId: 'course-real-1',
          batchName: 'Self-Paced Masterclass Batch 1',
          startDate: new Date('2026-01-01T00:00:00Z'),
          capacity: 500,
          enrolledCount: 142,
          status: 'ACTIVE',
        },
      ],
      faqs: [
        {
          question: 'Is this course completely self-paced?',
          answer: 'Yes! All 23 video modules are available immediately.',
        },
      ],
      highlights: ['23 on-demand video modules', 'Lifetime access'],
    };

    const dto = toCoursePublicDTO(rawRealCourse);

    assert.equal(dto.slug, 'what-is-astrology');
    assert.equal(dto.priceInr, 5100);
    assert.equal(dto.originalPriceInr, 11000);
    assert.equal(dto.modules.length, 23);
    assert.equal(dto.cohorts.length, 1);
    assert.equal(dto.faqs.length, 1);
    assert.equal(typeof dto.createdAt, 'string');
    assert.ok(dto.createdAt.endsWith('Z'));
    assert.equal(dto.modules[22].moduleNumber, 23);
    assert.equal(dto.modules[22].isBonus, true);
  });

  await t.test('2. Course whose optional fields are all null converts safely without throwing', () => {
    const rawNullCourse = {
      id: 'course-null-1',
      slug: 'minimal-astrology',
      title: 'Minimal Astrology',
      titleHi: null,
      tagline: null,
      subtitle: null,
      description: null,
      descriptionHi: null,
      shortDescription: null,
      shortDescriptionHi: null,
      level: null,
      deliveryMode: null,
      category: null,
      status: null,
      isPublished: null,
      isComingSoon: null,
      acceptingEnrollments: null,
      featured: null,
      badge: null,
      thumbnailUrl: null,
      durationWeeks: null,
      totalClasses: null,
      classesPerWeek: null,
      priceInr: null,
      priceUsd: null,
      originalPriceInr: null,
      originalPriceUsd: null,
      passingScore: null,
      certificateEnabled: null,
      createdAt: null,
      updatedAt: null,
      instructor: null,
      instructorName: null,
      instructorBio: null,
      modules: null,
      syllabusJson: null,
      quizzes: null,
      faqs: null,
      cohorts: null,
      highlights: null,
      prerequisites: null,
      whatYouWillLearn: null,
    };

    const dto = toCoursePublicDTO(rawNullCourse);

    assert.equal(dto.slug, 'minimal-astrology');
    assert.equal(typeof dto.priceInr, 'number');
    assert.equal(typeof dto.originalPriceInr, 'number');
    assert.ok(Array.isArray(dto.modules), 'modules must be an array');
    assert.ok(Array.isArray(dto.cohorts), 'cohorts must be an array');
    assert.ok(Array.isArray(dto.faqs), 'faqs must be an array');
    assert.ok(Array.isArray(dto.highlights), 'highlights must be an array');
    assert.ok(dto.instructor !== null && typeof dto.instructor === 'object', 'instructor must be non-null');
    assert.equal(typeof dto.instructor.name, 'string');
    assert.equal(typeof dto.createdAt, 'string');
  });

  await t.test('3. Course with zero modules converts with safe empty module array', () => {
    const rawZeroModuleCourse = {
      id: 'course-zero-1',
      slug: 'empty-course',
      title: 'Course with Zero Modules',
      status: 'PUBLISHED',
      isPublished: true,
      modules: [],
      syllabusJson: [],
    };

    const dto = toCoursePublicDTO(rawZeroModuleCourse);

    assert.equal(dto.modules.length, 0);
    assert.equal(typeof dto.totalClasses, 'number');
  });

  await t.test('4. Unpublished course is recognized as draft and non-public', () => {
    const rawDraftCourse = {
      id: 'course-draft-1',
      slug: 'unreleased-course',
      title: 'Unreleased Draft Course',
      status: 'DRAFT',
      isPublished: false,
      isComingSoon: false,
    };

    const dto = toCoursePublicDTO(rawDraftCourse);

    assert.equal(dto.status, 'DRAFT');
    assert.equal(dto.isPublished, false);
    assert.equal(dto.isComingSoon, false);

    const allowedStatuses = ['PUBLISHED', 'COMING_SOON'];
    const isPubliclyAccessible = allowedStatuses.includes(dto.status);
    assert.equal(isPubliclyAccessible, false, 'Draft course must not be publicly accessible');
  });

  await t.test('5. Missing course handler (courses/[slug]/not-found.tsx) is configured with bilingual recovery', () => {
    const notFoundFile = path.resolve('src/app/courses/[slug]/not-found.tsx');
    assert.ok(fs.existsSync(notFoundFile), 'courses/[slug]/not-found.tsx must exist');

    const content = fs.readFileSync(notFoundFile, 'utf-8');
    assert.ok(content.includes('Course Not Found'), 'must state Course Not Found in English');
    assert.ok(content.includes('पाठ्यक्रम नहीं मिला') || content.includes('उपलब्ध नहीं है'), 'must provide Hindi explanation');
    assert.ok(content.includes('/courses'), 'must link to catalog /courses');
    assert.ok(content.includes('wa.me/919311215564'), 'must link to WhatsApp admissions');
    assert.ok(content.includes('+91 93112 15564'), 'must include direct contact phone');
    assert.ok(content.includes('aapkaastro1606@gmail.com'), 'must include support email');
  });

  await t.test('6. Segment error boundary (courses/[slug]/error.tsx) is configured for calm recovery', () => {
    const errorFile = path.resolve('src/app/courses/[slug]/error.tsx');
    assert.ok(fs.existsSync(errorFile), 'courses/[slug]/error.tsx must exist');

    const content = fs.readFileSync(errorFile, 'utf-8');
    assert.ok(content.includes("'use client'"), 'must be a client component');
    assert.ok(content.includes('logClientError'), 'must report to server telemetry');
    assert.ok(content.includes('Unable to Load Course Details'), 'must display English heading');
    assert.ok(content.includes('पाठ्यक्रम विवरण लोड करने में समस्या'), 'must display Hindi heading');
    assert.ok(content.includes('reset()') || content.includes('Try Again / पुनः प्रयास करें'), 'must offer reset handler');
    assert.ok(content.includes('wa.me/919311215564'), 'must link to WhatsApp support');
  });
});
