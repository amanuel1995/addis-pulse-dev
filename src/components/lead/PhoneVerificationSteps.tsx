import type { PassengerLocale } from "@/lib/passenger-flow/i18n";

const copy: Record<PassengerLocale, { details: string; verify: string; continue: string }> = {
  en: { details: "Your details", verify: "Verify phone", continue: "Continue to phone verification" },
  am: { details: "መረጃዎ", verify: "ስልክ ያረጋግጡ", continue: "ወደ ስልክ ማረጋገጫ ይቀጥሉ" },
  om: { details: "Odeeffannoo kee", verify: "Bilbila mirkaneessi", continue: "Gara mirkaneessa bilbilaatti itti fufi" },
  ar: { details: "بياناتك", verify: "تحقق من الهاتف", continue: "متابعة للتحقق من الهاتف" },
};

export function phoneVerificationCopy(locale: PassengerLocale) {
  return copy[locale];
}

export function PhoneVerificationSteps({ locale, activeStep }: { locale: PassengerLocale; activeStep: 1 | 2 }) {
  const text = copy[locale];
  return <ol aria-label="Phone verification progress" className="grid grid-cols-[1fr_auto_1fr] items-start gap-3 text-center text-xs font-bold">
    <li className={activeStep >= 1 ? "text-[var(--passenger-primary)]" : "text-[var(--passenger-muted)]"}><span className="mx-auto mb-2 grid size-8 place-items-center rounded-full bg-[var(--passenger-primary)] text-white">1</span>{text.details}</li>
    <li aria-hidden="true" className="mt-4 h-px w-10 bg-[var(--passenger-line)] sm:w-16" />
    <li className={activeStep >= 2 ? "text-[var(--passenger-primary)]" : "text-[var(--passenger-muted)]"}><span className={`mx-auto mb-2 grid size-8 place-items-center rounded-full ${activeStep >= 2 ? "bg-[var(--passenger-primary)] text-white" : "border border-[var(--passenger-line)] bg-white"}`}>2</span>{text.verify}</li>
  </ol>;
}
