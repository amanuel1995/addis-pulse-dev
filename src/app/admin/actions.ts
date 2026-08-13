"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hashPhone } from "@/lib/passenger-flow/security";
import { normalizeEthiopianPhone } from "@/lib/passenger-flow/validation";

const databaseUuid = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
);

const companySchema = z.object({
  name: z.string().trim().min(2).max(120),
  identifier: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  sector: z.string().trim().min(2).max(120),
  brandColor: z.string().trim().regex(/^#[0-9a-f]{6}$/i),
  contactEmail: z.email().or(z.literal("")),
  contactPhone: z.string().trim(),
  description: z.string().trim().max(500),
});

const campaignSchema = z.object({
  companyId: databaseUuid,
  name: z.string().trim().min(2).max(160),
  campaignType: z.enum(["lead_generation", "product_launch", "appointment_booking", "brand_awareness"]),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  vehicleCount: z.coerce.number().int().min(1).max(10000),
  targetLeads: z.coerce.number().int().min(0).optional(),
  budgetEtb: z.coerce.number().min(0).optional(),
  rewardDescription: z.string().trim().max(500),
  headline: z.string().trim().min(2).max(180),
  offerText: z.string().trim().max(500),
  privacyNotice: z.string().trim().min(10),
});

const campaignUpdateSchema = z.object({
  id: databaseUuid,
  name: z.string().trim().min(2).max(160),
  campaignType: z.enum(["lead_generation", "product_launch", "appointment_booking", "brand_awareness"]),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  vehicleCount: z.coerce.number().int().min(1).max(10000),
  targetLeads: z.number().int().min(0).optional(),
  budgetEtb: z.number().min(0).optional(),
  rewardDescription: z.string().trim().max(500),
});

const driverSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim(),
  vehiclePlate: z.string().trim().min(2).max(32),
  vehicleType: z.string().trim().min(2).max(50),
  primaryZone: z.string().trim().min(2).max(120),
  telegramHandle: z.string().trim().max(64),
});

function value(formData: FormData, key: string) {
  return String(formData.get(key) || "");
}

function optionalNumber(formData: FormData, key: string) {
  const raw = value(formData, key).trim();
  return raw ? Number(raw) : undefined;
}

function finish(path: string, kind: "message" | "error", text: string): never {
  redirect(`${path}?${kind}=${encodeURIComponent(text)}`);
}

function refreshAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/companies");
  revalidatePath("/admin/campaigns");
  revalidatePath("/admin/drivers");
  revalidatePath("/admin/assignments");
}

export async function signOutAdmin() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function createCompany(formData: FormData) {
  const actor = await requirePlatformAdmin();
  const parsed = companySchema.safeParse({
    name: value(formData, "name"), identifier: value(formData, "identifier"), sector: value(formData, "sector"),
    brandColor: value(formData, "brandColor"), contactEmail: value(formData, "contactEmail"),
    contactPhone: value(formData, "contactPhone"), description: value(formData, "description"),
  });
  if (!parsed.success) finish("/admin/companies", "error", "Check the company fields and identifier format.");
  const phone = parsed.data.contactPhone ? normalizeEthiopianPhone(parsed.data.contactPhone) : null;
  if (parsed.data.contactPhone && !phone) finish("/admin/companies", "error", "Use a valid Ethiopian mobile number.");

  const admin = createAdminClient();
  const { data: company, error } = await admin.from("companies").insert({
    name: parsed.data.name,
    identifier: parsed.data.identifier,
    sector: parsed.data.sector,
    brand_color: parsed.data.brandColor.toUpperCase(),
    description: parsed.data.description || null,
    public_contact_email: parsed.data.contactEmail || null,
    public_contact_phone: phone,
    logo_path: `companies/${parsed.data.identifier}/logo-pending.svg`,
    status: "draft",
    created_by: actor.id,
  }).select("id").single();
  if (error || !company) {
    console.error("[admin:create-company]", { code: error?.code, message: error?.message });
    finish("/admin/companies", "error", error?.code === "23505" ? "That company identifier already exists." : "Unable to create the company.");
  }
  const { error: receiverError } = await admin.from("company_receiver_settings").insert({
    company_id: company.id,
    receiver_name: `${parsed.data.name} lead receiver`,
    updated_by: actor.id,
  });
  if (receiverError) {
    await admin.from("companies").delete().eq("id", company.id);
    console.error("[admin:create-company-receiver]", { code: receiverError.code, message: receiverError.message });
    finish("/admin/companies", "error", "Unable to initialize the company receiver settings.");
  }
  refreshAdmin();
  finish("/admin/companies", "message", `${parsed.data.name} was created as a draft.`);
}

export async function updateCompanyStatus(formData: FormData) {
  await requirePlatformAdmin();
  const id = databaseUuid.safeParse(value(formData, "id"));
  const status = z.enum(["draft", "active", "inactive", "archived"]).safeParse(value(formData, "status"));
  if (!id.success || !status.success) finish("/admin/companies", "error", "Invalid company update.");
  const admin = createAdminClient();
  const { error } = await admin.from("companies").update({
    status: status.data,
    deactivated_at: status.data === "inactive" || status.data === "archived" ? new Date().toISOString() : null,
  }).eq("id", id.data);
  if (error) finish("/admin/companies", "error", "Unable to update the company status.");
  refreshAdmin();
  finish("/admin/companies", "message", "Company status updated.");
}

