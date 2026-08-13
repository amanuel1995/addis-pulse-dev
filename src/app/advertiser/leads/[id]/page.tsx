import { notFound } from "next/navigation";
import { AdvertiserShell } from "@/components/advertiser/AdvertiserShell";
import { SecureContact } from "@/components/advertiser/SecureContact";
import { maskAdvertiserPhone } from "@/lib/advertiser-dashboard/leads";
import { requireAdvertiserContext } from "@/lib/advertiser/auth";
import { addLeadActivity } from "../../extended-actions";

export const dynamic = "force-dynamic";
const input = "mt-1 min-h-10 w-full rounded-xl border border-slate-300 px-3";

export default async function LeadDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ message?: string; error?: string }> }) {
  const [{ id }, query, { supabase, memberships }] = await Promise.all([params, searchParams, requireAdvertiserContext()]);
  const { data: lead } = await supabase.from("leads").select("id,company_id,full_name,phone_e164,email,organization,interested_service_text,message,preferred_contact_method,verification_status,status,created_at,companies(name),campaigns(name)").eq("id", id).maybeSingle();
  if (!lead) notFound();
  const [{ data: history }, { data: activities }] = await Promise.all([
    supabase.from("lead_status_history").select("id,old_status,new_status,created_at,note,profiles!lead_status_history_changed_by_fkey(full_name)").eq("lead_id", id).order("created_at", { ascending: false }),
    supabase.from("lead_activities").select("id,activity_type,status,scheduled_at,completed_at,outcome_code,notes,created_at,profiles!lead_activities_performed_by_fkey(full_name)").eq("lead_id", id).order("created_at", { ascending: false }),
  ]);
  const canUpdate = memberships.some((membership) => membership.company_id === lead.company_id && membership.can_update_lead_status);
  return <AdvertiserShell title={lead.full_name} companies={memberships.map((membership) => membership.companies?.name || "Company")}>
    {(query.message || query.error) && <p className={`mt-5 rounded-xl p-3 font-bold ${query.error ? "bg-red-50 text-red-900" : "bg-emerald-50 text-emerald-900"}`}>{query.error || query.message}</p>}
    <div className="mt-7 grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
      <section className="rounded-2xl bg-white p-5"><h2 className="text-xl font-black">Lead details</h2><div className="mt-4"><SecureContact leadId={lead.id} maskedPhone={maskAdvertiserPhone(lead.phone_e164)} /></div><p className="mt-3"><strong>Campaign:</strong> {lead.campaigns?.name}</p><p className="mt-3"><strong>Interest:</strong> {lead.interested_service_text || "—"}</p><p className="mt-3"><strong>Organization:</strong> {lead.organization || "—"}</p><p className="mt-3"><strong>Message:</strong> {lead.message || "—"}</p><p className="mt-3"><strong>Status:</strong> {lead.status}</p></section>
      <form action={addLeadActivity} className="rounded-2xl bg-white p-5"><h2 className="text-xl font-black">Add follow-up activity</h2><input type="hidden" name="leadId" value={lead.id}/><div className="grid gap-3 sm:grid-cols-2"><label className="mt-3 text-sm font-bold">Type<select name="type" className={input}>{["call","sms","email","whatsapp","telegram","appointment","note"].map((value) => <option key={value}>{value}</option>)}</select></label><label className="mt-3 text-sm font-bold">Status<select name="status" className={input}>{["planned","in_progress","completed","cancelled"].map((value) => <option key={value}>{value}</option>)}</select></label></div><label className="mt-3 block text-sm font-bold">Scheduled time<input name="scheduledAt" type="datetime-local" className={input}/></label><label className="mt-3 block text-sm font-bold">Outcome<input name="outcome" className={input}/></label><label className="mt-3 block text-sm font-bold">Notes<textarea name="notes" className={`${input} min-h-20 py-2`}/></label><button disabled={!canUpdate} className="mt-4 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white disabled:opacity-40">Add activity</button></form>
    </div>
    <div className="mt-6 grid gap-6 xl:grid-cols-2"><Timeline title="Activity timeline" rows={(activities || []).map((item) => `${new Date(item.created_at).toLocaleString()} · ${item.activity_type} · ${item.status} · ${item.notes || item.outcome_code || "No note"}`)}/><Timeline title="Status history" rows={(history || []).map((item) => `${new Date(item.created_at).toLocaleString()} · ${item.old_status || "created"} → ${item.new_status}${item.note ? ` · ${item.note}` : ""}`)}/></div>
  </AdvertiserShell>;
}

function Timeline({ title, rows }: { title: string; rows: string[] }) { return <section className="rounded-2xl bg-white p-5"><h2 className="text-xl font-black">{title}</h2>{rows.map((row, index) => <p key={index} className="mt-2 rounded-lg bg-slate-50 p-3 text-sm">{row}</p>)}</section>; }
