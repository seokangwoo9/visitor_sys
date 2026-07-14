"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SafetyAcknowledgmentPolicy } from "@/types/visitor";

interface AdminSafetyAcknowledgmentFormProps {
  safetyAcknowledgment: SafetyAcknowledgmentPolicy;
}

export function AdminSafetyAcknowledgmentForm({
  safetyAcknowledgment,
}: AdminSafetyAcknowledgmentFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setMessage("");

    const response = await fetch("/api/admin/safety-acknowledgment", {
      method: "POST",
      body: JSON.stringify({
        title: String(formData.get("title") ?? ""),
        content: String(formData.get("content") ?? ""),
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      setMessage("Unable to publish safety acknowledgment.");
      return;
    }

    setMessage("Safety acknowledgment published.");
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="grid gap-4">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-text-secondary">
            Form Title
          </span>
          <Input
            className="h-12 rounded-2xl bg-bg-base"
            defaultValue={safetyAcknowledgment.title}
            maxLength={200}
            name="title"
            required
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-text-secondary">
            Full Text
          </span>
          <Textarea
            className="min-h-72 rounded-2xl bg-bg-base px-4 py-4 text-sm leading-7"
            defaultValue={safetyAcknowledgment.content}
            maxLength={10000}
            name="content"
            required
          />
        </label>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-secondary">
          Saving publishes this text for new visitor check-ins.
        </p>
        <Button
          className="h-12 rounded-2xl bg-visitor-success px-7 shadow-lg shadow-visitor-success/20 hover:bg-visitor-success-deep"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Publishing" : "Publish Version"}
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