export async function createCampaign(formData: FormData) {
  const actor = await requirePlatformAdmin();
  const parsed = campaignSchema.safeParse({
    companyId: value(formData, "companyId"), name: value(formData, "name"), campaignType: value(formData, "campaignType"),
    startDate: value(formData, "startDate"), endDate: value(formData, "endDate"), vehicleCount: value(formData, "vehicleCount"),
    targetLeads: optionalNumber(formData, "targetLeads"), budgetEtb: optionalNumber(formData, "budgetEtb"),
    rewardDescription: value(formData, "rewardDescription"), headline: value(formData, "headline"),
    offerText: value(formData, "offerText"), privacyNotice: value(formData, "privacyNotice"),
  });
  if (!parsed.success || parsed.data.endDate < parsed.data.startDate) finish("/admin/campaigns", "error", "Check the campaign fields and dates.");
  const admin = createAdminClient();
  const { data: campaign, error } = await admin.from("campaigns").insert({
    company_id: parsed.data.companyId, name: parsed.data.name, campaign_type: parsed.data.campaignType,
    status: "draft", start_date: parsed.data.startDate, end_date: parsed.data.endDate,
    vehicle_count: parsed.data.vehicleCount, target_leads: parsed.data.targetLeads ?? null,
    budget_etb: parsed.data.budgetEtb ?? null, reward_description: parsed.data.rewardDescription || null,
    landing_page_config: {}, default_locale: "en", created_by: actor.id,
  }).select("id").single();
  if (error || !campaign) {
    console.error("[admin:create-campaign]", { code: error?.code, message: error?.message });
    finish("/admin/campaigns", "error", "Unable to create the campaign.");
  }
  const { error: contentError } = await admin.from("campaign_content").insert({
    campaign_id: campaign.id, locale: "en", headline: parsed.data.headline,
    offer_text: parsed.data.offerText || null, reward_text: parsed.data.rewardDescription || null,
    call_to_action: "Continue", privacy_notice_text: parsed.data.privacyNotice, created_by: actor.id,
  });
  if (contentError) {
    await admin.from("campaigns").delete().eq("id", campaign.id);
    console.error("[admin:create-campaign-content]", { code: contentError.code, message: contentError.message });
    finish("/admin/campaigns", "error", "Unable to create the campaign content.");
  }
  refreshAdmin();
  finish("/admin/campaigns", "message", `${parsed.data.name} was created as a draft.`);
}

export async function updateCampaignStatus(formData: FormData) {
  await requirePlatformAdmin();
  const id = databaseUuid.safeParse(value(formData, "id"));
  const status = z.enum(["draft", "scheduled", "active", "paused", "completed", "cancelled"]).safeParse(value(formData, "status"));
  if (!id.success || !status.success) finish("/admin/campaigns", "error", "Invalid campaign update.");
  const { error } = await createAdminClient().from("campaigns").update({ status: status.data }).eq("id", id.data);
  if (error) finish("/admin/campaigns", "error", "Unable to update the campaign status.");
  refreshAdmin();
  finish("/admin/campaigns", "message", "Campaign status updated.");
}

export async function updateCampaign(formData: FormData) {
  await requirePlatformAdmin();
  const parsed = campaignUpdateSchema.safeParse({
    id: value(formData, "id"), name: value(formData, "name"), campaignType: value(formData, "campaignType"),
    startDate: value(formData, "startDate"), endDate: value(formData, "endDate"),
    vehicleCount: Number(value(formData, "vehicleCount")), targetLeads: optionalNumber(formData, "targetLeads"),
    budgetEtb: optionalNumber(formData, "budgetEtb"), rewardDescription: value(formData, "rewardDescription"),
  });
  if (!parsed.success || parsed.data.endDate < parsed.data.startDate) {
    finish("/admin/campaigns", "error", "Check the campaign fields and dates.");
  }

  const { error } = await createAdminClient().from("campaigns").update({
    name: parsed.data.name, campaign_type: parsed.data.campaignType,
    start_date: parsed.data.startDate, end_date: parsed.data.endDate,
    vehicle_count: parsed.data.vehicleCount, target_leads: parsed.data.targetLeads ?? null,
    budget_etb: parsed.data.budgetEtb ?? null, reward_description: parsed.data.rewardDescription || null,
  }).eq("id", parsed.data.id);
  if (error) {
    console.error("[admin:update-campaign]", { code: error.code, message: error.message });
    finish("/admin/campaigns", "error", "Unable to update the campaign.");
  }
  refreshAdmin();
  finish("/admin/campaigns", "message", `${parsed.data.name} was updated.`);
}

