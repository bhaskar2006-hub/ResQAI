-- CreateEnum
CREATE TYPE "SupplyType" AS ENUM ('FOOD', 'WATER', 'MEDICINES', 'TENTS', 'BLANKETS');

-- AlterTable
ALTER TABLE "Hospital" ADD COLUMN     "ambulances" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "district" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "generalBeds" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "icuBeds" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "state" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Available';

-- AlterTable
ALTER TABLE "Shelter" ADD COLUMN     "district" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "NGO" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "focus" TEXT NOT NULL,
    "volunteers" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "NGO_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" UUID NOT NULL,
    "district" TEXT NOT NULL,
    "foodKits" INTEGER NOT NULL,
    "water" INTEGER NOT NULL,
    "medicine" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernmentOffice" (
    "id" UUID NOT NULL,
    "department" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "officer" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "GovernmentOffice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FireStation" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "trucks" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "FireStation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supply" (
    "id" UUID NOT NULL,
    "type" "SupplyType" NOT NULL,
    "district" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Available',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Supply_pkey" PRIMARY KEY ("id")
);
