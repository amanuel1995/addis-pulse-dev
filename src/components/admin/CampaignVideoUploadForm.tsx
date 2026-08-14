"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const input = "mt-1 min-h-10 w-full rounded-xl border border-slate-300 px-3";
type Source = "supabase_storage" | "youtube" | "vimeo" | "cloudinary";

export function CampaignVideoUploadForm({ campaigns }: { campaigns: Array<{ id: string; label: string }> }) {
  const router = useRouter();
  const [source, setSource] = useState<Source>("supabase_storage");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBusy(true); setError(null); setProgress("Preparing video…");
    try {
      const campaignId = String(form.get("campaignId"));
      const common = { campaignId, duration: Number(form.get("duration")), caption: String(form.get("caption") || ""), active: form.get("active") === "on" };
      if (source !== "supabase_storage") {
        const completed = await fetch("/api/v1/admin/media", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "external", provider: source, url: String(form.get("url") || ""), ...common }) });
        const result = await completed.json(); if (!completed.ok) throw new Error(result.error || "Unable to save video URL.");
        setProgress("Video URL saved and activated.");
      } else {
        const file = form.get("video");
        if (!(file instanceof File) || !file.size) throw new Error("Choose an MP4 or WebM video.");
        if (file.size > 50_000_000) throw new Error("The video must be under 50 MB.");
        const prepared = await fetch("/api/v1/admin/media", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "prepare", campaignId, fileName: file.name, contentType: file.type, size: file.size }) });
        const uploadDetails = await prepared.json(); if (!prepared.ok) throw new Error(uploadDetails.error || "Unable to prepare upload.");
        setProgress("Uploading directly to Supabase…");
        const { error: uploadError } = await createClient().storage.from("campaign-videos").uploadToSignedUrl(uploadDetails.path, uploadDetails.token, file, { contentType: file.type, cacheControl: "31536000" });
        if (uploadError) throw uploadError;
        setProgress("Saving and activating video…");
        const completed = await fetch("/api/v1/admin/media", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "complete", path: uploadDetails.path, ...common }) });
        const result = await completed.json(); if (!completed.ok) throw new Error(result.error || "Unable to save video.");
        setProgress("Video uploaded and activated.");
      }
      formElement.reset(); setSource("supabase_storage"); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Video upload failed."); setProgress(null); }
    finally { setBusy(false); }
  }

  return <form onSubmit={submit} className="rounded-2xl bg-white p-5">
    <h2 className="text-xl font-black">Add campaign video</h2><p className="mt-2 text-sm text-slate-500">Upload a file or use a hosted YouTube, Vimeo, or Cloudinary link.</p>
    <label className="mt-3 block text-sm font-bold">Campaign<select name="campaignId" className={input} required>{campaigns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
    <label className="mt-3 block text-sm font-bold">Video source<select value={source} onChange={event => setSource(event.target.value as Source)} className={input}><option value="supabase_storage">Upload MP4/WebM file</option><option value="youtube">YouTube URL</option><option value="vimeo">Vimeo URL</option><option value="cloudinary">Cloudinary URL</option></select></label>
    {source === "supabase_storage" ? <label className="mt-3 block text-sm font-bold">Video file (MP4 or WebM, max 50 MB)<input name="video" type="file" accept="video/mp4,video/webm" required className={`${input} py-2`} /></label> : <label className="mt-3 block text-sm font-bold">{source === "youtube" ? "YouTube" : source === "vimeo" ? "Vimeo" : "Cloudinary"} URL<input name="url" type="url" required placeholder={source === "youtube" ? "https://www.youtube.com/watch?v=TokQvB_ufU4" : "https://…"} className={input} /></label>}
    <label className="mt-3 block text-sm font-bold">Duration, seconds<input name="duration" type="number" min="30" max="50" required className={input} /></label>
    <label className="mt-3 block text-sm font-bold">Caption<input name="caption" maxLength={240} className={input} /></label>
    <label className="mt-3 flex gap-2 text-sm font-bold"><input name="active" type="checkbox" defaultChecked /> Show this video on the passenger page</label>
    {progress && <p className="mt-3 text-sm font-bold text-emerald-700" aria-live="polite">{progress}</p>}{error && <p className="mt-3 text-sm font-bold text-red-700" role="alert">{error}</p>}
    <button disabled={busy || !campaigns.length} className="mt-4 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Saving…" : source === "supabase_storage" ? "Upload and activate video" : "Save and activate video"}</button>
  </form>;
}
