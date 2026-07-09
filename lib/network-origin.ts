import "server-only";

import { getPreferredPrivateIpv4Address } from "@/lib/network-addresses";

const localhostNames = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export function resolveVisitorQrCodeOrigin(headersList: Headers): string | undefined {
  const hostHeader = headersList.get("x-forwarded-host") ?? headersList.get("host");

  if (!hostHeader) {
    return undefined;
  }

  const protocol = headersList.get("x-forwarded-proto") ?? "http";
  const parsedHost = parseHostHeader(hostHeader);
  const hostname = parsedHost.hostname.toLowerCase();

  if (!localhostNames.has(hostname)) {
    return `${protocol}://${hostHeader}`;
  }

  const networkAddress = getPreferredPrivateIpv4Address();

  if (!networkAddress) {
    return `${protocol}://${hostHeader}`;
  }

  return `${protocol}://${networkAddress}${parsedHost.port ? `:${parsedHost.port}` : ""}`;
}

function parseHostHeader(hostHeader: string): { hostname: string; port: string } {
  if (hostHeader.startsWith("[")) {
    const closingBracketIndex = hostHeader.indexOf("]");
    const hostname = closingBracketIndex >= 0
      ? hostHeader.slice(0, closingBracketIndex + 1)
      : hostHeader;
    const port = closingBracketIndex >= 0 && hostHeader[closingBracketIndex + 1] === ":"
      ? hostHeader.slice(closingBracketIndex + 2)
      : "";

    return { hostname, port };
  }

  const lastColonIndex = hostHeader.lastIndexOf(":");

  if (lastColonIndex <= 0) {
    return { hostname: hostHeader, port: "" };
  }

  return {
    hostname: hostHeader.slice(0, lastColonIndex),
    port: hostHeader.slice(lastColonIndex + 1),
  };
}
