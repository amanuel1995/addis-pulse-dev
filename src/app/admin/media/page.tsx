import { AdminShell, Notice } from "@/components/admin/AdminShell";
import { requirePlatformAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { addCampaignVideo } from "../control-actions";

export const dynamic = "force-dynamic";
const input = "mt-1 min-h-10 w-full rounded-xl border border-slate-300 px-3";

export default async function Page({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const [adminUser, query] = await Promise.all([requirePlatformAdmin(), searchParams]);
  const db = createAdminClient();
  const [{ data: campaigns }, { data: videos }] = await Promise.all([
    db.from("campaigns").select("id,name,companies(name)").order("name"),
    db.from("campaign_videos").select("id,provider,video_url,video_path,duration_seconds,caption,active,validated_at,campaigns(name)").order("created_at", { ascending: false }),
  ]);
  return <AdminShell title="Campaign media" eyebrow="Validated promotional videos" adminName={adminUser.full_name}>
    <Notice {...query} />
    <div className="mt-7 grid gap-6 xl:grid-cols-[.7fr_1.3fr]">
      <form action={addCampaignVideo} encType="multipart/form-data" className="rounded-2xl bg-white p-5">
        <h2 className="text-xl font-black">Add campaign video</h2>
        <p className="mt-2 text-sm text-slate-500">Upload an MP4/WebM file, or paste a hosted video URL.</p>
        <label className="mt-3 block text-sm font-bold">Campaign<select name="campaignId" className={input}>{(campaigns || []).map(c => <option key={c.id} value={c.id}>{c.companies?.name} · {c.name}</option>)}</select></label>
        <label className="mt-3 block text-sm font-bold">Source<select name="provider" className={input} defaultValue="supabase_storage"><option value="supabase_storage">Upload a video file</option><option value="youtube">YouTube URL</option><option value="vimeo">Vimeo URL</option><option value="cloudinary">Cloudinary URL</option></select></label>
        <label className="mt-3 block text-sm font-bold">Video file (MP4 or WebM, max 100 MB)<input name="video" type="file" accept="video/mp4,video/webm" className={`${input} py-2`} /></label>
        <label className="mt-3 block text-sm font-bold">Hosted URL (only for URL sources)<input name="url" type="url" placeholder="https://…" className={input} /></label>
        <label className="mt-3 block text-sm font-bold">Duration, seconds<input name="duration" type="number" min="30" max="50" required className={input} /></label>
        <label className="mt-3 block text-sm font-bold">Caption<input name="caption" className={input} /></label>
        <label className="mt-3 flex gap-2 text-sm font-bold"><input name="active" type="checkbox" defaultChecked /> Show this video on the passenger page</label>
        <button className="mt-4 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white">Upload and save video</button>
      </form>
      <section className="rounded-2xl bg-white p-5"><h2 className="text-xl font-black">Media library</h2>{(videos || []).map(v => <article key={v.id} className="mt-3 rounded-xl border p-4"><div className="flex justify-between"><strong>{v.campaigns?.name}</strong><span className={v.active ? "text-emerald-700" : "text-slate-500"}>{v.active ? "Active" : "Inactive"}</span></div><p className="mt-1 text-sm">{v.provider} · {v.duration_seconds}s · {v.caption || "No caption"}</p>{v.video_url ? <a className="mt-2 block break-all text-xs text-blue-700 underline" href={v.video_url}>{v.video_url}</a> : <p className="mt-2 break-all text-xs text-slate-500">Uploaded file: {v.video_path}</p>}</article>)}</section>
    </div>
  </AdminShell>;
}
