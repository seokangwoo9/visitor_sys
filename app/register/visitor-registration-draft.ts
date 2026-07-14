import { z } from "zod";

import type { VisitorRegistrationFormInput } from "@/lib/validations/visitor";

export const visitorRegistrationDraftStorageKey = "tvms.visitor-registration-draft.v1";
type VisitorRegistrationDraftValues = Partial<Record<keyof VisitorRegistrationFormInput, unknown>>;

export const defaultVisitorRegistrationValues: VisitorRegistrationFormInput = {
  fullName: "",
  companyName: "",
  contactNumber: "",
  partySize: 1,
  email: "",
  identificationNumber: "",
  hasVehicle: true,
  vehiclePlateNumber: "",
  department: "",
  hostName: "",
  purposeOfVisit: "",
  safetyAcknowledged: false,
  safetyAcknowledgmentVersionId: "",
};

interface DraftStorage {
  getItem: (key: string) => string | null;
  removeItem: (key: string) => void;
  setItem: (key: string, value: string) => void;
}

const visitorRegistrationDraftSchema = z.object({
  fullName: z.string().max(200).optional(),
  companyName: z.string().max(200).optional(),
  contactNumber: z.string().max(50).optional(),
  partySize: z.coerce.number().int().min(1).max(100).optional(),
  email: z.string().max(320).optional(),
  identificationNumber: z.string().max(100).optional(),
  hasVehicle: z.boolean().optional(),
  vehiclePlateNumber: z.string().max(50).optional(),
  department: z.string().max(200).optional(),
  hostName: z.string().max(200).optional(),
  purposeOfVisit: z.string().max(1000).optional(),
  safetyAcknowledged: z.boolean().optional(),
  safetyAcknowledgmentVersionId: z.uuid().optional(),
});

export function readVisitorRegistrationDraft(
  storage: Pick<DraftStorage, "getItem">
): VisitorRegistrationFormInput | null {
  const rawDraft = safelyReadDraft(storage);

  if (!rawDraft) {
    return null;
  }

  const parsedDraft = visitorRegistrationDraftSchema.safeParse(rawDraft);

  if (!parsedDraft.success) {
    return null;
  }

  return {
    ...defaultVisitorRegistrationValues,
    ...parsedDraft.data,
  };
}

export function writeVisitorRegistrationDraft(
  storage: Pick<DraftStorage, "setItem">,
  values: VisitorRegistrationDraftValues
): void {
  try {
    storage.setItem(
      visitorRegistrationDraftStorageKey,
      JSON.stringify({
        ...defaultVisitorRegistrationValues,
        ...values,
        partySize: normalizePartySize(values.partySize),
      })
    );
  } catch {
    // Mobile browsers can deny storage in private or constrained modes.
  }
}

export function clearVisitorRegistrationDraft(
  storage: Pick<DraftStorage, "removeItem">
): void {
  try {
    storage.removeItem(visitorRegistrationDraftStorageKey);
  } catch {
    // Best-effort cleanup only.
  }
}

function safelyReadDraft(storage: Pick<DraftStorage, "getItem">): unknown {
  try {
    const rawDraft = storage.getItem(visitorRegistrationDraftStorageKey);

    return rawDraft ? JSON.parse(rawDraft) : null;
  } catch {
    return null;
  }
}

function normalizePartySize(value: unknown): number {
  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) && parsedValue >= 1 && parsedValue <= 100
    ? parsedValue
    : 1;
}
