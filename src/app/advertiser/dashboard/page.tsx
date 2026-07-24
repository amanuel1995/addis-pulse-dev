import { redirect } from "next/navigation";
import { RealtimeLeadDashboard } from "@/components/advertiser/RealtimeLeadDashboard";
import { maskAdvertiserPhone, type DashboardLead } from "@/lib/advertiser-dashboard/leads";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdvertiserDashboardPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/advertiser/login");

  const { data: memberships, error: membershipError } = await supabase
    .from("company_memberships")
    .select("company_id,realtime_enabled,companies(name)")
    .eq("user_id", user.id)
    .eq("active", true)
    .eq("can_view_leads", true);
  if (membershipError) throw new Error(`Unable to load advertiser access: ${membershipError.message}`);

  if (!memberships?.length) {
    return (
      <DashboardFrame>
        <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-xl font-bold text-amber-950">Dashboard access unavailable</h2>
          <p className="mt-2 text-sm leading-6 text-amber-900">Your authenticated account does not have an active company membership with permission to view leads. Contact an AddisPulse administrator.</p>
        </section>
      </DashboardFrame>
    );
  }

  const companyIds = memberships.map((membership) => membership.company_id);
  const [{ data: leadRows, error: leadError }, { data: campaigns, error: campaignError }] = await Promise.all([
    supabase.from("leads").select("id,company_id,campaign_id,full_name,phone_e164,created_at,verification_status").in("company_id", companyIds).is("deleted_at", null).order("created_at", { ascending: false }).limit(100),
    supabase.from("campaigns").select("id,name").in("company_id", companyIds),
  ]);
  if (leadError) throw new Error(`Unable to load advertiser leads: ${leadError.message}`);
  if (campaignError) throw new Error(`Unable to load advertiser campaigns: ${campaignError.message}`);

  const leadIds = (leadRows || []).map((lead) => lead.id);
  const rewardResult = leadIds.length
    ? await supabase.from("reward_issuances").select("lead_id,status").in("lead_id", leadIds)
    : { data: [], error: null };
  if (rewardResult.error) throw new Error(`Unable to load reward status: ${rewardResult.error.message}`);

  const campaignNames = Object.fromEntries((campaigns || []).map((campaign) => [campaign.id, campaign.name]));
  const rewardStatuses = Object.fromEntries((rewardResult.data || []).map((reward) => [reward.lead_id, reward.status]));
  const leads: DashboardLead[] = (leadRows || []).map((lead) => ({
    id: lead.id,
    companyId: lead.company_id,
    campaignId: lead.campaign_id,
    campaignName: lead.campaign_id ? campaignNames[lead.campaign_id] || null : null,
    fullName: lead.full_name,
    phoneLabel: maskAdvertiserPhone(lead.phone_e164),
    createdAt: lead.created_at,
    verificationStatus: lead.verification_status,
    rewardStatus: rewardStatuses[lead.id] || null,
  }));

  const companyNames = memberships
    .map((membership) => {
      const company = membership.companies as { name?: string } | null;
      return company?.name;
    })
    .filter(Boolean)
    .join(", ");

  return (
    <DashboardFrame companyNames={companyNames}>
      <RealtimeLeadDashboard
        initialLeads={leads}
        campaignNames={campaignNames}
        companyIds={companyIds}
        realtimeEnabled={memberships.some((membership) => membership.realtime_enabled)}
      />
    </DashboardFrame>
  );
}

function DashboardFrame({ children, companyNames }: { children: React.ReactNode; companyNames?: string }) {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-red-800">AddisPulse Media</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Pilot lead dashboard</h1>
        <p className="mt-2 text-slate-600">{companyNames || "Advertiser access"}</p>
        {children}
      </div>
    </main>
  );
}
