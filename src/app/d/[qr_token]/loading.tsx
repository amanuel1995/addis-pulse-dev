import { CampaignFooter, PassengerShell } from "@/components/passenger/PassengerShell";

export default function CampaignLoading() {
  return <PassengerShell><main aria-busy="true" aria-label="Loading campaign" className="mx-auto w-full max-w-6xl animate-pulse px-4 py-6 motion-reduce:animate-none sm:px-6 lg:py-10"><div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10"><div className="space-y-6"><div className="h-72 rounded-[28px] bg-white" /><div className="aspect-video rounded-[24px] bg-[var(--passenger-primary-soft)]" /><div className="h-44 rounded-[24px] bg-white" /></div><div className="h-[620px] rounded-[28px] bg-white" /></div><span className="sr-only">Loading campaign details</span></main><CampaignFooter /></PassengerShell>;
}
