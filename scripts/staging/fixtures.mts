import { randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createStagingAdmin, loadStagingConfig } from "./config.mts";

export const FIXTURE = {
  users: {
    admin: { id: "e1000000-0000-4000-8000-000000000001", email: "admin@addispulse.example.test" },
    alpha: { id: "e1000000-0000-4000-8000-000000000002", email: "alpha-rep@addispulse.example.test" },
    beta: { id: "e1000000-0000-4000-8000-000000000003", email: "beta-rep@addispulse.example.test" },
  },
  companies: { alpha: "e2000000-0000-4000-8000-000000000001", beta: "e2000000-0000-4000-8000-000000000002" },
  campaign: "e4000000-0000-4000-8000-000000000001",
  video: "e5000000-0000-4000-8000-000000000001",
  driver: "e6000000-0000-4000-8000-000000000001",
  assignment: "e7000000-0000-4000-8000-000000000001",
  qr: "e8000000-0000-4000-8000-000000000001",
  qrToken: "e8100000-0000-4000-8000-000000000001",
  qrSlug: "staging-test-driver",
  destinations: {
    lead: "e9000000-0000-4000-8000-000000000001",
    feedback: "e9000000-0000-4000-8000-000000000002",
  },
} as const;

const MARKER = "[STAGING TEST]";
const VERSION = 1;

function password() {
  return `${randomBytes(32).toString("base64url")}Aa1!`;
}

async function must<T>(promise: PromiseLike<{ data: T; error: { message: string } | null }>, operation: string) {
  const { data, error } = await promise;
  if (error) throw new Error(`${operation} failed: ${error.message}`);
  return data;
}

async function ensureUser(admin: SupabaseClient, user: { id: string; email: string }, label: string) {
  const runtimePassword = password();
  const existing = await admin.auth.admin.getUserById(user.id);
  if (existing.error && existing.error.status !== 404) {
    throw new Error(`Auth fixture inspection failed for ${user.id}: ${existing.error.message}`);
  }
  if (existing.data.user) {
    if (existing.data.user.email !== user.email || existing.data.user.app_metadata?.staging_fixture !== true) {
      throw new Error(`Refusing to modify unmarked Auth user ${user.id}.`);
    }
    const updated = await admin.auth.admin.updateUserById(user.id, { password: runtimePassword });
    if (updated.error) throw new Error(`Auth fixture repair failed for ${user.id}: ${updated.error.message}`);
  } else {
    const created = await admin.auth.admin.createUser({
      id: user.id,
      email: user.email,
      password: runtimePassword,
      email_confirm: true,
      app_metadata: { staging_fixture: true, fixture_version: VERSION },
      user_metadata: { full_name: `${MARKER} ${label}` },
    });
    if (created.error) throw new Error(`Auth fixture creation failed for ${user.id}: ${created.error.message}`);
  }
  return runtimePassword;
}

async function assertMarkedRow(
  admin: SupabaseClient,
  table: string,
  idColumn: string,
  id: string,
  marked: (row: Record<string, unknown>) => boolean,
) {
  const data = await must(
    admin.from(table).select("*").eq(idColumn, id).maybeSingle(),
    `Inspect ${table} ${id}`,
  );
  if (data && !marked(data as Record<string, unknown>)) {
    throw new Error(`Refusing to modify unmarked row ${table}.${idColumn}=${id}.`);
  }
}

