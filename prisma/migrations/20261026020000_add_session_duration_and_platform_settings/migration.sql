-- AlterTable: Add default session duration and meeting platform to courses
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "default_session_duration_minutes" INTEGER DEFAULT 60;
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "default_meeting_platform" TEXT DEFAULT 'GOOGLE_MEET';
