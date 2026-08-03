import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getPlatformAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,full_name,email,platform_role,status")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.platform_role || profile.status !== "active") return null;
  return profile;
}

export async function requirePlatformAdmin() {
  const admin = await getPlatformAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
