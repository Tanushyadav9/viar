import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const isApply = process.argv.includes('--apply');

async function main() {
  console.log('========================================================================');
  console.log(`INVALID LESSON PROGRESS CLEANUP — ${isApply ? 'APPLY MODE (TRANSACTIONAL)' : 'DRY-RUN MODE'}`);
  console.log('========================================================================\n');

  // Find all LessonProgress records and inspect lesson content
  const allProgress = await prisma.lessonProgress.findMany({
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      lesson: {
        select: {
          id: true,
          title: true,
          type: true,
          videoProviderId: true,
          externalVideoUrl: true,
          notesMarkdown: true,
          documentKey: true,
          documentUrl: true,
          liveScheduledAt: true,
        },
      },
    },
  });

  const invalidRecords = allProgress.filter((p) => {
    // Both records from Oct 25 walkthrough (resulting in "2 of 23 modules completed")
    if (p.id === 'cmvno9ku900017hni36nmi4hv' || p.id === 'cmvno9wd200037hni3q4wkqix') {
      return true;
    }
    if (!p.lesson) return true;
    const lType = (p.lesson.type || 'VIDEO').toUpperCase();
    if (lType === 'VIDEO') {
      const vid = p.lesson.videoProviderId || p.lesson.externalVideoUrl;
      return !vid || !vid.trim() || vid.includes('dQw4w9WgXcQ');
    }
    if (lType === 'DOCUMENT') {
      return (
        (!p.lesson.documentKey || !p.lesson.documentKey.trim()) &&
        (!p.lesson.documentUrl || !p.lesson.documentUrl.trim()) &&
        (!p.lesson.notesMarkdown || !p.lesson.notesMarkdown.trim())
      );
    }
    if (lType === 'LIVE_SESSION') {
      return (
        !p.lesson.liveScheduledAt ||
        isNaN(new Date(p.lesson.liveScheduledAt).getTime()) ||
        new Date(p.lesson.liveScheduledAt).getTime() <= 86400000
      );
    }
    return false;
  });

  console.log(`Total LessonProgress records in DB: ${allProgress.length}`);
  console.log(`Invalid records (completed without content / test walkthrough): ${invalidRecords.length}\n`);

  if (invalidRecords.length === 0) {
    console.log('✅ Zero invalid progress records found. Nothing to clean.');
    return;
  }

  console.log('--- DRY-RUN LIST OF INVALID RECORDS IDENTIFIED FOR DELETION ---');
  for (const inv of invalidRecords) {
    console.log({
      progressId: inv.id,
      user: `${inv.user?.name} (${inv.user?.email})`,
      lessonId: inv.lessonId,
      lessonTitle: inv.lesson?.title,
      lessonType: inv.lesson?.type,
      hasVideo: Boolean(inv.lesson?.videoProviderId || inv.lesson?.externalVideoUrl),
      hasNotes: Boolean(inv.lesson?.notesMarkdown?.trim() || inv.lesson?.documentKey),
      completedAt: inv.completedAt,
    });
  }
  console.log('---------------------------------------------------------------\n');

  if (!isApply) {
    console.log('⚠️ DRY-RUN ONLY: No changes made to the database.');
    console.log('To execute the deletion in an ACID transaction, run with --apply after confirmation.');
    return;
  }

  // Execute deletion in a Prisma transaction
  const targetIds = invalidRecords.map((r) => r.id);
  console.log(`Executing ACID transaction to delete ${targetIds.length} invalid record(s)...`);

  const result = await prisma.$transaction(async (tx) => {
    const deleted = await tx.lessonProgress.deleteMany({
      where: { id: { in: targetIds } },
    });

    // Create audit log entry
    await tx.auditLog.create({
      data: {
        action: 'INVALID_PROGRESS_PURGED',
        userId: 'system',
        userEmail: 'aapkaastro1606@gmail.com',
        userRole: 'OWNER',
        details: JSON.stringify({
          count: deleted.count,
          purgedIds: targetIds,
          reason: 'Cleared lesson progress marked on lessons lacking published content.',
        }),
      },
    });

    return deleted;
  });

  console.log(`✅ Transaction committed successfully! Deleted ${result.count} invalid lesson progress record(s).`);

  const remaining = await prisma.lessonProgress.count();
  console.log(`Remaining LessonProgress records in DB: ${remaining}`);
}

main()
  .catch((e) => {
    console.error('Error during cleanup:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
