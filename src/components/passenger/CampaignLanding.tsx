import { ArrowDown, BadgeCheck, Gift, Mail, MessageCircle, Phone, Sparkles } from "lucide-react";
import { BrandMark, CampaignFooter, LanguageSwitcher, PassengerShell } from "./PassengerShell";
import { CampaignMedia } from "./CampaignMedia";
import { LeadForm } from "@/components/lead/LeadForm";
import type { PublicLandingPayload } from "@/types/passenger";

export function CampaignLanding({
  landing,
  qrToken,
  locale,
  driverName,
  logoUrl,
  videoUrl,
  posterUrl,
}: {
  landing: PublicLandingPayload;
  qrToken: string;
  locale: "en" | "am";
  driverName: string;
  logoUrl?: string | null;
  videoUrl?: string | null;
  posterUrl?: string | null;
}) {
  const company = landing.company || {};
  const campaign = landing.campaign || {};
  const content = campaign.content || {};
  const companyName = company.name || "Campaign partner";
  const headline = content.headline || `An offer from ${companyName}`;
  const description = content.description || content.subheadline || company.description || "Explore the offer and request more information in under a minute.";
  const offer = content.offer_text || campaign.reward_description;
  const services = (company.services || []).filter((service) => service.name);
  const contacts = [
    company.public_contact_phone && { href: `tel:${company.public_contact_phone}`, label: "Call", icon: Phone },
    company.public_contact_email && { href: `mailto:${company.public_contact_email}`, label: "Email", icon: Mail },
    company.whatsapp_url && { href: company.whatsapp_url, label: "WhatsApp", icon: MessageCircle },
  ].filter(Boolean) as Array<{ href: string; label: string; icon: typeof Phone }>;
  const externalVideo = landing.video?.provider !== "supabase_storage";

  return (
    <PassengerShell>
      <header className="border-b border-[var(--passenger-line)] bg-white/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3"><BrandMark name={companyName} logoUrl={logoUrl} /><div className="min-w-0"><p className="truncate font-extrabold">{companyName}</p><p className="truncate text-sm text-[var(--passenger-muted)]">Sponsored passenger offer</p></div></div>
          <LanguageSwitcher qrToken={qrToken} locale={locale} />
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:gap-10 lg:py-10">
        <div className="space-y-6">
          <section className="rounded-[28px] border border-[var(--passenger-line)] bg-white p-5 shadow-[0_20px_60px_rgba(82,36,24,0.08)] sm:p-8">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--passenger-primary)]"><Sparkles aria-hidden="true" className="size-4" />{campaign.name || "Featured campaign"}</div>
            <h1 className="mt-4 max-w-2xl text-3xl font-black leading-[1.08] tracking-[-0.035em] sm:text-5xl">{headline}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--passenger-muted)] sm:text-lg">{description}</p>
            {offer && <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[var(--passenger-primary-soft)] p-4 text-sm text-[var(--passenger-primary-dark)]"><Gift aria-hidden="true" className="mt-0.5 size-5 shrink-0" /><p className="font-semibold">{offer}</p></div>}
            <a href="#lead-form" className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--passenger-primary)] px-5 py-3 font-bold text-white shadow-[0_12px_26px_rgba(119,28,15,0.2)] transition-colors hover:bg-[var(--passenger-primary-dark)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--passenger-primary)] sm:w-auto">{content.call_to_action || "Continue and verify phone"}<ArrowDown aria-hidden="true" className="size-4" /></a>
          </section>

          <CampaignMedia videoUrl={videoUrl} posterUrl={posterUrl} caption={landing.video?.caption} external={externalVideo} />

          {(services.length > 0 || company.services_summary) && <section aria-labelledby="campaign-details" className="rounded-[24px] border border-[var(--passenger-line)] bg-white p-5 sm:p-7"><h2 id="campaign-details" className="text-xl font-extrabold text-[var(--passenger-primary)]">What you can explore</h2>{company.services_summary && <p className="mt-2 text-[var(--passenger-muted)]">{company.services_summary}</p>}{services.length > 0 && <ul className="mt-4 grid gap-3 sm:grid-cols-2">{services.map((service, index) => <li key={service.id || `${service.name}-${index}`} className="flex gap-3 rounded-2xl border border-[var(--passenger-line)] bg-[#fffdfc] p-4"><BadgeCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[var(--passenger-primary)]" /><div><p className="font-bold">{service.name}</p>{service.description && <p className="mt-1 text-sm text-[var(--passenger-muted)]">{service.description}</p>}</div></li>)}</ul>}</section>}

          {contacts.length > 0 && <section aria-labelledby="contact-actions"><h2 id="contact-actions" className="text-xl font-extrabold">Contact {companyName}</h2><div className="mt-3 grid grid-cols-3 gap-2">{contacts.map(({ href, label, icon: Icon }) => <a key={label} href={href} className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl bg-[var(--passenger-primary-soft)] px-2 py-3 text-sm font-bold text-[var(--passenger-primary)] transition-colors hover:bg-[var(--passenger-line)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--passenger-primary)]"><Icon aria-hidden="true" className="size-5" />{label}</a>)}</div></section>}
        </div>

        <aside id="lead-form" className="scroll-mt-5 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-[28px] border border-[var(--passenger-line)] bg-white p-5 shadow-[0_24px_70px_rgba(82,36,24,0.12)] sm:p-7">
            <p className="text-sm font-bold uppercase tracking-[0.1em] text-[var(--passenger-primary)]">Request information</p>
            <h2 className="mt-2 text-2xl font-extrabold">Interested in this offer?</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--passenger-muted)]">Share your details, then verify your phone. {companyName} may contact you about this campaign.</p>
            <div className="mt-6"><LeadForm qrToken={qrToken} callToAction={content.call_to_action || "Continue and verify phone"} privacyNotice={content.privacy_notice_text} privacyNoticeVersion={content.content_version ? `campaign-content-v${content.content_version}` : "2026-07-v1"} services={services.map((service) => service.name || "").filter(Boolean)} companyName={companyName} /></div>
            <p className="mt-5 border-t border-[var(--passenger-line)] pt-4 text-sm leading-6 text-[var(--passenger-muted)]">Submitting does not guarantee a reward unless the campaign terms explicitly confirm eligibility. Your phone is verified to protect the campaign and its passengers.</p>
            <p className="mt-3 text-xs text-[var(--passenger-muted)]">QR assigned to driver {driverName}.</p>
          </div>
        </aside>
      </main>
      <CampaignFooter />
    </PassengerShell>
  );
}
