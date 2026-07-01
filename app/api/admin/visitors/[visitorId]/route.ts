import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError } from "@/lib/api-response";
import { getAdminAuthSession } from "@/lib/admin-auth-session";
import { removeVisitorRecord } from "@/services/admin-visitor-service";

const visitorIdSchema = z.string().uuid();

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/admin/visitors/[visitorId]">
): Promise<NextResponse> {
  const session = await getAdminAuthSession(await headers());

  if (!session) {
    return apiError("Authentication required.", 401);
  }

  const params = await context.params;
  const parsedVisitorId = visitorIdSchema.safeParse(params.visitorId);

  if (!parsedVisitorId.success) {
    return apiError("Invalid visitor id.", 400);
  }

  await removeVisitorRecord(parsedVisitorId.data, session.user.id);

  return NextResponse.json({
    ok: true,
  });
}
