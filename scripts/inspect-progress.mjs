import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const progressList = await prisma.lessonProgress.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      lesson: {
        select: {
          id: true,
          title: true,
          type: true,
          videoProviderId: true,
          notesMarkdown: true,
          module: { select: { id: true, title: true, order: true } },
        },
      },
    },
  });

  console.log(`=== TOTAL LESSON PROGRESS RECORDS: ${progressList.length} ===`);
  for (const p of progressList) {
    console.log({
      id: p.id,
      user: p.user?.name + ' (' + p.user?.email + ')',
      lessonId: p.lessonId,
      lessonTitle: p.lesson?.title,
      moduleTitle: p.lesson?.module?.title,
      hasVideo: Boolean(p.lesson?.videoProviderId),
      hasNotes: Boolean(p.lesson?.notesMarkdown?.trim()),
      completed: p.completed,
      completedAt: p.completedAt,
    });
  }

  const sessionProg = await prisma.sessionProgress.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } }
    }
  });
  console.log(`=== TOTAL SESSION PROGRESS RECORDS: ${sessionProg.length} ===`);
  for (const sp of sessionProg) {
    console.log(sp);
  }
}

main().finally(() => prisma.$disconnect());
