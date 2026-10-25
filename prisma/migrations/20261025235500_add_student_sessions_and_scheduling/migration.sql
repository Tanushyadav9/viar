-- AlterTable: Add optional per-course settings (empty by default)
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "sessions_included_per_student" INTEGER;
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "maximum_active_students" INTEGER;

-- CreateTable: student_sessions
CREATE TABLE IF NOT EXISTS "student_sessions" (
    "id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "module_id" TEXT,
    "lesson_id" TEXT,
    "title" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "meeting_link" TEXT,
    "meeting_platform" TEXT NOT NULL DEFAULT 'GOOGLE_MEET',
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "private_notes" TEXT,
    "shared_notes" TEXT,
    "homework" TEXT,
    "recording_url" TEXT,
    "created_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_sessions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "student_sessions_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "student_sessions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "student_sessions_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "student_sessions_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "student_sessions_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "student_sessions_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable: session_requests
CREATE TABLE IF NOT EXISTS "session_requests" (
    "id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "course_id" TEXT,
    "student_session_id" TEXT,
    "request_type" TEXT NOT NULL DEFAULT 'INITIAL',
    "message" TEXT,
    "preferred_windows" JSONB NOT NULL DEFAULT '[]',
    "reschedule_reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "resolved_at" TIMESTAMP(3),
    "resolved_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_requests_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "session_requests_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "session_requests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "session_requests_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "session_requests_student_session_id_fkey" FOREIGN KEY ("student_session_id") REFERENCES "student_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable: owner_working_hours
CREATE TABLE IF NOT EXISTS "owner_working_hours" (
    "id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "slot_duration_minutes" INTEGER NOT NULL DEFAULT 60,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "owner_working_hours_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "owner_working_hours_day_of_week_key" UNIQUE ("day_of_week")
);

-- CreateTable: owner_blocked_dates
CREATE TABLE IF NOT EXISTS "owner_blocked_dates" (
    "id" TEXT NOT NULL,
    "blocked_date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "is_full_day" BOOLEAN NOT NULL DEFAULT true,
    "start_time" TEXT,
    "end_time" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "owner_blocked_dates_pkey" PRIMARY KEY ("id")
);

-- CreateTable: session_history_logs
CREATE TABLE IF NOT EXISTS "session_history_logs" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "previous_status" TEXT,
    "new_status" TEXT,
    "notes" TEXT,
    "change_summary" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_history_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "session_history_logs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "student_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "session_history_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndexes
CREATE INDEX IF NOT EXISTS "student_sessions_enrollment_id_idx" ON "student_sessions"("enrollment_id");
CREATE INDEX IF NOT EXISTS "student_sessions_student_id_idx" ON "student_sessions"("student_id");
CREATE INDEX IF NOT EXISTS "student_sessions_course_id_idx" ON "student_sessions"("course_id");
CREATE INDEX IF NOT EXISTS "student_sessions_start_time_idx" ON "student_sessions"("start_time");
CREATE INDEX IF NOT EXISTS "student_sessions_status_idx" ON "student_sessions"("status");

CREATE INDEX IF NOT EXISTS "session_requests_enrollment_id_idx" ON "session_requests"("enrollment_id");
CREATE INDEX IF NOT EXISTS "session_requests_student_id_idx" ON "session_requests"("student_id");
CREATE INDEX IF NOT EXISTS "session_requests_student_session_id_idx" ON "session_requests"("student_session_id");
CREATE INDEX IF NOT EXISTS "session_requests_status_idx" ON "session_requests"("status");

CREATE INDEX IF NOT EXISTS "owner_blocked_dates_blocked_date_idx" ON "owner_blocked_dates"("blocked_date");

CREATE INDEX IF NOT EXISTS "session_history_logs_session_id_idx" ON "session_history_logs"("session_id");
CREATE INDEX IF NOT EXISTS "session_history_logs_actor_user_id_idx" ON "session_history_logs"("actor_user_id");
CREATE INDEX IF NOT EXISTS "session_history_logs_created_at_idx" ON "session_history_logs"("created_at");
