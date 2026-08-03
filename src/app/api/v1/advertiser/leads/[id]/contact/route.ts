import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const databaseUuid = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!databaseUuid.safeParse(id).success) return NextResponse.json({ error: "invalid_lead" }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: lead } = await supabase.from("leads").select("id,company_id,phone_e164,email,verification_status").eq("id", id).maybeSingle();
  if (!lead || !["otp_verified", "call_verified"].includes(lead.verification_status)) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const { data: membership } = await supabase.from("company_memberships").select("company_id").eq("company_id", lead.company_id).eq("user_id", user.id).eq("active", true).eq("can_view_leads", true).maybeSingle();
  if (!membership) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return NextResponse.json({ phone: lead.phone_e164, email: lead.email }, { headers: { "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" } });
}
