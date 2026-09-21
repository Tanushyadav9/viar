export type UserRole = 'STUDENT' | 'ADMIN' | 'INSTRUCTOR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  timezone?: string;
  avatarUrl?: string;
  enrolledCohortIds: string[];
}

export interface CourseModule {
  id: string;
  moduleNumber: number;
  title: string;
  description: string;
  classCount: number;
  classNumbers: number[];
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  subtitle: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  durationWeeks: number;
  totalClasses: number;
  classesPerWeek: number;
  priceInr: number;
  priceUsd: number;
  originalPriceInr: number;
  originalPriceUsd: number;
  isPublished: boolean;
  featured: boolean;
  badge?: string;
  instructor: {
    name: string;
    title: string;
    bio: string;
    experienceYears: number;
    studentsTaught: number;
    avatarUrl: string;
    aapkaAstroUrl: string;
  };
  highlights: string[];
  prerequisites: string[];
  whatYouWillLearn: string[];
  modules: CourseModule[];
  faqs: { question: string; answer: string }[];
}

export type CohortStatus = 'UPCOMING' | 'ENROLLING' | 'IN_PROGRESS' | 'COMPLETED';

export interface Cohort {
  id: string;
  courseId: string;
  batchNumber: number;
  batchName: string;
  startDate: string; // ISO string
  endDate: string;   // ISO string
  scheduleDescription: string; // e.g. "Every Saturday & Sunday at 8:00 PM IST"
  scheduleTimeUtc: {
    dayOfWeek: number[]; // 0=Sun, 6=Sat
    hoursUtc: number;
    minutesUtc: number;
  };
  maxSeats: number;
  enrolledCount: number;
  status: CohortStatus;
  enrollmentDeadline: string;
}

export type MeetingPlatform = 'ZOOM' | 'GOOGLE_MEET';

export interface ClassResource {
  id: string;
  title: string;
  type: 'PDF' | 'CHART' | 'DOCUMENT' | 'AUDIO';
  url: string;
  size?: string;
}

export interface ClassRecording {
  id: string;
  videoUrl: string; // Embed or stream URL
  provider: 'YOUTUBE' | 'VIMEO' | 'BUNNY' | 'DIRECT';
  durationMinutes: number;
  recordedDate: string;
  notesMarkdown: string;
  keyTakeaways: string[];
  resources: ClassResource[];
}

export interface ScheduledClass {
  id: string;
  cohortId: string;
  classNumber: number;
  moduleNumber: number;
  title: string;
  subtitle: string;
  description: string;
  scheduledStartTime: string; // ISO 8601 UTC
  durationMinutes: number;
  meetingPlatform: MeetingPlatform;
  joinUrl: string;
  meetingId?: string;
  passcode?: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
  recording?: ClassRecording;
}

export interface TestQuestion {
  id: string;
  questionNumber: number;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  topic: string;
}

export interface FinalTest {
  id: string;
  cohortId: string;
  courseId: string;
  title: string;
  description: string;
  passingPercentage: number;
  durationMinutes: number;
  totalQuestions: number;
  questions: TestQuestion[];
}

export interface TestSubmission {
  id: string;
  testId: string;
  cohortId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  answers: Record<string, number>; // questionId -> selectedOptionIndex
  score: number;
  totalQuestions: number;
  scorePercentage: number;
  isPassed: boolean;
  submittedAt: string;
  certificateId?: string;
}

export interface Certificate {
  id: string;
  verificationCode: string; // e.g. "VIAR-2026-WIA-9842"
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  cohortBatchName: string;
  issueDate: string; // formatted date
  scorePercentage: number;
  grade: 'Distinction' | 'Merit' | 'Pass';
  instructorName: string;
  instructorTitle: string;
  signatureUrl?: string;
  verificationUrl: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  cohortId: string;
  enrolledAt: string;
  paymentStatus: 'PAID' | 'REFUNDED';
  paymentAmount: number;
  currency: 'INR' | 'USD';
  paymentMethod: string;
  paymentId: string;
}
