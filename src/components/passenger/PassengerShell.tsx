import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { passengerDictionary, passengerLocales, type PassengerLocale } from "@/lib/passenger-flow/i18n";

const RIDEPERK_LOGO_PATH = "/logo_forrp.webp";

export function PassengerShell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-[var(--passenger-background)] text-[var(--passenger-ink)]">{children}</div>;
}

export function CampaignFooter({ locale = "en" }: { locale?: PassengerLocale }) {
  const t = passengerDictionary(locale);
  return <footer className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-2 px-5 py-7 text-center text-sm text-[var(--passenger-muted)] sm:flex-row sm:gap-3"><RidePerkBrand compact /><span aria-hidden="true" className="hidden h-5 w-px bg-[var(--passenger-line)] sm:block" /><span className="inline-flex items-center gap-1.5"><ShieldCheck aria-hidden="true" className="size-4 text-[var(--passenger-primary)]" />{t.secureExperience}</span></footer>;
}

export function RidePerkBrand({ compact = false }: { compact?: boolean }) {
  return <Link href="/" aria-label="RidePerk home" className="inline-flex min-h-11 items-center rounded-xl px-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--passenger-primary)]"><Image src={RIDEPERK_LOGO_PATH} alt="RidePerk" width={260} height={100} className={compact ? "h-8 w-auto object-contain" : "h-11 w-auto object-contain"} /></Link>;
}

export function LanguageSwitcher({ qrToken, locale }: { qrToken: string; locale: PassengerLocale }) {
  const labels: Record<PassengerLocale, string> = { en: "EN", am: "አማ", om: "OM", ar: "عر" };
  return <nav aria-label="Campaign language" className="flex rounded-full border border-[var(--passenger-line)] bg-white p-1 text-sm font-semibold">{passengerLocales.map((option) => <Link key={option} href={`/d/${encodeURIComponent(qrToken)}?lang=${option}`} aria-current={locale === option ? "page" : undefined} title={passengerDictionary(option).languageName} className={`min-h-9 rounded-full px-3 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--passenger-primary)] ${locale === option ? "bg-[var(--passenger-primary)] text-white" : "text-[var(--passenger-muted)] hover:text-[var(--passenger-primary)]"}`}>{labels[option]}</Link>)}</nav>;
}

export function BrandMark({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  return logoUrl ? <Image src={logoUrl} alt={`${name} logo`} width={48} height={48} unoptimized className="size-12 rounded-2xl border border-[var(--passenger-line)] bg-white object-contain p-1.5" /> : <div aria-hidden="true" className="grid size-12 place-items-center rounded-2xl bg-[var(--passenger-primary)] text-lg font-black text-white shadow-[0_10px_28px_rgba(119,28,15,0.2)]">{name.trim().slice(0, 2).toUpperCase() || "RP"}</div>;
}
