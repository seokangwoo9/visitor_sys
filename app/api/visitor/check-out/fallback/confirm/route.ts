import { NextResponse } from "next/server";

import { apiError, parseJsonRequest } from "@/lib/api-response";
import { consumeFallbackCheckoutAttempt } from "@/lib/rate-limit";
import { visitorFallbackCheckoutSchema } from "@/lib/validations/visitor";
import {
  getFallbackCheckoutMessage,
  getFallbackCheckoutStatus,
  getFallbackRateLimitKey,
} from "@/lib/visitor-fallback-checkout-api";
import { checkOutFallbackVisitor } from "@/services/visitor-session-service";

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
    const result = await checkOutFallbackVisitor(parsedPayload.data);

    if ("visitorId" in result) {
      return NextResponse.json({
        ok: true,
        visitorId: result.visitorId,
        status: result.status,
        checkInAt: result.checkInAt.toISOString(),
        checkOutAt: result.checkOutAt.toISOString(),
      });
    }

    return apiError(getFallbackCheckoutMessage(result.status), getFallbackCheckoutStatus(result.status));
  } catch {
    return apiError("Unable to check out visitor. Please try again.", 500);
  }
}
