/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Public Course DTO & Serializer
 * Vihangam Institute of Astrology and Research (Viar.in)
 * 
 * CORE ARCHITECTURAL INVARIANT:
 * Converts raw PostgreSQL Prisma models into plain, 100% serializable public objects.
 * Guarantees:
 * 1. Dates are strictly ISO-8601 strings (no Date instances).
 * 2. Numbers are native JavaScript numbers (no Decimal, no BigInt).
 * 3. Every optional and array field is guaranteed a safe, non-null default.
 * 4. Client components only import and consume CoursePublicDTO.
 */

export interface CourseInstructorDTO {
  name: string;
  title: string;
  bio: string;
  experienceYears: number;
  avatarUrl: string;
  aapkaAstroUrl: string;
  credentials: string[];
}

export interface CourseFaqDTO {
  question: string;
  answer: string;
}

export interface CourseLessonDTO {
  id: string;
  moduleId: string;
  order: number;
  type: string;
  title: string;
  description: string;
  isPublished?: boolean;
  isFreePreview: boolean;
  videoDuration?: number | null;
  isLocked: boolean;
  playbackUrl?: string | null;
  signedPlaybackToken?: string | null;
  documentDownloadUrl?: string | null;
}

export interface CourseModuleDTO {
  id: string;
  moduleNumber: number;
  number?: number;
  title: string;
  description: string;
  durationMinutes: number;
  order: number;
  isBonus?: boolean;
  isPublished?: boolean;
  keyTopics: string[];
  lessons: CourseLessonDTO[];
}

export interface CourseQuizQuestionDTO {
  id: string;
  order: number;
  question: string;
  explanation?: string;
  options: {
    id: string;
    order: number;
    text: string;
    isCorrect?: boolean;
  }[];
}

export interface CourseQuizDTO {
  id: string;
  title: string;
  passingPercentage: number;
  durationMinutes: number;
  totalQuestions: number;
  isLocked: boolean;
  questions: CourseQuizQuestionDTO[];
}

export interface CourseCohortDTO {
  id: string;
  courseId: string;
  batchName: string;
  startDate: string;
  endDate: string | null;
  capacity: number;
  enrolledCount: number;
  status: string;
  scheduleDescription: string;
  createdAt: string;
}

export interface CoursePublicDTO {
  id: string;
  slug: string;
  title: string;
  titleHi: string;
  tagline: string;
  subtitle: string;
  description: string;
  descriptionHi: string;
  shortDescription: string;
  shortDescriptionHi: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  deliveryMode: 'SELF_PACED' | 'LIVE_COHORT';
  category: string;
  status: string;
  isPublished: boolean;
  isComingSoon: boolean;
  acceptingEnrollments: boolean;
  featured: boolean;
  badge: string;
  thumbnailUrl: string;
  durationWeeks: number;
  totalClasses: number;
  classesPerWeek: number;
  priceInr: number;
  priceUsd: number;
  originalPriceInr: number;
  originalPriceUsd: number;
  passingScore: number;
  certificateEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  instructor: CourseInstructorDTO;
  highlights: string[];
  prerequisites: string[];
  whatYouWillLearn: string[];
  modules: CourseModuleDTO[];
  quizzes: CourseQuizDTO[];
  faqs: CourseFaqDTO[];
  cohorts: CourseCohortDTO[];
  enrollmentCount: number;
}

const DEFAULT_INSTRUCTOR: CourseInstructorDTO = {
  name: 'Acharya Niraj Kumar',
  title: 'Jyotish Acharya (Bharatiya Vidya Bhavan) | Founder, Aapka Astro & VIAR',
  bio: 'Acharya Niraj Kumar brings together authentic traditional Vedic learning rooted in Baidyanath Dham (Deoghar) and prestigious academic credentials as a certified Jyotish Acharya from the legendary Bharatiya Vidya Bhavan - Institute of Astrology, Kasturba Gandhi Marg, New Delhi (under renowned advisor K.N. Rao), alongside certified qualifications as a Logical Vastu Expert and Astro Vastu specialist. Blending 20+ years of senior executive leadership (former Vice President at Reliance Retail, Metro Cash & Carry, and NIF Food) with 20+ years of astrological practice, he is trusted by students and consultation clients across India and globally, backed by an active community of 26,000+ followers.',
  experienceYears: 20,
  avatarUrl: '/images/Acharya_Niraj_Kumar_Headshot.jpg',
  aapkaAstroUrl: 'https://aapkaastro.com',
  credentials: [
    'Jyotish Acharya — Bharatiya Vidya Bhavan (under Advisor K.N. Rao)',
    'Logical Vastu Expert — ISO 9001:2015 Certified',
    'Certified Astro Vastu Specialist (Jyotishvedanghub)',
    'Founder of Aapka Astro (26k+ Community Across India & Abroad)',
  ],
};

