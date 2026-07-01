import "server-only";

import type { Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { AdminSettingsValues } from "@/types/visitor";

const SETTINGS_KEY = "visitor_timeout_rules";

export async function getAdminSettings(
  prismaClient: PrismaClient = prisma
): Promise<AdminSettingsValues | null> {
  const setting = await prismaClient.systemSetting.findUnique({
    where: {
      key: SETTINGS_KEY,
    },
  });

  if (!setting || typeof setting.value !== "object" || setting.value === null) {
    return null;
  }

  const value = setting.value as Record<string, unknown>;
  const overdueThresholdHours = Number(value.overdueThresholdHours);
  const autoExpireHours = Number(value.autoExpireHours);

  if (!Number.isFinite(overdueThresholdHours) || !Number.isFinite(autoExpireHours)) {
    return null;
  }

  return {
    overdueThresholdHours,
    autoExpireHours,
  };
}

export async function saveAdminSettings(
  nextSettings: AdminSettingsValues,
  adminActorId: string | null,
  prismaClient: PrismaClient = prisma
): Promise<AdminSettingsValues> {
  const previousSettings = await getAdminSettings(prismaClient);
  const nextSettingsJson: Prisma.InputJsonObject = {
    overdueThresholdHours: nextSettings.overdueThresholdHours,
    autoExpireHours: nextSettings.autoExpireHours,
  };
  const previousSettingsJson: Prisma.InputJsonValue =
    previousSettings === null
      ? "unset"
      : {
          overdueThresholdHours: previousSettings.overdueThresholdHours,
          autoExpireHours: previousSettings.autoExpireHours,
        };

  await prismaClient.$transaction(async (transaction) => {
    await transaction.systemSetting.upsert({
      where: {
        key: SETTINGS_KEY,
      },
      create: {
        key: SETTINGS_KEY,
        value: nextSettingsJson,
      },
      update: {
        value: nextSettingsJson,
      },
    });

    await transaction.auditLog.create({
      data: {
        eventType: "SETTINGS_UPDATE",
        actorType: "ADMIN",
        actorId: adminActorId,
        metadata: {
          before: previousSettingsJson,
          after: nextSettingsJson,
        },
      },
    });
  });

  return nextSettings;
}
