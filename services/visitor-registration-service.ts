import "server-only";

import type { VisitorCheckInResult, VisitorRegistrationInput } from "@/types/visitor";
import {
  createVisitorSessionExpiresAt,
  createVisitorSessionToken,
  hashVisitorSessionToken,
} from "@/lib/visitor-session";
import { createCheckedInVisitorRecord } from "@/repositories/visitor-repository";
import { verifySafetyAcknowledgmentVersion } from "@/services/safety-acknowledgment-service";
import { verifyPdpaConsentVersion } from "@/services/pdpa-consent-service";

export async function registerVisitor(
  input: VisitorRegistrationInput
): Promise<VisitorCheckInResult> {
  const now = new Date();
  const sessionToken = createVisitorSessionToken();
  const sessionTokenHash = hashVisitorSessionToken(sessionToken);
  const expiresAt = createVisitorSessionExpiresAt(now);

  const [safetyAcknowledgment, pdpaConsent] = await Promise.all([
    verifySafetyAcknowledgmentVersion(input.safetyAcknowledgmentVersionId),
    verifyPdpaConsentVersion(input.pdpaConsentVersionId),
  ]);

  const visitor = await createCheckedInVisitorRecord({
    visitor: {
      fullName: input.fullName,
      companyName: input.companyName,
      contactNumber: input.contactNumber,
      email: input.email,
      identificationNumber: input.identificationNumber,
      hasVehicle: input.hasVehicle,
      vehiclePlateNumber: input.hasVehicle ? input.vehiclePlateNumber : "",
      hostName: input.hostName,
      purposeOfVisit: input.purposeOfVisit,
      safetyAcknowledged: true,
      safetyAcknowledgedAt: now,
      safetyAcknowledgmentVersion: safetyAcknowledgment.version,
      safetyAcknowledgmentPolicy: {
        connect: {
          id: safetyAcknowledgment.id,
        },
      },
      pdpaConsent: true,
      pdpaConsentedAt: now,
      pdpaConsentVersion: pdpaConsent.version,
      pdpaConsentPolicy: {
        connect: {
          id: pdpaConsent.id,
        },
      },
      checkInAt: now,
      status: "CHECKED_IN",
    },
    sessionTokenHash,
    expiresAt,
    auditEventType: "VISITOR_CHECKED_IN",
    auditMetadata: {
      safetyAcknowledgment: {
        accepted: true,
        acceptedAt: now.toISOString(),
        version: safetyAcknowledgment.version,
        versionId: safetyAcknowledgment.id,
      },
      pdpaConsent: {
        accepted: true,
        acceptedAt: now.toISOString(),
        version: pdpaConsent.version,
        versionId: pdpaConsent.id,
      },
    },
  });

  return {
    visitorId: visitor.id,
    status: visitor.status,
    checkInAt: visitor.checkInAt,
    expiresAt,
    sessionToken,
  };
}
