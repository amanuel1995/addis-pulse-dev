import "server-only";

import { randomInt } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOtpProvider } from "@/lib/otp/provider";
import { hashPhone } from "@/lib/passenger-flow/security";

const RESEND_COOLDOWN_SECONDS = 60;

export class OtpCooldownError extends Error {}

export async function sendOtpForLead(leadId: string, phoneE164: string) {
  const admin = createAdminClient();
  const cutoff = new Date(
    Date.now() - RESEND_COOLDOWN_SECONDS * 1000,
  ).toISOString();
  const { data: recent } = await admin
    .from("otp_verifications")
    .select("id")
    .eq("lead_id", leadId)
    .in("status", ["created", "send_pending", "sent"])
    .gte("created_at", cutoff)
    .maybeSingle();

  if (recent)
    throw new OtpCooldownError("Please wait before requesting another code");

  const code =
    process.env.OTP_PROVIDER === "africas_talking"
      ? randomInt(0, 1_000_000).toString().padStart(6, "0")
      : process.env.OTP_FAKE_CODE || "123456";
  if (!/^\d{6}$/.test(code))
    throw new Error("OTP_FAKE_CODE must contain exactly six digits");
  const ttl = Math.min(
    Math.max(Number(process.env.OTP_EXPIRY_SECONDS || 300), 60),
    900,
  );
  const { data: otpId, error: challengeError } = await admin.rpc(
    "create_otp_challenge_server",
    {
      p_lead_id: leadId,
      p_code_plaintext: code,
      p_ttl_seconds: ttl,
    },
  );
  if (challengeError) throw challengeError;

  const provider = getOtpProvider();
  try {
    const result = await provider.send({ phoneE164, code });
    const { error } = await admin.rpc("record_otp_delivery_attempt_server", {
      p_otp_verification_id: otpId,
      p_attempt_number: 1,
      p_provider: result.provider,
      p_provider_message_id: result.providerMessageId,
      p_destination_hash: hashPhone(phoneE164),
      p_status: "accepted",
    });
    if (error) {
      console.error("OTP delivery metadata insert failed", {
        code: error.code,
        message: error.message,
      });
      throw error;
    }
  } catch (error) {
    const { error: failureRecordError } = await admin.rpc(
      "record_otp_delivery_attempt_server",
      {
        p_otp_verification_id: otpId,
        p_attempt_number: 1,
        p_provider: process.env.OTP_PROVIDER || "fake_local",
        p_destination_hash: hashPhone(phoneE164),
        p_status: "failed",
        p_error_code: "provider_send_failed",
        p_error_message: "OTP provider rejected the delivery request",
      },
    );
    if (failureRecordError) {
      console.error("OTP delivery failure metadata insert failed", {
        code: failureRecordError.code,
        message: failureRecordError.message,
      });
    }
    throw error;
  }
}
