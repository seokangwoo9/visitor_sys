import "server-only";

<<<<<<< HEAD
=======
import { createHmac, timingSafeEqual } from "node:crypto";

>>>>>>> f3b7cde (fixed remaining issue)
import { prisma } from "@/lib/prisma";

const betterAuthCookieNames = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
  "better-auth-session_token",
  "__Secure-better-auth-session_token",
];

export interface AdminAuthSession {
  session: {
    id: string;
    expiresAt: Date;
    token: string;
    userId: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export async function getAdminAuthSession(
  headers: Headers
): Promise<AdminAuthSession | null> {
  const sessionToken = getBetterAuthSessionToken(headers.get("cookie"));

  if (!sessionToken) {
    return null;
  }

  const session = await prisma.sessions.findUnique({
    where: {
      token: sessionToken,
    },
    include: {
      users: true,
    },
  });

  if (!session || session.expiresAt <= new Date()) {
    return null;
  }

  return {
    session: {
      id: session.id,
      expiresAt: session.expiresAt,
      token: session.token,
      userId: session.userId,
    },
    user: {
      id: session.users.id,
      name: session.users.name,
      email: session.users.email,
    },
  };
}

function getBetterAuthSessionToken(cookieHeader: string | null): string | null {
  if (!cookieHeader) {
    return null;
  }

  const cookies = parseCookieHeader(cookieHeader);

  for (const cookieName of betterAuthCookieNames) {
    const cookieValue = cookies.get(cookieName);
<<<<<<< HEAD

    if (cookieValue) {
      return cookieValue;
=======
    const sessionToken = cookieValue ? getSignedCookieValue(cookieValue) : null;

    if (sessionToken) {
      return sessionToken;
>>>>>>> f3b7cde (fixed remaining issue)
    }
  }

  return null;
}

<<<<<<< HEAD
=======
function getSignedCookieValue(cookieValue: string): string | null {
  const signatureStartIndex = cookieValue.lastIndexOf(".");

  if (signatureStartIndex < 1) {
    return null;
  }

  const signedValue = cookieValue.slice(0, signatureStartIndex);
  const signature = cookieValue.slice(signatureStartIndex + 1);

  return isValidCookieSignature(signedValue, signature) ? signedValue : null;
}

function isValidCookieSignature(value: string, signature: string): boolean {
  const secret = process.env.BETTER_AUTH_SECRET;

  if (!secret) {
    return false;
  }

  const expectedSignature = createHmac("sha256", secret).update(value).digest("base64");

  try {
    return timingSafeEqual(
      Buffer.from(signature, "base64"),
      Buffer.from(expectedSignature, "base64")
    );
  } catch {
    return false;
  }
}

>>>>>>> f3b7cde (fixed remaining issue)
function parseCookieHeader(cookieHeader: string): Map<string, string> {
  const cookies = new Map<string, string>();

  for (const cookiePair of cookieHeader.split(";")) {
    const separatorIndex = cookiePair.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const name = cookiePair.slice(0, separatorIndex).trim();
    const value = cookiePair.slice(separatorIndex + 1).trim();

    if (name) {
      cookies.set(name, decodeURIComponent(value));
    }
  }

  return cookies;
}
