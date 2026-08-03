"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const uuid = z.string().regex(/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i);
const text = (fd: FormData, key: string) => String(fd.get(key) || "").trim();
function done(path: string, kind: "message" | "error", message: string): never { revalidatePath(path); redirect(`${path}?${kind}=${encodeURIComponent(message)}`); }

export async function decideLeadQuality(fd: FormData) {
  const actor = await requirePlatformAdmin(); const leadId = uuid.safeParse(text(fd, "leadId"));
  const status = z.enum(["qualified","duplicate","fraud_confirmed","invalid_phone","invalid_other","rejected"]).safeParse(text(fd, "status"));
  if (!leadId.success || !status.success) done("/admin/review", "error", "Invalid quality decision.");
  const admin = createAdminClient(); const { data: lead } = await admin.from("leads").select("id,company_id,campaign_id").eq("id", leadId.data).maybeSingle();
  if (!lead) done("/admin/review", "error", "Lead not found.");
  const { data: current } = await admin.from("lead_quality_decisions").select("id").eq("lead_id", lead.id).eq("is_current", true).maybeSingle();
  if (current) await admin.from("lead_quality_decisions").update({ is_current:false, superseded_at:new Date().toISOString() }).eq("id", current.id);
  const { error } = await admin.from("lead_quality_decisions").insert({ lead_id:lead.id, company_id:lead.company_id, campaign_id:lead.campaign_id, quality_status:status.data, billable:status.data === "qualified", decision_source:"manual_review", reason_code:text(fd,"reasonCode") || status.data, reason_detail:text(fd,"reason") || null, decided_by:actor.id, supersedes_id:current?.id || null });
  if (error) done("/admin/review", "error", error.message); done("/admin/review", "message", "Lead quality decision saved.");
}

export async function resolveFraudFlag(fd: FormData) {
  const actor = await requirePlatformAdmin(); const id = uuid.safeParse(text(fd,"id")); if (!id.success) done("/admin/review","error","Invalid flag.");
  const { error } = await createAdminClient().from("fraud_flags").update({ resolved:true,resolved_by:actor.id,resolved_at:new Date().toISOString() }).eq("id",id.data).eq("resolved",false);
  if (error) done("/admin/review","error",error.message); done("/admin/review","message","Fraud flag resolved.");
}

export async function updateFeedback(fd: FormData) {
  const actor = await requirePlatformAdmin(); const id=uuid.safeParse(text(fd,"id")); const status=z.enum(["viewed","actioned","archived"]).safeParse(text(fd,"status")); if(!id.success||!status.success) done("/admin/review","error","Invalid feedback update.");
  const now=new Date().toISOString(); const patch=status.data === "viewed" ? {status:status.data,viewed_at:now,viewed_by:actor.id} : status.data === "actioned" ? {status:status.data,actioned_at:now,actioned_by:actor.id} : {status:status.data,archived_at:now};
  const {error}=await createAdminClient().from("lead_feedback").update(patch).eq("id",id.data); if(error) done("/admin/review","error",error.message); done("/admin/review","message","Feedback updated.");
}

export async function recordCompliance(fd: FormData) {
  const actor=await requirePlatformAdmin(); const driverId=uuid.safeParse(text(fd,"driverId")); const campaignId=uuid.safeParse(text(fd,"campaignId")); const inventory=z.coerce.number().int().min(0).safeParse(text(fd,"inventory"));
  if(!driverId.success||!campaignId.success||!inventory.success) done("/admin/field-ops","error","Check compliance fields.");
  let photoPath:string|null=null; const photo=fd.get("photo");
  if(photo instanceof File && photo.size){ if(photo.size>5_000_000||!photo.type.startsWith("image/")) done("/admin/field-ops","error","Photo must be an image under 5 MB."); const ext=photo.name.split(".").pop()?.replace(/[^a-z0-9]/gi,"")||"jpg"; photoPath=`${campaignId.data}/${driverId.data}/${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`; const {error:uploadError}=await createAdminClient().storage.from("compliance-photos").upload(photoPath,photo,{contentType:photo.type,upsert:false}); if(uploadError) done("/admin/field-ops","error",`Photo upload failed: ${uploadError.message}`); }
  const {error}=await createAdminClient().from("driver_compliance_records").upsert({driver_id:driverId.data,campaign_id:campaignId.data,record_date:text(fd,"recordDate"),checkin_time:new Date().toISOString(),checkin_photo_path:photoPath,inventory_reported:inventory.data,compliance_flag:text(fd,"flagged")==="on",flag_reason:text(fd,"reason")||null,recorded_by:actor.id},{onConflict:"driver_id,campaign_id,record_date"});
  if(error) done("/admin/field-ops","error",error.message); done("/admin/field-ops","message","Driver check-in recorded.");
}

