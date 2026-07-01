ALTER TABLE "visitors"
ADD COLUMN "partySize" INTEGER NOT NULL DEFAULT 1;

CREATE INDEX "visitors_partySize_idx" ON "visitors"("partySize");
