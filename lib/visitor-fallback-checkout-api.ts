import type { VisitorFallbackCheckoutStatus } from "@/types/visitor";

export function getFallbackRateLimitKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp = forwardedFor?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
  const userAgent = request.headers.get("user-agent")?.slice(0, 120) || "unknown";

  return `${clientIp}:${userAgent}`;
}

export function getFallbackCheckoutMessage(
  status: VisitorFallbackCheckoutStatus
): string {
  if (status === "AMBIGUOUS") {
    return "Unable to confirm a unique active visit. Please contact the front desk.";
  }

  if (status === "ALREADY_CHECKED_OUT") {
    return "This visit has already been checked out.";
  }

  if (status === "EXPIRED") {
    return "This visitor session has expired. Please contact the front desk.";
  }

  return "No active visit was found. Please check your details or contact the front desk.";
}

export function getFallbackCheckoutStatus(
  status: VisitorFallbackCheckoutStatus
): number {
  if (status === "ALREADY_CHECKED_OUT") {
    return 409;
  }

  if (status === "EXPIRED") {
    return 410;
  }

  if (status === "AMBIGUOUS") {
    return 409;
  }

  return 404;
}
