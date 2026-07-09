import { LogOut } from "lucide-react";

import { ActiveVisitCheckOutForm } from "./active-visit-check-out-form";

export default async function CheckOutPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-visitor-page px-4 py-8 text-text-primary">
      <section className="w-full max-w-[25.5rem] rounded-3xl bg-card px-6 py-7 shadow-2xl shadow-visitor-success/10">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <LogOut className="size-8" aria-hidden="true" />
        </div>
        <div className="text-center">
          <p className="mt-8 text-xs font-bold uppercase text-visitor-success-deep">
            Visitor Check Out
          </p>
          <h1 className="mt-5 text-3xl font-bold text-visitor-ink">
            Find your active visit
          </h1>
          <p className="mx-auto mt-5 max-w-sm text-base leading-8 text-text-secondary">
            Enter the phone number used during check in to confirm your check out.
          </p>
        </div>

        <div className="mt-6">
          <ActiveVisitCheckOutForm />
        </div>
      </section>
    </main>
  );
}
