"use client";

import { useState } from "react";
import { ExternalLink, Film, LoaderCircle } from "lucide-react";
import { shouldShowCampaignMedia } from "@/lib/passenger-flow/ui";

export function CampaignMedia({
  videoUrl,
  posterUrl,
  caption,
  external,
}: {
  videoUrl?: string | null;
  posterUrl?: string | null;
  caption?: string | null;
  external?: boolean;
}) {
  const [loading, setLoading] = useState(Boolean(videoUrl && !external));
  const [failed, setFailed] = useState(false);
  const hasVideo = shouldShowCampaignMedia(videoUrl);

  if (hasVideo && videoUrl && external) {
    return (
      <a href={videoUrl} target="_blank" rel="noreferrer" className="group relative flex aspect-video items-end overflow-hidden rounded-[24px] bg-[var(--passenger-navy)] p-5 text-white shadow-[0_18px_45px_rgba(11,31,51,0.18)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--passenger-primary)]">
        {posterUrl && <span aria-hidden="true" className="absolute inset-0 bg-cover bg-center opacity-55 transition-transform duration-300 motion-safe:group-hover:scale-[1.02]" style={{ backgroundImage: `url(${posterUrl})` }} />}
        <span className="relative flex items-center gap-3 rounded-2xl bg-black/55 px-4 py-3 text-sm font-bold backdrop-blur-sm">
          <ExternalLink aria-hidden="true" className="size-5" />
          {caption || "Watch campaign video"}
        </span>
      </a>
    );
  }

  if (hasVideo && videoUrl && !failed) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-[24px] bg-[var(--passenger-navy)] shadow-[0_18px_45px_rgba(11,31,51,0.18)]">
        {loading && <div role="status" className="absolute inset-0 grid place-items-center text-white"><LoaderCircle aria-hidden="true" className="size-8 animate-spin motion-reduce:animate-none" /><span className="sr-only">Loading campaign video</span></div>}
        <video controls playsInline muted preload="metadata" poster={posterUrl || undefined} onLoadedData={() => setLoading(false)} onError={() => { setLoading(false); setFailed(true); }} className="size-full object-cover">
          <source src={videoUrl} />
          Your browser does not support campaign video playback.
        </video>
      </div>
    );
  }

  return (
    <div className="flex aspect-video items-center justify-center rounded-[24px] border border-[var(--passenger-line)] bg-[linear-gradient(135deg,var(--passenger-primary-soft),#fff_48%,#eef2f5)] p-6 text-center">
      <div><Film aria-hidden="true" className="mx-auto size-9 text-[var(--passenger-primary)]" /><p className="mt-3 font-bold">{failed ? "Video unavailable right now" : "Discover this campaign"}</p><p className="mt-1 text-sm text-[var(--passenger-muted)]">{caption || "Campaign details are available below."}</p></div>
    </div>
  );
}
