import Link from "next/link";
import { Clock3 } from "lucide-react";
import { FlowStatusCard } from "@/components/passenger/FlowStatusCard";
import { createClient } from "@/lib/supabase/server";
import type { PublicLandingPayload } from "@/types/passenger";

export default async function InactivePage({ params }: { params: Promise<{ qr_token: string }> }) {
  const { qr_token } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_public_landing_page", { p_public_path: `d/${qr_token}`, p_locale: "en" });
  const landing = data as PublicLandingPayload | null;
  return (
    <FlowStatusCard icon={<Clock3 aria-hidden="true" className="size-8" />} eyebrow="Valid passenger QR" title="No active offer right now" description={landing?.message || "This driver QR is valid, but there is no campaign assigned at the moment. Please try again later."}>
      <Link href={`/d/${encodeURIComponent(qr_token)}`} className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[var(--passenger-primary)] px-5 py-3 font-bold text-white hover:bg-[var(--passenger-primary-dark)]">Try again</Link>
    </FlowStatusCard>
  );
}
