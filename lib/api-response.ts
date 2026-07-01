import { NextResponse } from "next/server";

export interface ApiErrorResponseBody {
  ok: false;
  message: string;
}

export interface ApiSuccessResponseBody<TData extends object = Record<string, never>> {
  ok: true;
  data?: TData;
}

export function apiError(
  message: string,
  status: number
): NextResponse<ApiErrorResponseBody> {
  return NextResponse.json(
    {
      ok: false,
      message,
    },
    { status }
  );
}

export async function parseJsonRequest(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    return null;
  }

  return request.json().catch(() => null);
}
