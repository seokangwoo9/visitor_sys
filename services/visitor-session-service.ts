import "server-only";

import type {
  ActiveVisitorSession,
  VisitorFallbackCheckoutInput,
  VisitorFallbackCheckoutLookupResult,
  VisitorCheckoutResult,
  VisitorSessionCookieValue,
} from "@/types/visitor";
import { hashVisitorSessionToken } from "@/lib/visitor-session";
import {
  completeVisitorCheckout,
  createVisitorFallbackCheckoutAuditLog,
  expireVisitorSession,
  findVisitorsForFallbackCheckout,
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

export async function lookupFallbackCheckoutVisitor(
  input: VisitorFallbackCheckoutInput
): Promise<VisitorFallbackCheckoutLookupResult> {
  const now = new Date();
  const candidates = await findVisitorsForFallbackCheckout(
    input.visitorPassId,
    input.contactNumber
  );

  const activeCandidates = candidates.filter(
    (candidate) => candidate.status === "CHECKED_IN" && candidate.sessions.length > 0
  );

  if (activeCandidates.length > 1) {
    await createVisitorFallbackCheckoutAuditLog("VISITOR_FALLBACK_CHECKOUT_AMBIGUOUS", {
      reason: "multiple_active_matches",
    });
    return { status: "AMBIGUOUS" };
  }

  if (activeCandidates.length === 1) {
    const visitor = activeCandidates[0];
    const session = visitor.sessions[0];

    if (session.expiresAt <= now) {
      await expireVisitorSession(visitor.id, session.id, now);
      return { status: "EXPIRED" };
    }

    return {
      status: "FOUND",
      match: {
        visitorId: visitor.id,
        fullName: visitor.fullName,
        companyName: visitor.companyName,
        contactNumber: visitor.contactNumber,
        partySize: visitor.partySize,
        visitorPassId: visitor.visitorPassId,
        checkInAt: visitor.checkInAt,
        expiresAt: session.expiresAt,
      },
    };
  }

  if (candidates.some((candidate) => candidate.status === "CHECKED_OUT")) {
    await createVisitorFallbackCheckoutAuditLog("VISITOR_FALLBACK_CHECKOUT_ALREADY_COMPLETED", {
      reason: "already_checked_out",
    });
    return { status: "ALREADY_CHECKED_OUT" };
  }

  if (candidates.some((candidate) => candidate.status === "EXPIRED")) {
    return { status: "EXPIRED" };
  }

  await createVisitorFallbackCheckoutAuditLog("VISITOR_FALLBACK_CHECKOUT_NOT_FOUND", {
    reason: "no_active_match",
  });
  return { status: "NOT_FOUND" };
}

export async function checkOutFallbackVisitor(
  input: VisitorFallbackCheckoutInput
): Promise<VisitorCheckoutResult | VisitorFallbackCheckoutLookupResult> {
  const lookupResult = await lookupFallbackCheckoutVisitor(input);

  if (lookupResult.status !== "FOUND" || !lookupResult.match) {
    return lookupResult;
  }

  const now = new Date();
  const candidates = await findVisitorsForFallbackCheckout(
    input.visitorPassId,
    input.contactNumber
  );
  const visitor = candidates.find(
    (candidate) => candidate.id === lookupResult.match?.visitorId
  );
  const session = visitor?.sessions[0];

  if (!visitor || !session || visitor.status !== "CHECKED_IN") {
    return { status: "NOT_FOUND" };
  }

  if (session.expiresAt <= now) {
    await expireVisitorSession(visitor.id, session.id, now);
    return { status: "EXPIRED" };
  }

  const checkedOutVisitor = await completeVisitorCheckout(
    visitor.id,
    session.id,
    now,
    undefined,
    "VISITOR_FALLBACK_CHECKED_OUT",
    {
      method: "visitor_pass_id_contact_number",
    }
  );

  return {
    visitorId: checkedOutVisitor.id,
    status: checkedOutVisitor.status,
    checkInAt: checkedOutVisitor.checkInAt,
    checkOutAt: checkedOutVisitor.checkOutAt ?? now,
  };
}
