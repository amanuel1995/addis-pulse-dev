export type CampaignMetricInput = {
  id: string;
  name: string;
  budgetEtb: number | null;
};

export type MetricLead = {
  campaignId: string | null;
  verificationStatus: string;
  status: string;
};

export type CampaignValueMetric = {
  id: string;
  name: string;
  scans: number;
  leads: number;
  verified: number;
  converted: number;
  scanToLeadRate: number;
  verificationRate: number;
  conversionRate: number;
  costPerVerifiedLead: number | null;
};

function percentage(numerator: number, denominator: number) {
  return denominator ? Math.round((numerator / denominator) * 1000) / 10 : 0;
}

export function calculateCampaignValueMetrics(
  campaigns: CampaignMetricInput[],
  visits: Array<{ campaignId: string | null }>,
  leads: MetricLead[],
): CampaignValueMetric[] {
  return campaigns.map((campaign) => {
    const scans = visits.filter((visit) => visit.campaignId === campaign.id).length;
    const campaignLeads = leads.filter((lead) => lead.campaignId === campaign.id);
    const verified = campaignLeads.filter((lead) => ["otp_verified", "call_verified"].includes(lead.verificationStatus)).length;
    const converted = campaignLeads.filter((lead) => lead.status === "converted").length;
    return {
      id: campaign.id,
      name: campaign.name,
      scans,
      leads: campaignLeads.length,
      verified,
      converted,
      scanToLeadRate: percentage(campaignLeads.length, scans),
      verificationRate: percentage(verified, campaignLeads.length),
      conversionRate: percentage(converted, verified),
      costPerVerifiedLead: campaign.budgetEtb !== null && verified
        ? Math.round((campaign.budgetEtb / verified) * 100) / 100
        : null,
    };
  });
}

export function csvCell(value: unknown) {
  const raw = value === null || value === undefined ? "" : String(value);
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function rowsToCsv(headers: string[], rows: unknown[][]) {
  return `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}
