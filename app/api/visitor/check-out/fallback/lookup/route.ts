import { NextResponse } from "next/server";

import { apiError, parseJsonRequest } from "@/lib/api-response";
import { consumeFallbackCheckoutAttempt } from "@/lib/rate-limit";
import { visitorFallbackCheckoutSchema } from "@/lib/validations/visitor";
import {
  getFallbackCheckoutMessage,
  getFallbackCheckoutStatus,
  getFallbackRateLimitKey,
} from "@/lib/visitor-fallback-checkout-api";
import { lookupFallbackCheckoutVisitor } from "@/services/visitor-session-service";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  const rateLimit = consumeFallbackCheckoutAttempt(getFallbackRateLimitKey(request));

  if (!rateLimit.allowed) {
    return apiError(
      "Too many check-out attempts. Please wait before trying again.",
      429
    );
  }

  const payload = await parseJsonRequest(request);
  const parsedPayload = visitorFallbackCheckoutSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "Please check the visitor information and try again.",
        fieldErrors: parsedPayload.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  try {
    const result = await lookupFallbackCheckoutVisitor(parsedPayload.data);

    if (result.status === "FOUND" && result.match) {
      return NextResponse.json({
        ok: true,
        data: {
          fullName: result.match.fullName,
          companyName: result.match.companyName,
          partySize: result.match.partySize,
          visitorPassId: result.match.visitorPassId,
          checkInAt: result.match.checkInAt.toISOString(),
        },
      });
    }

    return apiError(getFallbackCheckoutMessage(result.status), getFallbackCheckoutStatus(result.status));
  } catch {
    return apiError("Unable to verify visitor check-out. Please try again.", 500);
  }
}
