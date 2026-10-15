-- AlterEnum
BEGIN;
CREATE TYPE "PaymentProvider_new" AS ENUM ('UPI_QR', 'MANUAL_VERIFICATION', 'BANK_TRANSFER');
ALTER TABLE "payments" ALTER COLUMN "provider" TYPE "PaymentProvider_new" USING ("provider"::text::"PaymentProvider_new");
ALTER TYPE "PaymentProvider" RENAME TO "PaymentProvider_old";
ALTER TYPE "PaymentProvider_new" RENAME TO "PaymentProvider";
DROP TYPE "PaymentProvider_old";
COMMIT;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "course_id" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "screenshot_url" TEXT,
ADD COLUMN     "student_email" TEXT,
ADD COLUMN     "student_name" TEXT,
ADD COLUMN     "student_phone" TEXT,
ADD COLUMN     "verified_at" TIMESTAMP(3),
ADD COLUMN     "verified_by" TEXT,
ALTER COLUMN "provider" SET DEFAULT 'UPI_QR',
ALTER COLUMN "provider_reference" DROP NOT NULL;

-- CreateTable
CREATE TABLE "clerk_webhook_events" (
    "id" TEXT NOT NULL,
    "event_id" TEXT,
    "event_type" TEXT NOT NULL,
    "payload" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PROCESSED',
    "error_message" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clerk_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clerk_webhook_events_event_type_idx" ON "clerk_webhook_events"("event_type");

-- CreateIndex
CREATE INDEX "clerk_webhook_events_received_at_idx" ON "clerk_webhook_events"("received_at");

-- CreateIndex
CREATE INDEX "payments_course_id_idx" ON "payments"("course_id");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
