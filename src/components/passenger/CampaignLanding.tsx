import { ArrowDown, BadgeCheck, Gift, Mail, MessageCircle, Phone, Sparkles } from "lucide-react";
import { BrandMark, CampaignFooter, LanguageSwitcher, PassengerShell } from "./PassengerShell";
import { CampaignMedia } from "./CampaignMedia";
import { CampaignVisitTracker } from "./CampaignVisitTracker";
import { LeadForm } from "@/components/lead/LeadForm";
import type { PublicCampaignViewModel } from "@/types/passenger";

export function CampaignLanding({
  campaign,
  qrToken,
}: {
  campaign: PublicCampaignViewModel;
  qrToken: string;
}) {
  const companyName = campaign.advertiser.name;
  const contacts = [
    campaign.contact.phone && { href: `tel:${campaign.contact.phone}`, label: "Call", icon: Phone },
    campaign.contact.email && { href: `mailto:${campaign.contact.email}`, label: "Email", icon: Mail },
    campaign.contact.whatsapp && { href: campaign.contact.whatsapp, label: "WhatsApp", icon: MessageCircle },
  ].filter(Boolean) as Array<{ href: string; label: string; icon: typeof Phone }>;

  return (
    <PassengerShell>
      <CampaignVisitTracker qrToken={qrToken} />
      <header className="border-b border-[var(--passenger-line)] bg-white/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3"><BrandMark name={companyName} logoUrl={campaign.advertiser.logoUrl} /><div className="min-w-0"><p className="truncate font-extrabold">{companyName}</p><p className="truncate text-sm text-[var(--passenger-muted)]">Sponsored passenger offer</p></div></div>
          <LanguageSwitcher qrToken={qrToken} locale={campaign.locale} />
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:gap-10 lg:py-10">
        <div className="space-y-6">
          <section className="rounded-[28px] border border-[var(--passenger-line)] bg-white p-5 shadow-[0_20px_60px_rgba(82,36,24,0.08)] sm:p-8">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--passenger-primary)]"><Sparkles aria-hidden="true" className="size-4" />{campaign.name}</div>
            <h1 className="mt-4 max-w-2xl text-3xl font-black leading-[1.08] tracking-[-0.035em] sm:text-5xl">{campaign.content.headline}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--passenger-muted)] sm:text-lg">{campaign.content.description}</p>
            {campaign.content.offer && <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[var(--passenger-primary-soft)] p-4 text-sm text-[var(--passenger-primary-dark)]"><Gift aria-hidden="true" className="mt-0.5 size-5 shrink-0" /><p className="font-semibold">{campaign.content.offer}</p></div>}
            <a href="#lead-form" className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--passenger-primary)] px-5 py-3 font-bold text-white shadow-[0_12px_26px_rgba(119,28,15,0.2)] transition-colors hover:bg-[var(--passenger-primary-dark)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--passenger-primary)] sm:w-auto">{campaign.content.callToAction}<ArrowDown aria-hidden="true" className="size-4" /></a>
          </section>

          <CampaignMedia videoUrl={campaign.media.videoUrl} posterUrl={campaign.media.posterUrl} caption={campaign.media.caption} external={campaign.media.external} />

          {(campaign.interests.length > 0 || campaign.advertiser.servicesSummary) && <section aria-labelledby="campaign-details" className="rounded-[24px] border border-[var(--passenger-line)] bg-white p-5 sm:p-7"><h2 id="campaign-details" className="text-xl font-extrabold text-[var(--passenger-primary)]">What you can explore</h2>{campaign.advertiser.servicesSummary && <p className="mt-2 text-[var(--passenger-muted)]">{campaign.advertiser.servicesSummary}</p>}{campaign.interests.length > 0 && <ul className="mt-4 grid gap-3 sm:grid-cols-2">{campaign.interests.map((interest) => <li key={interest.value} className="flex gap-3 rounded-2xl border border-[var(--passenger-line)] bg-[#fffdfc] p-4"><BadgeCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[var(--passenger-primary)]" /><div><p className="font-bold">{interest.label}</p>{interest.description && <p className="mt-1 text-sm text-[var(--passenger-muted)]">{interest.description}</p>}</div></li>)}</ul>}</section>}

          {contacts.length > 0 && <section aria-labelledby="contact-actions"><h2 id="contact-actions" className="text-xl font-extrabold">Contact {companyName}</h2><div className="mt-3 grid grid-cols-3 gap-2">{contacts.map(({ href, label, icon: Icon }) => <a key={label} href={href} className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl bg-[var(--passenger-primary-soft)] px-2 py-3 text-sm font-bold text-[var(--passenger-primary)] transition-colors hover:bg-[var(--passenger-line)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--passenger-primary)]"><Icon aria-hidden="true" className="size-5" />{label}</a>)}</div></section>}
        </div>

        <aside id="lead-form" className="scroll-mt-5 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-[28px] border border-[var(--passenger-line)] bg-white p-5 shadow-[0_24px_70px_rgba(82,36,24,0.12)] sm:p-7">
            <p className="text-sm font-bold uppercase tracking-[0.1em] text-[var(--passenger-primary)]">Request information</p>
            <h2 className="mt-2 text-2xl font-extrabold">Interested in this offer?</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--passenger-muted)]">Share your details, then verify your phone. {companyName} may contact you about this campaign.</p>
            <div className="mt-6"><LeadForm qrToken={qrToken} callToAction={campaign.content.callToAction} privacyNotice={campaign.content.privacyNotice || undefined} privacyNoticeVersion={campaign.content.privacyNoticeVersion} services={campaign.interests.map((interest) => interest.label)} companyName={companyName} /></div>
            <p className="mt-5 border-t border-[var(--passenger-line)] pt-4 text-sm leading-6 text-[var(--passenger-muted)]">Submitting does not guarantee a reward unless the campaign terms explicitly confirm eligibility. Your phone is verified to protect the campaign and its passengers.</p>
            <p className="mt-3 text-xs text-[var(--passenger-muted)]">QR assigned to driver {campaign.driverName}.</p>
          </div>
        </aside>
      </main>
      <CampaignFooter />
    </PassengerShell>
  );
}
