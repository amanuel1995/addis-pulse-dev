import { RealtimeLeadDashboard } from "@/components/advertiser/RealtimeLeadDashboard";
import { AdvertiserShell } from "@/components/advertiser/AdvertiserShell";
import { maskAdvertiserPhone, type DashboardLead } from "@/lib/advertiser-dashboard/leads";
import { requireAdvertiserContext } from "@/lib/advertiser/auth";

export const dynamic = "force-dynamic";

export default async function AdvertiserDashboardPage() {
  const { supabase, user, memberships: allMemberships } = await requireAdvertiserContext();
  const memberships = allMemberships.filter((membership) => membership.can_view_leads);
  const shellCompanies = memberships.map((membership) => membership.companies?.name || "Company");

  if (!memberships?.length) {
    return (
      <AdvertiserShell title="Pilot lead dashboard" companies={shellCompanies}>
        <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-xl font-bold text-amber-950">Dashboard access unavailable</h2>
          <p className="mt-2 text-sm leading-6 text-amber-900">
            You are signed in as <strong>{user.email || "an account without advertiser access"}</strong>. Sign out, then use the advertiser representative account supplied by AddisPulse.
          </p>
        </section>
      </AdvertiserShell>
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

  return (
    <AdvertiserShell title="Pilot lead dashboard" companies={shellCompanies}>
      <RealtimeLeadDashboard
        initialLeads={leads}
        campaignNames={campaignNames}
        companyIds={companyIds}
        realtimeEnabled={memberships.some((membership) => membership.realtime_enabled)}
      />
    </AdvertiserShell>
  );
}
