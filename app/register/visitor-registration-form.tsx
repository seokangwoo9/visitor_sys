"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ComponentType, ReactNode } from "react";
import { useForm, useWatch, type UseFormRegisterReturn } from "react-hook-form";
import {
  BookOpen,
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
import type { SafetyAcknowledgmentPolicy } from "@/types/visitor";
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
};

export function VisitorRegistrationForm({
  safetyAcknowledgment,
}: {
  safetyAcknowledgment: SafetyAcknowledgmentPolicy;
}) {
  const router = useRouter();
  const hasRestoredDraft = useRef(false);
  const [serverMessage, setServerMessage] = useState("");
  const initialValues: VisitorRegistrationFormInput = {
    ...defaultVisitorRegistrationValues,
    safetyAcknowledgmentVersionId: safetyAcknowledgment.id,
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
      });
    }

    queueMicrotask(() => {
      hasRestoredDraft.current = true;
    });
  }, [reset, safetyAcknowledgment.id]);

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

      setServerMessage(message ?? "Unable to register visitor. Please try again.");
      return;
    }

    clearVisitorRegistrationDraft(window.sessionStorage);
    router.replace("/visitor/status");
    router.refresh();
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(submitRegistration)}>
      <FormSection icon={UserRound} title="Personal Information">
        <Field
          autoComplete="name"
          disabled={isSubmitting}
          error={errors.fullName?.message}
          label={fieldLabels.fullName}
          placeholder="Enter your full name"
          registration={register("fullName")}
        />
        <Field
          disabled={isSubmitting}
          error={errors.identificationNumber?.message}
          label={fieldLabels.identificationNumber}
          placeholder="IC or passport number"
          registration={register("identificationNumber")}
        />
        <Field
          autoComplete="tel"
          disabled={isSubmitting}
          error={errors.contactNumber?.message}
          label={fieldLabels.contactNumber}
          placeholder="0123456789"
          registration={register("contactNumber")}
          type="tel"
        />
        <Field
          autoComplete="email"
          disabled={isSubmitting}
          error={errors.email?.message}
          label={fieldLabels.email}
          placeholder="you@company.com"
          registration={register("email")}
          type="email"
        />
      </FormSection>

      <FormSection icon={Car} title="Vehicle">
        <label className="flex h-14 items-center gap-3 rounded-2xl border border-border bg-bg-base px-4 text-sm font-medium text-text-secondary">
          <input
            aria-invalid={Boolean(errors.hasVehicle)}
            checked={!hasVehicle}
            className="size-5 rounded border-border-subtle bg-card text-visitor-success-deep"
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
          No Vehicle
        </label>
        <Field
          disabled={isSubmitting || !hasVehicle}
          error={errors.vehiclePlateNumber?.message}
          label={fieldLabels.vehiclePlateNumber}
          placeholder="ABC1234"
          registration={register("vehiclePlateNumber")}
        />
      </FormSection>

      <FormSection icon={UsersRound} title="Company">
        <Field
          autoComplete="organization"
          disabled={isSubmitting}
          error={errors.companyName?.message}
          label={fieldLabels.companyName}
          placeholder="Company name"
          registration={register("companyName")}
        />
        <TextAreaField
          disabled={isSubmitting}
          error={errors.purposeOfVisit?.message}
          label={fieldLabels.purposeOfVisit}
          placeholder="Briefly describe your visit purpose"
          registration={register("purposeOfVisit")}
        />
        <Field
          disabled={isSubmitting}
          error={errors.hostName?.message}
          label={fieldLabels.hostName}
          placeholder="Host or PIC name"
          registration={register("hostName")}
        />
      </FormSection>

      <FormSection icon={ShieldCheck} title="Safety Acknowledgment">
        <input type="hidden" {...register("safetyAcknowledgmentVersionId")} />
        <div className="rounded-2xl border border-border bg-bg-base p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-visitor-ink">
                {safetyAcknowledgment.title}
              </p>
            </div>
            <Dialog>
              <DialogTrigger
                render={
                  <button
                    className="inline-flex h-10 shrink-0 items-center gap-2 rounded-2xl border border-border bg-card px-3 text-xs font-bold text-visitor-success-deep transition hover:bg-visitor-success-soft"
                    type="button"
                  />
                }
              >
                <BookOpen className="size-4" aria-hidden="true" />
                Read
              </DialogTrigger>
              <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] overflow-y-auto rounded-[1.75rem] border border-border bg-card p-5 shadow-xl shadow-register-shadow/10 sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-visitor-ink">
                    {safetyAcknowledgment.title}
                  </DialogTitle>
                </DialogHeader>
                <div className="mt-4 whitespace-pre-wrap rounded-2xl bg-bg-base p-4 text-sm leading-7 text-text-secondary">
                  {safetyAcknowledgment.content}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <label className="flex items-start gap-3 rounded-2xl border border-border bg-bg-base px-4 py-4 text-sm font-medium text-text-secondary">
          <input
            aria-invalid={Boolean(errors.safetyAcknowledged)}
            className="mt-0.5 size-5 rounded border-border-subtle bg-card text-visitor-success-deep"
            disabled={isSubmitting}
            type="checkbox"
            {...register("safetyAcknowledged")}
          />
          <span>
            I acknowledge that I have read and agree to the Visitor Safety Acknowledgment and Indemnity Form.
          </span>
        </label>
        {errors.safetyAcknowledged?.message ? (
          <p className="text-sm font-medium text-destructive" role="alert">
            {errors.safetyAcknowledged.message}
          </p>
        ) : null}
      </FormSection>

      {serverMessage ? (
        <p className="text-sm font-medium text-destructive" role="alert">
          {serverMessage}
        </p>
      ) : null}

      <Button
        className="h-14 w-full rounded-2xl bg-visitor-success text-base font-bold shadow-xl shadow-visitor-success/20 hover:bg-visitor-success-deep"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? (
          <>
            <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
            Submitting
          </>
        ) : (
          "Submit Check In"
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
    <section className="rounded-[1.75rem] bg-card px-5 py-6 shadow-xl shadow-register-shadow/10">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-visitor-success-soft text-visitor-success-deep">
          <Icon className="size-5" aria-hidden={true} />
        </div>
        <h2 className="text-lg font-bold text-visitor-ink">{title}</h2>
      </div>
      <div className="space-y-5">{children}</div>
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
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-text-secondary" htmlFor={registration.name}>
        {label}
      </Label>
      <Input
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        className={cn(
          "h-14 rounded-2xl border-border bg-card px-4 text-base placeholder:text-text-muted",
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
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-text-secondary" htmlFor={registration.name}>
        {label}
      </Label>
      <Textarea
        aria-invalid={Boolean(error)}
        className={cn(
          "min-h-28 rounded-2xl border-border bg-card px-4 py-4 text-base placeholder:text-text-muted",
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
