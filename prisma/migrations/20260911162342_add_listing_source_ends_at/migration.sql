-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "endsAt" TIMESTAMP(3),
ADD COLUMN     "source" TEXT;

-- CreateIndex
CREATE INDEX "Listing_source_endsAt_idx" ON "Listing"("source", "endsAt");
