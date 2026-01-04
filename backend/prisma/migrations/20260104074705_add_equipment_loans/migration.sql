/*
  Warnings:

  - A unique constraint covering the columns `[rfid_tag]` on the table `equipment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "equipment" ADD COLUMN     "rfid_tag" VARCHAR(50);

-- CreateTable
CREATE TABLE "equipment_loans" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "borrowed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returned_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipment_loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_loan_items" (
    "id" TEXT NOT NULL,
    "loan_id" TEXT NOT NULL,
    "equipment_id" TEXT NOT NULL,
    "returned_at" TIMESTAMP(3),

    CONSTRAINT "equipment_loan_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "equipment_loans_user_id_idx" ON "equipment_loans"("user_id");

-- CreateIndex
CREATE INDEX "equipment_loans_status_idx" ON "equipment_loans"("status");

-- CreateIndex
CREATE INDEX "equipment_loans_borrowed_at_idx" ON "equipment_loans"("borrowed_at");

-- CreateIndex
CREATE INDEX "equipment_loan_items_loan_id_idx" ON "equipment_loan_items"("loan_id");

-- CreateIndex
CREATE INDEX "equipment_loan_items_equipment_id_idx" ON "equipment_loan_items"("equipment_id");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_loan_items_loan_id_equipment_id_key" ON "equipment_loan_items"("loan_id", "equipment_id");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_rfid_tag_key" ON "equipment"("rfid_tag");

-- AddForeignKey
ALTER TABLE "equipment_loans" ADD CONSTRAINT "equipment_loans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_loan_items" ADD CONSTRAINT "equipment_loan_items_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "equipment_loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_loan_items" ADD CONSTRAINT "equipment_loan_items_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