export async function recordInventory(fd: FormData) {
  const actor=await requirePlatformAdmin(); const driverId=uuid.safeParse(text(fd,"driverId")); const campaignId=uuid.safeParse(text(fd,"campaignId")); const movement=z.enum(["issued","returned","distributed","lost","adjustment"]).safeParse(text(fd,"movementType")); const quantity=z.coerce.number().int().positive().safeParse(text(fd,"quantity"));
  if(!driverId.success||!campaignId.success||!movement.success||!quantity.success) done("/admin/field-ops","error","Check inventory fields.");
  const {error}=await createAdminClient().from("inventory_movements").insert({driver_id:driverId.data,campaign_id:campaignId.data,movement_type:movement.data,quantity:quantity.data,notes:text(fd,"notes")||null,recorded_by:actor.id}); if(error) done("/admin/field-ops","error",error.message); done("/admin/field-ops","message","Inventory movement recorded.");
}

export async function createInvoice(fd: FormData) {
  const actor=await requirePlatformAdmin(); const companyId=uuid.safeParse(text(fd,"companyId")); const campaignId=uuid.safeParse(text(fd,"campaignId")); const amount=z.coerce.number().min(0).safeParse(text(fd,"amount")); if(!companyId.success||!campaignId.success||!amount.success) done("/admin/billing","error","Check invoice fields.");
  const {error}=await createAdminClient().from("invoices").insert({company_id:companyId.data,campaign_id:campaignId.data,invoice_number:text(fd,"invoiceNumber"),amount_etb:amount.data,due_date:text(fd,"dueDate")||null,status:"draft",created_by:actor.id}); if(error) done("/admin/billing","error",error.message); done("/admin/billing","message","Invoice created.");
}

export async function recordPayment(fd: FormData) {
  const actor=await requirePlatformAdmin(); const invoiceId=uuid.safeParse(text(fd,"invoiceId")); const amount=z.coerce.number().positive().safeParse(text(fd,"amount")); if(!invoiceId.success||!amount.success) done("/admin/billing","error","Check payment fields."); const admin=createAdminClient();
  const {error}=await admin.from("invoice_payments").insert({invoice_id:invoiceId.data,amount_etb:amount.data,payment_reference:text(fd,"reference")||null,paid_at:new Date().toISOString(),recorded_by:actor.id}); if(error) done("/admin/billing","error",error.message); done("/admin/billing","message","Payment recorded.");
}

export async function saveCampaignContent(fd: FormData) {
  const actor=await requirePlatformAdmin(); const campaignId=uuid.safeParse(text(fd,"campaignId")); const locale=z.string().regex(/^[a-z]{2,3}(?:-[A-Z]{2})?$/).safeParse(text(fd,"locale")); if(!campaignId.success||!locale.success||text(fd,"headline").length<2) done("/admin/content","error","Check content fields.");
  const {error}=await createAdminClient().from("campaign_content").upsert({campaign_id:campaignId.data,locale:locale.data,headline:text(fd,"headline"),subheadline:text(fd,"subheadline")||null,description:text(fd,"description")||null,offer_text:text(fd,"offer")||null,reward_text:text(fd,"reward")||null,call_to_action:text(fd,"cta")||"Continue",privacy_notice_text:text(fd,"privacy")||null,created_by:actor.id},{onConflict:"campaign_id,locale"}); if(error) done("/admin/content","error",error.message); done("/admin/content","message","Campaign content saved.");
}

export async function addCampaignZone(fd: FormData) { await requirePlatformAdmin(); const campaignId=uuid.safeParse(text(fd,"campaignId")); if(!campaignId.success||!text(fd,"zone")) done("/admin/content","error","Select campaign and zone."); const {error}=await createAdminClient().from("campaign_zones").insert({campaign_id:campaignId.data,zone_name:text(fd,"zone")}); if(error) done("/admin/content","error",error.message); done("/admin/content","message","Zone added."); }

