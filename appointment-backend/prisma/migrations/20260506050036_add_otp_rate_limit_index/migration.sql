-- CreateIndex
CREATE INDEX "OtpVerification_target_type_createdAt_idx" ON "OtpVerification"("target", "type", "createdAt");
