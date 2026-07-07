-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'HOSPITAL';
ALTER TYPE "Role" ADD VALUE 'VOLUNTEER';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hospitalId" UUID,
ADD COLUMN     "resourceId" UUID;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE SET NULL ON UPDATE CASCADE;
