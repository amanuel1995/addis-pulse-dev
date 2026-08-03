import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { rowsToCsv } from "@/lib/advertiser/value";

const databaseUuid = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: memberships, error: membershipError } = await supabase.from("company_memberships").select("company_id").eq("user_id", user.id).eq("active", true).eq("can_export_leads", true);
  if (membershipError || !memberships?.length) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const companyIds = memberships.map((membership) => membership.company_id);
  const campaign = new URL(request.url).searchParams.get("campaign");
  if (campaign && !databaseUuid.safeParse(campaign).success) return NextResponse.json({ error: "invalid_campaign" }, { status: 400 });
  const maxRows = Math.min(Math.max(Number(process.env.CSV_EXPORT_MAX_ROWS) || 5000, 1), 50000);
  let query = supabase.from("leads").select("id,company_id,campaign_id,full_name,phone_e164,email,interested_service_text,verification_status,status,created_at,campaigns(name),companies(name)").in("company_id", companyIds).is("deleted_at", null).in("verification_status", ["otp_verified", "call_verified"]).order("created_at", { ascending: false }).limit(maxRows);
  if (campaign) query = query.eq("campaign_id", campaign);
  const { data: leads, error } = await query;
  if (error) return NextResponse.json({ error: "export_failed" }, { status: 500 });
  const csv = rowsToCsv(
    ["Lead ID", "Company", "Campaign", "Name", "Phone", "Email", "Interest", "Verification", "Pipeline Status", "Submitted At"],
    (leads || []).map((lead) => [lead.id, lead.companies?.name, lead.campaigns?.name, lead.full_name, lead.phone_e164, lead.email, lead.interested_service_text, lead.verification_status, lead.status, lead.created_at]),
  );
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="addispulse-leads-${date}.csv"`, "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" } });
}
