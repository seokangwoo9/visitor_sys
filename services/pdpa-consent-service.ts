import "server-only";

import {
  findPdpaConsentVersionById,
  getActivePdpaConsentVersion,
  publishPdpaConsentVersion,
} from "@/repositories/pdpa-consent-repository";
import type { PdpaConsentDraft, PdpaConsentPolicy } from "@/types/visitor";

export class PdpaConsentVersionChangedError extends Error {
  constructor() {
    super("PDPA consent version changed.");
    this.name = "PdpaConsentVersionChangedError";
  }
}

export async function getActivePdpaConsentPolicy(): Promise<PdpaConsentPolicy> {
  return getActivePdpaConsentVersion();
}

export async function updatePdpaConsentPolicy(
  nextPolicy: PdpaConsentDraft,
  adminActorId: string | null
): Promise<PdpaConsentPolicy> {
  return publishPdpaConsentVersion(nextPolicy, adminActorId);
}

export async function verifyPdpaConsentVersion(
  versionId: string
): Promise<PdpaConsentPolicy> {
  const [submittedPolicy, activePolicy] = await Promise.all([
    findPdpaConsentVersionById(versionId),
    getActivePdpaConsentVersion(),
  ]);

  if (!submittedPolicy || !submittedPolicy.isActive || submittedPolicy.id !== activePolicy.id) {
    throw new PdpaConsentVersionChangedError();
  }

  return submittedPolicy;
}
