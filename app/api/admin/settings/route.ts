import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminAuthSession } from "@/lib/admin-auth-session";
import { updateSettingsValues } from "@/services/admin-visitor-service";

const settingsSchema = z.object({
  overdueThresholdHours: z.number().int().min(1).max(168),
  autoExpireHours: z.number().int().min(1).max(168),
});

export async function POST(request: Request): Promise<NextResponse> {
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

  const payload: unknown = await request.json().catch(() => null);
  const parsedPayload = settingsSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid settings payload.",
      },
      { status: 400 }
    );
  }

  const settings = await updateSettingsValues(parsedPayload.data, session.user.id);

  return NextResponse.json({
    ok: true,
    settings,
  });
}
