-- CreateIndex
CREATE INDEX "visitors_visitorPassId_idx" ON "visitors"("visitorPassId");

-- CreateIndex
CREATE INDEX "visitors_contactNumber_idx" ON "visitors"("contactNumber");

-- CreateIndex
CREATE INDEX "visitors_visitorPassId_contactNumber_status_idx" ON "visitors"("visitorPassId", "contactNumber", "status");
