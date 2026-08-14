import { AdminShell, Notice } from "@/components/admin/AdminShell";
import { requirePlatformAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CampaignVideoUploadForm } from "@/components/admin/CampaignVideoUploadForm";

export const dynamic = "force-dynamic";

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
      <CampaignVideoUploadForm campaigns={(campaigns || []).map(c => ({ id: c.id, label: `${c.companies?.name} · ${c.name}` }))} />
      <section className="rounded-2xl bg-white p-5"><h2 className="text-xl font-black">Media library</h2>{(videos || []).map(v => <article key={v.id} className="mt-3 rounded-xl border p-4"><div className="flex justify-between"><strong>{v.campaigns?.name}</strong><span className={v.active ? "text-emerald-700" : "text-slate-500"}>{v.active ? "Active" : "Inactive"}</span></div><p className="mt-1 text-sm">{v.provider} · {v.duration_seconds}s · {v.caption || "No caption"}</p>{v.video_url ? <a className="mt-2 block break-all text-xs text-blue-700 underline" href={v.video_url}>{v.video_url}</a> : <p className="mt-2 break-all text-xs text-slate-500">Uploaded file: {v.video_path}</p>}</article>)}</section>
    </div>
  </AdminShell>;
}
