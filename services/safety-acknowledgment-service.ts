import "server-only";

import {
  findSafetyAcknowledgmentVersionById,
  getActiveSafetyAcknowledgmentVersion,
  publishSafetyAcknowledgmentVersion,
} from "@/repositories/safety-acknowledgment-repository";
import type {
  SafetyAcknowledgmentDraft,
  SafetyAcknowledgmentPolicy,
} from "@/types/visitor";

export class SafetyAcknowledgmentVersionChangedError extends Error {
  constructor() {
    super("Safety acknowledgment version changed.");
    this.name = "SafetyAcknowledgmentVersionChangedError";
  }
}

export async function getActiveSafetyAcknowledgmentPolicy(): Promise<SafetyAcknowledgmentPolicy> {
  return getActiveSafetyAcknowledgmentVersion();
}

export async function updateSafetyAcknowledgmentPolicy(
  nextPolicy: SafetyAcknowledgmentDraft,
  adminActorId: string | null
): Promise<SafetyAcknowledgmentPolicy> {
  return publishSafetyAcknowledgmentVersion(nextPolicy, adminActorId);
}

export async function verifySafetyAcknowledgmentVersion(
  versionId: string
): Promise<SafetyAcknowledgmentPolicy> {
  const [submittedPolicy, activePolicy] = await Promise.all([
    findSafetyAcknowledgmentVersionById(versionId),
    getActiveSafetyAcknowledgmentVersion(),
  ]);

  if (!submittedPolicy || !submittedPolicy.isActive || submittedPolicy.id !== activePolicy.id) {
    throw new SafetyAcknowledgmentVersionChangedError();
  }

  return submittedPolicy;
}
