import { LanguageProvider } from "@/lib/i18n/language-context";

import { RegistrationPageContent } from "./registration-page-content";

export default function RegisterPage() {
  return (
    <LanguageProvider>
      <RegistrationPageContent />
    </LanguageProvider>
  );
}
