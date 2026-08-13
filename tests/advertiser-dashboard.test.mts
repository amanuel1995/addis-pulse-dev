import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateLeadMetrics,
  maskAdvertiserPhone,
  type DashboardLead,
  updateRealtimeReward,
  upsertRealtimeLead,
} from "../src/lib/advertiser-dashboard/leads.ts";

function lead(id: string, status: DashboardLead["verificationStatus"], createdAt = "2026-07-24T12:00:00Z"): DashboardLead {
  return { id, companyId: "company-a", campaignId: "campaign-a", campaignName: "Pilot", fullName: "Test Passenger", phoneLabel: "•••• 4567", createdAt, verificationStatus: status, rewardStatus: null };
}

test("dashboard metrics include submitted, verified, pending, and conversion", () => {
  assert.deepEqual(calculateLeadMetrics([
    lead("1", "submitted"),
    lead("2", "otp_sent"),
    lead("3", "otp_verified"),
    lead("4", "otp_failed"),
  ]), { total: 4, verified: 1, pending: 2, conversionRate: 25 });
});

test("empty dashboard metrics avoid division by zero", () => {
  assert.deepEqual(calculateLeadMetrics([]), { total: 0, verified: 0, pending: 0, conversionRate: 0 });
});

test("phone display exposes only the final four digits", () => {
  assert.equal(maskAdvertiserPhone("+251911234567"), "•••• 4567");
  assert.equal(maskAdvertiserPhone(null), "Phone on file");
  assert.equal(maskAdvertiserPhone("12"), "Phone on file");
});

test("realtime insert adds and sorts a new lead without duplicates", () => {
  const older = lead("old", "submitted", "2026-07-24T10:00:00Z");
  const newer = lead("new", "submitted", "2026-07-24T11:00:00Z");
  assert.deepEqual(upsertRealtimeLead([older], newer).map((item) => item.id), ["new", "old"]);
  assert.equal(upsertRealtimeLead([newer, older], { ...newer, verificationStatus: "otp_verified" }).length, 2);
});

test("realtime update moves a pending lead to verified and updates metrics", () => {
  const pending = lead("1", "submitted");
  const updated = upsertRealtimeLead([pending], { ...pending, verificationStatus: "otp_verified" });
  assert.deepEqual(calculateLeadMetrics(updated), { total: 1, verified: 1, pending: 0, conversionRate: 100 });
});

test("realtime reward update attaches status to the matching lead", () => {
  assert.equal(updateRealtimeReward([lead("1", "otp_verified")], "1", "issued")[0].rewardStatus, "issued");
});
