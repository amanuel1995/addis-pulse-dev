import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOtpForLead } from "@/lib/otp/service";
import {
  createFlowToken,
  hashDeviceFingerprint,
  hashIp,
  hashPhone,
} from "@/lib/passenger-flow/security";
import {
  leadSubmissionSchema,
  normalizeEthiopianPhone,
} from "@/lib/passenger-flow/validation";

function responseWithFlowCookie(
  body: object,
  status: number,
  flowToken: string,
  request: NextRequest,
) {
  const response = NextResponse.json(body, { status });
  const isLoopback =
    request.nextUrl.hostname === "localhost" ||
    request.nextUrl.hostname === "127.0.0.1";
  response.cookies.set("ap_passenger_flow", flowToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production" && !isLoopback,
    path: "/",
    maxAge: 30 * 60,
  });
  return response;
}

export async function POST(request: NextRequest) {
  const parsed = leadSubmissionSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const phoneE164 = normalizeEthiopianPhone(parsed.data.phone);
  if (!phoneE164) {
    return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
  }

  const forwardedFor =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const fingerprint = request.headers.get("x-device-fingerprint");
  const publicPath = parsed.data.qrToken.startsWith("d/")
    ? parsed.data.qrToken
    : `d/${parsed.data.qrToken}`;
  const admin = createAdminClient();
  const { data: leadId, error } = await admin.rpc("submit_lead_server", {
    p_public_path: publicPath,
    p_idempotency_key: parsed.data.idempotencyKey,
    p_full_name: parsed.data.fullName,
    p_phone_e164: phoneE164,
    p_phone_hash: hashPhone(phoneE164),
    p_email: parsed.data.email || undefined,
    p_interested_service_text: parsed.data.interestedService || undefined,
    p_ip_hash: hashIp(forwardedFor),
    p_device_fingerprint_hash: hashDeviceFingerprint(fingerprint) || undefined,
    p_consent_given: true,
    p_privacy_notice_version: parsed.data.privacyNoticeVersion,
  });

  if (error || !leadId) {
    const knownErrors = new Set([
      "invalid_or_inactive_qr",
      "campaign_unavailable",
      "company_inactive",
      "submission_limit_exceeded",
      "captcha_required",
      "daily_ip_limit_exceeded",
    ]);
    const code =
      error?.message && knownErrors.has(error.message)
        ? error.message
        : "lead_creation_failed";
    const status =
      code === "invalid_or_inactive_qr" || code === "campaign_unavailable"
        ? 404
        : 422;
    return NextResponse.json({ error: code }, { status });
  }

  const flowToken = createFlowToken({
    leadId,
    qrToken: parsed.data.qrToken,
    expiresAt: Date.now() + 30 * 60 * 1000,
  });

  try {
    await sendOtpForLead(leadId, phoneE164);
    return responseWithFlowCookie(
      {
        leadId,
        delivery: "accepted",
        nextRoute: `/d/${encodeURIComponent(parsed.data.qrToken)}/verify`,
      },
      201,
      flowToken,
      request,
    );
  } catch {
    return responseWithFlowCookie(
      { error: "otp_delivery_failed", leadId, delivery: "failed" },
      502,
      flowToken,
      request,
    );
  }
}
