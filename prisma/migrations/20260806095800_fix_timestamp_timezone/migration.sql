-- Fix timestamp columns to use TIMESTAMPTZ (timestamp with timezone)
-- This prevents timezone interpretation issues where UTC timestamps are incorrectly read as local time

-- Visitors table
ALTER TABLE "visitors" ALTER COLUMN "checkInAt" TYPE TIMESTAMPTZ(3) USING "checkInAt" AT TIME ZONE 'UTC';
ALTER TABLE "visitors" ALTER COLUMN "checkOutAt" TYPE TIMESTAMPTZ(3) USING "checkOutAt" AT TIME ZONE 'UTC';
ALTER TABLE "visitors" ALTER COLUMN "safetyAcknowledgedAt" TYPE TIMESTAMPTZ(3) USING "safetyAcknowledgedAt" AT TIME ZONE 'UTC';
ALTER TABLE "visitors" ALTER COLUMN "pdpaConsentedAt" TYPE TIMESTAMPTZ(3) USING "pdpaConsentedAt" AT TIME ZONE 'UTC';
ALTER TABLE "visitors" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "visitors" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- Visitor sessions table
ALTER TABLE "visitor_sessions" ALTER COLUMN "expiresAt" TYPE TIMESTAMPTZ(3) USING "expiresAt" AT TIME ZONE 'UTC';
ALTER TABLE "visitor_sessions" ALTER COLUMN "revokedAt" TYPE TIMESTAMPTZ(3) USING "revokedAt" AT TIME ZONE 'UTC';
ALTER TABLE "visitor_sessions" ALTER COLUMN "destroyedAt" TYPE TIMESTAMPTZ(3) USING "destroyedAt" AT TIME ZONE 'UTC';
ALTER TABLE "visitor_sessions" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "visitor_sessions" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- Admins table
ALTER TABLE "admins" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "admins" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- System settings table
ALTER TABLE "system_settings" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "system_settings" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- Audit logs table
ALTER TABLE "audit_logs" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';

-- Better Auth tables
ALTER TABLE "users" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "users" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE "sessions" ALTER COLUMN "expiresAt" TYPE TIMESTAMPTZ(3) USING "expiresAt" AT TIME ZONE 'UTC';
ALTER TABLE "sessions" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "sessions" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE "accounts" ALTER COLUMN "accessTokenExpiresAt" TYPE TIMESTAMPTZ(3) USING "accessTokenExpiresAt" AT TIME ZONE 'UTC';
ALTER TABLE "accounts" ALTER COLUMN "refreshTokenExpiresAt" TYPE TIMESTAMPTZ(3) USING "refreshTokenExpiresAt" AT TIME ZONE 'UTC';
ALTER TABLE "accounts" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "accounts" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE "verifications" ALTER COLUMN "expiresAt" TYPE TIMESTAMPTZ(3) USING "expiresAt" AT TIME ZONE 'UTC';
ALTER TABLE "verifications" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "verifications" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- Safety acknowledgment table
ALTER TABLE "safety_acknowledgment_versions" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "safety_acknowledgment_versions" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- PDPA consent table
ALTER TABLE "pdpa_consent_versions" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "pdpa_consent_versions" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';
