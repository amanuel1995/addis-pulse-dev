import assert from "node:assert/strict";
import test from "node:test";
import { calculateCampaignValueMetrics, csvCell, rowsToCsv } from "../src/lib/advertiser/value.ts";

test("campaign value metrics cover scans, verification, conversion, and CPL", () => {
  const [metric] = calculateCampaignValueMetrics(
    [{ id: "campaign-1", name: "Pilot", budgetEtb: 42000 }],
    Array.from({ length: 10 }, () => ({ campaignId: "campaign-1" })),
    [
      { campaignId: "campaign-1", verificationStatus: "otp_verified", status: "converted" },
      { campaignId: "campaign-1", verificationStatus: "otp_verified", status: "contacted" },
      { campaignId: "campaign-1", verificationStatus: "otp_sent", status: "new" },
    ],
  );
  assert.deepEqual(metric, {
    id: "campaign-1", name: "Pilot", scans: 10, leads: 3, verified: 2, converted: 1,
    scanToLeadRate: 30, verificationRate: 66.7, conversionRate: 50, costPerVerifiedLead: 21000,
  });
});

test("empty campaign metrics avoid division by zero", () => {
  const [metric] = calculateCampaignValueMetrics([{ id: "empty", name: "Empty", budgetEtb: 1000 }], [], []);
  assert.equal(metric.scanToLeadRate, 0);
  assert.equal(metric.verificationRate, 0);
  assert.equal(metric.conversionRate, 0);
  assert.equal(metric.costPerVerifiedLead, null);
});

test("CSV output quotes values and neutralizes spreadsheet formulas", () => {
  assert.equal(csvCell("=HYPERLINK(\"bad\")"), '"\'=HYPERLINK(""bad"")"');
  const csv = rowsToCsv(["Name", "Phone"], [["Sara, Test", "+251911223344"]]);
  assert.match(csv, /^\uFEFF"Name","Phone"/);
  assert.match(csv, /"Sara, Test","'\+251911223344"/);
});
