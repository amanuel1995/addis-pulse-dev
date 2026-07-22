import Link from "next/link";
import { ScanLine } from "lucide-react";
import { FlowStatusCard } from "@/components/passenger/FlowStatusCard";

export default function InvalidQrNotFound() {
  return <FlowStatusCard icon={<ScanLine aria-hidden="true" className="size-8" />} eyebrow="QR not recognized" title="This QR link is not valid" description="Check that the full QR code is visible and scan it again. No campaign information is available for this link."><Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[var(--passenger-line)] px-5 py-3 font-bold text-[var(--passenger-primary)]">Go to AddisPulse</Link></FlowStatusCard>;
}
