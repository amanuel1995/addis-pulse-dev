import { randomUUID } from "node:crypto";
import { notFound, redirect } from "next/navigation";
import { CampaignLanding } from "@/components/passenger/CampaignLanding";
import { createClient } from "@/lib/supabase/server";
import {
  buildPublicCampaignViewModel,
  classifyPublicLandingResponse,
  PublicCampaignValidationError,
  rpcShape,
} from "@/lib/passenger-flow/public-campaign";
import type { PublicCampaignViewModel } from "@/types/passenger";

// Driver assignments and campaign availability can change at any time. Avoid
// serving a cached unavailable result after an assignment is activated (or a
// cached active campaign after it is removed).
export const dynamic = "force-dynamic";

export default async function DriverQRRoute({
  params,
  searchParams,
}: {
  params: Promise<{ qr_token: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const [{ qr_token }, query] = await Promise.all([params, searchParams]);
  const requestId = randomUUID();
  const locale: "en" | "am" = query.lang === "am" ? "am" : "en";
  const publicPath = `d/${qr_token}`;
  console.info("[public-campaign:start]", {
    requestId,
    qrTokenSuffix: qr_token.slice(-6),
    locale,
  });
  const supabase = await createClient();

  const [resolutionResult, landingResult] = await Promise.all([
    supabase.rpc("resolve_driver_campaign", { p_qr_token: publicPath }).maybeSingle(),
    supabase.rpc("get_public_landing_page", {
      p_public_path: publicPath,
      p_locale: locale,
    }),
  ]);

  console.info("[public-campaign:rpc-complete]", {
    requestId,
    resolution: rpcShape(resolutionResult.data),
    landing: rpcShape(landingResult.data),
  });

  if (resolutionResult.error) {
    console.error("[public-campaign:resolution-error]", {
      requestId,
      code: resolutionResult.error.code,
      message: resolutionResult.error.message,
      details: resolutionResult.error.details,
      hint: resolutionResult.error.hint,
    });
    throw new Error(`Public campaign resolution failed. Reference: ${requestId}`);
  }
  if (landingResult.error) {
    console.error("[public-campaign:landing-error]", {
      requestId,
      code: landingResult.error.code,
      message: landingResult.error.message,
      details: landingResult.error.details,
      hint: landingResult.error.hint,
    });
    throw new Error(`Public campaign loading failed. Reference: ${requestId}`);
  }

  const landingState = classifyPublicLandingResponse(landingResult.data);
  console.info("[public-campaign:schema-state]", { requestId, state: landingState.state });
  if (landingState.state === "not_found") notFound();
  if (landingState.state === "unavailable" || !resolutionResult.data) {
    redirect(`/d/${encodeURIComponent(qr_token)}/inactive`);
  }
  if (landingState.state === "invalid") {
    console.error("[public-campaign:invalid-envelope]", { requestId });
    throw new Error(`Public campaign response was invalid. Reference: ${requestId}`);
  }

  let campaign: PublicCampaignViewModel;
  try {
    console.info("[public-campaign:view-model-start]", { requestId });
    campaign = buildPublicCampaignViewModel({
      landingData: landingResult.data,
      driverData: resolutionResult.data,
      locale,
      resolveStorageAsset: (bucket, path) =>
        supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl,
    });
  } catch (error) {
    console.error("[public-campaign:render-failure]", {
      requestId,
      name: error instanceof Error ? error.name : "UnknownError",
      issues: error instanceof PublicCampaignValidationError ? error.issues : undefined,
    });
    throw new Error(`Public campaign rendering failed. Reference: ${requestId}`);
  }

  console.info("[public-campaign:render-ready]", {
    requestId,
    hasLogo: Boolean(campaign.advertiser.logoUrl),
    hasMedia: Boolean(campaign.media.videoUrl),
    interestCount: campaign.interests.length,
  });
  return <CampaignLanding campaign={campaign} qrToken={qr_token} />;
}