export async function createDriver(formData: FormData) {
  await requirePlatformAdmin();
  const parsed = driverSchema.safeParse({
    fullName: value(formData, "fullName"), phone: value(formData, "phone"), vehiclePlate: value(formData, "vehiclePlate"),
    vehicleType: value(formData, "vehicleType"), primaryZone: value(formData, "primaryZone"), telegramHandle: value(formData, "telegramHandle"),
  });
  if (!parsed.success) finish("/admin/drivers", "error", "Check the driver fields.");
  const phone = normalizeEthiopianPhone(parsed.data.phone);
  if (!phone) finish("/admin/drivers", "error", "Use a valid Ethiopian mobile number.");
  let error: { code?: string; message: string } | null = null;
  try {
    const phoneHash = hashPhone(phone);
    ({ error } = await createAdminClient().from("drivers").insert({
      full_name: parsed.data.fullName, phone_e164: phone, phone_hash: phoneHash,
      vehicle_plate: parsed.data.vehiclePlate.toUpperCase(), vehicle_type: parsed.data.vehicleType,
      primary_zone: parsed.data.primaryZone, telegram_handle: parsed.data.telegramHandle || null,
      status: "registered",
    }));
  } catch (cause) {
    console.error("[admin:create-driver:exception]", cause);
    finish("/admin/drivers", "error", "Driver registration is temporarily unavailable. Check the server configuration.");
  }
  if (error) {
    console.error("[admin:create-driver]", { code: error.code, message: error.message });
    finish("/admin/drivers", "error", error.code === "23505" ? "That phone or vehicle plate is already registered." : "Unable to create the driver.");
  }
  refreshAdmin();
  finish("/admin/drivers", "message", `${parsed.data.fullName} was registered.`);
}

export async function updateDriverStatus(formData: FormData) {
  await requirePlatformAdmin();
  const id = databaseUuid.safeParse(value(formData, "id"));
  const status = z.enum(["registered", "shortlisted", "active", "suspended", "removed"]).safeParse(value(formData, "status"));
  if (!id.success || !status.success) finish("/admin/drivers", "error", "Invalid driver update.");
  const { error } = await createAdminClient().from("drivers").update({ status: status.data }).eq("id", id.data);
  if (error) finish("/admin/drivers", "error", "Unable to update the driver status.");
  refreshAdmin();
  finish("/admin/drivers", "message", "Driver status updated.");
}

export async function createAssignment(formData: FormData) {
  const actor = await requirePlatformAdmin();
  const driverId = databaseUuid.safeParse(value(formData, "driverId"));
  const campaignId = databaseUuid.safeParse(value(formData, "campaignId"));
  if (!driverId.success || !campaignId.success) finish("/admin/assignments", "error", "Select a driver and campaign.");
  const admin = createAdminClient();
  const [{ data: campaign }, { data: existingAssignment }, { data: qr }] = await Promise.all([
    admin.from("campaigns").select("id,company_id,status").eq("id", campaignId.data).maybeSingle(),
    admin.from("driver_campaign_assignments").select("id").eq("driver_id", driverId.data).eq("status", "active").maybeSingle(),
    admin.from("qr_codes").select("id,company_id,status").eq("driver_id", driverId.data).eq("qr_type", "driver").eq("status", "active").maybeSingle(),
  ]);
  if (!campaign) finish("/admin/assignments", "error", "Campaign not found.");
  if (existingAssignment) finish("/admin/assignments", "error", "This driver already has an active campaign. End it first.");
  if (qr && qr.company_id !== campaign.company_id) finish("/admin/assignments", "error", "The driver's permanent QR belongs to another company.");

  if (!qr) {
    const suffix = randomBytes(4).toString("hex");
    const { error: qrError } = await admin.from("qr_codes").insert({
      qr_type: "driver", company_id: campaign.company_id, driver_id: driverId.data,
      public_path: `d/driver-${suffix}`, image_path: `qr/drivers/driver-${suffix}.png`, status: "active",
    });
    if (qrError) {
      console.error("[admin:create-driver-qr]", { code: qrError.code, message: qrError.message });
      finish("/admin/assignments", "error", "Unable to create the permanent driver QR.");
    }
  }
  const { error } = await admin.from("driver_campaign_assignments").insert({
    driver_id: driverId.data, campaign_id: campaignId.data, status: "active", assigned_by: actor.id,
  });
  if (error) {
    console.error("[admin:create-assignment]", { code: error.code, message: error.message });
    finish("/admin/assignments", "error", "Unable to create the assignment.");
  }
  refreshAdmin();
  finish("/admin/assignments", "message", "Driver assigned and permanent QR confirmed.");
}

export async function endAssignment(formData: FormData) {
  await requirePlatformAdmin();
  const id = databaseUuid.safeParse(value(formData, "id"));
  if (!id.success) finish("/admin/assignments", "error", "Invalid assignment.");
  const { error } = await createAdminClient().from("driver_campaign_assignments").update({
    status: "completed", ended_at: new Date().toISOString(),
  }).eq("id", id.data).eq("status", "active");
  if (error) finish("/admin/assignments", "error", "Unable to end the assignment.");
  refreshAdmin();
  finish("/admin/assignments", "message", "Assignment completed.");
}
