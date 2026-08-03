import { AdminShell, EmptyState, Notice } from "@/components/admin/AdminShell";
import { createCampaign, updateCampaignStatus } from "@/app/admin/actions";
import { requirePlatformAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
const input = "mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 outline-none focus:border-red-800";

export default async function CampaignsPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const [actor, query] = await Promise.all([requirePlatformAdmin(), searchParams]);
  const admin = createAdminClient();
  const [{ data: companies }, { data: campaigns, error }] = await Promise.all([
    admin.from("companies").select("id,name,status").in("status", ["draft", "active"]).order("name"),
    admin.from("campaigns").select("id,company_id,name,campaign_type,status,start_date,end_date,vehicle_count,target_leads,budget_etb,companies(name)").order("created_at", { ascending: false }),
  ]);
  if (error) throw new Error(`Unable to load campaigns: ${error.message}`);
  return (
    <AdminShell title="Campaign management" eyebrow="Offer and schedule" adminName={actor.full_name || actor.email}>
      <Notice message={query.message} error={query.error} />
      <div className="mt-8 grid gap-7 xl:grid-cols-[0.9fr_1.1fr]">
        <form action={createCampaign} className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Create campaign</h2><p className="mt-2 text-sm text-slate-500">Creates the campaign and its required English landing content together.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold sm:col-span-2">Company<select className={input} name="companyId" required defaultValue=""><option value="" disabled>Select company</option>{companies?.map((company) => <option key={company.id} value={company.id}>{company.name} ({company.status})</option>)}</select></label>
            <label className="text-sm font-bold">Campaign name<input className={input} name="name" required /></label>
            <label className="text-sm font-bold">Campaign type<select className={input} name="campaignType" defaultValue="lead_generation"><option value="lead_generation">Lead generation</option><option value="appointment_booking">Appointment booking</option><option value="product_launch">Product launch</option><option value="brand_awareness">Brand awareness</option></select></label>
            <label className="text-sm font-bold">Start date<input className={input} name="startDate" type="date" required /></label>
            <label className="text-sm font-bold">End date<input className={input} name="endDate" type="date" required /></label>
            <label className="text-sm font-bold">Vehicles<input className={input} name="vehicleCount" type="number" min="1" defaultValue="10" required /></label>
            <label className="text-sm font-bold">Target leads<input className={input} name="targetLeads" type="number" min="0" /></label>
            <label className="text-sm font-bold sm:col-span-2">Budget ETB<input className={input} name="budgetEtb" type="number" min="0" step="0.01" /></label>
          </div>
          <label className="mt-4 block text-sm font-bold">Landing headline<input className={input} name="headline" required /></label>
          <label className="mt-4 block text-sm font-bold">Offer<textarea className={`${input} min-h-20 py-3`} name="offerText" /></label>
          <label className="mt-4 block text-sm font-bold">Reward description<textarea className={`${input} min-h-20 py-3`} name="rewardDescription" /></label>
          <label className="mt-4 block text-sm font-bold">Passenger privacy notice<textarea className={`${input} min-h-24 py-3`} name="privacyNotice" required defaultValue="By submitting, you consent to AddisPulse sharing your verified request with this campaign advertiser for follow-up." /></label>
          <button disabled={!companies?.length} className="mt-5 min-h-11 w-full rounded-xl bg-slate-950 px-4 font-black text-white hover:bg-red-900 disabled:opacity-50">Create draft campaign</button>
        </form>
        <section><h2 className="text-xl font-black">Campaign portfolio</h2><div className="mt-4 space-y-3">
          {!campaigns?.length ? <EmptyState>No campaigns created yet.</EmptyState> : campaigns.map((campaign) => <article key={campaign.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-xs font-black uppercase tracking-wider text-red-800">{campaign.companies?.name || "Unknown company"}</p><h3 className="mt-1 font-black">{campaign.name}</h3><p className="mt-2 text-sm text-slate-500">{campaign.start_date} → {campaign.end_date} · {campaign.vehicle_count} vehicles</p><p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-500">{campaign.campaign_type.replaceAll("_", " ")} · {campaign.status}</p></div><form action={updateCampaignStatus} className="flex gap-2"><input type="hidden" name="id" value={campaign.id} /><select name="status" defaultValue={campaign.status} className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-bold"><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="active">Active</option><option value="paused">Paused</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select><button className="rounded-lg bg-slate-100 px-3 text-sm font-bold hover:bg-slate-200">Update</button></form></div></article>)}
        </div></section>
      </div>
    </AdminShell>
  );
}
