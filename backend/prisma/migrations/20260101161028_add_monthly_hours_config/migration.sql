-- CreateTable
CREATE TABLE "monthly_hours_config" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "target_hours" DECIMAL(5,2) NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_hours_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "monthly_hours_config_year_idx" ON "monthly_hours_config"("year");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_hours_config_year_month_key" ON "monthly_hours_config"("year", "month");

-- AddForeignKey
ALTER TABLE "monthly_hours_config" ADD CONSTRAINT "monthly_hours_config_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
