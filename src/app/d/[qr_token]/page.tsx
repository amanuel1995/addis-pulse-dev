import { notFound, redirect } from "next/navigation";
import { CampaignLanding } from "@/components/passenger/CampaignLanding";
import { createClient } from "@/lib/supabase/server";
import type { PublicLandingPayload } from "@/types/passenger";

// Driver assignments and campaign availability can change at any time. Avoid
// serving a cached unavailable result after an assignment is activated (or a
// cached active campaign after it is removed).
export const dynamic = "force-dynamic";

type DriverResolution = { driver_name: string };

export default async function DriverQRRoute({
  params,
  searchParams,
}: {
  params: Promise<{ qr_token: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const [{ qr_token }, query] = await Promise.all([params, searchParams]);
  const locale: "en" | "am" = query.lang === "am" ? "am" : "en";
  const publicPath = `d/${qr_token}`;
  const supabase = await createClient();

  const [resolutionResult, landingResult] = await Promise.all([
    supabase.rpc("resolve_driver_campaign", { p_qr_token: publicPath }).maybeSingle(),
    supabase.rpc("get_public_landing_page", {
      p_public_path: publicPath,
      p_locale: locale,
    }),
  ]);

  if (resolutionResult.error) {
    throw new Error(`Failed to resolve QR token: ${resolutionResult.error.message}`);
  }
  if (landingResult.error) {
    throw new Error(`Failed to load campaign: ${landingResult.error.message}`);
  }

  const landing = landingResult.data as PublicLandingPayload | null;
  if (!landing || landing.reason === "invalid_qr") notFound();
  if (!landing.available || !resolutionResult.data) {
    redirect(`/d/${encodeURIComponent(qr_token)}/inactive`);
  }

  const companyAssets = supabase.storage.from("company-assets");
  const campaignVideos = supabase.storage.from("campaign-videos");
  const logoUrl = publicAssetUrl(
    landing.company?.logo_path,
    (path) => companyAssets.getPublicUrl(path).data.publicUrl,
  );
  const videoUrl = publicAssetUrl(
    landing.video?.path || landing.video?.url,
    (path) => campaignVideos.getPublicUrl(path).data.publicUrl,
  );
  const posterUrl = publicAssetUrl(
    landing.video?.poster_path,
    (path) => campaignVideos.getPublicUrl(path).data.publicUrl,
  );

  return (
    <CampaignLanding
      landing={landing}
      qrToken={qr_token}
      locale={locale}
      driverName={(resolutionResult.data as DriverResolution).driver_name}
      logoUrl={logoUrl}
      videoUrl={videoUrl}
      posterUrl={posterUrl}
    />
  );
}

function publicAssetUrl(
  value: string | undefined,
  resolveStoragePath: (path: string) => string,
) {
  if (!value) return null;
  if (value.startsWith("https://") || value.startsWith("http://")) return value;
  return resolveStoragePath(value);
}
