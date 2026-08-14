"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdvertiserContext } from "@/lib/advertiser/auth";

const schema = z.object({
  companyId: z.uuid(),
  chatId: z.string().trim().min(2).max(200),
  label: z.string().trim().min(2).max(100),
  frequency: z.enum(["instant", "daily_digest"]),
  digestTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional().or(z.literal("")),
});

export async function connectTelegram(formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/advertiser/settings/notifications?error=Check+the+connection+details");
  const { supabase, user, memberships } = await requireAdvertiserContext();
  const allowed = memberships.some((m) => m.company_id === parsed.data.companyId && m.can_manage_notifications);
  if (!allowed) redirect("/advertiser/settings/notifications?error=Notification+permission+required");

  const destination = parsed.data.chatId.replace(/^https?:\/\/t\.me\//i, "@");
  const destinationHash = createHash("sha256").update(`telegram:${destination.toLowerCase()}`).digest("hex");
  const { error: primaryError } = await supabase.from("notification_destinations").update({ is_primary: false }).eq("company_id", parsed.data.companyId).eq("event_type", "lead_verified").eq("channel", "telegram").eq("is_primary", true);
  if (primaryError) redirect("/advertiser/settings/notifications?error=Unable+to+replace+the+primary+destination");
  const { error } = await supabase.from("notification_destinations").upsert({
    company_id: parsed.data.companyId,
    channel: "telegram",
    event_type: "lead_verified",
    frequency: parsed.data.frequency,
    digest_time_utc: parsed.data.frequency === "daily_digest" ? `${parsed.data.digestTime || "09:00"}:00` : null,
    destination_value: destination,
    destination_hash: destinationHash,
    label: parsed.data.label,
    active: true,
    is_primary: true,
    created_by: user.id,
  }, { onConflict: "company_id,event_type,channel,destination_hash" });
  if (error) redirect(`/advertiser/settings/notifications?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/advertiser/settings/notifications");
  redirect("/advertiser/settings/notifications?message=Telegram+destination+connected");
}

export async function toggleDestination(formData: FormData) {
  const id = z.uuid().safeParse(formData.get("id"));
  const active = z.enum(["true", "false"]).safeParse(formData.get("active"));
  if (!id.success || !active.success) redirect("/advertiser/settings/notifications?error=Invalid+destination");
  const { supabase, memberships } = await requireAdvertiserContext();
  const companyIds = memberships.filter((m) => m.can_manage_notifications).map((m) => m.company_id);
  const { error } = await supabase.from("notification_destinations").update({ active: active.data === "true" }).eq("id", id.data).in("company_id", companyIds);
  if (error) redirect("/advertiser/settings/notifications?error=Unable+to+update+destination");
  revalidatePath("/advertiser/settings/notifications");
}

export async function sendTelegramTest(formData: FormData) {
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) redirect("/advertiser/settings/notifications?error=Invalid+destination");
  const { supabase, memberships } = await requireAdvertiserContext();
  const companyIds = memberships.filter((m) => m.can_manage_notifications).map((m) => m.company_id);
  const { data: destination } = await supabase.from("notification_destinations").select("company_id,destination_value,label").eq("id", id.data).eq("channel", "telegram").in("company_id", companyIds).maybeSingle();
  if (!destination) redirect("/advertiser/settings/notifications?error=Telegram+destination+not+available");
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) redirect("/advertiser/settings/notifications?error=TELEGRAM_BOT_TOKEN+is+not+configured");
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: destination.destination_value, text: `✅ RidePerk connection confirmed for ${destination.label || "your sales team"}. Verified leads can now be delivered here.` }),
    cache: "no-store",
  });
  if (!response.ok) {
    const result = await response.json().catch(() => null) as { description?: string } | null;
    redirect(`/advertiser/settings/notifications?error=${encodeURIComponent(result?.description || "Telegram rejected the test message")}`);
  }
  redirect("/advertiser/settings/notifications?message=Telegram+test+message+sent");
}

export async function connectEmail(formData: FormData) {
  const parsed = z.object({ companyId: z.uuid(), email: z.email(), label: z.string().trim().min(2).max(100), frequency: z.enum(["instant", "daily_digest"]), digestTime: z.string().optional() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/advertiser/settings/notifications?error=Check+the+email+details");
  const { supabase, user, memberships } = await requireAdvertiserContext();
  if (!memberships.some((m) => m.company_id === parsed.data.companyId && m.can_manage_notifications)) redirect("/advertiser/settings/notifications?error=Notification+permission+required");
  const destinationHash = createHash("sha256").update(`email:${parsed.data.email.toLowerCase()}`).digest("hex");
  await supabase.from("notification_destinations").update({ is_primary: false }).eq("company_id", parsed.data.companyId).eq("event_type", "lead_verified").eq("channel", "email").eq("is_primary", true);
  const { error } = await supabase.from("notification_destinations").upsert({ company_id: parsed.data.companyId, channel: "email", event_type: "lead_verified", frequency: parsed.data.frequency, digest_time_utc: parsed.data.frequency === "daily_digest" ? `${parsed.data.digestTime || "09:00"}:00` : null, destination_value: parsed.data.email.toLowerCase(), destination_hash: destinationHash, label: parsed.data.label, active: true, is_primary: true, created_by: user.id }, { onConflict: "company_id,event_type,channel,destination_hash" });
  if (error) redirect(`/advertiser/settings/notifications?error=${encodeURIComponent(error.message)}`);
  redirect("/advertiser/settings/notifications?message=Email+destination+connected");
}
