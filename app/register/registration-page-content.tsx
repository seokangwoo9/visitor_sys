"use client";

import { ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { useLanguage } from "@/lib/i18n/language-context";
import type { SafetyAcknowledgmentPolicy, PdpaConsentPolicy } from "@/types/visitor";

import { LanguageSelector } from "./language-selector";
import { VisitorRegistrationForm } from "./visitor-registration-form";

export function RegistrationPageContent() {
  const { t } = useLanguage();
  const [safetyAcknowledgment, setSafetyAcknowledgment] =
    useState<SafetyAcknowledgmentPolicy | null>(null);
  const [pdpaConsent, setPdpaConsent] = useState<PdpaConsentPolicy | null>(null);

  useEffect(() => {
    async function loadPolicies() {
      const [safetyResponse, pdpaResponse] = await Promise.all([
        fetch("/api/visitor/safety-acknowledgment"),
        fetch("/api/visitor/pdpa-consent"),
      ]);

      if (safetyResponse.ok) {
        const data = (await safetyResponse.json()) as SafetyAcknowledgmentPolicy;
        setSafetyAcknowledgment(data);
      }

      if (pdpaResponse.ok) {
        const data = (await pdpaResponse.json()) as PdpaConsentPolicy;
        setPdpaConsent(data);
      }
    }

    loadPolicies();
  }, []);

  if (!safetyAcknowledgment || !pdpaConsent) {
    return null;
  }

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
                TOMY Visitor Management System
              </p>
              <p className="text-xs font-semibold text-visitor-ink">
                {t("pageTitle")}
              </p>
            </div>
          </div>
          <h1 className="mt-4 text-xl font-semibold leading-snug text-visitor-ink">
            {t("pageSubtitle")}
          </h1>
        </section>

        <LanguageSelector />

        <VisitorRegistrationForm
          safetyAcknowledgment={safetyAcknowledgment}
          pdpaConsent={pdpaConsent}
        />
      </div>
    </main>
  );
}
