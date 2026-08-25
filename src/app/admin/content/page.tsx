import { AdminShell, Notice } from "@/components/admin/AdminShell";
import { requirePlatformAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { addCampaignZone, saveCampaignContent } from "../control-actions";

export const dynamic = "force-dynamic";
const input = "mt-1 min-h-10 w-full rounded-xl border border-slate-300 px-3";
const languages = [{ value: "en", label: "English" }, { value: "am", label: "Amharic (አማርኛ)" }, { value: "om", label: "Afaan Oromo" }, { value: "ar", label: "Arabic (العربية)" }];

export default async function Page({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const [admin, query] = await Promise.all([requirePlatformAdmin(), searchParams]); const db = createAdminClient();
  const [{ data: campaigns }, { data: content }, { data: zones }, { data: videos }] = await Promise.all([
    db.from("campaigns").select("id,name,companies(name)").order("name"),
    db.from("campaign_content").select("campaign_id,locale,headline,subheadline,active,content_version,campaigns(name)").order("updated_at", { ascending: false }),
    db.from("campaign_zones").select("campaign_id,zone_name,campaigns(name)"),
    db.from("campaign_videos").select("id,campaign_id,provider,video_url,video_path,duration_seconds,caption,active,validated_at,campaigns(name)").order("created_at", { ascending: false }),
  ]);
  return <AdminShell title="Campaign content studio" eyebrow="Landing page, zones and media" adminName={admin.full_name}><Notice {...query} />
    <div className="mt-7 grid gap-6 xl:grid-cols-[1.4fr_.6fr]">
      <form action={saveCampaignContent} className="rounded-2xl bg-white p-5"><h2 className="text-xl font-black">Localized campaign copy</h2><p className="mt-2 text-sm text-slate-500">Save one version for each language. Passengers see it when they use the language selector.</p><div className="grid gap-3 sm:grid-cols-2"><label className="mt-3 text-sm font-bold">Campaign<select name="campaignId" className={input}>{(campaigns || []).map(c => <option key={c.id} value={c.id}>{c.companies?.name} · {c.name}</option>)}</select></label><label className="mt-3 text-sm font-bold">Language<select name="locale" defaultValue="en" className={input}>{languages.map(language => <option key={language.value} value={language.value}>{language.label}</option>)}</select></label></div>{[["headline", "Headline"], ["subheadline", "Subheadline"], ["offer", "Offer"], ["reward", "Reward"], ["cta", "Call to action"], ["privacy", "Privacy notice"]].map(([name, label]) => <label key={name} className="mt-3 block text-sm font-bold">{label}<input name={name} required={name === "headline"} className={input} /></label>)}<label className="mt-3 block text-sm font-bold">Public campaign description<textarea name="description" className={`${input} min-h-24 py-2`} /></label><button className="mt-4 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white">Save language version</button></form>
      <form action={addCampaignZone} className="rounded-2xl bg-white p-5"><h2 className="text-xl font-black">Add campaign zone</h2><label className="mt-3 block text-sm font-bold">Campaign<select name="campaignId" className={input}>{(campaigns || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label className="mt-3 block text-sm font-bold">Zone<input name="zone" required className={input} /></label><button className="mt-4 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white">Add zone</button><h3 className="mt-7 font-black">Current zones</h3>{(zones || []).map(z => <p key={`${z.campaign_id}:${z.zone_name}`} className="mt-2 rounded-lg bg-slate-50 p-2 text-sm">{z.campaigns?.name} · {z.zone_name}</p>)}</form>
    </div>
    <div className="mt-6 grid gap-6 xl:grid-cols-2"><List title="Published language versions" rows={(content || []).map(item => `${item.campaigns?.name} · ${languages.find(language => language.value === item.locale)?.label || item.locale} · v${item.content_version} · ${item.headline}`)} /><List title="Campaign media" rows={(videos || []).map(item => `${item.campaigns?.name} · ${item.provider} · ${item.duration_seconds}s · ${item.active ? "active" : "inactive"} · ${item.validated_at ? "validated" : "pending validation"}`)} /></div>
  </AdminShell>;
}

function List({ title, rows }: { title: string; rows: string[] }) { return <section className="rounded-2xl bg-white p-5"><h2 className="text-xl font-black">{title}</h2>{rows.map((row, index) => <p key={index} className="mt-2 rounded-lg bg-slate-50 p-3 text-sm">{row}</p>)}</section>; }
