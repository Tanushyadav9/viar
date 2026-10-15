-- AlterTable
ALTER TABLE "courses" ADD COLUMN "title_hi" TEXT;
ALTER TABLE "courses" ADD COLUMN "short_description_hi" TEXT;
ALTER TABLE "courses" ADD COLUMN "description_hi" TEXT;

-- AlterTable
ALTER TABLE "modules" ADD COLUMN "title_hi" TEXT;
ALTER TABLE "modules" ADD COLUMN "description_hi" TEXT;

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN "title_hi" TEXT;
ALTER TABLE "lessons" ADD COLUMN "description_hi" TEXT;
