import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminPaginationProps {
  customFrom?: string;
  customTo?: string;
  dateFilter?: string;
  page: number;
  pageSize: number;
  section?: string;
  sort?: string;
  total: number;
  query: string;
  status: string;
}

export function AdminPagination({
  customFrom = "",
  customTo = "",
  dateFilter = "",
  page,
  pageSize,
  section = "visitors",
  sort = "",
  total,
  query,
  status,
}: AdminPaginationProps) {
  const pageCount = Math.max(Math.ceil(total / pageSize), 1);
  const previousPage = Math.max(page - 1, 1);
  const nextPage = Math.min(page + 1, pageCount);

  return (
    <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <p>
        Page {page} of {pageCount} · {total} visitor records
      </p>
      <div className="flex gap-2">
        <Link
          aria-disabled={page <= 1}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "rounded-xl",
            page <= 1 && "pointer-events-none opacity-50"
          )}
          href={buildPageHref({
            customFrom,
            customTo,
            dateFilter,
            page: previousPage,
            query,
            section,
            sort,
            status,
          })}
        >
          Previous
        </Link>
        <Link
          aria-disabled={page >= pageCount}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "rounded-xl",
            page >= pageCount && "pointer-events-none opacity-50"
          )}
          href={buildPageHref({
            customFrom,
            customTo,
            dateFilter,
            page: nextPage,
            query,
            section,
            sort,
            status,
          })}
        >
          Next
        </Link>
      </div>
    </div>
  );
}

function buildPageHref({
  customFrom,
  customTo,
  dateFilter,
  page,
  query,
  section,
  sort,
  status,
}: {
  customFrom: string;
  customTo: string;
  dateFilter: string;
  page: number;
  query: string;
  section: string;
  sort: string;
  status: string;
}): string {
  const params = new URLSearchParams();

  params.set("section", section);
  params.set("page", String(page));

  if (query) {
    params.set("query", query);
  }

  if (status) {
    params.set("status", status);
  }

  if (dateFilter) {
    params.set("date", dateFilter);
  }

  if (sort) {
    params.set("sort", sort);
  }

  if (customFrom) {
    params.set("from", customFrom);
  }

  if (customTo) {
    params.set("to", customTo);
  }

  return `/admin?${params.toString()}`;
}
