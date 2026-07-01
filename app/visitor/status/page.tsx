import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { Check, CheckCircle2, Clock, ShieldCheck } from "lucide-react";

import {
  decodeVisitorSessionCookie,
  VISITOR_SESSION_COOKIE_NAME,
} from "@/lib/visitor-session";
import { cn } from "@/lib/utils";
import { getActiveVisitorSession } from "@/services/visitor-session-service";

import { CheckOutButton } from "./check-out-button";

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
      <section className="w-full max-w-[25.5rem] overflow-hidden rounded-3xl bg-card shadow-2xl shadow-visitor-success/10">
        <div className="bg-visitor-success px-6 pb-8 pt-8 text-primary-foreground">
          <div className="flex items-start justify-between gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary-foreground/20">
              <ShieldCheck className="size-7" aria-hidden="true" />
            </div>
            <div className="rounded-3xl bg-primary-foreground px-5 py-2 text-xs font-bold uppercase text-visitor-success-deep">
              Checked In
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <p className="text-sm font-bold uppercase">
              Welcome
            </p>
            <div className="space-y-3">
              <h1 className="text-2xl font-bold">{activeSession.fullName}</h1>
              <p className="flex items-center gap-2 text-base">
                <CheckCircle2 className="size-5" aria-hidden="true" />
                Checked in successfully
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-6 py-6">
          <div className="rounded-3xl border border-visitor-success/10 bg-visitor-success-soft px-5 py-6 text-center">
            <p className="text-xs font-bold uppercase text-visitor-success-deep">
              Status
            </p>
            <p className="mt-3 text-3xl font-extrabold uppercase text-visitor-success-deep">
              Checked In
            </p>
          </div>

          <DetailPanel className="col-span-full">
            <div className="flex items-center gap-2 text-sm font-semibold text-text-muted">
              <Clock className="size-4" aria-hidden="true" />
              Check In Time
            </div>
            <p className="mt-2 text-base font-bold text-visitor-ink">
              {formatDateTime(activeSession.checkInAt)}
            </p>
          </DetailPanel>

          <div className="grid grid-cols-2 gap-3">
            <DetailPanel>
              <p className="text-sm font-semibold text-text-muted">Company</p>
              <p className="mt-2 text-base font-bold text-visitor-ink">
                {activeSession.companyName}
              </p>
            </DetailPanel>
            <DetailPanel>
              <p className="text-sm font-semibold text-text-muted">People</p>
              <p className="mt-2 text-base font-bold text-visitor-ink">
                {activeSession.partySize}
              </p>
            </DetailPanel>
          </div>

          <DetailPanel>
            <p className="text-sm font-semibold text-text-muted">Meeting</p>
            <p className="mt-2 text-base font-bold text-visitor-ink">
              {activeSession.hostName}
            </p>
          </DetailPanel>

          <DetailPanel>
            <p className="text-sm font-semibold text-text-muted">Visitor Pass</p>
            <p className="mt-2 text-xl font-extrabold text-visitor-ink">
              {activeSession.visitorPassId}
            </p>
          </DetailPanel>

          <CheckOutButton />
        </div>
      </section>
    </main>
  );
}

function CheckedOutCard() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-visitor-page px-4 py-8 text-text-primary">
      <section className="w-full max-w-md rounded-3xl bg-card px-7 py-8 text-center shadow-2xl shadow-visitor-success/10 sm:px-10">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-visitor-success-soft">
          <div className="flex size-11 items-center justify-center rounded-full border-4 border-visitor-success-deep text-visitor-success-deep">
            <Check className="size-6 stroke-[4]" aria-hidden="true" />
          </div>
        </div>
        <p className="mt-8 text-xs font-bold uppercase text-visitor-success-deep">
          Checked Out Successfully
        </p>
        <h1 className="mt-5 text-3xl font-bold text-visitor-ink">
          Thank you for your visit
        </h1>
        <p className="mx-auto mt-5 max-w-sm text-base leading-8 text-text-secondary">
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
      <section className="w-full max-w-md rounded-3xl bg-card px-7 py-8 text-center shadow-2xl shadow-visitor-success/10 sm:px-10">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Clock className="size-8" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-visitor-ink">
          No active visit
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-base leading-8 text-text-secondary">
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
    <div className={cn("rounded-2xl bg-visitor-surface p-4", className)}>
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
