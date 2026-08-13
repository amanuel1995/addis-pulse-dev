import type { Database } from "@/types/database.types";

export type VerificationStatus =
  Database["public"]["Enums"]["lead_verification_status"];
export type RewardStatus =
  Database["public"]["Enums"]["reward_issuance_status"];

export type DashboardLead = {
  id: string;
  companyId: string;
  campaignId: string | null;
  campaignName: string | null;
  fullName: string;
  phoneLabel: string;
  createdAt: string;
  verificationStatus: VerificationStatus;
  rewardStatus: RewardStatus | null;
};

export type LeadMetrics = {
  total: number;
  verified: number;
  pending: number;
  conversionRate: number;
};

export function isVerified(status: VerificationStatus) {
  return status === "otp_verified" || status === "call_verified";
}

export function isPending(status: VerificationStatus) {
  return status === "submitted" || status === "otp_sent";
}

export function calculateLeadMetrics(leads: DashboardLead[]): LeadMetrics {
  const total = leads.length;
  const verified = leads.filter((lead) => isVerified(lead.verificationStatus)).length;
  const pending = leads.filter((lead) => isPending(lead.verificationStatus)).length;
  return {
    total,
    verified,
    pending,
    conversionRate: total === 0 ? 0 : Math.round((verified / total) * 1000) / 10,
  };
}

export function maskAdvertiserPhone(phone: string | null | undefined) {
  if (!phone) return "Phone on file";
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 4 ? `•••• ${digits.slice(-4)}` : "Phone on file";
}

export function upsertRealtimeLead(
  leads: DashboardLead[],
  lead: DashboardLead,
  limit = 100,
) {
  return [lead, ...leads.filter((item) => item.id !== lead.id)]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, limit);
}

export function updateRealtimeReward(
  leads: DashboardLead[],
  leadId: string,
  rewardStatus: RewardStatus,
) {
  return leads.map((lead) =>
    lead.id === leadId ? { ...lead, rewardStatus } : lead,
  );
}
