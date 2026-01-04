-- CreateTable
CREATE TABLE "pending_rfids" (
    "id" TEXT NOT NULL,
    "rfid_tag" VARCHAR(50) NOT NULL,
    "scanned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" VARCHAR(255),

    CONSTRAINT "pending_rfids_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pending_rfids_rfid_tag_key" ON "pending_rfids"("rfid_tag");

-- CreateIndex
CREATE INDEX "pending_rfids_scanned_at_idx" ON "pending_rfids"("scanned_at");
