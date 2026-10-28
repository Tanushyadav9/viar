const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const course = await prisma.course.findFirst({
    include: {
      modules: {
        orderBy: { order: 'asc' },
        select: { id: true, title: true, order: true, _count: { select: { lessons: true } } }
      }
    }
  });
  if (!course) {
    console.log('No course found');
    return;
  }
  console.log('Course:', course.title, 'slug:', course.slug, 'id:', course.id);
  console.log('Modules count:', course.modules.length);
  course.modules.forEach(m => console.log(` - Module ${m.order}: "${m.title}" (id: ${m.id}) -> ${m._count.lessons} lessons`));

  const liveLessons = await prisma.lesson.findMany({
    where: { type: 'LIVE_SESSION' }
  });
  console.log('Live lessons currently in DB:', liveLessons.length);
  liveLessons.forEach(l => console.log(`   * [${l.status}] ${l.title} (at: ${l.liveScheduledAt}, link: ${l.liveJoinLink})`));

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
