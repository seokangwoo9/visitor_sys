import { ShieldCheck } from "lucide-react";
import { connection } from "next/server";

import { getActiveSafetyAcknowledgmentPolicy } from "@/services/safety-acknowledgment-service";

import { VisitorRegistrationForm } from "./visitor-registration-form";

export async function RegistrationPageContent() {
  await connection();

  const safetyAcknowledgment = await getActiveSafetyAcknowledgmentPolicy();

  return (
    <main className="min-h-screen bg-register-page px-4 py-8 text-text-primary sm:px-6">
      <div className="mx-auto flex w-full max-w-102 flex-col gap-5">
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-visitor-success-soft text-visitor-success-deep">
              <ShieldCheck className="size-4" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-text-muted">
                TOE Visitor Management System
              </p>
              <p className="text-xs font-semibold text-visitor-ink">
                Visitor Registration
              </p>
            </div>
          </div>
          <h1 className="mt-4 text-xl font-semibold leading-snug text-visitor-ink">
            Check in with your visit details
          </h1>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Please complete the secure registration form before entering the premises.
          </p>
        </section>

        <VisitorRegistrationForm safetyAcknowledgment={safetyAcknowledgment} />
      </div>
    </main>
  );
}
