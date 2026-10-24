-- AlterTable
ALTER TABLE "modules" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'PUBLISHED';

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'PUBLISHED';
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "is_external_video" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "external_video_url" TEXT;
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "notes_markdown" TEXT;
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "duration_minutes" INTEGER DEFAULT 60;
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "meeting_platform" "MeetingPlatform" DEFAULT 'GOOGLE_MEET';
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "agenda" TEXT;
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "recording_url" TEXT;
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "recording_stream_id" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "modules_status_idx" ON "modules"("status");
CREATE INDEX IF NOT EXISTS "lessons_status_idx" ON "lessons"("status");