export async function updateQrStatus(fd: FormData) { await requirePlatformAdmin(); const id=uuid.safeParse(text(fd,"id")); const status=z.enum(["active","inactive","retired"]).safeParse(text(fd,"status")); if(!id.success||!status.success) done("/admin/qr-codes","error","Invalid QR update."); const {error}=await createAdminClient().from("qr_codes").update({status:status.data,retired_at:status.data==="retired"?new Date().toISOString():null}).eq("id",id.data); if(error) done("/admin/qr-codes","error",error.message); done("/admin/qr-codes","message","QR status updated."); }

export async function updatePlatformSettings(fd: FormData) { await requirePlatformAdmin(); const retention=z.coerce.number().int().min(1).max(120).safeParse(text(fd,"retention")); if(!retention.success) done("/admin/system","error","Invalid retention period."); const {error}=await createAdminClient().from("app_settings").update({public_base_url:text(fd,"baseUrl"),default_unavailable_message:text(fd,"unavailable"),lead_retention_months:retention.data}).eq("id",1); if(error) done("/admin/system","error",error.message); done("/admin/system","message","Platform settings updated."); }

export async function handleDeletionRequest(fd: FormData) { const actor=await requirePlatformAdmin(); const id=uuid.safeParse(text(fd,"id")); const status=z.enum(["verified","approved","completed","rejected"]).safeParse(text(fd,"status")); if(!id.success||!status.success) done("/admin/system","error","Invalid privacy request."); const terminal=["completed","rejected"].includes(status.data); const {error}=await createAdminClient().from("data_deletion_requests").update({status:status.data,notes:text(fd,"notes")||null,handled_by:terminal?actor.id:null,handled_at:terminal?new Date().toISOString():null}).eq("id",id.data); if(error) done("/admin/system","error",error.message); done("/admin/system","message","Privacy request updated."); }

export async function retryNotification(fd: FormData) { await requirePlatformAdmin(); const id=uuid.safeParse(text(fd,"id")); if(!id.success) done("/admin/notifications","error","Invalid job."); const {error}=await createAdminClient().from("notification_jobs").update({status:"retry",next_attempt_at:new Date().toISOString(),locked_at:null,locked_by:null,last_error:null}).eq("id",id.data).in("status",["dead_letter","cancelled","retry"]); if(error) done("/admin/notifications","error",error.message); done("/admin/notifications","message","Notification queued for retry."); }

export async function addCampaignVideo(fd: FormData) {
  const actor = await requirePlatformAdmin(); const campaignId = uuid.safeParse(text(fd,"campaignId")); const provider = z.enum(["youtube","vimeo","cloudinary"]).safeParse(text(fd,"provider")); const duration = z.coerce.number().int().min(30).max(50).safeParse(text(fd,"duration"));
  if(!campaignId.success||!provider.success||!duration.success||!z.url().safeParse(text(fd,"url")).success) done("/admin/media","error","Use a valid video URL and duration from 30 to 50 seconds.");
  const admin=createAdminClient(); const activate=text(fd,"active")==="on"; if(activate) await admin.from("campaign_videos").update({active:false}).eq("campaign_id",campaignId.data).eq("active",true);
  const{error}=await admin.from("campaign_videos").insert({campaign_id:campaignId.data,provider:provider.data,video_url:text(fd,"url"),duration_seconds:duration.data,caption:text(fd,"caption")||null,active:activate,validated_at:new Date().toISOString(),validated_by:actor.id,created_by:actor.id}); if(error) done("/admin/media","error",error.message); done("/admin/media","message","Campaign video saved and validated.");
}

export async function updateReward(fd: FormData) {
  const actor=await requirePlatformAdmin(); const id=uuid.safeParse(text(fd,"id")); const status=z.enum(["pending","issued","redeemed","expired","cancelled"]).safeParse(text(fd,"status")); if(!id.success||!status.success) done("/admin/rewards","error","Invalid reward update."); const now=new Date().toISOString();
  const patch=status.data==="issued"?{status:status.data,issued_at:now,issued_by:actor.id,external_reference:text(fd,"reference")||null}:status.data==="redeemed"?{status:status.data,issued_at:now,redeemed_at:now,redeemed_by:actor.id}:status.data==="cancelled"?{status:status.data,cancelled_at:now,cancellation_reason:text(fd,"reason")||"Cancelled by administrator"}:{status:status.data};
  const{error}=await createAdminClient().from("reward_issuances").update(patch).eq("id",id.data);if(error)done("/admin/rewards","error",error.message);done("/admin/rewards","message","Reward status updated.");
}
