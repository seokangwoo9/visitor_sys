"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AdminSearchFormProps {
  initialQuery: string;
  initialStatus: string;
}

export function AdminSearchForm({
  initialQuery,
  initialStatus,
}: AdminSearchFormProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    const query = String(formData.get("query") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim();
    const nextParams = new URLSearchParams(searchParams.toString());

    nextParams.delete("page");

    if (query) {
      nextParams.set("query", query);
    } else {
      nextParams.delete("query");
    }

    if (status) {
      nextParams.set("status", status);
    } else {
      nextParams.delete("status");
    }

    startTransition(() => {
      router.replace(`${pathname}?${nextParams.toString()}`);
    });
  }

  return (
    <form action={handleSubmit} className="grid gap-3 md:grid-cols-[1fr_12rem_auto]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-11 rounded-xl pl-9"
          defaultValue={initialQuery}
          name="query"
          placeholder="Search visitors"
        />
      </div>
      <select
        className="h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        defaultValue={initialStatus}
        name="status"
      >
        <option value="">All statuses</option>
        <option value="CHECKED_IN">Checked in</option>
        <option value="CHECKED_OUT">Checked out</option>
        <option value="EXPIRED">Expired</option>
      </select>
      <Button className="h-11 rounded-xl" disabled={isPending} type="submit">
        {isPending ? "Filtering" : "Filter"}
      </Button>
    </form>
  );
}
