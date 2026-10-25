export interface OneOnOneSessionRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  courseId?: string | null;
  courseTitle?: string | null;
  title: string;
  description?: string | null;
  scheduledAt: string; // ISO String
  durationMinutes: number;
  meetingPlatform: string;
  meetingLink?: string | null;
  meetingId?: string | null;
  passcode?: string | null;
  notes?: string | null; // Pre-class instructions
  taughtRecord?: string | null; // Post-class record of what was taught
  homework?: string | null; // Assigned exercises/charts
  recordingUrl?: string | null;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}