const DEFAULT_FAQS: CourseFaqDTO[] = [
  {
    question: 'Is this course completely self-paced?',
    answer:
      'Yes! All 23 video modules and the 2 bonus chart workshops are available immediately upon enrollment. You have lifetime access, meaning you can watch, pause, re-watch, and progress through the curriculum entirely on your own schedule with zero time pressure.',
  },
  {
    question: 'Do I get a certificate upon completion?',
    answer:
      'Yes. After completing the video modules, you can take the comprehensive final certification assessment. Scoring 70% or higher generates your official digital Certificate of Completion from the Vihangam Institute of Astrology and Research (VIAR), complete with a unique verifiable code at viar.in/verify.',
  },
  {
    question: 'Who is the instructor?',
    answer:
      'The course is created and taught exclusively by Acharya Niraj Kumar, a certified Jyotish Acharya from the prestigious Bharatiya Vidya Bhavan - Institute of Astrology, New Delhi (under guru K.N. Rao), Logical Vastu Expert, and founder of Aapka Astro (26k+ followers across India and abroad).',
  },
];

const DEFAULT_HIGHLIGHTS: string[] = [
  '23 comprehensive on-demand video modules covering the complete science of Vedic Astrology',
  '2 bonus real-world chart reading masterclasses: Career analysis and Marriage timing',
  '100% self-paced: watch anytime, from any device, at your own speed with lifetime access',
  'Downloadable high-resolution chart templates, planetary tables, and study cheatsheets',
  'Final graded assessment and official verifiable Certificate of Completion from Vihangam Institute of Astrology and Research',
];

const DEFAULT_PREREQUISITES: string[] = [
  'No prior astrological knowledge required — starts from foundational principles',
  'An open mind and curiosity for cosmic mathematics and psychology',
  'Your birth details (date, exact time, and location) for personal chart exercises',
];

const DEFAULT_WHAT_YOU_WILL_LEARN: string[] = [
  'The cosmic architecture: 9 Grahas, 12 Rashis, 27 Nakshatras, and 12 Bhavas',
  'Decoding planetary dignities: Exaltation, Debilitation, Combustion, and Retrograde motion',
  'Navigating the Dasha system (Vimshottari) to time life events with mathematical precision',
  'Remedial Vedic sciences: Authentic Gemstone therapy, Rudraksha selection, and Daan-Dakshina principles',
  'Step-by-step reading of the Lagna Kundali with real chart case studies',
];

function toIsoString(val: unknown, fallback?: string): string {
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'string' && val.trim().length > 0) {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  return fallback || new Date().toISOString();
}

function toNumber(val: unknown, fallback: number): number {
  if (typeof val === 'number' && !isNaN(val)) return val;
  if (typeof val === 'string') {
    const parsed = Number(val);
    if (!isNaN(parsed)) return parsed;
  }
  if (val && typeof val === 'object' && 'toNumber' in (val as Record<string, unknown>)) {
    // Handle Prisma Decimal safely if encountered
    try {
      return (val as { toNumber: () => number }).toNumber();
    } catch {
      return fallback;
    }
  }
  return fallback;
}

