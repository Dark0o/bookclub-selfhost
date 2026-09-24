/*
  Warnings:

  - You are about to drop the column `bookId` on the `Club` table. All the data in the column will be lost.
  - You are about to drop the `Book` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `bookAuthor` to the `Club` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bookTitle` to the `Club` table without a default value. This is not possible if the table is not empty.
  - Added the required column `numberOfWeeks` to the `Club` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPages` to the `Club` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Club" DROP CONSTRAINT "Club_bookId_fkey";

-- DropIndex
DROP INDEX "Club_bookId_idx";

-- AlterTable
ALTER TABLE "Club" DROP COLUMN "bookId",
ADD COLUMN     "bookAuthor" TEXT NOT NULL,
ADD COLUMN     "bookTitle" TEXT NOT NULL,
ADD COLUMN     "numberOfWeeks" INTEGER NOT NULL,
ADD COLUMN     "totalPages" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ReadingPhase" ADD COLUMN     "description" TEXT,
ADD COLUMN     "isOpen" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "unlockDate" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Verification" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "Book";

-- CreateTable
CREATE TABLE "MemberCard" (
    "id" TEXT NOT NULL,
    "currentPage" INTEGER NOT NULL DEFAULT 0,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,

    CONSTRAINT "MemberCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MemberCard_phaseId_idx" ON "MemberCard"("phaseId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberCard_userId_phaseId_key" ON "MemberCard"("userId", "phaseId");

-- AddForeignKey
ALTER TABLE "MemberCard" ADD CONSTRAINT "MemberCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberCard" ADD CONSTRAINT "MemberCard_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "ReadingPhase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
