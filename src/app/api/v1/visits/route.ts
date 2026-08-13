import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hashIp, opaqueRequestHash } from "@/lib/passenger-flow/security";
import { normalizeRpcRecord } from "@/lib/passenger-flow/public-campaign";

const requestSchema = z.object({
  qrToken: z.string().trim().min(3).max(160).regex(/^[a-zA-Z0-9_-]+$/),
  sessionId: z.uuid(),
});

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  const publicClient = await createClient();
  const admin = createAdminClient();
  const publicPath = `d/${parsed.data.qrToken}`;
  const { data, error } = await publicClient.rpc("get_public_landing_page", { p_public_path: publicPath, p_locale: "en" });
  const landing = normalizeRpcRecord(data);
  if (error || typeof landing !== "object" || landing === null || Array.isArray(landing)) {
    console.error("[visit:resolve]", { code: error?.code, validPayload: false });
    return NextResponse.json({ error: "campaign_unavailable" }, { status: 404 });
  }
  const payload = landing as { available?: boolean; qr?: { id?: string }; company?: { id?: string }; campaign?: { id?: string } };
  if (!payload.available || !payload.qr?.id || !payload.company?.id || !payload.campaign?.id) {
    console.error("[visit:resolve]", { available: payload.available, hasQr: Boolean(payload.qr?.id), hasCompany: Boolean(payload.company?.id), hasCampaign: Boolean(payload.campaign?.id) });
    return NextResponse.json({ error: "campaign_unavailable" }, { status: 404 });
  }
  const sessionHash = opaqueRequestHash(`${parsed.data.sessionId}:${publicPath}`);
  const { count } = await admin.from("landing_page_visits").select("id", { count: "exact", head: true }).eq("session_hash", sessionHash).eq("campaign_id", payload.campaign.id);
  if (count) return new NextResponse(null, { status: 204 });
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const userAgent = request.headers.get("user-agent")?.slice(0, 255) || null;
  const deviceCategory = /mobile|android|iphone/i.test(userAgent || "") ? "mobile" : "desktop";
  const referrer = request.headers.get("referer");
  let referrerDomain: string | null = null;
  try { referrerDomain = referrer ? new URL(referrer).hostname.slice(0, 255) : null; } catch { referrerDomain = null; }
  const { data: qr } = await admin.from("qr_codes").select("driver_id").eq("id", payload.qr.id).maybeSingle();
  const { error: insertError } = await admin.from("landing_page_visits").insert({
    qr_code_id: payload.qr.id, company_id: payload.company.id, campaign_id: payload.campaign.id,
    driver_id: qr?.driver_id || null, ip_hash: hashIp(forwardedFor), session_hash: sessionHash,
    device_category: deviceCategory, user_agent_summary: userAgent, referrer_domain: referrerDomain,
  });
  if (insertError) {
    console.error("[visit:insert]", { code: insertError.code, message: insertError.message });
    return NextResponse.json({ error: "visit_not_recorded" }, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}
