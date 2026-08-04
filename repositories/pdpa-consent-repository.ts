import "server-only";

import { Prisma, type PrismaClient } from "@prisma/client";

import {
  defaultPdpaConsentContent,
  defaultPdpaConsentTitle,
} from "@/lib/pdpa-consent";
import { prisma } from "@/lib/prisma";
import type { PdpaConsentDraft, PdpaConsentPolicy } from "@/types/visitor";

export async function getActivePdpaConsentVersion(
  prismaClient: PrismaClient = prisma
): Promise<PdpaConsentPolicy> {
  const activeVersion = await prismaClient.pdpaConsentVersion.findFirst({
    where: {
      isActive: true,
    },
    orderBy: {
      version: "desc",
    },
  });

  if (activeVersion) {
    return activeVersion;
  }

  return createDefaultPdpaConsentVersion(prismaClient);
}

export async function findPdpaConsentVersionById(
  versionId: string,
  prismaClient: PrismaClient = prisma
): Promise<PdpaConsentPolicy | null> {
  return prismaClient.pdpaConsentVersion.findUnique({
    where: {
      id: versionId,
    },
  });
}

export async function publishPdpaConsentVersion(
  nextPolicy: PdpaConsentDraft,
  adminActorId: string | null,
  prismaClient: PrismaClient = prisma
): Promise<PdpaConsentPolicy> {
  const previousPolicy = await getActivePdpaConsentVersion(prismaClient);
  const latestVersion = await prismaClient.pdpaConsentVersion.aggregate({
    _max: {
      version: true,
    },
  });
  const nextVersion = (latestVersion._max.version ?? 0) + 1;

  return prismaClient.$transaction(async (transaction) => {
    await transaction.pdpaConsentVersion.updateMany({
      where: {
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    const createdPolicy = await transaction.pdpaConsentVersion.create({
      data: {
        version: nextVersion,
        title: nextPolicy.title,
        content: nextPolicy.content,
        isActive: true,
        publishedByAdminId: adminActorId,
      },
    });

    await transaction.auditLog.create({
      data: {
        eventType: "PDPA_CONSENT_UPDATE",
        actorType: "ADMIN",
        actorId: adminActorId,
        metadata: {
          before: serializePolicyForAudit(previousPolicy),
          after: serializePolicyForAudit(createdPolicy),
        },
      },
    });

    return createdPolicy;
  });
}

async function createDefaultPdpaConsentVersion(
  prismaClient: PrismaClient
): Promise<PdpaConsentPolicy> {
  try {
    return await prismaClient.$transaction(async (transaction) => {
      const activeVersion = await transaction.pdpaConsentVersion.findFirst({
        where: {
          isActive: true,
        },
        orderBy: {
          version: "desc",
        },
      });

      if (activeVersion) {
        return activeVersion;
      }

      return transaction.pdpaConsentVersion.create({
        data: {
          version: 1,
          title: defaultPdpaConsentTitle,
          content: defaultPdpaConsentContent,
          isActive: true,
        },
      });
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    const activeVersion = await prismaClient.pdpaConsentVersion.findFirst({
      where: {
        isActive: true,
      },
      orderBy: {
        version: "desc",
      },
    });

    if (activeVersion) {
      return activeVersion;
    }

    return prismaClient.pdpaConsentVersion.findUniqueOrThrow({
      where: {
        version: 1,
      },
    });
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function serializePolicyForAudit(
  policy: PdpaConsentPolicy
): Prisma.InputJsonObject {
  return {
    id: policy.id,
    version: policy.version,
    title: policy.title,
    contentLength: policy.content.length,
    isActive: policy.isActive,
    createdAt: policy.createdAt.toISOString(),
    updatedAt: policy.updatedAt.toISOString(),
  };
}
