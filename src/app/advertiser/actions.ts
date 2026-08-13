"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdvertiserContext } from "@/lib/advertiser/auth";

const databaseUuid = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
const leadStatus = z.enum(["new", "viewed", "contacted", "appointment_set", "followed_up", "converted", "rejected", "duplicate", "invalid"]);

export async function signOutAdvertiser() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/advertiser/login");
}

export async function updateLeadPipelineStatus(formData: FormData) {
  const { supabase, memberships } = await requireAdvertiserContext();
  const leadId = databaseUuid.safeParse(String(formData.get("leadId") || ""));
  const status = leadStatus.safeParse(String(formData.get("status") || ""));
  if (!leadId.success || !status.success) redirect("/advertiser/leads?error=Invalid+lead+update");

  const { data: lead } = await supabase.from("leads").select("id,company_id,verification_status").eq("id", leadId.data).maybeSingle();
  const permission = lead && memberships.find((membership) => membership.company_id === lead.company_id && membership.can_update_lead_status);
  if (!lead || !permission || !["otp_verified", "call_verified"].includes(lead.verification_status)) {
    redirect("/advertiser/leads?error=You+cannot+update+this+lead");
  }

  const now = new Date().toISOString();
  const timestamps = {
    viewed_at: status.data === "viewed" ? now : undefined,
    followed_up_at: status.data === "followed_up" ? now : undefined,
    converted_at: status.data === "converted" ? now : undefined,
  };
  const { error } = await supabase.from("leads").update({ status: status.data, ...timestamps }).eq("id", lead.id);
  if (error) {
    console.error("[advertiser:update-lead-status]", { code: error.code, message: error.message });
    redirect("/advertiser/leads?error=Unable+to+update+lead+status");
  }
  revalidatePath("/advertiser/leads");
  revalidatePath("/advertiser/campaigns");
  redirect("/advertiser/leads?message=Lead+status+updated");
}
