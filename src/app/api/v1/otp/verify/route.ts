import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyFlowToken } from "@/lib/passenger-flow/security";
import { otpVerificationSchema } from "@/lib/passenger-flow/validation";

export async function POST(request: NextRequest) {
  const parsed = otpVerificationSchema.safeParse(
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
  const { data: verified, error } = await admin.rpc("verify_otp_server", {
    p_lead_id: flow.leadId,
    p_code_plaintext: parsed.data.code,
  });
  if (error)
    return NextResponse.json({ error: "verification_failed" }, { status: 500 });

  if (!verified) {
    const { data: otp, error: otpLookupError } = await admin
      .from("otp_verifications")
      .select("status, attempts, expires_at")
      .eq("lead_id", flow.leadId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (otpLookupError) {
      console.error("OTP verification state lookup failed", {
        code: otpLookupError.code,
        message: otpLookupError.message,
      });
      return NextResponse.json(
        { error: "verification_failed" },
        { status: 500 },
      );
    }
    const expired =
      otp?.status === "expired" ||
      (otp?.expires_at && Date.parse(otp.expires_at) <= Date.now());
    return NextResponse.json(
      {
        error: expired
          ? "otp_expired"
          : otp?.status === "failed"
            ? "attempts_exhausted"
            : "incorrect_otp",
        attempts: otp?.attempts,
      },
      { status: 422 },
    );
  }

  return NextResponse.json({
    verified: true,
    nextRoute: `/d/${encodeURIComponent(flow.qrToken)}/thank-you`,
  });
}
