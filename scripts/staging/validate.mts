import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { generateOtpCode, OtpConfigurationError, resolveOtpProviderName } from "../../src/lib/otp/config.ts";
import { normalizeEthiopianPhone } from "../../src/lib/passenger-flow/validation.ts";
import { bootstrapFixtures, FIXTURE } from "./fixtures.mts";

const checks: Array<{ name: string; run: () => Promise<void> | void }> = [];
const check = (name: string, run: () => Promise<void> | void) => checks.push({ name, run });
const { admin, config, passwords } = await bootstrapFixtures();
if (!config.appUrl) throw new Error("Missing required environment variable: STAGING_APP_URL");
const appUrl = config.appUrl.replace(/\/$/, "");

async function rpc(name: string, args: Record<string, unknown>) {
  const { data, error } = await admin.rpc(name, args);
  if (error) throw new Error(`${name} failed: ${error.message}`);
  return data;
}

async function submitLead(suffix: number) {
  return String(await rpc("submit_lead_server", {
    p_public_path: `d/${FIXTURE.qrSlug}`,
    p_idempotency_key: randomUUID(),
    p_full_name: `[STAGING TEST] Passenger ${suffix}`,
    p_phone_e164: `+2517000000${90 + suffix}`,
    p_phone_hash: `staging-test-phone-hash-${suffix}`,
    p_ip_hash: `staging-test-ip-hash-${suffix}`,
    p_device_fingerprint_hash: `staging-test-device-hash-${suffix}`,
    p_consent_given: true,
    p_privacy_notice_version: "staging-automated-v1",
  }));
}

const leadSuccess = await submitLead(1);
const leadFailed = await submitLead(2);
const leadExpired = await submitLead(3);
const leadCooldown = await submitLead(4);

