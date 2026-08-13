import Link from "next/link";
import { AdminShell, EmptyState, Notice } from "@/components/admin/AdminShell";
import { createAssignment, endAssignment } from "@/app/admin/actions";
import { requirePlatformAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
const input = "mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 outline-none focus:border-red-800";

export default async function AssignmentsPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const [actor, query] = await Promise.all([requirePlatformAdmin(), searchParams]);
  const admin = createAdminClient();
  const [{ data: drivers }, { data: campaigns }, { data: assignments, error }, { data: qrs }] = await Promise.all([
    admin.from("drivers").select("id,full_name,vehicle_plate,status").in("status", ["registered", "shortlisted", "active"]).order("full_name"),
    admin.from("campaigns").select("id,name,company_id,status,companies(name)").in("status", ["scheduled", "active"]).order("name"),
    admin.from("driver_campaign_assignments").select("id,driver_id,campaign_id,status,assigned_at,ended_at,drivers(full_name,vehicle_plate),campaigns(name,companies(name))").order("assigned_at", { ascending: false }),
    admin.from("qr_codes").select("driver_id,public_path,status").eq("qr_type", "driver"),
  ]);
  if (error) throw new Error(`Unable to load assignments: ${error.message}`);
  const qrByDriver = Object.fromEntries((qrs || []).filter((qr) => qr.driver_id).map((qr) => [qr.driver_id!, qr]));
  return (
    <AdminShell title="Driver assignments" eyebrow="Campaign routing" adminName={actor.full_name || actor.email}>
      <Notice message={query.message} error={query.error} />
      <div className="mt-8 grid gap-7 xl:grid-cols-[0.7fr_1.3fr]">
        <form action={createAssignment} className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Assign active campaign</h2><p className="mt-2 text-sm leading-6 text-slate-500">A driver can have only one active campaign. The first assignment creates their permanent public QR.</p>
          <label className="mt-5 block text-sm font-bold">Driver<select className={input} name="driverId" required defaultValue=""><option value="" disabled>Select driver</option>{drivers?.map((driver) => <option key={driver.id} value={driver.id}>{driver.full_name} · {driver.vehicle_plate || "No plate"}</option>)}</select></label>
          <label className="mt-4 block text-sm font-bold">Campaign<select className={input} name="campaignId" required defaultValue=""><option value="" disabled>Select scheduled/active campaign</option>{campaigns?.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name} · {campaign.companies?.name}</option>)}</select></label>
          <button disabled={!drivers?.length || !campaigns?.length} className="mt-5 min-h-11 w-full rounded-xl bg-slate-950 px-4 font-black text-white hover:bg-red-900 disabled:opacity-50">Create assignment</button>
          {!campaigns?.length && <p className="mt-3 text-sm font-semibold text-amber-700">Activate or schedule a campaign before assigning drivers.</p>}
        </form>
        <section><h2 className="text-xl font-black">Assignment history</h2><div className="mt-4 space-y-3">
          {!assignments?.length ? <EmptyState>No assignments created yet.</EmptyState> : assignments.map((assignment) => {
            const qr = qrByDriver[assignment.driver_id];
            return <article key={assignment.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-xs font-black uppercase tracking-wider text-red-800">{assignment.campaigns?.companies?.name || "Company"}</p><h3 className="mt-1 font-black">{assignment.drivers?.full_name} → {assignment.campaigns?.name}</h3><p className="mt-2 text-sm text-slate-500">{assignment.drivers?.vehicle_plate || "Plate pending"} · assigned {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(assignment.assigned_at))}</p><div className="mt-3 flex flex-wrap items-center gap-3"><span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${assignment.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{assignment.status}</span>{qr && <Link className="text-sm font-bold text-red-800 hover:underline" href={`/${qr.public_path}`} target="_blank">Open customer page</Link>}</div></div>{assignment.status === "active" && <form action={endAssignment}><input type="hidden" name="id" value={assignment.id} /><button className="min-h-10 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-black text-red-800 hover:bg-red-100">End assignment</button></form>}</div></article>;
          })}
        </div></section>
      </div>
    </AdminShell>
  );
}
