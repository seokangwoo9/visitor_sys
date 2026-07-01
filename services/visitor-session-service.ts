import "server-only";

import type {
  ActiveVisitorSession,
  VisitorCheckoutResult,
  VisitorSessionCookieValue,
} from "@/types/visitor";
import { hashVisitorSessionToken } from "@/lib/visitor-session";
import {
  completeVisitorCheckout,
  expireVisitorSession,
  findVisitorSessionByHash,
} from "@/repositories/visitor-repository";

export async function getActiveVisitorSession(
  cookieValue: VisitorSessionCookieValue | null
): Promise<ActiveVisitorSession | null> {
  if (!cookieValue) {
    return null;
  }

  const sessionTokenHash = hashVisitorSessionToken(cookieValue.sessionToken);
  const sessionRecord = await findVisitorSessionByHash(
    cookieValue.visitorId,
    sessionTokenHash
  );

  if (!sessionRecord) {
    return null;
  }

  const now = new Date();

  if (sessionRecord.expiresAt <= now) {
    await expireVisitorSession(sessionRecord.visitorId, sessionRecord.id, now);
    return null;
  }

  if (sessionRecord.visitor.status !== "CHECKED_IN") {
    return null;
  }

  return {
    visitorId: sessionRecord.visitor.id,
    fullName: sessionRecord.visitor.fullName,
    companyName: sessionRecord.visitor.companyName,
    contactNumber: sessionRecord.visitor.contactNumber,
    email: sessionRecord.visitor.email,
    identificationNumber: sessionRecord.visitor.identificationNumber,
    partySize: sessionRecord.visitor.partySize,
    hasVehicle: sessionRecord.visitor.hasVehicle,
    vehiclePlateNumber: sessionRecord.visitor.vehiclePlateNumber,
    department: sessionRecord.visitor.department,
    visitorPassId: sessionRecord.visitor.visitorPassId,
    hostName: sessionRecord.visitor.hostName,
    purposeOfVisit: sessionRecord.visitor.purposeOfVisit,
    checkInAt: sessionRecord.visitor.checkInAt,
    checkOutAt: sessionRecord.visitor.checkOutAt,
    status: sessionRecord.visitor.status,
    expiresAt: sessionRecord.expiresAt,
  };
}

export async function checkOutVisitor(
  cookieValue: VisitorSessionCookieValue | null
): Promise<VisitorCheckoutResult | null> {
  if (!cookieValue) {
    return null;
  }

  const sessionTokenHash = hashVisitorSessionToken(cookieValue.sessionToken);
  const sessionRecord = await findVisitorSessionByHash(
    cookieValue.visitorId,
    sessionTokenHash
  );

  if (!sessionRecord) {
    return null;
  }

  const now = new Date();

  if (sessionRecord.expiresAt <= now) {
    await expireVisitorSession(sessionRecord.visitorId, sessionRecord.id, now);
    return null;
  }

  if (sessionRecord.visitor.status !== "CHECKED_IN") {
    return null;
  }

  const visitor = await completeVisitorCheckout(
    sessionRecord.visitorId,
    sessionRecord.id,
    now
  );

  return {
    visitorId: visitor.id,
    status: visitor.status,
    checkInAt: visitor.checkInAt,
    checkOutAt: visitor.checkOutAt ?? now,
  };
}
