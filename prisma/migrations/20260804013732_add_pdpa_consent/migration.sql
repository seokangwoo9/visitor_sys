-- AlterTable
ALTER TABLE "visitors" ADD COLUMN     "pdpaConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pdpaConsentVersion" INTEGER,
ADD COLUMN     "pdpaConsentVersionId" UUID,
ADD COLUMN     "pdpaConsentedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "pdpa_consent_versions" (
    "id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "publishedByAdminId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pdpa_consent_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pdpa_consent_versions_version_key" ON "pdpa_consent_versions"("version");

-- CreateIndex
CREATE INDEX "pdpa_consent_versions_isActive_idx" ON "pdpa_consent_versions"("isActive");

-- CreateIndex
CREATE INDEX "pdpa_consent_versions_createdAt_idx" ON "pdpa_consent_versions"("createdAt");

-- CreateIndex
CREATE INDEX "pdpa_consent_versions_publishedByAdminId_idx" ON "pdpa_consent_versions"("publishedByAdminId");

-- CreateIndex
CREATE INDEX "visitors_pdpaConsent_idx" ON "visitors"("pdpaConsent");

-- CreateIndex
CREATE INDEX "visitors_pdpaConsentVersionId_idx" ON "visitors"("pdpaConsentVersionId");

-- AddForeignKey
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_pdpaConsentVersionId_fkey" FOREIGN KEY ("pdpaConsentVersionId") REFERENCES "pdpa_consent_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
