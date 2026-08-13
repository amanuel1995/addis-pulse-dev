import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function authorized(request: NextRequest) {
  const secret = process.env.NOTIFICATION_WORKER_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!secret || supplied.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(secret), Buffer.from(supplied));
}

async function deliver(channel: "email" | "telegram", destination: string, subject: string, text: string) {
  if (channel === "telegram") {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chat_id: destination, text }) });
    const body = await response.json().catch(() => null) as { ok?: boolean; result?: { message_id?: number }; description?: string } | null;
    if (!response.ok || !body?.ok) throw new Error(body?.description || `Telegram HTTP ${response.status}`);
    return String(body.result?.message_id || "sent");
  }
  const key = process.env.RESEND_API_KEY; const from = process.env.NOTIFICATION_FROM_EMAIL;
  if (!key || !from) throw new Error("RESEND_API_KEY or NOTIFICATION_FROM_EMAIL is not configured");
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" }, body: JSON.stringify({ from, to: [destination], subject, text }) });
  const body = await response.json().catch(() => null) as { id?: string; message?: string } | null;
  if (!response.ok) throw new Error(body?.message || `Email HTTP ${response.status}`);
  return body?.id || "sent";
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const admin = createAdminClient(); const now = new Date(); const worker = `web-${crypto.randomUUID()}`;
  const { data: jobs, error } = await admin.from("notification_jobs").select("id,event_type,channel,attempt_count,lead_id,feedback_id,notification_destinations(destination_value,label),leads(full_name,phone_e164,email,interested_service_text),lead_feedback(rating,comment)").in("status", ["pending", "retry"]).eq("delivery_frequency", "instant").lte("next_attempt_at", now.toISOString()).order("created_at").limit(20);
  if (error) return NextResponse.json({ error: "queue_unavailable" }, { status: 500 });
  let sent = 0, failed = 0;
  for (const job of jobs || []) {
    const attempt = job.attempt_count + 1; const started = Date.now();
    const { data: claimed } = await admin.from("notification_jobs").update({ status: "processing", locked_at: now.toISOString(), locked_by: worker, attempt_count: attempt }).eq("id", job.id).in("status", ["pending", "retry"]).select("id").maybeSingle();
    if (!claimed) continue;
    const destination = job.notification_destinations?.destination_value;
    const lead = job.leads; const feedback = job.lead_feedback;
    const subject = job.event_type === "lead_verified" ? `New verified lead: ${lead?.full_name || "Lead"}` : `New passenger feedback: ${feedback?.rating || "—"}/5`;
    const message = job.event_type === "lead_verified" ? `✅ New Verified Lead\nName: ${lead?.full_name || "—"}\nPhone: ${lead?.phone_e164 || "—"}\nEmail: ${lead?.email || "—"}\nInterest: ${lead?.interested_service_text || "—"}\nFollow up while the passenger is engaged.` : `⭐ New Passenger Feedback\nRating: ${feedback?.rating || "—"}/5\nComment: ${feedback?.comment || "No comment"}\nLead: ${lead?.full_name || "—"}`;
    try {
      if (!destination) throw new Error("Destination is missing");
      const providerId = await deliver(job.channel, destination, subject, message);
      await admin.from("notification_attempts").insert({ job_id: job.id, attempt_number: attempt, status: "sent", provider_code: job.channel, provider_response: { provider_message_id: providerId }, duration_ms: Date.now() - started, completed_at: new Date().toISOString() });
      await admin.from("notification_jobs").update({ status: "sent", sent_at: new Date().toISOString(), provider_message_id: providerId, locked_at: null, locked_by: null, last_error: null }).eq("id", job.id); sent++;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message.slice(0, 1000) : "Delivery failed"; const terminal = attempt >= 4;
      await admin.from("notification_attempts").insert({ job_id: job.id, attempt_number: attempt, status: "failed", provider_code: job.channel, error_message: message, duration_ms: Date.now() - started, completed_at: new Date().toISOString() });
      await admin.from("notification_jobs").update({ status: terminal ? "dead_letter" : "retry", next_attempt_at: new Date(Date.now() + 2 ** attempt * 60_000).toISOString(), locked_at: null, locked_by: null, last_error: message }).eq("id", job.id); failed++;
    }
  }
  return NextResponse.json({ processed: sent + failed, sent, failed });
}
