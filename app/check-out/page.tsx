import { LogOut } from "lucide-react";

import { ActiveVisitCheckOutForm } from "./active-visit-check-out-form";

export default async function CheckOutPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-visitor-page px-4 py-8 text-text-primary">
      <section className="w-full max-w-102 rounded-2xl bg-card px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-visitor-success-soft text-visitor-success-deep">
            <LogOut className="size-4" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-text-muted">
              TOE Visitor Management System
            </p>
            <p className="text-xs font-semibold text-visitor-ink">Visitor Check Out</p>
          </div>
        </div>
        <h1 className="mt-4 text-xl font-semibold text-visitor-ink">
          Find your active visit
        </h1>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          Enter the phone number used during check in to confirm your check out.
        </p>

        <div className="mt-5">
          <ActiveVisitCheckOutForm />
        </div>
      </section>
    </main>
  );
}
