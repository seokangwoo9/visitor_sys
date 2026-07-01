import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminAuthSession } from "@/lib/admin-auth-session";
import { removeVisitorRecord } from "@/services/admin-visitor-service";

const visitorIdSchema = z.string().uuid();

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/admin/visitors/[visitorId]">
): Promise<NextResponse> {
  const session = await getAdminAuthSession(await headers());

  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        message: "Authentication required.",
      },
      { status: 401 }
    );
  }

  const params = await context.params;
  const parsedVisitorId = visitorIdSchema.safeParse(params.visitorId);

  if (!parsedVisitorId.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid visitor id.",
      },
      { status: 400 }
    );
  }

  await removeVisitorRecord(parsedVisitorId.data, session.user.id);

  return NextResponse.json({
    ok: true,
  });
}
