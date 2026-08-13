import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Check, Download, Mail, Phone } from "lucide-react";
import { BrandMark, CampaignFooter, PassengerShell } from "@/components/passenger/PassengerShell";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyFlowToken } from "@/lib/passenger-flow/security";
import type { PublicLandingPayload } from "@/types/passenger";

export default async function ThankYouPage({ params }: { params: Promise<{ qr_token: string }> }) {
  const { qr_token } = await params;
  const flow = verifyFlowToken((await cookies()).get("ap_passenger_flow")?.value || "");
  if (!flow || flow.qrToken !== qr_token) redirect(`/d/${encodeURIComponent(qr_token)}`);

  const admin = createAdminClient();
  const [leadResult, landingResult] = await Promise.all([
    admin.from("leads").select("verification_status").eq("id", flow.leadId).maybeSingle(),
    admin.rpc("get_public_landing_page", { p_public_path: `d/${qr_token}`, p_locale: "en" }),
  ]);
  if (leadResult.error) throw new Error(`Failed to load verified lead: ${leadResult.error.message}`);
  if (leadResult.data?.verification_status !== "otp_verified" && leadResult.data?.verification_status !== "call_verified") redirect(`/d/${encodeURIComponent(qr_token)}/verify`);
  if (landingResult.error) throw new Error(`Failed to load campaign details: ${landingResult.error.message}`);

  const landing = landingResult.data as PublicLandingPayload | null;
  const company = landing?.company || {};
  const campaign = landing?.campaign || {};
  const companyName = company.name || "Campaign partner";
  const reward = campaign.content?.reward_text || campaign.reward_description;
  const logoUrl = company.logo_path ? admin.storage.from("company-assets").getPublicUrl(company.logo_path).data.publicUrl : null;
  const brochureUrl = campaign.brochure_path
    ? campaign.brochure_path.startsWith("http") ? campaign.brochure_path : admin.storage.from("campaign-videos").getPublicUrl(campaign.brochure_path).data.publicUrl
    : null;

  return (
    <PassengerShell>
      <main className="mx-auto flex min-h-[calc(100vh-76px)] w-full max-w-xl items-center px-4 py-8 sm:px-6">
        <section className="w-full rounded-[28px] border border-[var(--passenger-line)] bg-white p-6 text-center shadow-[0_24px_70px_rgba(82,36,24,0.1)] sm:p-9">
          <div className="flex justify-center"><BrandMark name={companyName} logoUrl={logoUrl} /></div>
          <div className="mx-auto mt-6 grid size-16 place-items-center rounded-full bg-green-100 text-green-800"><Check aria-hidden="true" className="size-8" strokeWidth={3} /></div>
          <p className="mt-5 text-sm font-bold uppercase tracking-[0.1em] text-[var(--passenger-primary)]">Phone verified</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Thank you</h1>
          <p className="mx-auto mt-3 max-w-md leading-7 text-[var(--passenger-muted)]">Your request was received. {companyName} may contact you with the next steps for this campaign.</p>
          {reward && <div className="mt-6 rounded-2xl bg-[var(--passenger-primary-soft)] p-5 text-left"><p className="text-sm font-bold uppercase tracking-[0.08em] text-[var(--passenger-primary)]">Reward information</p><p className="mt-2 font-semibold leading-6">{reward}</p><p className="mt-2 text-sm text-[var(--passenger-muted)]">Eligibility remains subject to the campaign terms.</p></div>}
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {brochureUrl && <a href={brochureUrl} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--passenger-primary)] px-4 py-3 font-bold text-white hover:bg-[var(--passenger-primary-dark)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--passenger-primary)]"><Download aria-hidden="true" className="size-5" />View brochure</a>}
            {company.public_contact_phone && <a href={`tel:${company.public_contact_phone}`} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--passenger-line)] px-4 py-3 font-bold text-[var(--passenger-primary)]"><Phone aria-hidden="true" className="size-5" />Call company</a>}
            {!company.public_contact_phone && company.public_contact_email && <a href={`mailto:${company.public_contact_email}`} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--passenger-line)] px-4 py-3 font-bold text-[var(--passenger-primary)]"><Mail aria-hidden="true" className="size-5" />Email company</a>}
          </div>
          <Link href={`/d/${encodeURIComponent(qr_token)}`} className="mt-6 inline-flex min-h-11 items-center px-3 text-sm font-semibold text-[var(--passenger-muted)] underline-offset-4 hover:underline">Return to campaign details</Link>
        </section>
      </main>
      <CampaignFooter />
    </PassengerShell>
  );
}
