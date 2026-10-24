-- CreateTable
CREATE TABLE "course_invitations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "cohort_id" TEXT,
    "invited_by" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "revoke_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_invitations_email_idx" ON "course_invitations"("email");
CREATE INDEX "course_invitations_status_idx" ON "course_invitations"("status");
CREATE INDEX "course_invitations_course_id_idx" ON "course_invitations"("course_id");
CREATE INDEX "course_invitations_cohort_id_idx" ON "course_invitations"("cohort_id");
CREATE INDEX "course_invitations_expires_at_idx" ON "course_invitations"("expires_at");

-- AddForeignKey
ALTER TABLE "course_invitations" ADD CONSTRAINT "course_invitations_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_invitations" ADD CONSTRAINT "course_invitations_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
