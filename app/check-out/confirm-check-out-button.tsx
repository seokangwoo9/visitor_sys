"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ConfirmCheckOutButton() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  async function handleConfirmCheckOut() {
    setErrorMessage("");
    setIsCheckingOut(true);

    const response = await fetch("/api/visitor/check-out", {
      method: "POST",
    });

    setIsCheckingOut(false);

    if (!response.ok) {
      setErrorMessage("No active visitor session was found. Please contact the front desk.");
      router.refresh();
      return;
    }

    router.replace("/visitor/status?checkedOut=1");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <Button
        className="h-14 w-full rounded-2xl bg-visitor-success text-base font-bold text-primary-foreground shadow-xl shadow-visitor-success/20 hover:bg-visitor-success-deep"
        disabled={isCheckingOut}
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
      {errorMessage ? (
        <p className="text-sm font-medium text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
