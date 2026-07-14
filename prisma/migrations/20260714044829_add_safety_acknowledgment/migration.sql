-- AlterTable
ALTER TABLE "visitors" ADD COLUMN     "safetyAcknowledged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "safetyAcknowledgedAt" TIMESTAMP(3),
ADD COLUMN     "safetyAcknowledgmentVersion" INTEGER,
ADD COLUMN     "safetyAcknowledgmentVersionId" UUID;

-- CreateTable
CREATE TABLE "safety_acknowledgment_versions" (
    "id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "publishedByAdminId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "safety_acknowledgment_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "safety_acknowledgment_versions_version_key" ON "safety_acknowledgment_versions"("version");

-- CreateIndex
CREATE INDEX "safety_acknowledgment_versions_isActive_idx" ON "safety_acknowledgment_versions"("isActive");

-- CreateIndex
CREATE INDEX "safety_acknowledgment_versions_createdAt_idx" ON "safety_acknowledgment_versions"("createdAt");

-- CreateIndex
CREATE INDEX "safety_acknowledgment_versions_publishedByAdminId_idx" ON "safety_acknowledgment_versions"("publishedByAdminId");

-- CreateIndex
CREATE INDEX "visitors_safetyAcknowledged_idx" ON "visitors"("safetyAcknowledged");

-- CreateIndex
CREATE INDEX "visitors_safetyAcknowledgmentVersionId_idx" ON "visitors"("safetyAcknowledgmentVersionId");

-- AddForeignKey
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_safetyAcknowledgmentVersionId_fkey" FOREIGN KEY ("safetyAcknowledgmentVersionId") REFERENCES "safety_acknowledgment_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
