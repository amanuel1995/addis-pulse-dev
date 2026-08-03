import { AdvertiserShell } from "@/components/advertiser/AdvertiserShell";
import { LeadPipeline, type PipelineLead } from "@/components/advertiser/LeadPipeline";
import { requireAdvertiserContext } from "@/lib/advertiser/auth";
import { maskAdvertiserPhone } from "@/lib/advertiser-dashboard/leads";

export const dynamic = "force-dynamic";

export default async function AdvertiserLeadsPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string; campaign?: string }> }) {
  const [{ supabase, memberships }, query] = await Promise.all([requireAdvertiserContext(), searchParams]);
  const visible = memberships.filter((membership) => membership.can_view_leads);
  const companyIds = visible.map((membership) => membership.company_id);
  const companyNames = Object.fromEntries(visible.map((membership) => [membership.company_id, membership.companies?.name || "Company"]));
  let request = supabase.from("leads").select("id,company_id,campaign_id,full_name,phone_e164,interested_service_text,created_at,verification_status,status,campaigns(name)").in("company_id", companyIds.length ? companyIds : ["00000000-0000-0000-0000-000000000000"]).is("deleted_at", null).order("created_at", { ascending: false }).limit(500);
  if (query.campaign) request = request.eq("campaign_id", query.campaign);
  const { data, error } = await request;
  if (error) throw new Error(`Unable to load lead pipeline: ${error.message}`);
  const leads: PipelineLead[] = (data || []).map((lead) => ({
    id: lead.id, fullName: lead.full_name, maskedPhone: maskAdvertiserPhone(lead.phone_e164),
    campaignName: lead.campaigns?.name || "Unassigned campaign", companyName: companyNames[lead.company_id] || "Company",
    interest: lead.interested_service_text, createdAt: lead.created_at, verificationStatus: lead.verification_status,
    status: lead.status, canUpdate: Boolean(memberships.find((membership) => membership.company_id === lead.company_id)?.can_update_lead_status),
  }));
  const canExport = memberships.some((membership) => membership.can_export_leads);
  return (
    <AdvertiserShell title="Lead pipeline" companies={Object.values(companyNames)}>
      <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><p className="max-w-2xl leading-7 text-slate-600">Move verified customer interest from new through appointment and conversion, while keeping complete contact details behind an explicit reveal.</p>{canExport && <a href={`/api/v1/advertiser/leads/export${query.campaign ? `?campaign=${encodeURIComponent(query.campaign)}` : ""}`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-black text-white hover:bg-red-900">Export authorized CSV</a>}</div>
      {query.message && <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-800">{query.message}</p>}{query.error && <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">{query.error}</p>}
      <LeadPipeline leads={leads} />
    </AdvertiserShell>
  );
}
