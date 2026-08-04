import { LanguageProvider } from "@/lib/i18n/language-context";

import { RegistrationPageContent } from "./register/registration-page-content";

export default function Home() {
  return (
    <LanguageProvider>
      <RegistrationPageContent />
    </LanguageProvider>
  );
}
