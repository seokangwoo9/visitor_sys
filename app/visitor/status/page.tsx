import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { Check, CheckCircle2, Clock, ShieldCheck } from "lucide-react";

import {
  decodeVisitorSessionCookie,
  VISITOR_SESSION_COOKIE_NAME,
} from "@/lib/visitor-session";
import { cn } from "@/lib/utils";
import { getActiveVisitorSession } from "@/services/visitor-session-service";

export default async function VisitorStatusPage(props: PageProps<"/visitor/status">) {
  const searchParams = await props.searchParams;
  const checkedOut = searchParams.checkedOut === "1";

  if (checkedOut) {
    return <CheckedOutCard />;
  }

  const cookieStore = await cookies();
  const sessionCookie = decodeVisitorSessionCookie(
    cookieStore.get(VISITOR_SESSION_COOKIE_NAME)?.value
  );
  const activeSession = await getActiveVisitorSession(sessionCookie);

  if (!activeSession) {
    return <NoActiveVisitCard />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-visitor-page px-4 py-8 text-text-primary">
      <section className="w-full max-w-102 overflow-hidden rounded-2xl bg-card">
        <div className="bg-visitor-success px-6 pb-7 pt-6 text-primary-foreground">
          <div className="flex items-start justify-between gap-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary-foreground/20">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </div>
            <div className="rounded-lg bg-primary-foreground px-3 py-1.5 text-[11px] font-semibold uppercase text-visitor-success-deep">
              Checked In
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-primary-foreground/70">
              Welcome
            </p>
            <div className="space-y-2">
              <h1 className="text-xl font-semibold">{activeSession.fullName}</h1>
              <p className="flex items-center gap-2 text-sm text-primary-foreground/90">
                <CheckCircle2 className="size-4" aria-hidden="true" />
                Checked in successfully
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 px-6 py-5">
          <div className="rounded-xl border border-visitor-success/10 bg-visitor-success-soft px-5 py-5 text-center">
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-text-muted">
              Status
            </p>
            <p className="mt-2 text-2xl font-bold uppercase text-visitor-success-deep">
              Checked In
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card px-5 py-4 text-center">
            <p className="text-sm leading-6 text-text-secondary">
              Please scan the check-out QR code at the exit before leaving the premises.
            </p>
          </div>

          <DetailPanel className="col-span-full">
            <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
              <Clock className="size-3.5" aria-hidden="true" />
              Check In Time
            </div>
            <p className="mt-1.5 text-sm font-semibold text-visitor-ink">
              {formatDateTime(activeSession.checkInAt)}
            </p>
          </DetailPanel>

          <DetailPanel>
            <p className="text-xs font-medium text-text-muted">Company</p>
            <p className="mt-1.5 text-sm font-semibold text-visitor-ink">
              {activeSession.companyName}
            </p>
          </DetailPanel>

          <DetailPanel>
            <p className="text-xs font-medium text-text-muted">Meeting</p>
            <p className="mt-1.5 text-sm font-semibold text-visitor-ink">
              {activeSession.hostName}
            </p>
          </DetailPanel>
        </div>
      </section>
    </main>
  );
}

function CheckedOutCard() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-visitor-page px-4 py-8 text-text-primary">
      <section className="w-full max-w-md rounded-2xl bg-card px-7 py-8 text-center sm:px-10">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-visitor-success-soft text-visitor-success-deep">
          <Check className="size-7 stroke-3" aria-hidden="true" />
        </div>
        <p className="mt-6 text-[10px] font-medium uppercase tracking-[0.08em] text-text-muted">
          Checked Out Successfully
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-visitor-ink">
          Thank you for your visit
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-text-secondary">
          Your visitor session has ended. Please scan the QR code again if you
          need to register another visit.
        </p>
      </section>
    </main>
  );
}

function NoActiveVisitCard() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-visitor-page px-4 py-8 text-text-primary">
      <section className="w-full max-w-md rounded-2xl bg-card px-7 py-8 text-center sm:px-10">
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-bg-subtle text-text-muted">
          <Clock className="size-6" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold text-visitor-ink">
          No active visit
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-text-secondary">
          Please scan the QR code again if you need to register another visit.
        </p>
      </section>
    </main>
  );
}

function DetailPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl bg-visitor-surface p-4", className)}>
      {children}
    </div>
  );
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
