-- CreateTable
CREATE TABLE IF NOT EXISTS "one_on_one_sessions" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "course_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "duration_minutes" INTEGER NOT NULL DEFAULT 60,
    "meeting_platform" TEXT NOT NULL DEFAULT 'GOOGLE_MEET',
    "meeting_link" TEXT,
    "meeting_id" TEXT,
    "passcode" TEXT,
    "notes" TEXT,
    "taught_record" TEXT,
    "homework" TEXT,
    "recording_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "one_on_one_sessions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "one_on_one_sessions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "one_on_one_sessions_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "one_on_one_sessions_student_id_idx" ON "one_on_one_sessions"("student_id");
CREATE INDEX IF NOT EXISTS "one_on_one_sessions_scheduled_at_idx" ON "one_on_one_sessions"("scheduled_at");
CREATE INDEX IF NOT EXISTS "one_on_one_sessions_status_idx" ON "one_on_one_sessions"("status");
