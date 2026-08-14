import { randomBytes } from "node:crypto";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const uuid = z.string().regex(/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i);
const prepareSchema = z.object({
  action: z.literal("prepare"), campaignId: uuid, fileName: z.string().min(1).max(255),
  contentType: z.enum(["video/mp4", "video/webm"]), size: z.number().int().positive().max(50_000_000),
});
const completeSchema = z.object({
  action: z.literal("complete"), campaignId: uuid, path: z.string().min(1).max(1024),
  duration: z.number().int().min(30).max(50), caption: z.string().trim().max(240), active: z.boolean(),
});

export async function POST(request: Request) {
  const actor = await requirePlatformAdmin();
  const body: unknown = await request.json().catch(() => null);
  const admin = createAdminClient();
  const prepare = prepareSchema.safeParse(body);
  if (prepare.success) {
    const extension = prepare.data.contentType === "video/mp4" ? "mp4" : "webm";
    const path = `campaigns/${prepare.data.campaignId}/${Date.now()}-${randomBytes(6).toString("hex")}.${extension}`;
    const { data, error } = await admin.storage.from("campaign-videos").createSignedUploadUrl(path);
    if (error || !data) return Response.json({ error: error?.message || "Unable to prepare upload." }, { status: 500 });
    return Response.json({ path: data.path, token: data.token });
  }
  const complete = completeSchema.safeParse(body);
  if (!complete.success) return Response.json({ error: "Invalid video details." }, { status: 400 });
  if (!complete.data.path.startsWith(`campaigns/${complete.data.campaignId}/`)) return Response.json({ error: "Invalid upload path." }, { status: 400 });
  const { data: file, error: fileError } = await admin.storage.from("campaign-videos").info(complete.data.path);
  if (fileError || !file) return Response.json({ error: "The uploaded video could not be verified." }, { status: 400 });
  if (complete.data.active) await admin.from("campaign_videos").update({ active: false }).eq("campaign_id", complete.data.campaignId).eq("active", true);
  const { error } = await admin.from("campaign_videos").insert({
    campaign_id: complete.data.campaignId, provider: "supabase_storage", video_url: null,
    video_path: complete.data.path, duration_seconds: complete.data.duration,
    caption: complete.data.caption || null, active: complete.data.active,
    validated_at: new Date().toISOString(), validated_by: actor.id, created_by: actor.id,
  });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
