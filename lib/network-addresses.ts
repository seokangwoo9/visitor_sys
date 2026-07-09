import { networkInterfaces } from "node:os";

export function getPrivateIpv4Addresses(): string[] {
  return getExternalIpv4Addresses().filter(isPrivateIpv4Address);
}

export function getPreferredPrivateIpv4Address(): string | null {
  const addresses = getExternalIpv4Addresses();

  return addresses.find(isPrivateIpv4Address) ?? addresses[0] ?? null;
}

function getExternalIpv4Addresses(): string[] {
  const addresses = Object.values(networkInterfaces())
    .flat()
    .filter((address): address is NonNullable<typeof address> => Boolean(address))
    .filter((address) => address.family === "IPv4" && !address.internal)
    .map((address) => address.address);

  return Array.from(new Set(addresses));
}

export function isPrivateIpv4Address(address: string): boolean {
  const octets = address.split(".").map(Number);

  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet))) {
    return false;
  }

  const [first, second] = octets;

  return first === 10
    || (first === 172 && second >= 16 && second <= 31)
    || (first === 192 && second === 168);
}
