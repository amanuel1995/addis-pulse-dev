import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { OtpForm } from "@/components/lead/OtpForm";
import { BrandMark, CampaignFooter, PassengerShell } from "@/components/passenger/PassengerShell";
import { verifyFlowToken } from "@/lib/passenger-flow/security";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PublicLandingPayload } from "@/types/passenger";
import { maskPassengerPhone, otpSecondsRemaining } from "@/lib/passenger-flow/ui";
import { passengerLocale } from "@/lib/passenger-flow/i18n";
import { PhoneVerificationSteps } from "@/components/lead/PhoneVerificationSteps";

export default async function VerifyPage({ params, searchParams }: { params: Promise<{ qr_token: string }>; searchParams: Promise<{ lang?: string }> }) {
  const { qr_token } = await params;
  const locale = passengerLocale((await searchParams).lang);
  const flow = verifyFlowToken((await cookies()).get("ap_passenger_flow")?.value || "");
  if (!flow || flow.qrToken !== qr_token) redirect(`/d/${encodeURIComponent(qr_token)}`);

  const admin = createAdminClient();
  const [leadResult, otpResult, landingResult] = await Promise.all([
    admin.from("leads").select("phone_e164").eq("id", flow.leadId).maybeSingle(),
    admin.from("otp_verifications").select("expires_at").eq("lead_id", flow.leadId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    admin.rpc("get_public_landing_page", { p_public_path: `d/${qr_token}`, p_locale: locale }),
  ]);
  if (leadResult.error || !leadResult.data) redirect(`/d/${encodeURIComponent(qr_token)}`);
  const landing = landingResult.data as PublicLandingPayload | null;
  const companyName = landing?.company?.name || "Campaign partner";
  const logoPath = landing?.company?.logo_path;
  const logoUrl = logoPath ? admin.storage.from("company-assets").getPublicUrl(logoPath).data.publicUrl : null;

  return (
    <PassengerShell>
      <main className="mx-auto flex min-h-[calc(100vh-76px)] w-full max-w-lg items-center px-4 py-8 sm:px-6">
        <section className="w-full rounded-[28px] border border-[var(--passenger-line)] bg-white p-5 shadow-[0_24px_70px_rgba(82,36,24,0.1)] sm:p-8">
          <div className="flex items-center gap-3 border-b border-[var(--passenger-line)] pb-5"><BrandMark name={companyName} logoUrl={logoUrl} /><div><p className="font-extrabold">{companyName}</p><p className="text-sm text-[var(--passenger-muted)]">Secure phone verification</p></div></div>
          <div className="mt-6"><PhoneVerificationSteps locale={locale} activeStep={2}/></div>
          <div className="pt-6 text-center"><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--passenger-primary-soft)] text-[var(--passenger-primary)]"><LockKeyhole aria-hidden="true" className="size-7" /></div><h1 className="mt-4 text-3xl font-black tracking-tight">Verify your phone</h1><p className="mt-3 leading-7 text-[var(--passenger-muted)]">Enter the code sent to <span className="font-bold text-[var(--passenger-ink)]">{maskPassengerPhone(leadResult.data.phone_e164)}</span>.</p></div>
          <div className="mt-7">
            <OtpForm
              expiresAt={otpResult.data?.expires_at}
              initialSecondsRemaining={otpSecondsRemaining(otpResult.data?.expires_at)}
            />
          </div>
          <Link href={`/d/${encodeURIComponent(qr_token)}#lead-form`} className="mt-5 flex min-h-11 items-center justify-center text-sm font-semibold text-[var(--passenger-muted)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--passenger-primary)]">Use a different phone number</Link>
        </section>
      </main>
      <CampaignFooter />
    </PassengerShell>
  );
}
