"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AdminFilterFormProps {
  initialCustomFrom: string;
  initialCustomTo: string;
  initialDateFilter: string;
  initialQuery: string;
  initialSort: string;
  variant?: "standalone" | "embedded";
}

export function AdminFilterForm({
  initialCustomFrom,
  initialCustomTo,
  initialDateFilter,
  initialQuery,
  initialSort,
  variant = "standalone",
}: AdminFilterFormProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    const nextParams = new URLSearchParams(searchParams.toString());

    setParam(nextParams, "query", formData.get("query"));
    setParam(nextParams, "date", formData.get("date"));
    setParam(nextParams, "sort", formData.get("sort"));
    setParam(nextParams, "from", formData.get("from"));
    setParam(nextParams, "to", formData.get("to"));
    nextParams.delete("page");

    startTransition(() => {
      router.replace(`${pathname}?${nextParams.toString()}`);
    });
  }

  function handleReset() {
    const nextParams = new URLSearchParams(searchParams.toString());

    for (const key of ["query", "date", "sort", "from", "to", "page"]) {
      nextParams.delete(key);
    }

    startTransition(() => {
      router.replace(`${pathname}?${nextParams.toString()}`);
    });
  }

  return (
    <form
      action={handleSubmit}
      className={
        variant === "standalone"
          ? "grid gap-5 rounded-[1.75rem] border border-border bg-card p-5 lg:grid-cols-3"
          : "grid gap-5 lg:grid-cols-3"
      }
    >
      <label className="space-y-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
          <Search className="size-4 text-visitor-success-deep" aria-hidden="true" />
          Search Name, Company, Vehicle, PIC, Phone
        </span>
        <Input
          className="h-12 rounded-2xl bg-bg-base"
          defaultValue={initialQuery}
          name="query"
          placeholder="e.g. Ahmad, ACME, V1234"
        />
      </label>
      <label className="space-y-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
          <SlidersHorizontal className="size-4 text-visitor-success-deep" aria-hidden="true" />
          Date Filter
        </span>
        <select
          className="h-12 w-full rounded-2xl border border-input bg-bg-base px-4 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          defaultValue={initialDateFilter}
          name="date"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="all">All Time</option>
          <option value="custom">Custom Range</option>
        </select>
      </label>
      <label className="space-y-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
          <ArrowUpDown className="size-4 text-visitor-success-deep" aria-hidden="true" />
          Sort
        </span>
        <select
          className="h-12 w-full rounded-2xl border border-input bg-bg-base px-4 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          defaultValue={initialSort}
          name="sort"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="duration">Longest Duration</option>
        </select>
      </label>
      <label className="space-y-2">
        <span className="text-sm font-semibold text-text-secondary">Custom From</span>
        <Input
          className="h-12 rounded-2xl bg-bg-base"
          defaultValue={initialCustomFrom}
          name="from"
          type="date"
        />
      </label>
      <label className="space-y-2 lg:col-span-2">
        <span className="text-sm font-semibold text-text-secondary">Custom To</span>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <Input
            className="h-12 rounded-2xl bg-bg-base"
            defaultValue={initialCustomTo}
            name="to"
            type="date"
          />
          <Button
            className="h-12 rounded-2xl bg-visitor-success px-7 hover:bg-visitor-success-deep"
            disabled={isPending}
            type="submit"
          >
            {isPending ? "Applying" : "Apply"}
          </Button>
          <Button
            className="h-12 rounded-2xl px-7"
            disabled={isPending}
            onClick={handleReset}
            type="button"
            variant="outline"
          >
            Reset
          </Button>
        </div>
      </label>
    </form>
  );
}

function setParam(params: URLSearchParams, key: string, value: FormDataEntryValue | null) {
  const normalizedValue = String(value ?? "").trim();

  if (normalizedValue) {
    params.set(key, normalizedValue);
  } else {
    params.delete(key);
  }
}
