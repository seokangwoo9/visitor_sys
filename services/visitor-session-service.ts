import "server-only";

import type {
  ActiveVisitorSession,
  VisitorCheckoutSearchInput,
  VisitorCheckoutSearchLookupResult,
  VisitorCheckoutResult,
  VisitorSessionCookieValue,
} from "@/types/visitor";
import { hashVisitorSessionToken } from "@/lib/visitor-session";
import {
  completeVisitorCheckout,
  createVisitorCheckoutSearchAuditLog,
  expireVisitorSession,
  findVisitorsForCheckoutSearch,
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
    hostName: sessionRecord.visitor.hostName,
    purposeOfVisit: sessionRecord.visitor.purposeOfVisit,
    checkInAt: sessionRecord.visitor.checkInAt,
    checkOutAt: sessionRecord.visitor.checkOutAt,
    status: sessionRecord.visitor.status,
    expiresAt: sessionRecord.expiresAt,
  };
}

export async function lookupCheckoutSearchVisitor(
  input: VisitorCheckoutSearchInput
): Promise<VisitorCheckoutSearchLookupResult> {
  const now = new Date();
  const candidates = await findVisitorsForCheckoutSearch(input.contactNumber);

  const activeCandidates = candidates.filter(
    (candidate) => candidate.status === "CHECKED_IN" && candidate.sessions.length > 0
  );
  const validActiveCandidates: typeof activeCandidates = [];
  let expiredActiveCount = 0;

  for (const visitor of activeCandidates) {
    const session = visitor.sessions[0];

    if (session.expiresAt <= now) {
      expiredActiveCount += 1;
      await expireVisitorSession(visitor.id, session.id, now);
    } else {
      validActiveCandidates.push(visitor);
    }
  }

  if (validActiveCandidates.length > 1) {
    await createVisitorCheckoutSearchAuditLog("VISITOR_CHECKOUT_SEARCH_AMBIGUOUS", {
      reason: "multiple_active_matches",
    });
    return { status: "AMBIGUOUS" };
  }

  if (validActiveCandidates.length === 1) {
    const visitor = validActiveCandidates[0];
    const session = visitor.sessions[0];

    return {
      status: "FOUND",
      match: {
        visitorId: visitor.id,
        fullName: visitor.fullName,
        companyName: visitor.companyName,
        contactNumber: visitor.contactNumber,
        partySize: visitor.partySize,
        checkInAt: visitor.checkInAt,
        expiresAt: session.expiresAt,
      },
    };
  }

  if (candidates.some((candidate) => candidate.status === "CHECKED_OUT")) {
    await createVisitorCheckoutSearchAuditLog("VISITOR_CHECKOUT_SEARCH_ALREADY_COMPLETED", {
      reason: "already_checked_out",
    });
    return { status: "ALREADY_CHECKED_OUT" };
  }

  if (expiredActiveCount > 0) {
    return { status: "EXPIRED" };
  }

  if (candidates.some((candidate) => candidate.status === "EXPIRED")) {
    return { status: "EXPIRED" };
  }

  await createVisitorCheckoutSearchAuditLog("VISITOR_CHECKOUT_SEARCH_NOT_FOUND", {
    reason: "no_active_match",
  });
  return { status: "NOT_FOUND" };
}

export async function checkOutSearchVisitor(
  input: VisitorCheckoutSearchInput
): Promise<VisitorCheckoutResult | VisitorCheckoutSearchLookupResult> {
  const lookupResult = await lookupCheckoutSearchVisitor(input);

  if (lookupResult.status !== "FOUND" || !lookupResult.match) {
    return lookupResult;
  }

  const now = new Date();
  const candidates = await findVisitorsForCheckoutSearch(input.contactNumber);
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
    "VISITOR_SEARCH_CHECKED_OUT",
    {
      method: "contact_number_search",
    }
  );

  return {
    visitorId: checkedOutVisitor.id,
    status: checkedOutVisitor.status,
    checkInAt: checkedOutVisitor.checkInAt,
    checkOutAt: checkedOutVisitor.checkOutAt ?? now,
  };
}
