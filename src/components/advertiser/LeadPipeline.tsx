"use client";

import { useMemo, useState } from "react";
import { updateLeadPipelineStatus } from "@/app/advertiser/actions";
import { SecureContact } from "@/components/advertiser/SecureContact";

export type PipelineLead = {
  id: string;
  fullName: string;
  maskedPhone: string;
  campaignName: string;
  companyName: string;
  interest: string | null;
  createdAt: string;
  verificationStatus: string;
  status: string;
  canUpdate: boolean;
};

const statuses = ["new", "viewed", "contacted", "appointment_set", "followed_up", "converted", "rejected", "duplicate", "invalid"];

export function LeadPipeline({ leads }: { leads: PipelineLead[] }) {
  const [filter, setFilter] = useState("all");
  const filtered = useMemo(() => filter === "all" ? leads : leads.filter((lead) => lead.status === filter), [filter, leads]);
  return (
    <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center">
        <div><h2 className="text-xl font-black">Lead pipeline</h2><p className="mt-1 text-sm text-slate-500">Verified contacts can be revealed only on demand.</p></div>
        <select aria-label="Filter leads by status" value={filter} onChange={(event) => setFilter(event.target.value)} className="min-h-10 rounded-xl border border-slate-300 px-3 text-sm font-bold"><option value="all">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select>
      </div>
      {!filtered.length ? <p className="p-10 text-center text-slate-500">No leads match this pipeline status.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Lead</th><th className="px-5 py-3">Secure contact</th><th className="px-5 py-3">Campaign</th><th className="px-5 py-3">Interest</th><th className="px-5 py-3">Verification</th><th className="px-5 py-3">Pipeline status</th><th className="px-5 py-3">Submitted</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((lead) => <tr key={lead.id} className="align-top"><td className="px-5 py-4"><p className="font-black">{lead.fullName}</p><p className="mt-1 text-xs text-slate-500">{lead.companyName}</p></td><td className="px-5 py-4"><SecureContact leadId={lead.id} maskedPhone={lead.maskedPhone} /></td><td className="px-5 py-4 font-semibold">{lead.campaignName}</td><td className="px-5 py-4 text-slate-600">{lead.interest || "Not specified"}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-black ${lead.verificationStatus.endsWith("verified") ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{lead.verificationStatus.replaceAll("_", " ")}</span></td><td className="px-5 py-4">{lead.canUpdate && lead.verificationStatus.endsWith("verified") ? <form action={updateLeadPipelineStatus} className="flex gap-2"><input type="hidden" name="leadId" value={lead.id} /><select name="status" defaultValue={lead.status} className="min-h-9 rounded-lg border border-slate-300 px-2 text-xs font-bold">{statuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select><button className="rounded-lg bg-slate-950 px-3 text-xs font-black text-white">Save</button></form> : <span className="font-bold text-slate-500">{lead.status.replaceAll("_", " ")}</span>}</td><td className="px-5 py-4 text-slate-500">{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(lead.createdAt))}</td></tr>)}</tbody></table></div>}
    </section>
  );
}
