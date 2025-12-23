/*
  Warnings:

  - You are about to drop the column `google_calendar_id` on the `events` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "EquipmentCategory" AS ENUM ('camera', 'lens', 'adapter', 'sd_card');

-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('available', 'in_use', 'maintenance');

-- AlterTable
ALTER TABLE "events" DROP COLUMN "google_calendar_id";

-- CreateTable
CREATE TABLE "equipment" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "category" "EquipmentCategory" NOT NULL,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'available',
    "description" TEXT,
    "serial_number" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_assignments" (
    "id" TEXT NOT NULL,
    "equipment_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_id" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipment_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "equipment_category_idx" ON "equipment"("category");

-- CreateIndex
CREATE INDEX "equipment_status_idx" ON "equipment"("status");

-- CreateIndex
CREATE INDEX "equipment_is_active_idx" ON "equipment"("is_active");

-- CreateIndex
CREATE INDEX "equipment_assignments_equipment_id_idx" ON "equipment_assignments"("equipment_id");

-- CreateIndex
CREATE INDEX "equipment_assignments_user_id_idx" ON "equipment_assignments"("user_id");

-- CreateIndex
CREATE INDEX "equipment_assignments_event_id_idx" ON "equipment_assignments"("event_id");

-- CreateIndex
CREATE INDEX "equipment_assignments_start_time_idx" ON "equipment_assignments"("start_time");

-- AddForeignKey
ALTER TABLE "equipment_assignments" ADD CONSTRAINT "equipment_assignments_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_assignments" ADD CONSTRAINT "equipment_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_assignments" ADD CONSTRAINT "equipment_assignments_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_assignments" ADD CONSTRAINT "equipment_assignments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
