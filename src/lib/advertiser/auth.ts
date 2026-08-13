import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireAdvertiserContext() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/advertiser/login");

  const { data: memberships, error } = await supabase
    .from("company_memberships")
    .select("company_id,can_edit_profile,can_view_leads,can_export_leads,can_update_lead_status,can_manage_notifications,can_manage_team,realtime_enabled,companies(name)")
    .eq("user_id", user.id)
    .eq("active", true);
  if (error) throw new Error(`Unable to load advertiser access: ${error.message}`);
  return { supabase, user, memberships: memberships || [] };
}
