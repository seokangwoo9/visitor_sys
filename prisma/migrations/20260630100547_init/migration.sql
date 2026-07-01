-- CreateEnum
CREATE TYPE "VisitorStatus" AS ENUM ('PENDING', 'CHECKED_IN', 'CHECKED_OUT', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AuditActorType" AS ENUM ('VISITOR', 'ADMIN', 'SYSTEM');

-- CreateTable
CREATE TABLE "visitors" (
    "id" UUID NOT NULL,
    "fullName" VARCHAR(200) NOT NULL,
    "companyName" VARCHAR(200) NOT NULL,
    "contactNumber" VARCHAR(50) NOT NULL,
    "email" VARCHAR(320),
    "identificationNumber" VARCHAR(100),
    "hostName" VARCHAR(200) NOT NULL,
    "purposeOfVisit" TEXT NOT NULL,
    "checkInAt" TIMESTAMP(3) NOT NULL,
    "checkOutAt" TIMESTAMP(3),
    "status" "VisitorStatus" NOT NULL DEFAULT 'CHECKED_IN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitor_sessions" (
    "id" UUID NOT NULL,
    "visitorId" UUID NOT NULL,
    "sessionTokenHash" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "destroyedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visitor_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" UUID NOT NULL,
    "key" VARCHAR(120) NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "eventType" VARCHAR(120) NOT NULL,
    "actorType" "AuditActorType" NOT NULL,
    "actorId" UUID,
    "visitorId" UUID,
    "adminId" UUID,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "visitors_status_idx" ON "visitors"("status");

-- CreateIndex
CREATE INDEX "visitors_checkInAt_idx" ON "visitors"("checkInAt");

-- CreateIndex
CREATE INDEX "visitors_checkOutAt_idx" ON "visitors"("checkOutAt");

-- CreateIndex
CREATE UNIQUE INDEX "visitor_sessions_sessionTokenHash_key" ON "visitor_sessions"("sessionTokenHash");

-- CreateIndex
CREATE INDEX "visitor_sessions_visitorId_idx" ON "visitor_sessions"("visitorId");

-- CreateIndex
CREATE INDEX "visitor_sessions_expiresAt_idx" ON "visitor_sessions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE INDEX "admins_isActive_idx" ON "admins"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "audit_logs_eventType_idx" ON "audit_logs"("eventType");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_actorType_idx" ON "audit_logs"("actorType");

-- CreateIndex
CREATE INDEX "audit_logs_visitorId_idx" ON "audit_logs"("visitorId");

-- CreateIndex
CREATE INDEX "audit_logs_adminId_idx" ON "audit_logs"("adminId");

-- AddForeignKey
ALTER TABLE "visitor_sessions" ADD CONSTRAINT "visitor_sessions_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "visitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "visitors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
