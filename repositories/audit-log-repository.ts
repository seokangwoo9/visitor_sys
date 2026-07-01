import "server-only";

import type { PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function listLatestAuditLogs(
  take = 100,
  prismaClient: PrismaClient = prisma
) {
  return prismaClient.auditLog.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take,
  });
}
