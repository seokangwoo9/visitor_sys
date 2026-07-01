import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";

import type { VisitorSessionCookieValue } from "@/types/visitor";

export const VISITOR_SESSION_COOKIE_NAME = "visitor_session";
export const VISITOR_SESSION_DURATION_HOURS = 24;

export function createVisitorSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashVisitorSessionToken(sessionToken: string): string {
  return createHash("sha256").update(sessionToken).digest("hex");
}

export function createVisitorSessionExpiresAt(now: Date): Date {
  return new Date(now.getTime() + VISITOR_SESSION_DURATION_HOURS * 60 * 60 * 1000);
}

export function encodeVisitorSessionCookie(
  value: VisitorSessionCookieValue
): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

const visitorSessionCookieSchema = z.object({
  visitorId: z.uuid(),
  sessionToken: z.string().min(1),
});

export function decodeVisitorSessionCookie(
  cookieValue: string | undefined
): VisitorSessionCookieValue | null {
  if (!cookieValue) {
    return null;
  }

  try {
    const decodedValue: unknown = JSON.parse(
      Buffer.from(cookieValue, "base64url").toString("utf8")
    );
    const parsedValue = visitorSessionCookieSchema.safeParse(decodedValue);

    return parsedValue.success ? parsedValue.data : null;
  } catch {
    return null;
  }
}