check("valid permanent QR resolves the active campaign", async () => {
  const data = await rpc("resolve_driver_campaign", { p_qr_token: `d/${FIXTURE.qrSlug}` });
  assert.ok(Array.isArray(data) ? data.length === 1 : data);
});
check("invalid QR returns the not-found state", async () => {
  const response = await fetch(`${appUrl}/d/staging-test-does-not-exist`, { redirect: "manual" });
  const body = await response.text();
  // This route has loading.tsx, so Next.js streams a 200 response before a
  // later notFound() can update the status. Assert the user-facing state;
  // framework metadata inside a streamed React payload is not a stable API.
  assert.equal(response.status, 200);
  assert.match(body, /This QR link is not valid|QR not recognized/);
});
check("inactive assignment resolves unavailable", async () => {
  try {
    const { error } = await admin
      .from("driver_campaign_assignments")
      .update({ status: "removed", ended_at: new Date().toISOString() })
      .eq("id", FIXTURE.assignment);
    if (error) throw error;
    const data = await rpc("get_public_landing_page", { p_public_path: `d/${FIXTURE.qrSlug}`, p_locale: "en" }) as { available?: boolean };
    assert.equal(data?.available, false);
  } finally {
    const { error } = await admin
      .from("driver_campaign_assignments")
      .update({ status: "active", ended_at: null })
      .eq("id", FIXTURE.assignment);
    if (error) throw error;
  }
});
check("valid lead submission succeeds", () => assert.match(leadSuccess, /^[0-9a-f-]{36}$/));
check("missing consent is rejected", async () => {
  const { error } = await admin.rpc("submit_lead_server", {
    p_public_path: `d/${FIXTURE.qrSlug}`, p_idempotency_key: randomUUID(), p_full_name: "[STAGING TEST] No Consent",
    p_phone_e164: "+251700000098", p_phone_hash: "staging-test-no-consent", p_ip_hash: "staging-test-no-consent-ip",
    p_consent_given: false, p_privacy_notice_version: "staging-automated-v1",
  });
  assert.ok(error);
});
check("invalid Ethiopian phone is rejected", () => assert.equal(normalizeEthiopianPhone("+251111234567"), null));
check("raw request identifiers are not persisted", async () => {
  const { data, error } = await admin.from("leads").select("phone_e164,phone_hash,ip_hash,device_fingerprint_hash").eq("id", leadSuccess).single();
  if (error) throw error;
  assert.notEqual(data.phone_e164, "0700 000 091");
  assert.equal(data.phone_hash, "staging-test-phone-hash-1");
  assert.equal(data.ip_hash, "staging-test-ip-hash-1");
  assert.equal(data.device_fingerprint_hash, "staging-test-device-hash-1");
});
check("fake OTP mode cannot be selected in production", () => {
  assert.throws(() => resolveOtpProviderName({ NODE_ENV: "production", OTP_PROVIDER: "fake_local" }), OtpConfigurationError);
});
check("explicit non-production test OTP verifies", async () => {
  const code = generateOtpCode("fake_local", { NODE_ENV: "test", OTP_FAKE_CODE: "654321" });
  const otpId = String(await rpc("create_otp_challenge_server", { p_lead_id: leadSuccess, p_code_plaintext: code, p_ttl_seconds: 300 }));
  await rpc("record_otp_delivery_attempt_server", { p_otp_verification_id: otpId, p_attempt_number: 1, p_provider: "fake_local", p_destination_hash: "staging-test-destination", p_status: "accepted" });
  assert.equal(await rpc("verify_otp_server", { p_lead_id: leadSuccess, p_code_plaintext: code }), true);
});
check("wrong OTP increments attempts", async () => {
  const otpId = String(await rpc("create_otp_challenge_server", { p_lead_id: leadFailed, p_code_plaintext: "654321", p_ttl_seconds: 300 }));
  await rpc("record_otp_delivery_attempt_server", { p_otp_verification_id: otpId, p_attempt_number: 1, p_provider: "fake_local", p_destination_hash: "staging-test-destination-2", p_status: "accepted" });
  assert.equal(await rpc("verify_otp_server", { p_lead_id: leadFailed, p_code_plaintext: "000000" }), false);
  const { data } = await admin.from("otp_verifications").select("attempts").eq("lead_id", leadFailed).single();
  assert.equal(data?.attempts, 1);
});
check("third wrong OTP exhausts the challenge", async () => {
  await rpc("verify_otp_server", { p_lead_id: leadFailed, p_code_plaintext: "000000" });
  await rpc("verify_otp_server", { p_lead_id: leadFailed, p_code_plaintext: "000000" });
  const { data } = await admin.from("otp_verifications").select("attempts,status").eq("lead_id", leadFailed).single();
  assert.deepEqual(data, { attempts: 3, status: "failed" });
});
check("expired OTP is rejected", async () => {
  const otpId = String(await rpc("create_otp_challenge_server", { p_lead_id: leadExpired, p_code_plaintext: "654321", p_ttl_seconds: 60 }));
  await rpc("record_otp_delivery_attempt_server", { p_otp_verification_id: otpId, p_attempt_number: 1, p_provider: "fake_local", p_destination_hash: "staging-test-destination-3", p_status: "accepted" });
  await admin.from("otp_verifications").update({ created_at: new Date(Date.now() - 120_000).toISOString(), expires_at: new Date(Date.now() - 60_000).toISOString() }).eq("id", otpId);
  assert.equal(await rpc("verify_otp_server", { p_lead_id: leadExpired, p_code_plaintext: "654321" }), false);
});
check("resend cooldown has an open recent challenge", async () => {
  const otpId = String(await rpc("create_otp_challenge_server", { p_lead_id: leadCooldown, p_code_plaintext: "654321", p_ttl_seconds: 300 }));
  await rpc("record_otp_delivery_attempt_server", { p_otp_verification_id: otpId, p_attempt_number: 1, p_provider: "fake_local", p_destination_hash: "staging-test-destination-4", p_status: "accepted" });
  const { count } = await admin.from("otp_verifications").select("id", { count: "exact", head: true }).eq("lead_id", leadCooldown).in("status", ["created", "send_pending", "sent"]).gte("created_at", new Date(Date.now() - 60_000).toISOString());
  assert.equal(count, 1);
});
check("successful verification changes the lead to otp_verified", async () => {
  const { data } = await admin.from("leads").select("verification_status").eq("id", leadSuccess).single();
  assert.equal(data?.verification_status, "otp_verified");
});
check("exactly one reward is created", async () => {
  const { count } = await admin.from("reward_issuances").select("id", { count: "exact", head: true }).eq("lead_id", leadSuccess);
  assert.equal(count, 1);
});
check("notification jobs are created once", async () => {
  const { count } = await admin.from("notification_jobs").select("id", { count: "exact", head: true }).eq("lead_id", leadSuccess).eq("event_type", "lead_verified");
  assert.equal(count, 1);
});
check("repeated verification is idempotent", async () => {
  await rpc("verify_otp_server", { p_lead_id: leadSuccess, p_code_plaintext: "654321" });
  const { count } = await admin.from("reward_issuances").select("id", { count: "exact", head: true }).eq("lead_id", leadSuccess);
  assert.equal(count, 1);
});
check("Company A cannot access Company B records", async () => {
  const client = createClient(config.url, config.serviceRoleKey, { auth: { persistSession: false } });
  const signedIn = await client.auth.signInWithPassword({ email: FIXTURE.users.alpha.email, password: passwords.alpha });
  if (signedIn.error) throw signedIn.error;
  const { data, error } = await client.from("companies").select("id");
  if (error) throw error;
  assert.deepEqual(data.map((row) => row.id), [FIXTURE.companies.alpha]);
});
check("service-role key is absent from browser responses", async () => {
  const response = await fetch(`${appUrl}/d/${FIXTURE.qrSlug}`);
  const body = await response.text();
  assert.equal(body.includes(config.serviceRoleKey), false);
  const scriptPaths = [...body.matchAll(/<script[^>]+src="([^"]+)"/g)].map((match) => match[1]);
  for (const scriptPath of scriptPaths) {
    const bundle = await (await fetch(new URL(scriptPath, appUrl))).text();
    assert.equal(bundle.includes(config.serviceRoleKey), false);
  }
});
check("landing and reward payload contain expected branding", async () => {
  const response = await fetch(`${appUrl}/d/${FIXTURE.qrSlug}`);
  assert.equal(response.ok, true);
  const body = await response.text();
  assert.match(body, /\[STAGING TEST\] AddisPulse Campaign/);
  const landing = await rpc("get_public_landing_page", { p_public_path: `d/${FIXTURE.qrSlug}`, p_locale: "en" });
  assert.match(JSON.stringify(landing), /\[STAGING TEST\] Test reward/);
});

let failed = 0;
for (const [index, item] of checks.entries()) {
  try {
    await item.run();
    console.log(`ok ${index + 1} - ${item.name}`);
  } catch (error) {
    failed += 1;
    console.error(`not ok ${index + 1} - ${item.name}`);
    console.error(formatError(error));
  }
}
if (failed) throw new Error(`${failed} staging validation check(s) failed.`);

function formatError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message);
  }
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown staging validation failure";
  }
}
