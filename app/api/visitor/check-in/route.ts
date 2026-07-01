import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  decodeVisitorSessionCookie,
  encodeVisitorSessionCookie,
  VISITOR_SESSION_COOKIE_NAME,
} from "@/lib/visitor-session";
import { visitorRegistrationSchema } from "@/lib/validations/visitor";
import { registerVisitor } from "@/services/visitor-registration-service";
import { getActiveVisitorSession } from "@/services/visitor-session-service";

export async function POST(request: Request): Promise<NextResponse> {
  const cookieStore = await cookies();
  const existingSession = await getActiveVisitorSession(
    decodeVisitorSessionCookie(cookieStore.get(VISITOR_SESSION_COOKIE_NAME)?.value)
  );

  if (existingSession) {
    return NextResponse.json(
      {
        ok: false,
        message: "An active visitor session already exists.",
        redirectPath: "/visitor/status",
      },
      { status: 409 }
    );
  }

  const payload: unknown = await request.json().catch(() => null);
  const parsedPayload = visitorRegistrationSchema.safeParse(payload);

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
    const result = await registerVisitor(parsedPayload.data);
    const response = NextResponse.json(
      {
        ok: true,
        visitorId: result.visitorId,
        status: result.status,
        checkInAt: result.checkInAt.toISOString(),
      },
      { status: 201 }
    );

    response.cookies.set({
      name: VISITOR_SESSION_COOKIE_NAME,
      value: encodeVisitorSessionCookie({
        visitorId: result.visitorId,
        sessionToken: result.sessionToken,
      }),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: result.expiresAt,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Visitor registration failed", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Unable to register visitor. Please try again.",
      },
      { status: 500 }
    );
  }
}