export async function bootstrapFixtures() {
  const config = loadStagingConfig();
  const admin = createStagingAdmin(config);

  const passwords = {
    admin: await ensureUser(admin, FIXTURE.users.admin, "Platform Admin"),
    alpha: await ensureUser(admin, FIXTURE.users.alpha, "Alpha Representative"),
    beta: await ensureUser(admin, FIXTURE.users.beta, "Beta Representative"),
  };

  await must(admin.from("profiles").update({ platform_role: "super_admin", full_name: `${MARKER} Platform Admin` }).eq("id", FIXTURE.users.admin.id), "Mark admin profile");

  for (const [id, identifier] of [[FIXTURE.companies.alpha, "staging-test-alpha"], [FIXTURE.companies.beta, "staging-test-beta"]] as const) {
    await assertMarkedRow(admin, "companies", "id", id, (row) => String(row.name).startsWith(MARKER));
    await must(admin.from("companies").upsert({
      id, identifier, name: `${MARKER} ${identifier.endsWith("alpha") ? "Alpha" : "Beta"} Company`,
      logo_path: "staging-tests/no-contact.svg", brand_color: identifier.endsWith("alpha") ? "#1A3A5C" : "#7C3AED",
      description: `${MARKER} automated fixture`, services_summary: "Automated staging validation only",
      status: "active", created_by: FIXTURE.users.admin.id,
    }), `Upsert company ${id}`);
  }

  await must(admin.from("company_memberships").upsert([
    { company_id: FIXTURE.companies.alpha, user_id: FIXTURE.users.alpha.id, can_edit_profile: true, can_view_leads: true, can_export_leads: false, can_update_lead_status: true, can_manage_notifications: true, created_by: FIXTURE.users.admin.id },
    { company_id: FIXTURE.companies.beta, user_id: FIXTURE.users.beta.id, can_edit_profile: true, can_view_leads: true, can_export_leads: false, can_update_lead_status: true, can_manage_notifications: true, created_by: FIXTURE.users.admin.id },
  ]), "Upsert fixture memberships");

  await assertMarkedRow(admin, "campaigns", "id", FIXTURE.campaign, (row) => String(row.name).startsWith(MARKER));
  await must(admin.from("campaigns").upsert({
    id: FIXTURE.campaign, company_id: FIXTURE.companies.alpha, name: `${MARKER} Passenger OTP Campaign`,
    campaign_type: "lead_generation", status: "active", start_date: "2026-01-01", end_date: "2099-12-31",
    reward_type: "digital_coupon", reward_description: `${MARKER} verification reward`, reward_unit_cost_etb: 1,
    landing_page_config: { staging_fixture: true, fixture_version: VERSION, headline: `${MARKER} AddisPulse Campaign`, offer_text: `${MARKER} Submit to validate the passenger flow`, call_to_action: "Continue", privacy_notice_text: "Automated staging test only" },
    default_locale: "en", created_by: FIXTURE.users.admin.id,
  }), "Upsert fixture campaign");

  await must(admin.from("campaign_content").upsert([
    { campaign_id: FIXTURE.campaign, locale: "en", headline: `${MARKER} AddisPulse Campaign`, subheadline: "Automated staging validation", description: "No customer data", offer_text: `${MARKER} Test offer`, reward_text: `${MARKER} Test reward`, call_to_action: "Continue", privacy_notice_text: "Automated staging test only", created_by: FIXTURE.users.admin.id },
    { campaign_id: FIXTURE.campaign, locale: "am", headline: `${MARKER} Amharic Campaign`, subheadline: "Automated staging validation", description: "No customer data", offer_text: `${MARKER} Amharic test offer`, reward_text: `${MARKER} Amharic test reward`, call_to_action: "Continue", privacy_notice_text: "Automated staging test only", created_by: FIXTURE.users.admin.id },
  ], { onConflict: "campaign_id,locale" }), "Upsert fixture content");

  await assertMarkedRow(admin, "campaign_videos", "id", FIXTURE.video, (row) => (row.metadata as { staging_fixture?: boolean } | null)?.staging_fixture === true);
  await must(admin.from("campaign_videos").upsert({ id: FIXTURE.video, campaign_id: FIXTURE.campaign, provider: "youtube", video_url: "https://www.youtube.com/watch?v=STAGING_TEST_ONLY", duration_seconds: 30, caption: `${MARKER} Video`, metadata: { staging_fixture: true, fixture_version: VERSION }, active: true, validated_at: new Date().toISOString(), validated_by: FIXTURE.users.admin.id, created_by: FIXTURE.users.admin.id }), "Upsert fixture video");

  await assertMarkedRow(admin, "drivers", "id", FIXTURE.driver, (row) => String(row.full_name).startsWith(MARKER));
  await must(admin.from("drivers").upsert({ id: FIXTURE.driver, full_name: `${MARKER} Driver`, phone_e164: "+251700000099", phone_hash: "staging-test-driver-phone-hash", vehicle_plate: "STG-TEST-01", primary_zone: "Staging", status: "active" }), "Upsert fixture driver");
  await must(admin.from("driver_campaign_assignments").upsert({ id: FIXTURE.assignment, driver_id: FIXTURE.driver, campaign_id: FIXTURE.campaign, status: "active", assigned_by: FIXTURE.users.admin.id }), "Upsert fixture assignment");
  await assertMarkedRow(admin, "qr_codes", "id", FIXTURE.qr, (row) => String(row.public_path) === `d/${FIXTURE.qrSlug}`);
  await must(admin.from("qr_codes").upsert({ id: FIXTURE.qr, qr_type: "driver", company_id: FIXTURE.companies.alpha, driver_id: FIXTURE.driver, token: FIXTURE.qrToken, public_path: `d/${FIXTURE.qrSlug}`, image_path: "staging-tests/driver-qr.png", status: "active" }), "Upsert fixture QR");

  await must(admin.from("company_receiver_settings").upsert({ company_id: FIXTURE.companies.alpha, receiver_name: `${MARKER} Non-delivery Receiver`, enabled: true, updated_by: FIXTURE.users.admin.id }), "Upsert receiver settings");
  await must(admin.from("notification_destinations").upsert([
    { id: FIXTURE.destinations.lead, company_id: FIXTURE.companies.alpha, channel: "email", event_type: "lead_verified", frequency: "instant", destination_value: "never-deliver@addispulse.example.test", destination_hash: "staging-test-lead-destination", label: `${MARKER} Never Deliver`, active: true, is_primary: true, created_by: FIXTURE.users.admin.id },
    { id: FIXTURE.destinations.feedback, company_id: FIXTURE.companies.alpha, channel: "email", event_type: "feedback_received", frequency: "instant", destination_value: "never-deliver-feedback@addispulse.example.test", destination_hash: "staging-test-feedback-destination", label: `${MARKER} Never Deliver Feedback`, active: true, is_primary: true, created_by: FIXTURE.users.admin.id },
  ]), "Upsert fake notification destinations");

  return { admin, config, passwords };
}

