/*
  Warnings:

  - You are about to drop the column `featuredOrder` on the `Listing` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Listing_featuredOrder_key";

-- AlterTable
ALTER TABLE "Listing" DROP COLUMN "featuredOrder",
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false;
