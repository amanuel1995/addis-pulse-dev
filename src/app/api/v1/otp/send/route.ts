import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { OtpCooldownError, sendOtpForLead } from "@/lib/otp/service";
import { otpResendSchema } from "@/lib/passenger-flow/validation";
import { verifyFlowToken } from "@/lib/passenger-flow/security";

export async function POST(request: NextRequest) {
  const parsed = otpResendSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const flow = verifyFlowToken(
    request.cookies.get("ap_passenger_flow")?.value || "",
  );
  if (!flow)
    return NextResponse.json(
      { error: "invalid_or_expired_flow" },
      { status: 401 },
    );

  const admin = createAdminClient();
  const { data: lead, error: leadLookupError } = await admin
    .from("leads")
    .select("phone_e164, verification_status")
    .eq("id", flow.leadId)
    .maybeSingle();
  if (leadLookupError) {
    console.error("OTP lead lookup failed", {
      code: leadLookupError.code,
      message: leadLookupError.message,
    });
    return NextResponse.json({ error: "otp_send_failed" }, { status: 500 });
  }
  if (!lead)
    return NextResponse.json({ error: "lead_not_found" }, { status: 404 });
  if (
    lead.verification_status === "otp_verified" ||
    lead.verification_status === "call_verified"
  ) {
    return NextResponse.json({ error: "already_verified" }, { status: 409 });
  }

  try {
    await sendOtpForLead(flow.leadId, lead.phone_e164);
    return NextResponse.json({ delivery: "accepted" });
  } catch (error) {
    if (error instanceof OtpCooldownError) {
      return NextResponse.json({ error: "resend_cooldown" }, { status: 429 });
    }
    return NextResponse.json({ error: "otp_delivery_failed" }, { status: 502 });
  }
}
