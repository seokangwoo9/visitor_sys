"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AdminSettingsFormProps {
  autoExpireHours: number;
  overdueThresholdHours: number;
}

export function AdminSettingsForm({
  autoExpireHours,
  overdueThresholdHours,
}: AdminSettingsFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setMessage("");

    const response = await fetch("/api/admin/settings", {
      method: "POST",
      body: JSON.stringify({
        overdueThresholdHours: Number(formData.get("overdueThresholdHours")),
        autoExpireHours: Number(formData.get("autoExpireHours")),
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      setMessage("Unable to save settings.");
      return;
    }

    setMessage("Settings saved.");
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-text-secondary">
            Overdue Threshold Hours
          </span>
          <Input
            className="h-12 rounded-2xl bg-bg-base"
            defaultValue={overdueThresholdHours}
            min={1}
            name="overdueThresholdHours"
            type="number"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-text-secondary">
            Auto-Expire Hours
          </span>
          <Input
            className="h-12 rounded-2xl bg-bg-base"
            defaultValue={autoExpireHours}
            min={1}
            name="autoExpireHours"
            type="number"
          />
        </label>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-secondary">
          Default baseline: overdue 12h, auto-expire 24h.
        </p>
        <Button
          className="h-12 rounded-2xl bg-visitor-success px-7 shadow-lg shadow-visitor-success/20 hover:bg-visitor-success-deep"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Saving" : "Save Settings"}
        </Button>
      </div>
      {message ? (
        <p className="text-sm font-semibold text-text-secondary" role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
}
