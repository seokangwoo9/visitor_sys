import { LanguageProvider } from "@/lib/i18n/language-context";
import { RegistrationPageContent } from "@/app/register/registration-page-content";

export default function CheckInPage() {
  return (
    <LanguageProvider>
      <RegistrationPageContent />
    </LanguageProvider>
  );
}
