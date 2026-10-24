import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkFlagship() {
  const course = await prisma.course.findUnique({
    where: { slug: 'what-is-astrology' },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: {
          lessons: true,
        },
      },
      quizzes: {
        include: {
          questions: {
            include: {
              options: true,
            },
          },
        },
      },
      cohorts: true,
    },
  });

  if (!course) {
    console.error('Flagship course not found!');
    process.exit(1);
  }

  console.log('=== FLAGSHIP COURSE VERIFICATION ===');
  console.log('Title:            ', course.title);
  console.log('Slug:             ', course.slug);
  console.log('Price (INR):      ', course.priceInr);
  console.log('Original Price:   ', course.originalPriceInr);
  console.log('Total Modules:    ', course.modules.length);
  console.log('Certificate Enabled:', course.certificateEnabled);
  console.log('Passing Score:    ', course.passingScore);
  console.log('Quizzes Count:    ', course.quizzes.length);
  if (course.quizzes.length > 0) {
    console.log('Quiz Questions:   ', course.quizzes[0].questions.length);
  }
  console.log('Cohorts Count:    ', course.cohorts.length);
  if (course.cohorts.length > 0) {
    console.log('Cohort ID:        ', course.cohorts[0].id);
    console.log('Cohort Name:      ', course.cohorts[0].name);
  }

  const coreModules = course.modules.filter(m => !m.title.toLowerCase().includes('bonus'));
  const bonusModules = course.modules.filter(m => m.title.toLowerCase().includes('bonus'));
  console.log(`Module Breakdown:  ${coreModules.length} Core modules, ${bonusModules.length} Bonus modules`);
}

checkFlagship()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
