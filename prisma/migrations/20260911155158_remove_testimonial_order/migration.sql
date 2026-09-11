/*
  Warnings:

  - You are about to drop the column `order` on the `Testimonial` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Testimonial_published_order_idx";

-- AlterTable
ALTER TABLE "Testimonial" DROP COLUMN "order";

-- CreateIndex
CREATE INDEX "Testimonial_published_createdAt_idx" ON "Testimonial"("published", "createdAt");