/**
 * Converts a database Course entity (with optional relations) into a guaranteed null-safe CoursePublicDTO.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toCoursePublicDTO(course: any): CoursePublicDTO {
  if (!course) {
    throw new Error('toCoursePublicDTO requires a valid course object');
  }

  // 1. Instructor
  const instructor: CourseInstructorDTO = {
    name: String(course.instructorName || course.instructor?.name || DEFAULT_INSTRUCTOR.name),
    title: String(course.instructor?.title || DEFAULT_INSTRUCTOR.title),
    bio: String(course.instructorBio || course.instructor?.bio || DEFAULT_INSTRUCTOR.bio),
    experienceYears: toNumber(course.instructor?.experienceYears, DEFAULT_INSTRUCTOR.experienceYears),
    avatarUrl: String(course.instructor?.avatarUrl || DEFAULT_INSTRUCTOR.avatarUrl),
    aapkaAstroUrl: String(course.instructor?.aapkaAstroUrl || DEFAULT_INSTRUCTOR.aapkaAstroUrl),
    credentials: Array.isArray(course.instructor?.credentials)
      ? course.instructor.credentials.map(String)
      : DEFAULT_INSTRUCTOR.credentials,
  };

  // 2. Modules & Lessons
  const rawModules = Array.isArray(course.modules)
    ? course.modules
    : Array.isArray(course.syllabusJson)
    ? course.syllabusJson
    : [];

  const modules: CourseModuleDTO[] = rawModules.map((m: any, idx: number) => {
    const rawLessons = Array.isArray(m.lessons) ? m.lessons : [];
    const lessons: CourseLessonDTO[] = rawLessons.map((l: any, lIdx: number) => ({
      id: String(l.id || `lesson-${idx + 1}-${lIdx + 1}`),
      moduleId: String(l.moduleId || m.id || `mod-${idx + 1}`),
      order: toNumber(l.order, lIdx + 1),
      type: String(l.type || 'VIDEO'),
      title: String(l.title || `Lesson ${lIdx + 1}`),
      description: String(l.description || ''),
      isPublished: l.isPublished !== undefined ? Boolean(l.isPublished) : true,
      isFreePreview: Boolean(l.isFreePreview),
      videoDuration: l.videoDuration !== undefined && l.videoDuration !== null ? toNumber(l.videoDuration, 0) : null,
      isLocked: Boolean(l.isLocked ?? !l.isFreePreview),
      playbackUrl: l.playbackUrl ? String(l.playbackUrl) : null,
      signedPlaybackToken: l.signedPlaybackToken ? String(l.signedPlaybackToken) : null,
      documentDownloadUrl: l.documentDownloadUrl ? String(l.documentDownloadUrl) : null,
    }));

    return {
      id: String(m.id || `mod-${idx + 1}`),
      moduleNumber: toNumber(m.moduleNumber || m.number, idx + 1),
      number: toNumber(m.number || m.moduleNumber, idx + 1),
      title: String(m.title || `Module ${idx + 1}`),
      description: String(m.description || ''),
      durationMinutes: toNumber(m.durationMinutes, 75),
      order: toNumber(m.order, idx + 1),
      isBonus: Boolean(m.isBonus),
      isPublished: m.isPublished !== undefined ? Boolean(m.isPublished) : true,
      keyTopics: Array.isArray(m.keyTopics) ? m.keyTopics.map(String) : [],
      lessons,
    };
  });

  // 3. Cohorts
  const rawCohorts = Array.isArray(course.cohorts) ? course.cohorts : [];
  const cohorts: CourseCohortDTO[] = rawCohorts.map((c: any) => ({
    id: String(c.id),
    courseId: String(c.courseId || course.id),
    batchName: String(c.batchName || 'Self-Paced Masterclass'),
    startDate: toIsoString(c.startDate, '2026-01-01T00:00:00.000Z'),
    endDate: c.endDate ? toIsoString(c.endDate) : null,
    capacity: toNumber(c.capacity, 500),
    enrolledCount: toNumber(c.enrolledCount, 0),
    status: String(c.status || 'ACTIVE'),
    scheduleDescription: String(c.scheduleDescription || '100% On-Demand Self-Paced Video Learning'),
    createdAt: toIsoString(c.createdAt),
  }));

  // 4. Quizzes
  const rawQuizzes = Array.isArray(course.quizzes) ? course.quizzes : [];
  const quizzes: CourseQuizDTO[] = rawQuizzes.map((q: any) => {
    const rawQuestions = Array.isArray(q.questions) ? q.questions : [];
    const questions: CourseQuizQuestionDTO[] = rawQuestions.map((qn: any, qnIdx: number) => {
      const rawOptions = Array.isArray(qn.options) ? qn.options : [];
      return {
        id: String(qn.id || `question-${qnIdx + 1}`),
        order: toNumber(qn.order, qnIdx + 1),
        question: String(qn.question || ''),
        explanation: qn.explanation ? String(qn.explanation) : undefined,
        options: rawOptions.map((opt: any, optIdx: number) => ({
          id: String(opt.id || `opt-${optIdx + 1}`),
          order: toNumber(opt.order, optIdx + 1),
          text: String(opt.text || ''),
          isCorrect: opt.isCorrect !== undefined ? Boolean(opt.isCorrect) : undefined,
        })),
      };
    });

    return {
      id: String(q.id || 'quiz-final'),
      title: String(q.title || 'Graded Final Assessment'),
      passingPercentage: toNumber(q.passingPercentage, 70),
      durationMinutes: toNumber(q.durationMinutes, 45),
      totalQuestions: toNumber(q.totalQuestions, questions.length || 20),
      isLocked: Boolean(q.isLocked),
      questions,
    };
  });

  const totalClasses = toNumber(course.totalClasses, modules.length || 23);

  return {
    id: String(course.id),
    slug: String(course.slug),
    title: String(course.title || 'Vedic Astrology Masterclass'),
    titleHi: String(course.titleHi || 'सम्पूर्ण वैदिक ज्योतिष: मूल सिद्धांतों से कुंडली महारत'),
    tagline: String(
      course.tagline ||
        course.shortDescription ||
        course.description?.slice(0, 120) ||
        'Learn the sacred science of Vedic Astrology from first principles to real chart readings.'
    ),
    subtitle: String(
      course.subtitle ||
        `${totalClasses} Video Modules • Self-Paced • Graded Quiz & Certificate`
    ),
    description: String(course.description || ''),
    descriptionHi: String(course.descriptionHi || ''),
    shortDescription: String(course.shortDescription || ''),
    shortDescriptionHi: String(course.shortDescriptionHi || ''),
    level: (course.level as CoursePublicDTO['level']) || 'All Levels',
    deliveryMode: (course.deliveryMode as CoursePublicDTO['deliveryMode']) || 'SELF_PACED',
    category: String(course.category || 'Vedic Astrology'),
    status: String(course.status || 'PUBLISHED'),
    isPublished: course.status === 'PUBLISHED' || Boolean(course.isPublished),
    isComingSoon: course.status === 'COMING_SOON' || Boolean(course.isComingSoon),
    acceptingEnrollments: course.acceptingEnrollments !== false,
    featured: Boolean(course.featured),
    badge: String(course.badge || 'Self-Paced Masterclass'),
    thumbnailUrl: String(course.thumbnailUrl || '/images/course-default.jpg'),
    durationWeeks: toNumber(course.durationWeeks, 12),
    totalClasses,
    classesPerWeek: toNumber(course.classesPerWeek, 2),
    priceInr: toNumber(course.priceInr, 5100),
    priceUsd: toNumber(course.priceUsd, 69),
    originalPriceInr: toNumber(course.originalPriceInr, 11000),
    originalPriceUsd: toNumber(course.originalPriceUsd, 129),
    passingScore: toNumber(course.passingScore, 70),
    certificateEnabled: course.certificateEnabled !== false,
    createdAt: toIsoString(course.createdAt),
    updatedAt: toIsoString(course.updatedAt),
    instructor,
    highlights: Array.isArray(course.highlights) && course.highlights.length > 0
      ? course.highlights.map(String)
      : DEFAULT_HIGHLIGHTS,
    prerequisites: Array.isArray(course.prerequisites) && course.prerequisites.length > 0
      ? course.prerequisites.map(String)
      : DEFAULT_PREREQUISITES,
    whatYouWillLearn: Array.isArray(course.whatYouWillLearn) && course.whatYouWillLearn.length > 0
      ? course.whatYouWillLearn.map(String)
      : DEFAULT_WHAT_YOU_WILL_LEARN,
    modules,
    quizzes,
    faqs: Array.isArray(course.faqs) && course.faqs.length > 0
      ? course.faqs.map((f: any) => ({ question: String(f.question || ''), answer: String(f.answer || '') }))
      : DEFAULT_FAQS,
    cohorts,
    enrollmentCount: toNumber(course.enrollmentCount || course._count?.enrollments, 0),
  };
}
