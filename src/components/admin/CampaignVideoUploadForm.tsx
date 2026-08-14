"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const input = "mt-1 min-h-10 w-full rounded-xl border border-slate-300 px-3";

export function CampaignVideoUploadForm({ campaigns }: { campaigns: Array<{ id: string; label: string }> }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(null); setProgress("Preparing secure upload…");
    const form = new FormData(event.currentTarget); const file = form.get("video");
    if (!(file instanceof File) || !file.size) { setError("Choose an MP4 or WebM video."); setBusy(false); return; }
    if (file.size > 50_000_000) { setError("The video must be under 50 MB."); setBusy(false); return; }
    try {
      const campaignId = String(form.get("campaignId"));
      const prepared = await fetch("/api/v1/admin/media", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "prepare", campaignId, fileName: file.name, contentType: file.type, size: file.size }) });
      const uploadDetails = await prepared.json(); if (!prepared.ok) throw new Error(uploadDetails.error || "Unable to prepare upload.");
      setProgress("Uploading directly to Supabase…");
      const { error: uploadError } = await createClient().storage.from("campaign-videos").uploadToSignedUrl(uploadDetails.path, uploadDetails.token, file, { contentType: file.type, cacheControl: "31536000" });
      if (uploadError) throw uploadError;
      setProgress("Saving and activating video…");
      const completed = await fetch("/api/v1/admin/media", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "complete", campaignId, path: uploadDetails.path, duration: Number(form.get("duration")), caption: String(form.get("caption") || ""), active: form.get("active") === "on" }) });
      const result = await completed.json(); if (!completed.ok) throw new Error(result.error || "Unable to save video.");
      setProgress("Video uploaded and activated."); event.currentTarget.reset(); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Video upload failed."); setProgress(null); }
    finally { setBusy(false); }
  }

  return <form onSubmit={submit} className="rounded-2xl bg-white p-5">
    <h2 className="text-xl font-black">Upload campaign video</h2><p className="mt-2 text-sm text-slate-500">The file uploads securely and directly to Supabase Storage.</p>
    <label className="mt-3 block text-sm font-bold">Campaign<select name="campaignId" className={input} required>{campaigns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
    <label className="mt-3 block text-sm font-bold">Video file (MP4 or WebM, max 50 MB)<input name="video" type="file" accept="video/mp4,video/webm" required className={`${input} py-2`} /></label>
    <label className="mt-3 block text-sm font-bold">Duration, seconds<input name="duration" type="number" min="30" max="50" required className={input} /></label>
    <label className="mt-3 block text-sm font-bold">Caption<input name="caption" maxLength={240} className={input} /></label>
    <label className="mt-3 flex gap-2 text-sm font-bold"><input name="active" type="checkbox" defaultChecked /> Show this video on the passenger page</label>
    {progress && <p className="mt-3 text-sm font-bold text-emerald-700" aria-live="polite">{progress}</p>}{error && <p className="mt-3 text-sm font-bold text-red-700" role="alert">{error}</p>}
    <button disabled={busy || !campaigns.length} className="mt-4 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Uploading…" : "Upload and activate video"}</button>
  </form>;
}
