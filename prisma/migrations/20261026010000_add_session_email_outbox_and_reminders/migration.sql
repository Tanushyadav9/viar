-- AlterTable: Add minimum reschedule notice period to courses
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "minimum_reschedule_notice_hours" INTEGER DEFAULT 24;

-- AlterTable: Add reminder tracking timestamps to student_sessions
ALTER TABLE "student_sessions" ADD COLUMN IF NOT EXISTS "reminder_24h_sent_at" TIMESTAMP(3);
ALTER TABLE "student_sessions" ADD COLUMN IF NOT EXISTS "reminder_1h_sent_at" TIMESTAMP(3);

-- CreateTable: session_email_outbox
CREATE TABLE IF NOT EXISTS "session_email_outbox" (
    "id" TEXT NOT NULL,
    "session_id" TEXT,
    "recipient_email" TEXT NOT NULL,
    "recipient_name" TEXT,
    "email_type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "html_content" TEXT NOT NULL,
    "text_content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "next_attempt_at" TIMESTAMP(3),
    "last_error" TEXT,
    "sent_at" TIMESTAMP(3),
    "idempotency_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_email_outbox_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "session_email_outbox_idempotency_key_key" UNIQUE ("idempotency_key"),
    CONSTRAINT "session_email_outbox_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "student_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "session_email_outbox_status_idx" ON "session_email_outbox"("status");
CREATE INDEX IF NOT EXISTS "session_email_outbox_next_attempt_at_idx" ON "session_email_outbox"("next_attempt_at");
CREATE INDEX IF NOT EXISTS "session_email_outbox_session_id_idx" ON "session_email_outbox"("session_id");
CREATE INDEX IF NOT EXISTS "session_email_outbox_email_type_idx" ON "session_email_outbox"("email_type");
