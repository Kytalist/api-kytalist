-- CreateEnum
CREATE TYPE "ListingCategory" AS ENUM ('activity', 'camp', 'internship');

-- CreateEnum
CREATE TYPE "ExtracurricularType" AS ENUM ('Competition', 'Research', 'Program', 'Club', 'Volunteer', 'Leadership', 'Arts', 'STEM');

-- CreateEnum
CREATE TYPE "CostOption" AS ENUM ('Free', 'Paid', 'Stipend');

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "org" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "category" "ListingCategory" NOT NULL,
    "badge" TEXT NOT NULL,
    "footer" TEXT NOT NULL,
    "deadline" TEXT,
    "type" "ExtracurricularType",
    "cost" "CostOption",
    "grades" INTEGER[],
    "tags" TEXT[],
    "keywords" TEXT NOT NULL DEFAULT '',
    "deadlineAt" TIMESTAMP(3),
    "featuredOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Listing_featuredOrder_key" ON "Listing"("featuredOrder");

-- CreateIndex
CREATE INDEX "Listing_category_idx" ON "Listing"("category");

-- CreateIndex
CREATE INDEX "Listing_region_idx" ON "Listing"("region");

-- CreateIndex
CREATE INDEX "Listing_createdAt_idx" ON "Listing"("createdAt");
