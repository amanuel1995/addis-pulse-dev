"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdvertiserContext } from "@/lib/advertiser/auth";
import { createAdminClient } from "@/lib/supabase/admin";

async function authorizeCampaign(campaignId: string) {
  const { user, memberships } = await requireAdvertiserContext();
  const admin = createAdminClient();
  const { data: campaign } = await admin.from("campaigns").select("id,company_id").eq("id", campaignId).maybeSingle();
  if (!campaign || !memberships.some((m) => m.company_id === campaign.company_id && m.can_update_lead_status)) {
    redirect("/advertiser/operations?error=Operations+approval+permission+required");
  }
  return { admin, user };
}

const money = z.coerce.number().min(0).max(1_000_000);
const calculationSchema = z.object({ campaignId: z.uuid(), baseFee: money, perLead: money, topPrize: money, complianceThreshold: z.coerce.number().min(0).max(100), deduction: money });

export async function calculateBonuses(formData: FormData) {
  const parsed = calculationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/advertiser/operations?error=Check+the+bonus+rules");
  const { admin } = await authorizeCampaign(parsed.data.campaignId);
  const { error } = await admin.rpc("calculate_driver_bonuses_server", {
    p_campaign_id: parsed.data.campaignId,
    p_base_fee_etb: parsed.data.baseFee,
    p_bonus_per_verified_lead_etb: parsed.data.perLead,
    p_top_driver_prize_etb: parsed.data.topPrize,
    p_compliance_threshold: parsed.data.complianceThreshold,
    p_compliance_deduction_etb: parsed.data.deduction,
  });
  if (error) redirect(`/advertiser/operations?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/advertiser/operations");
  redirect("/advertiser/operations?message=Bonus+drafts+calculated");
}

export async function approveBonus(formData: FormData) {
  const parsed = z.object({ bonusId: z.uuid(), campaignId: z.uuid(), confirmation: z.literal("approve") }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/advertiser/operations?error=Approval+confirmation+required");
  const { admin, user } = await authorizeCampaign(parsed.data.campaignId);
  const { data, error } = await admin.from("driver_bonuses").update({ status: "approved", approved_by: user.id, approved_at: new Date().toISOString() }).eq("id", parsed.data.bonusId).eq("campaign_id", parsed.data.campaignId).eq("status", "pending").select("id").maybeSingle();
  if (error || !data) redirect("/advertiser/operations?error=Bonus+is+not+pending+or+could+not+be+approved");
  revalidatePath("/advertiser/operations");
  redirect("/advertiser/operations?message=Bonus+approved");
}
