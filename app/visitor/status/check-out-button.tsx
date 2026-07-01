"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CheckOutButton() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  async function handleCheckOut() {
    setErrorMessage("");
    setIsCheckingOut(true);

    const response = await fetch("/api/visitor/check-out", {
      method: "POST",
    });

    setIsCheckingOut(false);

    if (!response.ok) {
      setErrorMessage("Unable to check out. Please try again.");
      return;
    }

    router.replace("/visitor/status?checkedOut=1");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <Button
        className="h-14 w-full rounded-2xl bg-visitor-ink text-base font-bold text-primary-foreground shadow-xl shadow-visitor-ink/20 hover:bg-visitor-ink/90"
        disabled={isCheckingOut}
        onClick={handleCheckOut}
        type="button"
      >
        {isCheckingOut ? (
          <>
            <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
            Checking out
          </>
        ) : (
          <>
            <LogOut className="size-5" aria-hidden="true" />
            Check out
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
