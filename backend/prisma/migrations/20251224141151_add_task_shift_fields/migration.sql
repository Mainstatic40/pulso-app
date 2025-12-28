-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "afternoon_end_time" VARCHAR(5),
ADD COLUMN     "afternoon_start_time" VARCHAR(5),
ADD COLUMN     "execution_date" DATE,
ADD COLUMN     "morning_end_time" VARCHAR(5),
ADD COLUMN     "morning_start_time" VARCHAR(5),
ADD COLUMN     "shift" VARCHAR(20);

-- CreateIndex
CREATE INDEX "tasks_execution_date_idx" ON "tasks"("execution_date");
