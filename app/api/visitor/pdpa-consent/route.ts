import { NextResponse } from "next/server";

import { getActivePdpaConsentPolicy } from "@/services/pdpa-consent-service";

export async function GET() {
  try {
    const policy = await getActivePdpaConsentPolicy();
    return NextResponse.json(policy);
  } catch {
    return NextResponse.json(
      { error: "Failed to load PDPA consent" },
      { status: 500 }
    );
  }
}
