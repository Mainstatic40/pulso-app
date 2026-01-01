/*
  Warnings:

  - Added the required column `event_type` to the `events` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('civic', 'church', 'yearbook', 'congress');

-- AlterTable
ALTER TABLE "equipment_assignments" ADD COLUMN     "event_shift_id" TEXT;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "afternoon_end_time" VARCHAR(5),
ADD COLUMN     "afternoon_start_time" VARCHAR(5),
ADD COLUMN     "event_type" "EventType" NOT NULL,
ADD COLUMN     "morning_end_time" VARCHAR(5),
ADD COLUMN     "morning_start_time" VARCHAR(5),
ADD COLUMN     "use_preset_equipment" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "event_days" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_shifts" (
    "id" TEXT NOT NULL,
    "event_day_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "start_time" VARCHAR(5) NOT NULL,
    "end_time" VARCHAR(5) NOT NULL,
    "shift_type" VARCHAR(20),
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_days_event_id_idx" ON "event_days"("event_id");

-- CreateIndex
CREATE INDEX "event_days_date_idx" ON "event_days"("date");

-- CreateIndex
CREATE UNIQUE INDEX "event_days_event_id_date_key" ON "event_days"("event_id", "date");

-- CreateIndex
CREATE INDEX "event_shifts_event_day_id_idx" ON "event_shifts"("event_day_id");

-- CreateIndex
CREATE INDEX "event_shifts_user_id_idx" ON "event_shifts"("user_id");

-- CreateIndex
CREATE INDEX "equipment_assignments_event_shift_id_idx" ON "equipment_assignments"("event_shift_id");

-- CreateIndex
CREATE INDEX "events_event_type_idx" ON "events"("event_type");

-- AddForeignKey
ALTER TABLE "event_days" ADD CONSTRAINT "event_days_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_shifts" ADD CONSTRAINT "event_shifts_event_day_id_fkey" FOREIGN KEY ("event_day_id") REFERENCES "event_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_shifts" ADD CONSTRAINT "event_shifts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_assignments" ADD CONSTRAINT "equipment_assignments_event_shift_id_fkey" FOREIGN KEY ("event_shift_id") REFERENCES "event_shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
