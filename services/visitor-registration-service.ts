import "server-only";

import type { VisitorCheckInResult, VisitorRegistrationInput } from "@/types/visitor";
import {
  createVisitorSessionExpiresAt,
  createVisitorSessionToken,
  hashVisitorSessionToken,
} from "@/lib/visitor-session";
import { createCheckedInVisitorRecord } from "@/repositories/visitor-repository";
import { verifySafetyAcknowledgmentVersion } from "@/services/safety-acknowledgment-service";

export async function registerVisitor(
  input: VisitorRegistrationInput
): Promise<VisitorCheckInResult> {
  const now = new Date();
  const sessionToken = createVisitorSessionToken();
  const sessionTokenHash = hashVisitorSessionToken(sessionToken);
  const expiresAt = createVisitorSessionExpiresAt(now);
  const safetyAcknowledgment = await verifySafetyAcknowledgmentVersion(
    input.safetyAcknowledgmentVersionId
  );

  const visitor = await createCheckedInVisitorRecord({
    visitor: {
      fullName: input.fullName,
      companyName: input.companyName,
      contactNumber: input.contactNumber,
      email: input.email,
      identificationNumber: input.identificationNumber,
      partySize: input.partySize,
      hasVehicle: input.hasVehicle,
      vehiclePlateNumber: input.hasVehicle ? input.vehiclePlateNumber : "",
      department: input.department,
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
      checkInAt: now,
      status: "CHECKED_IN",
    },
    sessionTokenHash,
    expiresAt,
    auditEventType: "VISITOR_CHECKED_IN",
    auditMetadata: {
      partySize: input.partySize,
      safetyAcknowledgment: {
        accepted: true,
        acceptedAt: now.toISOString(),
        version: safetyAcknowledgment.version,
        versionId: safetyAcknowledgment.id,
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