async function deleteWhere(admin: SupabaseClient, table: string, column: string, values: string[]) {
  if (!values.length) return 0;
  const rows = await must(admin.from(table).delete().in(column, values).select(column), `Delete fixture rows from ${table}`);
  return Array.isArray(rows) ? rows.length : 0;
}

export async function cleanupFixtures() {
  const config = loadStagingConfig();
  const admin = createStagingAdmin(config);

  await assertMarkedRow(admin, "companies", "id", FIXTURE.companies.alpha, (row) => String(row.name).startsWith(MARKER));
  await assertMarkedRow(admin, "companies", "id", FIXTURE.companies.beta, (row) => String(row.name).startsWith(MARKER));
  await assertMarkedRow(admin, "campaigns", "id", FIXTURE.campaign, (row) => String(row.name).startsWith(MARKER));
  await assertMarkedRow(admin, "campaign_videos", "id", FIXTURE.video, (row) => (row.metadata as { staging_fixture?: boolean } | null)?.staging_fixture === true);
  await assertMarkedRow(admin, "drivers", "id", FIXTURE.driver, (row) => String(row.full_name).startsWith(MARKER));
  await assertMarkedRow(admin, "qr_codes", "id", FIXTURE.qr, (row) => row.public_path === `d/${FIXTURE.qrSlug}`);
  await assertMarkedRow(admin, "driver_campaign_assignments", "id", FIXTURE.assignment, (row) => row.driver_id === FIXTURE.driver && row.campaign_id === FIXTURE.campaign);
  await assertMarkedRow(admin, "notification_destinations", "id", FIXTURE.destinations.lead, (row) => String(row.label).startsWith(MARKER));
  await assertMarkedRow(admin, "notification_destinations", "id", FIXTURE.destinations.feedback, (row) => String(row.label).startsWith(MARKER));

  const leads = await must(admin.from("leads").select("id,full_name,privacy_notice_version").eq("campaign_id", FIXTURE.campaign), "Inspect fixture leads");
  for (const lead of leads as Array<{ id: string; full_name: string; privacy_notice_version: string }>) {
    if (!lead.full_name.startsWith(MARKER) || lead.privacy_notice_version !== "staging-automated-v1") {
      throw new Error(`Refusing cleanup because campaign contains unmarked lead ${lead.id}.`);
    }
  }
  const leadIds = (leads as Array<{ id: string }>).map((lead) => lead.id);
  const counts: Record<string, number> = {};
  // Rewards intentionally restrict lead deletion. Other lead-owned test rows
  // cascade from leads through their production foreign keys.
  counts.reward_issuances = await deleteWhere(admin, "reward_issuances", "lead_id", leadIds);
  counts.leads = await deleteWhere(admin, "leads", "id", leadIds);
  counts.landing_page_visits = await deleteWhere(admin, "landing_page_visits", "qr_code_id", [FIXTURE.qr]);
  await must(admin.from("driver_bonuses").delete().eq("campaign_id", FIXTURE.campaign), "Delete fixture bonuses");
  await must(admin.from("notification_destinations").delete().in("id", Object.values(FIXTURE.destinations)), "Delete destinations");
  await must(admin.from("company_receiver_settings").delete().eq("company_id", FIXTURE.companies.alpha), "Delete receiver settings");
  await must(admin.from("qr_codes").delete().eq("id", FIXTURE.qr), "Delete QR");
  await must(admin.from("driver_campaign_assignments").delete().eq("id", FIXTURE.assignment), "Delete assignment");
  await must(admin.from("drivers").delete().eq("id", FIXTURE.driver), "Delete driver");
  await must(admin.from("campaign_videos").delete().eq("id", FIXTURE.video), "Delete video");
  await must(admin.from("campaigns").delete().eq("id", FIXTURE.campaign), "Delete campaign");
  await must(admin.from("company_memberships").delete().in("company_id", Object.values(FIXTURE.companies)), "Delete memberships");
  await must(admin.from("companies").delete().in("id", Object.values(FIXTURE.companies)), "Delete companies");

  for (const user of Object.values(FIXTURE.users)) {
    const existing = await admin.auth.admin.getUserById(user.id);
    if (existing.error && existing.error.status !== 404) {
      throw new Error(`Auth fixture inspection failed for ${user.id}: ${existing.error.message}`);
    }
    if (existing.data.user && existing.data.user.app_metadata?.staging_fixture !== true) {
      throw new Error(`Refusing to delete unmarked Auth user ${user.id}.`);
    }
    if (existing.data.user) {
      const deleted = await admin.auth.admin.deleteUser(user.id);
      if (deleted.error) throw new Error(`Delete Auth fixture ${user.id} failed: ${deleted.error.message}`);
    }
  }
  return counts;
}
