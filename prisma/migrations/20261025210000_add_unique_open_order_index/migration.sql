-- Migration: Add partial unique index to enforce at most one open order per user and course
-- An open order is either PENDING_PAYMENT or PAYMENT_CLAIMED

-- Clean up any legacy duplicate open orders if any exist by marking older duplicates EXPIRED
UPDATE "orders"
SET "status" = 'EXPIRED'
WHERE "id" IN (
  SELECT "id" FROM (
    SELECT "id",
           ROW_NUMBER() OVER (
             PARTITION BY "user_id", "course_id"
             ORDER BY "created_at" DESC
           ) as rn
    FROM "orders"
    WHERE "status" IN ('PENDING_PAYMENT', 'PAYMENT_CLAIMED')
  ) sub
  WHERE sub.rn > 1
);

-- Partial unique index: allows only one open order per user and course
CREATE UNIQUE INDEX IF NOT EXISTS "unique_open_order_per_user_course"
ON "orders" ("user_id", "course_id")
WHERE "status" IN ('PENDING_PAYMENT', 'PAYMENT_CLAIMED');
