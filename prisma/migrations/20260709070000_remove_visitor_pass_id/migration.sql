-- Drop old pass-based lookup indexes before removing the field.
DROP INDEX IF EXISTS "visitors_visitorPassId_contactNumber_status_idx";
DROP INDEX IF EXISTS "visitors_visitorPassId_idx";

-- Primary check-out search uses phone number and must resolve to one active visit.
CREATE INDEX "visitors_contactNumber_status_idx" ON "visitors"("contactNumber", "status");

ALTER TABLE "visitors" DROP COLUMN "visitorPassId";
