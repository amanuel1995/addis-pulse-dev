import { ArrowDown, BadgeCheck, Building2, Gift, Mail, MessageCircle, Phone } from "lucide-react";
import { BrandMark, CampaignFooter, LanguageSwitcher, PassengerShell } from "./PassengerShell";
import { CampaignMedia } from "./CampaignMedia";
import { CampaignVisitTracker } from "./CampaignVisitTracker";
import { LeadForm } from "@/components/lead/LeadForm";
import type { PublicCampaignViewModel } from "@/types/passenger";
import { passengerDictionary } from "@/lib/passenger-flow/i18n";

export function CampaignLanding({campaign,qrToken}:{campaign:PublicCampaignViewModel;qrToken:string}) {
  const company=campaign.advertiser,t=passengerDictionary(campaign.locale);
  const contacts=[campaign.contact.phone&&{href:`tel:${campaign.contact.phone}`,label:t.call,icon:Phone},campaign.contact.email&&{href:`mailto:${campaign.contact.email}`,label:t.emailAction,icon:Mail},campaign.contact.whatsapp&&{href:campaign.contact.whatsapp,label:t.whatsapp,icon:MessageCircle}].filter(Boolean) as Array<{href:string;label:string;icon:typeof Phone}>;
  return <PassengerShell><div lang={campaign.locale} dir={campaign.locale==="ar"?"rtl":"ltr"} style={{"--passenger-primary":campaign.branding.primaryColor} as React.CSSProperties}>
    <CampaignVisitTracker qrToken={qrToken}/>
    <header className="sticky top-0 z-30 border-b border-[var(--passenger-line)] bg-white/95 backdrop-blur-xl"><div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6"><div className="flex min-w-0 items-center gap-3"><BrandMark name={company.name} logoUrl={company.logoUrl}/><div className="min-w-0"><p className="truncate font-extrabold">{company.name}</p><p className="truncate text-xs text-[var(--passenger-muted)]">{t.presented}</p></div></div><LanguageSwitcher qrToken={qrToken} locale={campaign.locale}/></div></header>
    <main className="mx-auto w-full max-w-5xl px-4 pb-10 pt-4 sm:px-6 sm:pt-6">
      <section className="overflow-hidden rounded-[28px] border border-[var(--passenger-line)] bg-white shadow-[0_18px_55px_rgba(82,36,24,.1)]">
        <div className="flex items-center gap-4 p-5 sm:p-7"><BrandMark name={company.name} logoUrl={company.logoUrl}/><div><p className="text-xs font-black uppercase tracking-[.16em] text-[var(--passenger-primary)]">{t.welcomeEyebrow}</p><h1 className="mt-1 text-2xl font-black tracking-[-.03em] sm:text-4xl">{company.name}</h1><p className="mt-1 text-sm text-[var(--passenger-muted)]">{campaign.name}</p></div></div>
        <CampaignMedia videoUrl={campaign.media.videoUrl} posterUrl={campaign.media.posterUrl} caption={campaign.media.caption} provider={campaign.media.provider} external={campaign.media.external} locale={campaign.locale} logoUrl={company.logoUrl} companyName={company.name}/>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_.95fr] lg:items-start">
        <div className="space-y-5">
          <section className="rounded-[26px] border border-[var(--passenger-line)] bg-white p-5 shadow-[0_14px_40px_rgba(82,36,24,.06)] sm:p-7">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.15em] text-[var(--passenger-primary)]"><Building2 className="size-4"/>About {company.name}</div>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-.035em]">{campaign.content.headline}</h2>
            <p className="mt-4 text-base leading-7 text-[var(--passenger-muted)]">{campaign.content.description}</p>
            {campaign.locale==="en"&&company.description&&campaign.content.description!==company.description&&<p className="mt-3 leading-7 text-[var(--passenger-muted)]">{company.description}</p>}
            {campaign.content.offer&&<div className="mt-5 flex gap-3 rounded-2xl bg-[var(--passenger-primary-soft)] p-4 text-sm text-[var(--passenger-primary-dark)]"><Gift className="mt-0.5 size-5 shrink-0"/><p className="font-semibold">{campaign.content.offer}</p></div>}
            <a href="#lead-form" className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--passenger-primary)] px-5 py-3 font-bold text-white sm:w-auto">{campaign.content.callToAction}<ArrowDown className="size-4"/></a>
          </section>

          {(company.servicesSummary||campaign.interests.length>0)&&<section className="rounded-[26px] border border-[var(--passenger-line)] bg-white p-5 sm:p-7"><h2 className="text-xl font-black text-[var(--passenger-primary)]">{t.details}</h2>{company.servicesSummary&&<p className="mt-3 leading-7 text-[var(--passenger-muted)]">{company.servicesSummary}</p>}{campaign.interests.length>0&&<ul className="mt-4 grid gap-3">{campaign.interests.map(i=><li key={i.value} className="flex gap-3 rounded-2xl bg-[#fffaf8] p-4"><BadgeCheck className="mt-0.5 size-5 shrink-0 text-[var(--passenger-primary)]"/><div><p className="font-bold">{i.label}</p>{i.description&&<p className="mt-1 text-sm text-[var(--passenger-muted)]">{i.description}</p>}</div></li>)}</ul>}</section>}

          {contacts.length>0&&<section className="rounded-[26px] border border-[var(--passenger-line)] bg-white p-5 sm:p-7"><h2 className="text-xl font-black">{t.contact(company.name)}</h2><div className="mt-4 grid grid-cols-3 gap-2">{contacts.map(({href,label,icon:Icon})=><a key={label} href={href} className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl bg-[var(--passenger-primary-soft)] px-2 py-3 text-sm font-bold text-[var(--passenger-primary)]"><Icon className="size-5"/>{label}</a>)}</div></section>}
        </div>

        <aside id="lead-form" className="scroll-mt-24 lg:sticky lg:top-24"><div className="rounded-[28px] border border-[var(--passenger-line)] bg-white p-5 shadow-[0_20px_60px_rgba(82,36,24,.11)] sm:p-7"><p className="text-xs font-black uppercase tracking-[.15em] text-[var(--passenger-primary)]">{t.request}</p><h2 className="mt-2 text-2xl font-black">{t.interested}</h2><p className="mt-2 text-sm leading-6 text-[var(--passenger-muted)]">{t.formIntro(company.name)}</p><div className="mt-6"><LeadForm qrToken={qrToken} privacyNotice={campaign.content.privacyNotice||undefined} privacyNoticeVersion={campaign.content.privacyNoticeVersion} services={campaign.interests.map(i=>i.label)} companyName={company.name} locale={campaign.locale}/></div><p className="mt-5 border-t border-[var(--passenger-line)] pt-4 text-sm leading-6 text-[var(--passenger-muted)]">{t.submitDisclaimer}</p><p className="mt-3 text-xs text-[var(--passenger-muted)]">{t.assigned(campaign.driverName)}</p></div></aside>
      </div>
    </main><CampaignFooter locale={campaign.locale}/>
  </div></PassengerShell>;
}
