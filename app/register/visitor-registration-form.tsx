"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ComponentType, ReactNode } from "react";
import { useForm, useWatch, type UseFormRegisterReturn } from "react-hook-form";
import {
  Car,
  LoaderCircle,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import type { SafetyAcknowledgmentPolicy, PdpaConsentPolicy } from "@/types/visitor";
import {
  type VisitorRegistrationFormInput,
  visitorRegistrationSchema,
  type VisitorRegistrationSchema,
} from "@/lib/validations/visitor";

import {
  clearVisitorRegistrationDraft,
  defaultVisitorRegistrationValues,
  readVisitorRegistrationDraft,
  writeVisitorRegistrationDraft,
} from "./visitor-registration-draft";

const checkInResponseSchema = z.object({
  ok: z.boolean(),
  message: z.string().optional(),
  fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
  redirectPath: z.string().optional(),
});

type FieldName = keyof VisitorRegistrationSchema;

const fieldLabels: Record<FieldName, string> = {
  fullName: "Full Name",
  identificationNumber: "IC / Passport",
  contactNumber: "Phone Number",
  email: "Email",
  hasVehicle: "No Vehicle",
  vehiclePlateNumber: "Vehicle Plate Number",
  companyName: "Company Name",
  purposeOfVisit: "Purpose of Visit",
  hostName: "Person to Meet",
  safetyAcknowledged: "Safety Acknowledgment",
  safetyAcknowledgmentVersionId: "Safety Acknowledgment Version",
  pdpaConsent: "PDPA Consent",
  pdpaConsentVersionId: "PDPA Consent Version",
};

export function VisitorRegistrationForm({
  safetyAcknowledgment,
  pdpaConsent,
}: {
  safetyAcknowledgment: SafetyAcknowledgmentPolicy;
  pdpaConsent: PdpaConsentPolicy;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const hasRestoredDraft = useRef(false);
  const [serverMessage, setServerMessage] = useState("");
  const initialValues: VisitorRegistrationFormInput = {
    ...defaultVisitorRegistrationValues,
    safetyAcknowledgmentVersionId: safetyAcknowledgment.id,
    pdpaConsentVersionId: pdpaConsent.id,
  };
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
  } = useForm<VisitorRegistrationFormInput, unknown, VisitorRegistrationSchema>({
    resolver: zodResolver(visitorRegistrationSchema),
    defaultValues: initialValues,
  });
  const watchedValues = useWatch({ control });
  const hasVehicle = watchedValues.hasVehicle !== false;

  useEffect(() => {
    const restoredDraft = readVisitorRegistrationDraft(window.sessionStorage);

    if (restoredDraft) {
      reset({
        ...restoredDraft,
        safetyAcknowledged:
          restoredDraft.safetyAcknowledgmentVersionId === safetyAcknowledgment.id
            ? restoredDraft.safetyAcknowledged
            : false,
        safetyAcknowledgmentVersionId: safetyAcknowledgment.id,
        pdpaConsent:
          restoredDraft.pdpaConsentVersionId === pdpaConsent.id
            ? restoredDraft.pdpaConsent
            : false,
        pdpaConsentVersionId: pdpaConsent.id,
      });
    }

    queueMicrotask(() => {
      hasRestoredDraft.current = true;
    });
  }, [reset, safetyAcknowledgment.id, pdpaConsent.id]);

  useEffect(() => {
    if (!hasRestoredDraft.current) {
      return;
    }

    writeVisitorRegistrationDraft(window.sessionStorage, watchedValues);
  }, [watchedValues]);

  async function submitRegistration(values: VisitorRegistrationSchema) {
    setServerMessage("");

    const response = await fetch("/api/visitor/check-in", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });
    const payload: unknown = await response.json().catch(() => null);
    const parsedPayload = checkInResponseSchema.safeParse(payload);
    const message = parsedPayload.success
      ? parsedPayload.data.message
      : "Unable to register visitor. Please try again.";

    if (!response.ok) {
      if (response.status === 409 && parsedPayload.success && parsedPayload.data.redirectPath) {
        clearVisitorRegistrationDraft(window.sessionStorage);
        router.replace(parsedPayload.data.redirectPath);
        router.refresh();
        return;
      }

      if (parsedPayload.success && parsedPayload.data.fieldErrors) {
        for (const fieldName of Object.keys(fieldLabels) as FieldName[]) {
          const fieldError = parsedPayload.data.fieldErrors[fieldName];

          if (Array.isArray(fieldError) && typeof fieldError[0] === "string") {
            setError(fieldName, { message: fieldError[0] });
          }
        }
      }

      setServerMessage(message ?? t("defaultError"));
      return;
    }

    clearVisitorRegistrationDraft(window.sessionStorage);
    router.replace("/visitor/status");
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submitRegistration)}>
      <FormSection icon={UserRound} title={t("personalInformation")}>
        <Field
          autoComplete="name"
          disabled={isSubmitting}
          error={errors.fullName?.message}
          label={t("fullName")}
          placeholder={t("enterFullName")}
          registration={register("fullName")}
        />
        <Field
          disabled={isSubmitting}
          error={errors.identificationNumber?.message}
          label={t("identificationNumber")}
          placeholder={t("enterIcPassport")}
          registration={register("identificationNumber")}
        />
        <Field
          autoComplete="tel"
          disabled={isSubmitting}
          error={errors.contactNumber?.message}
          label={t("contactNumber")}
          placeholder={t("enterPhone")}
          registration={register("contactNumber")}
          type="tel"
        />
        <Field
          autoComplete="email"
          disabled={isSubmitting}
          error={errors.email?.message}
          label={t("email")}
          placeholder={t("enterEmail")}
          registration={register("email")}
          type="email"
        />
      </FormSection>

      <FormSection icon={Car} title={t("vehicle")}>
        <label className="flex h-12 items-center gap-3 rounded-xl border border-border bg-bg-base px-4 text-sm font-medium text-text-secondary">
          <input
            aria-invalid={Boolean(errors.hasVehicle)}
            checked={!hasVehicle}
            className="size-4 rounded border-border-subtle bg-card text-visitor-success-deep"
            disabled={isSubmitting}
            onChange={(event) => {
              const nextHasVehicle = !event.target.checked;

              setValue("hasVehicle", nextHasVehicle, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            type="checkbox"
          />
          {t("noVehicle")}
        </label>
        <Field
          disabled={isSubmitting || !hasVehicle}
          error={errors.vehiclePlateNumber?.message}
          label={t("vehiclePlateNumber")}
          placeholder={t("enterPlateNumber")}
          registration={register("vehiclePlateNumber")}
        />
      </FormSection>

      <FormSection icon={UsersRound} title={t("company")}>
        <Field
          autoComplete="organization"
          disabled={isSubmitting}
          error={errors.companyName?.message}
          label={t("companyName")}
          placeholder={t("enterCompanyName")}
          registration={register("companyName")}
        />
        <TextAreaField
          disabled={isSubmitting}
          error={errors.purposeOfVisit?.message}
          label={t("purposeOfVisit")}
          placeholder={t("enterPurpose")}
          registration={register("purposeOfVisit")}
        />
        <Field
          disabled={isSubmitting}
          error={errors.hostName?.message}
          label={t("hostName")}
          placeholder={t("enterHostName")}
          registration={register("hostName")}
        />
      </FormSection>

      <FormSection icon={ShieldCheck} title={t("safetyAcknowledgment")}>
        <input type="hidden" {...register("safetyAcknowledgmentVersionId")} />
        <label className="flex items-start gap-3 rounded-xl border border-border bg-bg-base px-4 py-4 text-sm font-medium text-text-secondary">
          <input
            aria-invalid={Boolean(errors.safetyAcknowledged)}
            className="mt-0.5 size-4 shrink-0 rounded border-border-subtle bg-card text-visitor-success-deep"
            disabled={isSubmitting}
            type="checkbox"
            {...register("safetyAcknowledged")}
          />
          <Dialog>
            <DialogTrigger
              render={
                <button
                  className="text-left text-sm font-medium text-text-secondary underline decoration-visitor-success-deep underline-offset-4 transition hover:text-visitor-ink"
                  type="button"
                />
              }
            >
              {t("safetyAcknowledgmentCheckbox")}
            </DialogTrigger>
            <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-border bg-card p-5 sm:max-w-xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold text-visitor-ink">
                  {safetyAcknowledgment.title}
                </DialogTitle>
              </DialogHeader>
              <div className="mt-4 whitespace-pre-wrap rounded-xl bg-bg-base p-4 text-sm leading-7 text-text-secondary">
                {safetyAcknowledgment.content}
              </div>
            </DialogContent>
          </Dialog>
        </label>
        {errors.safetyAcknowledged?.message ? (
          <p className="text-sm font-medium text-destructive" role="alert">
            {errors.safetyAcknowledged.message}
          </p>
        ) : null}
      </FormSection>

      <FormSection icon={ShieldCheck} title={t("pdpaConsent")}>
        <input type="hidden" {...register("pdpaConsentVersionId")} />
        <label className="flex items-start gap-3 rounded-xl border border-border bg-bg-base px-4 py-4 text-sm font-medium text-text-secondary">
          <input
            aria-invalid={Boolean(errors.pdpaConsent)}
            className="mt-0.5 size-4 shrink-0 rounded border-border-subtle bg-card text-visitor-success-deep"
            disabled={isSubmitting}
            type="checkbox"
            {...register("pdpaConsent")}
          />
          <Dialog>
            <DialogTrigger
              render={
                <button
                  className="text-left text-sm font-medium text-text-secondary underline decoration-visitor-success-deep underline-offset-4 transition hover:text-visitor-ink"
                  type="button"
                />
              }
            >
              {t("pdpaConsentCheckbox")}
            </DialogTrigger>
            <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-border bg-card p-5 sm:max-w-xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold text-visitor-ink">
                  {pdpaConsent.title}
                </DialogTitle>
              </DialogHeader>
              <div className="mt-4 whitespace-pre-wrap rounded-xl bg-bg-base p-4 text-sm leading-7 text-text-secondary">
                {pdpaConsent.content}
              </div>
            </DialogContent>
          </Dialog>
        </label>
        {errors.pdpaConsent?.message ? (
          <p className="text-sm font-medium text-destructive" role="alert">
            {errors.pdpaConsent.message}
          </p>
        ) : null}
      </FormSection>

      {serverMessage ? (
        <p className="text-sm font-medium text-destructive" role="alert">
          {serverMessage}
        </p>
      ) : null}

      <Button
        className="h-12 w-full rounded-xl bg-visitor-success text-base font-semibold hover:bg-visitor-success-deep"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? (
          <>
            <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
            {t("submitting")}
          </>
        ) : (
          t("submitCheckIn")
        )}
      </Button>
    </form>
  );
}

