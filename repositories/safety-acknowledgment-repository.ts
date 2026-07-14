import "server-only";

import { Prisma, type PrismaClient } from "@prisma/client";

import {
  defaultSafetyAcknowledgmentContent,
  defaultSafetyAcknowledgmentTitle,
} from "@/lib/safety-acknowledgment";
import { prisma } from "@/lib/prisma";
import type {
  SafetyAcknowledgmentDraft,
  SafetyAcknowledgmentPolicy,
} from "@/types/visitor";

export async function getActiveSafetyAcknowledgmentVersion(
  prismaClient: PrismaClient = prisma
): Promise<SafetyAcknowledgmentPolicy> {
  const activeVersion = await prismaClient.safetyAcknowledgmentVersion.findFirst({
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

  return createDefaultSafetyAcknowledgmentVersion(prismaClient);
}

export async function findSafetyAcknowledgmentVersionById(
  versionId: string,
  prismaClient: PrismaClient = prisma
): Promise<SafetyAcknowledgmentPolicy | null> {
  return prismaClient.safetyAcknowledgmentVersion.findUnique({
    where: {
      id: versionId,
    },
  });
}

export async function publishSafetyAcknowledgmentVersion(
  nextPolicy: SafetyAcknowledgmentDraft,
  adminActorId: string | null,
  prismaClient: PrismaClient = prisma
): Promise<SafetyAcknowledgmentPolicy> {
  const previousPolicy = await getActiveSafetyAcknowledgmentVersion(prismaClient);
  const latestVersion = await prismaClient.safetyAcknowledgmentVersion.aggregate({
    _max: {
      version: true,
    },
  });
  const nextVersion = (latestVersion._max.version ?? 0) + 1;

  return prismaClient.$transaction(async (transaction) => {
    await transaction.safetyAcknowledgmentVersion.updateMany({
      where: {
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    const createdPolicy = await transaction.safetyAcknowledgmentVersion.create({
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
        eventType: "SAFETY_ACKNOWLEDGMENT_UPDATE",
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

async function createDefaultSafetyAcknowledgmentVersion(
  prismaClient: PrismaClient
): Promise<SafetyAcknowledgmentPolicy> {
  try {
    return await prismaClient.$transaction(async (transaction) => {
      const activeVersion = await transaction.safetyAcknowledgmentVersion.findFirst({
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

      return transaction.safetyAcknowledgmentVersion.create({
        data: {
          version: 1,
          title: defaultSafetyAcknowledgmentTitle,
          content: defaultSafetyAcknowledgmentContent,
          isActive: true,
        },
      });
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    const activeVersion = await prismaClient.safetyAcknowledgmentVersion.findFirst({
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

    return prismaClient.safetyAcknowledgmentVersion.findUniqueOrThrow({
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
  policy: SafetyAcknowledgmentPolicy
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
