import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { apiError } from "@/lib/api-response";
import {
  decodeVisitorSessionCookie,
  VISITOR_SESSION_COOKIE_NAME,
} from "@/lib/visitor-session";
import { checkOutVisitor } from "@/services/visitor-session-service";

export const runtime = "nodejs";

export async function POST(): Promise<NextResponse> {
  const cookieStore = await cookies();
  const sessionCookie = decodeVisitorSessionCookie(
    cookieStore.get(VISITOR_SESSION_COOKIE_NAME)?.value
  );

  try {
    const result = await checkOutVisitor(sessionCookie);

    if (!result) {
      const response = NextResponse.json(
        {
          ok: false,
          message: "No active visitor session was found.",
        },
        { status: 401 }
      );

      response.cookies.delete(VISITOR_SESSION_COOKIE_NAME);
      return response;
    }

    const response = NextResponse.json({
      ok: true,
      visitorId: result.visitorId,
      status: result.status,
      checkInAt: result.checkInAt.toISOString(),
      checkOutAt: result.checkOutAt.toISOString(),
    });

    response.cookies.delete(VISITOR_SESSION_COOKIE_NAME);
    return response;
  } catch {
    return apiError("Unable to check out visitor. Please try again.", 500);
  }
}