interface FormSectionProps {
  children: ReactNode;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
}

function FormSection({ children, icon: Icon, title }: FormSectionProps) {
  return (
    <section className="rounded-xl bg-card px-5 py-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-lg bg-visitor-success-soft text-visitor-success-deep">
          <Icon className="size-4" aria-hidden={true} />
        </div>
        <h2 className="text-base font-semibold text-visitor-ink">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

interface FieldProps {
  autoComplete?: string;
  disabled: boolean;
  error?: string;
  label: string;
  max?: number;
  min?: number;
  placeholder: string;
  registration: UseFormRegisterReturn;
  type?: string;
}

function Field({
  autoComplete,
  disabled,
  error,
  label,
  max,
  min,
  placeholder,
  registration,
  type = "text",
}: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-text-secondary" htmlFor={registration.name}>
        {label}
      </Label>
      <Input
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        className={cn(
          "h-12 rounded-xl border-border bg-card px-4 text-base placeholder:text-text-muted",
          error ? "border-destructive" : null
        )}
        disabled={disabled}
        id={registration.name}
        max={max}
        min={min}
        placeholder={placeholder}
        type={type}
        {...registration}
      />
      {error ? (
        <p className="text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface TextAreaFieldProps {
  disabled: boolean;
  error?: string;
  label: string;
  placeholder: string;
  registration: UseFormRegisterReturn;
}

function TextAreaField({
  disabled,
  error,
  label,
  placeholder,
  registration,
}: TextAreaFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-text-secondary" htmlFor={registration.name}>
        {label}
      </Label>
      <Textarea
        aria-invalid={Boolean(error)}
        className={cn(
          "min-h-24 rounded-xl border-border bg-card px-4 py-3 text-base placeholder:text-text-muted",
          error ? "border-destructive" : null
        )}
        disabled={disabled}
        id={registration.name}
        placeholder={placeholder}
        {...registration}
      />
      {error ? (
        <p className="text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
