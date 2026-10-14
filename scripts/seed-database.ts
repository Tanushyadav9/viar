import { PrismaClient } from '@prisma/client';
import {
  INITIAL_COURSES,
  ULTIMATE_ASTROLOGY_MODULES,
  SCHEDULED_CLASSES_FLAGSHIP,
  INITIAL_FINAL_TEST,
} from '../src/lib/data.ts';

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding Neon PostgreSQL Database with Full Course Curriculum...');

  // 1. Seed or Update Flagship Course
  const flagshipData = INITIAL_COURSES[0];
  const flagshipCourse = await prisma.course.upsert({
    where: { slug: flagshipData.slug },
    update: {
      title: flagshipData.title,
      description: flagshipData.description,
      category: flagshipData.level || 'Vedic Astrology',
      priceInr: flagshipData.priceInr,
      priceUsd: flagshipData.priceUsd,
      originalPriceInr: flagshipData.originalPriceInr,
      originalPriceUsd: flagshipData.originalPriceUsd,
      durationWeeks: flagshipData.durationWeeks,
      totalClasses: flagshipData.totalClasses,
      classesPerWeek: flagshipData.classesPerWeek,
      status: 'PUBLISHED',
      instructorName: flagshipData.instructor.name,
      instructorBio: flagshipData.instructor.bio,
      syllabusJson: ULTIMATE_ASTROLOGY_MODULES as any,
    },
    create: {
      title: flagshipData.title,
      slug: flagshipData.slug,
      description: flagshipData.description,
      category: flagshipData.level || 'Vedic Astrology',
      priceInr: flagshipData.priceInr,
      priceUsd: flagshipData.priceUsd,
      originalPriceInr: flagshipData.originalPriceInr,
      originalPriceUsd: flagshipData.originalPriceUsd,
      durationWeeks: flagshipData.durationWeeks,
      totalClasses: flagshipData.totalClasses,
      classesPerWeek: flagshipData.classesPerWeek,
      status: 'PUBLISHED',
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
        description: c.description,
        category: c.level || 'Vedic Astrology',
        priceInr: c.priceInr,
        priceUsd: c.priceUsd,
        originalPriceInr: c.originalPriceInr,
        originalPriceUsd: c.originalPriceUsd,
        durationWeeks: c.durationWeeks,
        totalClasses: c.totalClasses,
        classesPerWeek: c.classesPerWeek,
        status: c.isComingSoon ? 'COMING_SOON' : 'PUBLISHED',
        instructorName: c.instructor.name,
        instructorBio: c.instructor.bio,
        syllabusJson: (c.modules || []) as any,
      },
      create: {
        title: c.title,
        slug: c.slug,
        description: c.description,
        category: c.level || 'Vedic Astrology',
        priceInr: c.priceInr,
        priceUsd: c.priceUsd,
        originalPriceInr: c.originalPriceInr,
        originalPriceUsd: c.originalPriceUsd,
        durationWeeks: c.durationWeeks,
        totalClasses: c.totalClasses,
        classesPerWeek: c.classesPerWeek,
        status: c.isComingSoon ? 'COMING_SOON' : 'PUBLISHED',
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

  // 4. Upsert 23 Class Sessions (Modules & Lessons)
  for (const session of SCHEDULED_CLASSES_FLAGSHIP) {
    const sNumber = session.sessionNumber ?? 1;
    const s = await prisma.classSession.upsert({
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
        status: 'COMPLETED',
        recordingUrl: session.recording?.videoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        recordingUploadedAt: new Date(),
        notesMarkdown: session.recording?.notesMarkdown || '',
      },
      create: {
        id: session.id,
        cohortId: cohort.id,
        sessionNumber: sNumber,
        title: session.title,
        description: session.description,
        scheduledAt: new Date(session.scheduledAt || '2026-01-01T00:00:00.000Z'),
        durationMinutes: session.durationMinutes || 75,
        status: 'COMPLETED',
        recordingUrl: session.recording?.videoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        recordingUploadedAt: new Date(),
        notesMarkdown: session.recording?.notesMarkdown || '',
      },
    });
  }
  console.log(`✓ Synced ${SCHEDULED_CLASSES_FLAGSHIP.length} class sessions / module lessons`);

  // 5. Upsert Quiz
  const quiz = await prisma.quiz.upsert({
    where: { id: 'test-wia-final' },
    update: {
      courseId: flagshipCourse.id,
      title: INITIAL_FINAL_TEST.title,
      passingPercentage: INITIAL_FINAL_TEST.passingPercentage,
      durationMinutes: INITIAL_FINAL_TEST.durationMinutes,
      questionsJson: INITIAL_FINAL_TEST.questions as any,
    },
    create: {
      id: 'test-wia-final',
      courseId: flagshipCourse.id,
      title: INITIAL_FINAL_TEST.title,
      passingPercentage: INITIAL_FINAL_TEST.passingPercentage,
      durationMinutes: INITIAL_FINAL_TEST.durationMinutes,
      questionsJson: INITIAL_FINAL_TEST.questions as any,
    },
  });
  console.log(`✓ Flagship Quiz synced: ${quiz.id} with ${INITIAL_FINAL_TEST.questions.length} questions`);

  // Print final summary counts
  const [courseCount, cohortCount, sessionCount, quizCount] = await Promise.all([
    prisma.course.count(),
    prisma.cohort.count(),
    prisma.classSession.count(),
    prisma.quiz.count(),
  ]);

  console.log('\n--- SEED COMPLETE ---');
  console.log({ courseCount, cohortCount, sessionCount, quizCount });
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
