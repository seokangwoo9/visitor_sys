import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError, parseJsonRequest } from "@/lib/api-response";
import { getAdminAuthSession } from "@/lib/admin-auth-session";
import { updateSafetyAcknowledgmentPolicy } from "@/services/safety-acknowledgment-service";

const safetyAcknowledgmentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(200, "Title must be 200 characters or fewer."),
  content: z
    .string()
    .trim()
    .min(20, "Full text must be at least 20 characters.")
    .max(10000, "Full text must be 10,000 characters or fewer."),
});

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getAdminAuthSession(await headers());

  if (!session) {
    return apiError("Authentication required.", 401);
  }

  const payload = await parseJsonRequest(request);
  const parsedPayload = safetyAcknowledgmentSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return apiError("Invalid safety acknowledgment payload.", 400);
  }

  const safetyAcknowledgment = await updateSafetyAcknowledgmentPolicy(
    parsedPayload.data,
    session.user.id
  );

  return NextResponse.json({
    ok: true,
    safetyAcknowledgment: {
      ...safetyAcknowledgment,
      createdAt: safetyAcknowledgment.createdAt.toISOString(),
      updatedAt: safetyAcknowledgment.updatedAt.toISOString(),
    },
  });
}
