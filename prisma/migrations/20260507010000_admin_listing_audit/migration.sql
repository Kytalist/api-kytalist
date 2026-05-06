-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('draft', 'published', 'archived');

-- AlterTable
ALTER TABLE "Listing"
    ADD COLUMN "trendingOrder" INTEGER,
    ADD COLUMN "status" "ListingStatus" NOT NULL DEFAULT 'published',
    ADD COLUMN "publishedAt" TIMESTAMP(3),
    ADD COLUMN "authorId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Listing_trendingOrder_key" ON "Listing"("trendingOrder");

-- CreateIndex
CREATE INDEX "Listing_status_idx" ON "Listing"("status");

-- CreateIndex
CREATE INDEX "Listing_trendingOrder_idx" ON "Listing"("trendingOrder");

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
