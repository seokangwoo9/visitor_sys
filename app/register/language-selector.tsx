"use client";

import { Languages } from "lucide-react";

import { useLanguage } from "@/lib/i18n/language-context";
import { languages, type Language } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="mb-6 rounded-xl bg-card px-5 py-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-visitor-success-soft text-visitor-success-deep">
          <Languages className="size-3.5" aria-hidden={true} />
        </div>
        <h2 className="text-sm font-semibold text-visitor-ink">
          {t("selectLanguage")}
        </h2>
      </div>
      <div className="flex gap-2">
        {languages.map((lang) => (
          <button
            key={lang.code}
            className={cn(
              "flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition",
              language === lang.code
                ? "bg-visitor-success text-white"
                : "bg-bg-base text-text-secondary hover:bg-bg-subtle"
            )}
            onClick={() => setLanguage(lang.code as Language)}
            type="button"
          >
            {lang.nativeName}
          </button>
        ))}
      </div>
    </div>
  );
}
