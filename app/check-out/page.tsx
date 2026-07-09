import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { CircleAlert, Clock, LogOut, ShieldCheck } from "lucide-react";

import {
  decodeVisitorSessionCookie,
  VISITOR_SESSION_COOKIE_NAME,
} from "@/lib/visitor-session";
import { getActiveVisitorSession } from "@/services/visitor-session-service";

import { ConfirmCheckOutButton } from "./confirm-check-out-button";
import { FallbackCheckOutForm } from "./fallback-check-out-form";

export default async function CheckOutPage() {
  const cookieStore = await cookies();
  const sessionCookie = decodeVisitorSessionCookie(
    cookieStore.get(VISITOR_SESSION_COOKIE_NAME)?.value
  );
  const activeSession = await getActiveVisitorSession(sessionCookie);

  if (!activeSession) {
    return <NoActiveCheckoutSession />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-visitor-page px-4 py-8 text-text-primary">
      <section className="w-full max-w-[25.5rem] overflow-hidden rounded-3xl bg-card shadow-2xl shadow-visitor-success/10">
        <div className="bg-visitor-ink px-6 pb-8 pt-8 text-primary-foreground">
          <div className="flex items-start justify-between gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary-foreground/15">
              <LogOut className="size-7" aria-hidden="true" />
            </div>
            <div className="rounded-3xl bg-primary-foreground px-5 py-2 text-xs font-bold uppercase text-visitor-ink">
              Check Out
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <p className="text-sm font-bold uppercase text-primary-foreground/80">
              Leaving Premises
            </p>
            <div className="space-y-3">
              <h1 className="text-2xl font-bold">{activeSession.fullName}</h1>
              <p className="flex items-center gap-2 text-base text-primary-foreground/85">
                <ShieldCheck className="size-5" aria-hidden="true" />
                Confirm your visitor check out
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-6 py-6">
          <div className="rounded-3xl border border-visitor-success/10 bg-visitor-success-soft px-5 py-6 text-center">
            <p className="text-xs font-bold uppercase text-visitor-success-deep">
              Active Visit Found
            </p>
            <p className="mt-3 text-3xl font-extrabold uppercase text-visitor-success-deep">
              Ready
            </p>
          </div>

          <DetailPanel>
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
            <p className="text-sm font-semibold text-text-muted">Visitor Pass</p>
            <p className="mt-2 text-xl font-extrabold text-visitor-ink">
              {activeSession.visitorPassId}
            </p>
          </DetailPanel>

          <ConfirmCheckOutButton />
        </div>
      </section>
    </main>
  );
}

function NoActiveCheckoutSession() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-visitor-page px-4 py-8 text-text-primary">
      <section className="w-full max-w-[25.5rem] rounded-3xl bg-card px-6 py-7 shadow-2xl shadow-visitor-success/10">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <CircleAlert className="size-8" aria-hidden="true" />
        </div>
        <div className="text-center">
          <p className="mt-8 text-xs font-bold uppercase text-visitor-success-deep">
            Session Not Found
          </p>
          <h1 className="mt-5 text-3xl font-bold text-visitor-ink">
            Find your active visit
          </h1>
          <p className="mx-auto mt-5 max-w-sm text-base leading-8 text-text-secondary">
            Enter the same visitor pass ID and contact number used during check in.
          </p>
        </div>

        <div className="mt-6">
          <FallbackCheckOutForm />
        </div>
      </section>
    </main>
  );
}

function DetailPanel({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="rounded-2xl bg-visitor-surface p-4">{children}</div>;
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
