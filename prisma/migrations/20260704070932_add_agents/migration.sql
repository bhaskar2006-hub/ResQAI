-- CreateEnum
CREATE TYPE "AgentType" AS ENUM ('ALLOCATOR', 'TRANSLATOR', 'FORECASTER', 'SEARCH_AND_RESCUE');

-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('ACTIVE', 'IDLE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'EXECUTED');

-- CreateTable
CREATE TABLE "Agent" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AgentType" NOT NULL,
    "status" "AgentStatus" NOT NULL DEFAULT 'ACTIVE',
    "endpointUrl" TEXT,
    "capabilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentAction" (
    "id" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "actionType" TEXT NOT NULL,
    "targetId" UUID,
    "details" JSONB NOT NULL,
    "status" "ActionStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "AgentAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agent_name_key" ON "Agent"("name");

-- AddForeignKey
ALTER TABLE "AgentAction" ADD CONSTRAINT "AgentAction_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
