import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyFlowToken } from "@/lib/passenger-flow/security";

type LandingPayload = {
  company?: { name?: string; brand_color?: string };
  campaign?: {
    reward_description?: string;
    content?: { reward_text?: string };
  };
};

export default async function ThankYouPage({
  params,
}: {
  params: Promise<{ qr_token: string }>;
}) {
  const { qr_token } = await params;
  const flow = verifyFlowToken(
    (await cookies()).get("ap_passenger_flow")?.value || "",
  );
  if (!flow || flow.qrToken !== qr_token) {
    redirect(`/d/${encodeURIComponent(qr_token)}`);
  }

  const admin = createAdminClient();
  const { data: lead, error: leadError } = await admin
    .from("leads")
    .select("verification_status")
    .eq("id", flow.leadId)
    .maybeSingle();
  if (leadError) throw new Error(`Failed to load verified lead: ${leadError.message}`);
  if (
    lead?.verification_status !== "otp_verified" &&
    lead?.verification_status !== "call_verified"
  ) {
    redirect(`/d/${encodeURIComponent(qr_token)}/verify`);
  }

  const { data, error } = await admin.rpc("get_public_landing_page", {
    p_public_path: `d/${qr_token}`,
    p_locale: "en",
  });
  if (error) throw new Error(`Failed to load reward details: ${error.message}`);
  const landing = data as LandingPayload | null;
  const reward =
    landing?.campaign?.content?.reward_text ||
    landing?.campaign?.reward_description ||
    "Your verified request has been received.";
  const brandColor = landing?.company?.brand_color || "#1A3A5C";

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-10 text-center">
      <section className="w-full rounded-2xl border bg-white p-8 shadow-sm">
        <div
          className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full text-2xl text-white"
          style={{ backgroundColor: brandColor }}
          aria-hidden="true"
        >
          ✓
        </div>
        <p className="text-sm font-medium text-gray-500">{landing?.company?.name}</p>
        <h1 className="mt-1 text-2xl font-bold">Thank you / እናመሰግናለን</h1>
        <p className="mt-3 text-gray-600">
          Your phone is verified and your request was received.
        </p>
        <div className="mt-5 rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
          <span className="font-semibold">Reward: </span>
          {reward}
        </div>
        <p className="mt-5 text-xs text-gray-500">
          Feedback collection will be available here in a future release.
        </p>
        <Link
          href={`/d/${encodeURIComponent(qr_token)}`}
          className="mt-6 inline-block text-sm font-medium underline"
        >
          Return to campaign
        </Link>
      </section>
    </main>
  );
}
