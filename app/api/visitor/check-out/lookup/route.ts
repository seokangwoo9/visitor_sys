import { NextResponse } from "next/server";

import { apiError, parseJsonRequest } from "@/lib/api-response";
import { consumeCheckoutSearchAttempt } from "@/lib/rate-limit";
import { visitorCheckoutSearchSchema } from "@/lib/validations/visitor";
import {
  getCheckoutSearchMessage,
  getCheckoutSearchRateLimitKey,
  getCheckoutSearchStatusCode,
} from "@/lib/visitor-checkout-api";
import { lookupCheckoutSearchVisitor } from "@/services/visitor-session-service";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  const rateLimit = consumeCheckoutSearchAttempt(getCheckoutSearchRateLimitKey(request));

  if (!rateLimit.allowed) {
    return apiError(
      "Too many check-out attempts. Please wait before trying again.",
      429
    );
  }

  const payload = await parseJsonRequest(request);
  const parsedPayload = visitorCheckoutSearchSchema.safeParse(payload);

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
    const result = await lookupCheckoutSearchVisitor(parsedPayload.data);

    if (result.status === "FOUND" && result.match) {
      return NextResponse.json({
        ok: true,
        data: {
          fullName: result.match.fullName,
          companyName: result.match.companyName,
          partySize: result.match.partySize,
          checkInAt: result.match.checkInAt.toISOString(),
        },
      });
    }

    return apiError(getCheckoutSearchMessage(result.status), getCheckoutSearchStatusCode(result.status));
  } catch {
    return apiError("Unable to verify visitor check-out. Please try again.", 500);
  }
}
