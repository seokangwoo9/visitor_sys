import { VisitorRegistrationForm } from "./visitor-registration-form";

export function RegistrationPageContent() {
  return (
    <main className="min-h-screen bg-register-page px-4 py-8 text-text-primary sm:px-6">
      <div className="mx-auto flex w-full max-w-[25.5rem] flex-col gap-6">
        <section className="rounded-[2rem] bg-visitor-ink px-6 py-7 text-primary-foreground shadow-2xl shadow-register-shadow/20">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-foreground/80">
            Visitor Registration
          </p>
          <h1 className="mt-5 text-3xl font-bold leading-tight">
            Check in with your visit details
          </h1>
          <p className="mt-4 text-sm leading-7 text-primary-foreground/85">
            Please complete the secure registration form before entering the premises.
          </p>
        </section>

        <VisitorRegistrationForm />
      </div>
    </main>
  );
}
