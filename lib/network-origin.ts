import "server-only";

import { networkInterfaces } from "node:os";

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

function getPreferredPrivateIpv4Address(): string | null {
  const addresses = Object.values(networkInterfaces())
    .flat()
    .filter((address): address is NonNullable<typeof address> => Boolean(address))
    .filter((address) => address.family === "IPv4" && !address.internal)
    .map((address) => address.address);

  return addresses.find(isPrivateIpv4Address) ?? addresses[0] ?? null;
}

function isPrivateIpv4Address(address: string): boolean {
  const octets = address.split(".").map(Number);

  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet))) {
    return false;
  }

  const [first, second] = octets;

  return first === 10
    || (first === 172 && second >= 16 && second <= 31)
    || (first === 192 && second === 168);
}
