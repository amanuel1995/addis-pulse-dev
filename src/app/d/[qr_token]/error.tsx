"use client";

import { AlertTriangle } from "lucide-react";
import { FlowStatusCard } from "@/components/passenger/FlowStatusCard";

export default function CampaignError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <FlowStatusCard icon={<AlertTriangle aria-hidden="true" className="size-8" />} eyebrow="Temporarily unavailable" title="This campaign is temporarily unavailable" description="Please try again shortly. Your information has not been submitted."><button type="button" onClick={reset} className="min-h-12 rounded-2xl bg-[var(--passenger-primary)] px-5 py-3 font-bold text-white hover:bg-[var(--passenger-primary-dark)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--passenger-primary)]">Try again</button>{error.digest && <p className="mt-4 text-xs text-[var(--passenger-muted)]">Error reference: {error.digest}</p>}</FlowStatusCard>;
}
