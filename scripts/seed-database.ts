import { PrismaClient } from '@prisma/client';
import { assertStagingEnvironment } from './guard-staging.ts';
import {
  INITIAL_COURSES,
  ULTIMATE_ASTROLOGY_MODULES,
  SCHEDULED_CLASSES_FLAGSHIP,
  INITIAL_FINAL_TEST,
} from '../src/lib/data.ts';

// Enforce staging isolation: refuse to run against production database
assertStagingEnvironment({ scriptName: 'scripts/seed-database.ts' });

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding Neon PostgreSQL Database with Granular Relational Curriculum...');

  // 1. Seed or Update Flagship Course
  const flagshipData = INITIAL_COURSES[0];
  const flagshipCourse = await prisma.course.upsert({
    where: { slug: flagshipData.slug },
    update: {
      title: flagshipData.title,
      shortDescription: flagshipData.tagline || 'Comprehensive self-paced foundational masterclass in Vedic astrology.',
      description: flagshipData.description,
      level: flagshipData.level || 'Beginner',
      category: flagshipData.level || 'Vedic Astrology',
      thumbnailUrl: '/images/Acharya_Niraj_Kumar_Headshot.jpg',
      priceInr: flagshipData.priceInr || 5100,
      priceUsd: flagshipData.priceUsd || 69,
      originalPriceInr: flagshipData.originalPriceInr || 11000,
      originalPriceUsd: flagshipData.originalPriceUsd || 129,
      durationWeeks: flagshipData.durationWeeks || 9,
      totalClasses: flagshipData.totalClasses || 23,
      classesPerWeek: flagshipData.classesPerWeek || 2,
      status: 'PUBLISHED',
      isComingSoon: false,
      displayOrder: 1,
      passingScore: 70,
      certificateEnabled: true,
      instructorName: flagshipData.instructor.name,
      instructorBio: flagshipData.instructor.bio,
      syllabusJson: ULTIMATE_ASTROLOGY_MODULES as any,
    },
    create: {
      id: 'course-what-is-astrology',
      title: flagshipData.title,
      slug: flagshipData.slug,
      shortDescription: flagshipData.tagline || 'Comprehensive self-paced foundational masterclass in Vedic astrology.',
      description: flagshipData.description,
      level: flagshipData.level || 'Beginner',
      category: flagshipData.level || 'Vedic Astrology',
      thumbnailUrl: '/images/Acharya_Niraj_Kumar_Headshot.jpg',
      priceInr: flagshipData.priceInr || 5100,
      priceUsd: flagshipData.priceUsd || 69,
      originalPriceInr: flagshipData.originalPriceInr || 11000,
      originalPriceUsd: flagshipData.originalPriceUsd || 129,
      durationWeeks: flagshipData.durationWeeks || 9,
      totalClasses: flagshipData.totalClasses || 23,
      classesPerWeek: flagshipData.classesPerWeek || 2,
      status: 'PUBLISHED',
      isComingSoon: false,
      displayOrder: 1,
      passingScore: 70,
      certificateEnabled: true,
      instructorName: flagshipData.instructor.name,
      instructorBio: flagshipData.instructor.bio,
      syllabusJson: ULTIMATE_ASTROLOGY_MODULES as any,
    },
  });
  console.log(`✓ Flagship Course synced: ${flagshipCourse.id} (${flagshipCourse.title})`);

  // 2. Seed other courses from INITIAL_COURSES
  for (let i = 1; i < INITIAL_COURSES.length; i++) {
    const c = INITIAL_COURSES[i];
    const createdCourse = await prisma.course.upsert({
      where: { slug: c.slug },
      update: {
        title: c.title,
        shortDescription: c.tagline,
        description: c.description,
        level: c.level || 'Beginner',
        category: c.level || 'Vedic Astrology',
        priceInr: c.priceInr,
        priceUsd: c.priceUsd,
        originalPriceInr: c.originalPriceInr,
        originalPriceUsd: c.originalPriceUsd,
        durationWeeks: c.durationWeeks,
        totalClasses: c.totalClasses,
        classesPerWeek: c.classesPerWeek,
        status: c.isComingSoon ? 'COMING_SOON' : 'PUBLISHED',
        isComingSoon: Boolean(c.isComingSoon),
        displayOrder: i + 1,
        passingScore: 70,
        certificateEnabled: true,
        instructorName: c.instructor.name,
        instructorBio: c.instructor.bio,
        syllabusJson: (c.modules || []) as any,
      },
      create: {
        id: c.id,
        title: c.title,
        slug: c.slug,
        shortDescription: c.tagline,
        description: c.description,
        level: c.level || 'Beginner',
        category: c.level || 'Vedic Astrology',
        priceInr: c.priceInr,
        priceUsd: c.priceUsd,
        originalPriceInr: c.originalPriceInr,
        originalPriceUsd: c.originalPriceUsd,
        durationWeeks: c.durationWeeks,
        totalClasses: c.totalClasses,
        classesPerWeek: c.classesPerWeek,
        status: c.isComingSoon ? 'COMING_SOON' : 'PUBLISHED',
        isComingSoon: Boolean(c.isComingSoon),
        displayOrder: i + 1,
        passingScore: 70,
        certificateEnabled: true,
        instructorName: c.instructor.name,
        instructorBio: c.instructor.bio,
        syllabusJson: (c.modules || []) as any,
      },
    });
    console.log(`✓ Additional Course synced: ${createdCourse.slug}`);
  }

  // 3. Upsert Flagship Cohort
  const cohort = await prisma.cohort.upsert({
    where: { id: 'cohort-wia-batch-1' },
    update: {
      courseId: flagshipCourse.id,
      batchName: 'Self-Paced Masterclass — Vihangam Institute of Astrology and Research',
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      capacity: 500,
      status: 'ACTIVE',
      scheduleDescription: '100% On-Demand Self-Paced Video Learning with Verifiable Certification',
    },
    create: {
      id: 'cohort-wia-batch-1',
      courseId: flagshipCourse.id,
      batchName: 'Self-Paced Masterclass — Vihangam Institute of Astrology and Research',
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      capacity: 500,
      status: 'ACTIVE',
      scheduleDescription: '100% On-Demand Self-Paced Video Learning with Verifiable Certification',
    },
  });
  console.log(`✓ Flagship Cohort synced: ${cohort.id}`);

  // 4. Seed Granular Relational Modules and Lessons for Flagship Course
  console.log('Seeding 23 Relational Modules and Lessons...');
  for (const mod of ULTIMATE_ASTROLOGY_MODULES) {
    const moduleId = `mod-${mod.moduleNumber}`;
    const session = SCHEDULED_CLASSES_FLAGSHIP.find((s) => s.sessionNumber === mod.moduleNumber);

    // Upsert Module
    const dbModule = await prisma.module.upsert({
      where: { id: moduleId },
      update: {
        courseId: flagshipCourse.id,
        title: mod.title,
        description: mod.description,
        order: mod.moduleNumber,
      },
      create: {
        id: moduleId,
        courseId: flagshipCourse.id,
        title: mod.title,
        description: mod.description,
        order: mod.moduleNumber,
      },
    });

    // Lesson 1: On-Demand Video Lesson
    const videoLessonId = `lesson-${mod.moduleNumber}-vid`;
    const isFreePreview = mod.moduleNumber === 1; // Module 1 is Free Preview for prospective students
    await prisma.lesson.upsert({
      where: { id: videoLessonId },
      update: {
        moduleId: dbModule.id,
        order: 1,
        type: 'VIDEO',
        title: `${mod.title} — Video Lecture`,
        description: `Complete HD lecture session covering: ${mod.keyTopics?.join(', ') || mod.description || 'Core concepts'}.`,
        isFreePreview,
        videoProviderId: session?.recording?.videoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        videoDuration: (mod.durationMinutes || 75) * 60,
      },
      create: {
        id: videoLessonId,
        moduleId: dbModule.id,
        order: 1,
        type: 'VIDEO',
        title: `${mod.title} — Video Lecture`,
        description: `Complete HD lecture session covering: ${mod.keyTopics?.join(', ') || mod.description || 'Core concepts'}.`,
        isFreePreview,
        videoProviderId: session?.recording?.videoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        videoDuration: (mod.durationMinutes || 75) * 60,
      },
    });

    // Lesson 2: Study Guide Document / Notes
    const docLessonId = `lesson-${mod.moduleNumber}-doc`;
    await prisma.lesson.upsert({
      where: { id: docLessonId },
      update: {
        moduleId: dbModule.id,
        order: 2,
        type: 'DOCUMENT',
        title: `Module ${mod.moduleNumber} Study Guide & Reference Notes`,
        description: `Downloadable reference material and study guide for Module ${mod.moduleNumber}.`,
        isFreePreview,
        documentKey: `curriculum/module-${mod.moduleNumber}-guide.pdf`,
        documentUrl: `https://viar.in/resources/module-${mod.moduleNumber}-study-notes.pdf`,
      },
      create: {
        id: docLessonId,
        moduleId: dbModule.id,
        order: 2,
        type: 'DOCUMENT',
        title: `Module ${mod.moduleNumber} Study Guide & Reference Notes`,
        description: `Downloadable reference material and study guide for Module ${mod.moduleNumber}.`,
        isFreePreview,
        documentKey: `curriculum/module-${mod.moduleNumber}-guide.pdf`,
        documentUrl: `https://viar.in/resources/module-${mod.moduleNumber}-study-notes.pdf`,
      },
    });
  }
  console.log(`✓ Seeded ${ULTIMATE_ASTROLOGY_MODULES.length} modules and 46 lessons`);

  // 5. Upsert 23 Class Sessions (for backward compatibility with cohort schedule)
  for (const session of SCHEDULED_CLASSES_FLAGSHIP) {
    const sNumber = session.sessionNumber ?? 1;
    await prisma.classSession.upsert({
      where: {
        cohortId_sessionNumber: {
          cohortId: cohort.id,
          sessionNumber: sNumber,
        },
      },
      update: {
        title: session.title,
        description: session.description,
        scheduledAt: new Date(session.scheduledAt || '2026-01-01T00:00:00.000Z'),
        durationMinutes: session.durationMinutes || 75,
        status: session.status || 'UPCOMING',
        recordingUrl: session.recording?.videoUrl || null,
        recordingUploadedAt: session.recording?.videoUrl ? new Date() : null,
        notesMarkdown: session.recording?.notesMarkdown || null,
      },
      create: {
        id: session.id,
        cohortId: cohort.id,
        sessionNumber: sNumber,
        title: session.title,
        description: session.description,
        scheduledAt: new Date(session.scheduledAt || '2026-01-01T00:00:00.000Z'),
        durationMinutes: session.durationMinutes || 75,
        status: session.status || 'UPCOMING',
        recordingUrl: session.recording?.videoUrl || null,
        recordingUploadedAt: session.recording?.videoUrl ? new Date() : null,
        notesMarkdown: session.recording?.notesMarkdown || null,
      },
    });
  }
  console.log(`✓ Synced ${SCHEDULED_CLASSES_FLAGSHIP.length} class sessions`);

  // 6. Upsert Course Final Exam Quiz, Relational Questions, and Options
  const finalQuiz = await prisma.quiz.upsert({
    where: { id: 'test-wia-final' },
    update: {
      courseId: flagshipCourse.id,
      title: INITIAL_FINAL_TEST.title,
      passingPercentage: INITIAL_FINAL_TEST.passingPercentage,
      passingScore: INITIAL_FINAL_TEST.passingPercentage,
      durationMinutes: INITIAL_FINAL_TEST.durationMinutes,
      attemptsAllowed: 3,
      isFinalExam: true,
      questionsJson: INITIAL_FINAL_TEST.questions as any,
    },
    create: {
      id: 'test-wia-final',
      courseId: flagshipCourse.id,
      title: INITIAL_FINAL_TEST.title,
      passingPercentage: INITIAL_FINAL_TEST.passingPercentage,
      passingScore: INITIAL_FINAL_TEST.passingPercentage,
      durationMinutes: INITIAL_FINAL_TEST.durationMinutes,
      attemptsAllowed: 3,
      isFinalExam: true,
      questionsJson: INITIAL_FINAL_TEST.questions as any,
    },
  });

  console.log(`Seeding 20 Questions and Options for Quiz ${finalQuiz.id}...`);
  for (const q of INITIAL_FINAL_TEST.questions) {
    const questionRecord = await prisma.question.upsert({
      where: { id: q.id },
      update: {
        quizId: finalQuiz.id,
        order: q.questionNumber,
        question: q.question,
        explanation: q.explanation,
      },
      create: {
        id: q.id,
        quizId: finalQuiz.id,
        order: q.questionNumber,
        question: q.question,
        explanation: q.explanation,
      },
    });

    // Seed 4 options per question
    for (let optIdx = 0; optIdx < q.options.length; optIdx++) {
      const optionId = `${q.id}-opt-${optIdx}`;
      const optionText = q.options[optIdx];
      const isCorrect = optIdx === q.correctOptionIndex;

      await prisma.option.upsert({
        where: { id: optionId },
        update: {
          questionId: questionRecord.id,
          order: optIdx + 1,
          text: optionText,
          isCorrect,
        },
        create: {
          id: optionId,
          questionId: questionRecord.id,
          order: optIdx + 1,
          text: optionText,
          isCorrect,
        },
      });
    }
  }
  console.log(`✓ Seeded ${INITIAL_FINAL_TEST.questions.length} questions and 80 options for certification quiz`);

  // Print final summary counts
  const [courseCount, moduleCount, lessonCount, questionCount, optionCount, cohortCount, sessionCount, quizCount] = await Promise.all([
    prisma.course.count(),
    prisma.module.count(),
    prisma.lesson.count(),
    prisma.question.count(),
    prisma.option.count(),
    prisma.cohort.count(),
    prisma.classSession.count(),
    prisma.quiz.count(),
  ]);

  console.log('\n=======================================');
  console.log('✓ RELATIONAL SEED COMPLETE TO NEON DB');
  console.log('=======================================');
  console.log({
    courses: courseCount,
    modules: moduleCount,
    lessons: lessonCount,
    quizzes: quizCount,
    questions: questionCount,
    options: optionCount,
    cohorts: cohortCount,
    sessions: sessionCount,
  });
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
