import Link from "next/link";
import { ArrowRight, Building2, CalendarRange, CarFront, Link2 } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { requirePlatformAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const actor = await requirePlatformAdmin();
  const admin = createAdminClient();
  const [companies, campaigns, drivers, assignments] = await Promise.all([
    admin.from("companies").select("id", { count: "exact", head: true }),
    admin.from("campaigns").select("id", { count: "exact", head: true }),
    admin.from("drivers").select("id", { count: "exact", head: true }),
    admin.from("driver_campaign_assignments").select("id", { count: "exact", head: true }).eq("status", "active"),
  ]);
  const cards = [
    ["Companies", companies.count || 0, "/admin/companies", Building2],
    ["Campaigns", campaigns.count || 0, "/admin/campaigns", CalendarRange],
    ["Drivers", drivers.count || 0, "/admin/drivers", CarFront],
    ["Active assignments", assignments.count || 0, "/admin/assignments", Link2],
  ] as const;
  return (
    <AdminShell title="Operations overview" eyebrow="Milestone 2 foundation" adminName={actor.full_name || actor.email}>
      <p className="mt-4 max-w-2xl leading-7 text-slate-600">Create advertiser companies, configure campaigns, register drivers, and control the active campaign behind every permanent driver QR.</p>
      <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, count, href, Icon]) => <Link key={href} href={href} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><div className="flex items-center justify-between"><Icon className="size-6 text-red-800" aria-hidden="true" /><ArrowRight className="size-4 text-slate-400 transition group-hover:translate-x-1" aria-hidden="true" /></div><p className="mt-7 text-4xl font-black">{count}</p><p className="mt-1 text-sm font-bold text-slate-500">{label}</p></Link>)}
      </div>
      <section className="mt-8 rounded-2xl bg-slate-950 p-7 text-white">
        <p className="text-xs font-black uppercase tracking-[0.17em] text-red-300">Recommended workflow</p>
        <ol className="mt-5 grid gap-4 md:grid-cols-4">{["Create company", "Create campaign", "Register drivers", "Activate assignments"].map((step, index) => <li key={step} className="rounded-xl border border-white/10 bg-white/5 p-4"><span className="text-xs font-black text-red-300">0{index + 1}</span><p className="mt-3 font-bold">{step}</p></li>)}</ol>
      </section>
    </AdminShell>
  );
}
