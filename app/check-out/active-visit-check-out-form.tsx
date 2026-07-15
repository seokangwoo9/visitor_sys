"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle, Search } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const checkoutLookupResponseSchema = z.object({
  ok: z.boolean(),
  message: z.string().optional(),
  fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
  data: z
    .object({
      fullName: z.string(),
      companyName: z.string(),
      checkInAt: z.string(),
    })
    .optional(),
});

interface ActiveVisitMatch {
  fullName: string;
  companyName: string;
  checkInAt: string;
}

interface CheckoutSearchValues {
  contactNumber: string;
}

export function ActiveVisitCheckOutForm() {
  const router = useRouter();
  const [values, setValues] = useState<CheckoutSearchValues>({
    contactNumber: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CheckoutSearchValues, string>>>({});
  const [message, setMessage] = useState("");
  const [match, setMatch] = useState<ActiveVisitMatch | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  async function handleLookup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setFieldErrors({});
    setMatch(null);
    setIsLookingUp(true);

    const response = await fetch("/api/visitor/check-out/lookup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });
    const payload = await readCheckoutResponse(response);

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

    const response = await fetch("/api/visitor/check-out/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });
    const payload = await readCheckoutResponse(response);

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
    <div className="space-y-4 text-left">
      <form className="space-y-4" onSubmit={handleLookup}>
        <Field
          disabled={isLookingUp || isCheckingOut}
          error={fieldErrors.contactNumber}
          label="Phone Number"
          onChange={(value) => {
            setValues({ contactNumber: value });
          }}
          placeholder="Enter the phone number used at check in"
          type="tel"
          value={values.contactNumber}
        />

        <Button
          className="h-12 w-full rounded-xl bg-visitor-success text-base font-semibold text-primary-foreground hover:bg-visitor-success-deep"
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
        <div className="space-y-3 rounded-xl border border-visitor-success/10 bg-visitor-success-soft p-4 text-center">
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-text-muted">
            Active Visit Found
          </p>
          <h2 className="text-lg font-semibold text-visitor-ink">{match.fullName}</h2>
          <div className="grid gap-2 text-left">
            <MatchPanel label="Company" value={match.companyName} />
            <MatchPanel label="Check In" value={formatDateTime(match.checkInAt)} />
          </div>
          <Button
            className="h-12 w-full rounded-xl bg-visitor-success text-base font-semibold text-primary-foreground hover:bg-visitor-success-deep"
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
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-text-secondary" htmlFor={id}>
        {label}
      </Label>
      <Input
        aria-invalid={Boolean(error)}
        className={cn(
          "h-12 rounded-xl border-border bg-card px-4 text-base placeholder:text-text-muted",
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
  className,
  label,
  value,
}: {
  className?: string;
  label: string;
  value: string;
}) {
  return (
    <div className={cn("rounded-lg bg-card p-3", className)}>
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-text-muted">{label}</p>
      <p className="mt-1.5 text-sm font-semibold text-visitor-ink">{value}</p>
    </div>
  );
}

async function readCheckoutResponse(response: Response) {
  const payload: unknown = await response.json().catch(() => null);
  const parsedPayload = checkoutLookupResponseSchema.safeParse(payload);

  return parsedPayload.success ? parsedPayload.data : null;
}

function extractFieldErrors(
  payload: z.infer<typeof checkoutLookupResponseSchema> | null
): Partial<Record<keyof CheckoutSearchValues, string>> {
  return {
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
