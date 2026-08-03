import Link from "next/link";
import { AdvertiserShell } from "@/components/advertiser/AdvertiserShell";
import { requireAdvertiserContext } from "@/lib/advertiser/auth";
import { calculateCampaignValueMetrics } from "@/lib/advertiser/value";

export const dynamic = "force-dynamic";

export default async function AdvertiserCampaignsPage() {
  const { supabase, memberships } = await requireAdvertiserContext();
  const visible = memberships.filter((membership) => membership.can_view_leads);
  const companyIds = visible.map((membership) => membership.company_id);
  const companyNames = visible.map((membership) => membership.companies?.name || "Company");
  const safeCompanyIds = companyIds.length ? companyIds : ["00000000-0000-0000-0000-000000000000"];
  const [{ data: campaigns, error: campaignError }, { data: visits, error: visitError }, { data: leads, error: leadError }] = await Promise.all([
    supabase.from("campaigns").select("id,name,company_id,status,start_date,end_date,budget_etb,target_leads,vehicle_count,companies(name)").in("company_id", safeCompanyIds).order("start_date", { ascending: false }),
    supabase.from("landing_page_visits").select("campaign_id").in("company_id", safeCompanyIds),
    supabase.from("leads").select("campaign_id,verification_status,status").in("company_id", safeCompanyIds).is("deleted_at", null),
  ]);
  if (campaignError || visitError || leadError) throw new Error("Unable to load campaign value metrics.");
  const metrics = calculateCampaignValueMetrics(
    (campaigns || []).map((campaign) => ({ id: campaign.id, name: campaign.name, budgetEtb: campaign.budget_etb === null ? null : Number(campaign.budget_etb) })),
    (visits || []).map((visit) => ({ campaignId: visit.campaign_id })),
    (leads || []).map((lead) => ({ campaignId: lead.campaign_id, verificationStatus: lead.verification_status, status: lead.status })),
  );
  const totals = metrics.reduce((value, metric) => ({ scans: value.scans + metric.scans, leads: value.leads + metric.leads, verified: value.verified + metric.verified, converted: value.converted + metric.converted }), { scans: 0, leads: 0, verified: 0, converted: 0 });
  return (
    <AdvertiserShell title="Campaign value" companies={companyNames}>
      <p className="mt-4 max-w-2xl leading-7 text-slate-600">A live view from QR attention through verified demand and sales conversion.</p>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["QR scans", totals.scans], ["Leads", totals.leads], ["Verified", totals.verified], ["Converted", totals.converted]].map(([label, count]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-bold text-slate-500">{label}</p><p className="mt-2 text-4xl font-black">{count}</p></div>)}</div>
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {(campaigns || []).map((campaign) => {
          const metric = metrics.find((item) => item.id === campaign.id)!;
          return <article key={campaign.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wider text-red-800">{campaign.companies?.name}</p><h2 className="mt-1 text-xl font-black">{campaign.name}</h2><p className="mt-2 text-sm text-slate-500">{campaign.start_date} → {campaign.end_date} · {campaign.vehicle_count} vehicles</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase text-slate-600">{campaign.status}</span></div><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Scans", metric.scans], ["Leads", metric.leads], ["Verified", metric.verified], ["Converted", metric.converted]].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>)}</div><dl className="mt-5 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2"><div><dt className="text-xs font-bold text-slate-500">Scan → lead</dt><dd className="mt-1 font-black">{metric.scanToLeadRate}%</dd></div><div><dt className="text-xs font-bold text-slate-500">Lead verification</dt><dd className="mt-1 font-black">{metric.verificationRate}%</dd></div><div><dt className="text-xs font-bold text-slate-500">Verified → converted</dt><dd className="mt-1 font-black">{metric.conversionRate}%</dd></div><div><dt className="text-xs font-bold text-slate-500">Cost / verified lead</dt><dd className="mt-1 font-black">{metric.costPerVerifiedLead === null ? "—" : `${metric.costPerVerifiedLead.toLocaleString("en-US")} ETB`}</dd></div></dl><div className="mt-5 flex flex-wrap gap-3"><Link href={`/advertiser/leads?campaign=${campaign.id}`} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white hover:bg-red-900">View campaign leads</Link>{memberships.some((membership) => membership.company_id === campaign.company_id && membership.can_export_leads) && <a href={`/api/v1/advertiser/leads/export?campaign=${campaign.id}`} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-black hover:border-slate-950">Export CSV</a>}</div></article>;
        })}
      </div>
      {!campaigns?.length && <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">No campaigns are available for this account.</div>}
    </AdvertiserShell>
  );
}
