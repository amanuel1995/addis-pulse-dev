"use client";

import { AlertTriangle } from "lucide-react";
import { FlowStatusCard } from "@/components/passenger/FlowStatusCard";

export default function CampaignError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <FlowStatusCard icon={<AlertTriangle aria-hidden="true" className="size-8" />} eyebrow="Connection problem" title="We could not load this campaign" description="Check your connection and try again. Your information has not been submitted."><button type="button" onClick={reset} className="min-h-12 rounded-2xl bg-[var(--passenger-primary)] px-5 py-3 font-bold text-white hover:bg-[var(--passenger-primary-dark)]">Try again</button></FlowStatusCard>;
}
