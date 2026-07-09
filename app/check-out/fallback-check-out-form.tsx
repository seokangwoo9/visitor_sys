"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle, Search } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const fallbackLookupResponseSchema = z.object({
  ok: z.boolean(),
  message: z.string().optional(),
  fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
  data: z
    .object({
      fullName: z.string(),
      companyName: z.string(),
      partySize: z.number(),
      visitorPassId: z.string(),
      checkInAt: z.string(),
    })
    .optional(),
});

interface FallbackCheckoutMatch {
  fullName: string;
  companyName: string;
  partySize: number;
  visitorPassId: string;
  checkInAt: string;
}

interface FallbackCheckoutValues {
  visitorPassId: string;
  contactNumber: string;
}

export function FallbackCheckOutForm() {
  const router = useRouter();
  const [values, setValues] = useState<FallbackCheckoutValues>({
    visitorPassId: "",
    contactNumber: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FallbackCheckoutValues, string>>>({});
  const [message, setMessage] = useState("");
  const [match, setMatch] = useState<FallbackCheckoutMatch | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  async function handleLookup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setFieldErrors({});
    setMatch(null);
    setIsLookingUp(true);

    const response = await fetch("/api/visitor/check-out/fallback/lookup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });
    const payload = await readFallbackResponse(response);

    setIsLookingUp(false);

    if (!response.ok || !payload?.data) {
      setFieldErrors(extractFieldErrors(payload));
      setMessage(payload?.message ?? "Unable to find an active visit. Please contact the front desk.");
      return;
    }

    setMatch(payload.data);
  }

  async function handleConfirmCheckOut() {
    setMessage("");
    setIsCheckingOut(true);

    const response = await fetch("/api/visitor/check-out/fallback/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });
    const payload = await readFallbackResponse(response);

    setIsCheckingOut(false);

    if (!response.ok) {
      setMessage(payload?.message ?? "Unable to check out. Please contact the front desk.");
      router.refresh();
      return;
    }

    router.replace("/visitor/status?checkedOut=1");
    router.refresh();
  }

  return (
    <div className="space-y-5 text-left">
      <form className="space-y-4" onSubmit={handleLookup}>
        <Field
          disabled={isLookingUp || isCheckingOut}
          error={fieldErrors.visitorPassId}
          label="Visitor Pass ID"
          onChange={(value) => {
            setValues((currentValues) => ({ ...currentValues, visitorPassId: value }));
          }}
          placeholder="Enter your pass number"
          value={values.visitorPassId}
        />
        <Field
          disabled={isLookingUp || isCheckingOut}
          error={fieldErrors.contactNumber}
          label="Contact Number"
          onChange={(value) => {
            setValues((currentValues) => ({ ...currentValues, contactNumber: value }));
          }}
          placeholder="Enter the phone number used at check in"
          type="tel"
          value={values.contactNumber}
        />

        <Button
          className="h-14 w-full rounded-2xl bg-visitor-ink text-base font-bold text-primary-foreground shadow-xl shadow-visitor-ink/20 hover:bg-visitor-ink/90"
          disabled={isLookingUp || isCheckingOut}
          type="submit"
        >
          {isLookingUp ? (
            <>
              <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
              Finding visit
            </>
          ) : (
            <>
              <Search className="size-5" aria-hidden="true" />
              Find Active Visit
            </>
          )}
        </Button>
      </form>

      {match ? (
        <div className="space-y-4 rounded-3xl border border-visitor-success/10 bg-visitor-success-soft p-5 text-center">
          <p className="text-xs font-bold uppercase text-visitor-success-deep">
            Active Visit Found
          </p>
          <h2 className="text-xl font-bold text-visitor-ink">{match.fullName}</h2>
          <div className="grid grid-cols-2 gap-3 text-left">
            <MatchPanel label="Company" value={match.companyName} />
            <MatchPanel label="People" value={String(match.partySize)} />
            <MatchPanel label="Visitor Pass" value={match.visitorPassId} />
            <MatchPanel label="Check In" value={formatDateTime(match.checkInAt)} />
          </div>
          <Button
            className="h-14 w-full rounded-2xl bg-visitor-success text-base font-bold text-primary-foreground shadow-xl shadow-visitor-success/20 hover:bg-visitor-success-deep"
            disabled={isCheckingOut || isLookingUp}
            onClick={handleConfirmCheckOut}
            type="button"
          >
            {isCheckingOut ? (
              <>
                <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
                Checking out
              </>
            ) : (
              <>
                <CheckCircle2 className="size-5" aria-hidden="true" />
                Confirm Check Out
              </>
            )}
          </Button>
        </div>
      ) : null}

      {message ? (
        <p className="text-center text-sm font-medium text-destructive" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}

interface FieldProps {
  disabled: boolean;
  error?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  value: string;
}

function Field({
  disabled,
  error,
  label,
  onChange,
  placeholder,
  type = "text",
  value,
}: FieldProps) {
  const id = label.toLowerCase().replaceAll(" ", "-");

  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-text-secondary" htmlFor={id}>
        {label}
      </Label>
      <Input
        aria-invalid={Boolean(error)}
        className={cn(
          "h-14 rounded-2xl border-border bg-card px-4 text-base placeholder:text-text-muted",
          error ? "border-destructive" : null
        )}
        disabled={disabled}
        id={id}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      {error ? (
        <p className="text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function MatchPanel({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-card p-4">
      <p className="text-xs font-bold uppercase text-text-muted">{label}</p>
      <p className="mt-2 text-sm font-bold text-visitor-ink">{value}</p>
    </div>
  );
}

async function readFallbackResponse(response: Response) {
  const payload: unknown = await response.json().catch(() => null);
  const parsedPayload = fallbackLookupResponseSchema.safeParse(payload);

  return parsedPayload.success ? parsedPayload.data : null;
}

function extractFieldErrors(
  payload: z.infer<typeof fallbackLookupResponseSchema> | null
): Partial<Record<keyof FallbackCheckoutValues, string>> {
  return {
    visitorPassId: payload?.fieldErrors?.visitorPassId?.[0],
    contactNumber: payload?.fieldErrors?.contactNumber?.[0],
  };
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
