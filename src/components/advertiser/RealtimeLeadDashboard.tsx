"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  calculateLeadMetrics,
  maskAdvertiserPhone,
  type DashboardLead,
  type RewardStatus,
  type VerificationStatus,
  updateRealtimeReward,
  upsertRealtimeLead,
} from "@/lib/advertiser-dashboard/leads";

type ConnectionState = "connecting" | "connected" | "disconnected";

type LeadRecord = {
  id: string;
  company_id: string;
  campaign_id: string | null;
  full_name: string;
  phone_e164: string;
  created_at: string;
  verification_status: VerificationStatus;
};

export function RealtimeLeadDashboard({
  initialLeads,
  campaignNames,
  companyIds,
  realtimeEnabled,
}: {
  initialLeads: DashboardLead[];
  campaignNames: Record<string, string>;
  companyIds: string[];
  realtimeEnabled: boolean;
}) {
  const [leads, setLeads] = useState(initialLeads);
  const [connection, setConnection] = useState<ConnectionState>(
    realtimeEnabled ? "connecting" : "disconnected",
  );
  const metrics = useMemo(() => calculateLeadMetrics(leads), [leads]);

  useEffect(() => {
    if (!realtimeEnabled) return;
    const supabase = createClient();
    const channel = supabase
      .channel("advertiser-m1-leads")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        (payload) => {
          const row = payload.new as LeadRecord;
          if (!row?.id || !companyIds.includes(row.company_id)) return;
          setLeads((current) => {
            const existing = current.find((lead) => lead.id === row.id);
            return upsertRealtimeLead(current, {
              id: row.id,
              companyId: row.company_id,
              campaignId: row.campaign_id,
              campaignName: row.campaign_id ? campaignNames[row.campaign_id] || null : null,
              fullName: row.full_name,
              phoneLabel: maskAdvertiserPhone(row.phone_e164),
              createdAt: row.created_at,
              verificationStatus: row.verification_status,
              rewardStatus: existing?.rewardStatus || null,
            });
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reward_issuances" },
        (payload) => {
          const row = payload.new as { lead_id?: string; status?: RewardStatus };
          if (!row.lead_id || !row.status) return;
          setLeads((current) => updateRealtimeReward(current, row.lead_id!, row.status!));
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setConnection("connected");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setConnection("disconnected");
        } else setConnection("connecting");
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [campaignNames, companyIds, realtimeEnabled]);

  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total submitted" value={metrics.total} />
        <Metric label="OTP verified" value={metrics.verified} />
        <Metric label="Pending verification" value={metrics.pending} />
        <Metric label="Conversion rate" value={`${metrics.conversionRate}%`} />
      </div>

      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold">Recent leads</h2>
            <p className="text-sm text-slate-500">Company-authorized records only</p>
          </div>
          <ConnectionBadge state={connection} enabled={realtimeEnabled} />
        </div>
        {leads.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="font-semibold">No leads yet</p>
            <p className="mt-1 text-sm text-slate-500">New passenger submissions will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="px-5 py-3">Passenger</th><th className="px-5 py-3">Phone</th><th className="px-5 py-3">Campaign</th><th className="px-5 py-3">Submitted</th><th className="px-5 py-3">Verification</th><th className="px-5 py-3">Reward</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="px-5 py-4 font-semibold">{lead.fullName}</td>
                    <td className="px-5 py-4 font-mono text-slate-600">{lead.phoneLabel}</td>
                    <td className="px-5 py-4">{lead.campaignName || lead.campaignId || "Unassigned"}</td>
                    <td className="px-5 py-4">{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(lead.createdAt))}</td>
                    <td className="px-5 py-4"><Status value={lead.verificationStatus.replaceAll("_", " ")} positive={lead.verificationStatus.endsWith("verified")} /></td>
                    <td className="px-5 py-4">{lead.rewardStatus ? <Status value={lead.rewardStatus.replaceAll("_", " ")} positive={lead.rewardStatus === "issued" || lead.rewardStatus === "redeemed"} /> : <span className="text-slate-400">Not available</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-2 text-3xl font-black tracking-tight">{value}</p></div>;
}

function Status({ value, positive }: { value: string; positive: boolean }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${positive ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{value}</span>;
}

function ConnectionBadge({ state, enabled }: { state: ConnectionState; enabled: boolean }) {
  const label = !enabled ? "Realtime disabled" : state === "connected" ? "Realtime connected" : state === "connecting" ? "Realtime reconnecting" : "Realtime disconnected";
  const color = enabled && state === "connected" ? "bg-emerald-100 text-emerald-800" : state === "connecting" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600";
  return <span role="status" className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${color}`}><span className="size-2 rounded-full bg-current" />{label}</span>;
}
