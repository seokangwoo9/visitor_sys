import { NextResponse } from "next/server";

import { getActiveSafetyAcknowledgmentPolicy } from "@/services/safety-acknowledgment-service";

export async function GET() {
  try {
    const policy = await getActiveSafetyAcknowledgmentPolicy();
    return NextResponse.json(policy);
  } catch {
    return NextResponse.json(
      { error: "Failed to load safety acknowledgment" },
      { status: 500 }
    );
  }
}
