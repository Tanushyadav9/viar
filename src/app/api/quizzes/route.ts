import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { INITIAL_FINAL_TEST } from '@/lib/data';
import { getServerAuthUser, isAuthorizedForSection } from '@/lib/auth/serverAuth';
import { verifyUserCourseAccess } from '@/lib/auth/course-access';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const cohortId = searchParams.get('cohortId');
    const quizId = searchParams.get('quizId');

    const auth = await getServerAuthUser();
    const isStaff = isAuthorizedForSection(auth, 'quizzes', 'VIEW');

    let dbQuiz = null;
    try {
      if (quizId) {
        dbQuiz = await prisma.quiz.findUnique({ where: { id: quizId } });
      } else if (courseId) {
        dbQuiz = await prisma.quiz.findFirst({ where: { courseId } });
      } else if (cohortId) {
        const cohort = await prisma.cohort.findUnique({
          where: { id: cohortId },
          include: { course: { include: { quizzes: true } } },
        });
        dbQuiz = cohort?.course?.quizzes?.[0] || null;
      } else {
        dbQuiz = await prisma.quiz.findFirst();
      }
    } catch (dbError) {
      console.warn('Database query for quiz failed:', (dbError as Error).message);
    }

    const quizData = dbQuiz || {
      id: INITIAL_FINAL_TEST.id,
      courseId: INITIAL_FINAL_TEST.courseId,
      title: INITIAL_FINAL_TEST.title,
      passingPercentage: INITIAL_FINAL_TEST.passingPercentage,
      durationMinutes: INITIAL_FINAL_TEST.durationMinutes,
      questionsJson: INITIAL_FINAL_TEST.questions,
    };

    const rawQuestions = Array.isArray(quizData.questionsJson)
      ? (quizData.questionsJson as unknown as Array<Record<string, unknown>>)
      : [];

    const courseSlugOrId = courseId || cohortId || quizData.courseId || 'course-what-is-astrology';
    const access = await verifyUserCourseAccess(req, courseSlugOrId);
    const isAuthorized = isStaff || access.isEnrolled;

    // Security Gate: Non-enrolled public visitors get 403 Forbidden on direct calls
    if (!isAuthorized) {
      if (searchParams.get('mode') === 'preview' || searchParams.get('preview') === 'true') {
        return NextResponse.json({
          success: true,
          quiz: {
            id: quizData.id,
            courseId: quizData.courseId,
            title: quizData.title,
            passingPercentage: quizData.passingPercentage,
            durationMinutes: quizData.durationMinutes,
            totalQuestions: rawQuestions.length,
            isLocked: true,
            questions: [],
            isAnswerKeyProtected: true,
          },
        });
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: Active enrollment or staff access required to view quiz questions.',
          code: 'ENROLLMENT_REQUIRED',
          isLocked: true,
        },
        { status: 403 }
      );
    }

    // Security Gate: Protect Answer Key on Server
    // If not staff, strip correctOptionIndex & explanation so answer key cannot be extracted
    const sanitizedQuestions = isStaff
      ? rawQuestions
      : rawQuestions.map((q) => ({
          id: q.id,
          questionNumber: q.questionNumber,
          topic: q.topic,
          question: q.question,
          options: q.options,
        }));

    return NextResponse.json({
      success: true,
      quiz: {
        id: quizData.id,
        courseId: quizData.courseId,
        title: quizData.title,
        passingPercentage: quizData.passingPercentage,
        durationMinutes: quizData.durationMinutes,
        totalQuestions: rawQuestions.length,
        isLocked: false,
        questions: sanitizedQuestions,
        isAnswerKeyProtected: !isStaff,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!isAuthorizedForSection(auth, 'quizzes', 'MANAGE')) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: MANAGE permission on 'quizzes' required.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { courseId, title, passingPercentage, durationMinutes, questions } = body;

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'courseId is required to save quiz' },
        { status: 400 }
      );
    }

    // Upsert quiz in PostgreSQL
    const existingQuiz = await prisma.quiz.findFirst({
      where: { courseId },
    });

    let savedQuiz;
    if (existingQuiz) {
      savedQuiz = await prisma.quiz.update({
        where: { id: existingQuiz.id },
        data: {
          title: title || existingQuiz.title,
          passingPercentage: Number(passingPercentage) || existingQuiz.passingPercentage,
          durationMinutes: Number(durationMinutes) || existingQuiz.durationMinutes,
          questionsJson: questions || existingQuiz.questionsJson,
        },
      });
    } else {
      savedQuiz = await prisma.quiz.create({
        data: {
          courseId,
          title: title || 'Certification Assessment',
          passingPercentage: Number(passingPercentage) || 70,
          durationMinutes: Number(durationMinutes) || 45,
          questionsJson: questions || [],
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Quiz saved successfully to database',
      quiz: savedQuiz,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
