import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError, parseJsonRequest } from "@/lib/api-response";
import { getAdminAuthSession } from "@/lib/admin-auth-session";
import { updateSettingsValues } from "@/services/admin-visitor-service";

const settingsSchema = z.object({
  overdueThresholdHours: z.number().int().min(1).max(168),
  autoExpireHours: z.number().int().min(1).max(168),
});

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getAdminAuthSession(await headers());

  if (!session) {
    return apiError("Authentication required.", 401);
  }

  const payload = await parseJsonRequest(request);
  const parsedPayload = settingsSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return apiError("Invalid settings payload.", 400);
  }

  const settings = await updateSettingsValues(parsedPayload.data, session.user.id);

  return NextResponse.json({
    ok: true,
    settings,
  });
}
