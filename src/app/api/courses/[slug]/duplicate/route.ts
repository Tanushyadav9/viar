import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractAuthFromRequest, checkStaffSectionAccess } from '@/lib/auth/permissions';

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const auth = extractAuthFromRequest(req);
    const accessCheck = checkStaffSectionAccess({
      user: auth.userEmail || auth.userId || null,
      section: 'courses',
      requiredLevel: 'MANAGE',
    });

    if (!accessCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: accessCheck.reason || "Forbidden: MANAGE permission on 'courses' required.",
        },
        { status: 403 }
      );
    }

    const slugOrId = params.slug;

    // 1. Fetch source course with all modules, lessons, and quizzes
    const sourceCourse = await prisma.course.findFirst({
      where: {
        OR: [{ slug: slugOrId }, { id: slugOrId }],
      },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
            },
          },
        },
        quizzes: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
              include: {
                options: {
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!sourceCourse) {
      return NextResponse.json({ success: false, error: 'Source course not found' }, { status: 404 });
    }

    const uniqueSuffix = Math.random().toString(36).substring(2, 7);
    const newSlug = `${sourceCourse.slug}-copy-${uniqueSuffix}`;
    const newTitle = `${sourceCourse.title} (Copy)`;

    // 2. Create the duplicated course in DRAFT status
    const duplicatedCourse = await prisma.course.create({
      data: {
        title: newTitle,
        slug: newSlug,
        shortDescription: sourceCourse.shortDescription,
        description: sourceCourse.description,
        level: sourceCourse.level,
        category: sourceCourse.category,
        thumbnailUrl: sourceCourse.thumbnailUrl,
        status: 'DRAFT',
        isComingSoon: false,
        displayOrder: sourceCourse.displayOrder + 1,
        passingScore: sourceCourse.passingScore,
        certificateEnabled: sourceCourse.certificateEnabled,
        priceInr: sourceCourse.priceInr,
        priceUsd: sourceCourse.priceUsd,
        originalPriceInr: sourceCourse.originalPriceInr,
        originalPriceUsd: sourceCourse.originalPriceUsd,
        durationWeeks: sourceCourse.durationWeeks,
        totalClasses: sourceCourse.totalClasses,
        classesPerWeek: sourceCourse.classesPerWeek,
        instructorName: sourceCourse.instructorName,
        instructorBio: sourceCourse.instructorBio,
        syllabusJson: sourceCourse.syllabusJson || [],
      },
    });

    // 3. Duplicate modules & lessons
    for (const mod of sourceCourse.modules) {
      const newModule = await prisma.module.create({
        data: {
          courseId: duplicatedCourse.id,
          title: mod.title,
          description: mod.description,
          order: mod.order,
        },
      });

      for (const lesson of mod.lessons) {
        await prisma.lesson.create({
          data: {
            moduleId: newModule.id,
            order: lesson.order,
            type: lesson.type,
            title: lesson.title,
            description: lesson.description,
            isFreePreview: lesson.isFreePreview,
            videoProviderId: lesson.videoProviderId,
            videoDuration: lesson.videoDuration,
            documentKey: lesson.documentKey,
            documentUrl: lesson.documentUrl,
            liveScheduledAt: lesson.liveScheduledAt,
            liveTimezone: lesson.liveTimezone,
            liveJoinLink: lesson.liveJoinLink,
          },
        });
      }
    }

    // 4. Duplicate quizzes & questions
    for (const quiz of sourceCourse.quizzes) {
      const newQuiz = await prisma.quiz.create({
        data: {
          courseId: duplicatedCourse.id,
          title: quiz.title,
          passingPercentage: quiz.passingPercentage,
          passingScore: quiz.passingScore,
          attemptsAllowed: quiz.attemptsAllowed,
          durationMinutes: quiz.durationMinutes,
          isFinalExam: quiz.isFinalExam,
          questionsJson: quiz.questionsJson || [],
        },
      });

      for (const q of quiz.questions) {
        const newQuestion = await prisma.question.create({
          data: {
            quizId: newQuiz.id,
            order: q.order,
            question: q.question,
            explanation: q.explanation,
          },
        });

        for (const opt of q.options) {
          await prisma.option.create({
            data: {
              questionId: newQuestion.id,
              order: opt.order,
              text: opt.text,
              isCorrect: opt.isCorrect,
            },
          });
        }
      }
    }

    // 5. Log activity
    await prisma.activityLog.create({
      data: {
        userId: auth.userId || null,
        userEmail: auth.userEmail || null,
        action: 'COURSE_DUPLICATED',
        entityType: 'COURSE',
        entityId: duplicatedCourse.id,
        courseId: duplicatedCourse.id,
        reason: `Duplicated from ${sourceCourse.title} (${sourceCourse.slug})`,
        details: {
          sourceCourseId: sourceCourse.id,
          newCourseId: duplicatedCourse.id,
          newSlug,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Course "${sourceCourse.title}" successfully duplicated as a new draft!`,
      course: duplicatedCourse,
    });
  } catch (error) {
    console.error('Course duplicate error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
