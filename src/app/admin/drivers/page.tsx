import { AdminShell, EmptyState, Notice } from "@/components/admin/AdminShell";
import { createDriver, updateDriverStatus } from "@/app/admin/actions";
import { requirePlatformAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
const input = "mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 outline-none focus:border-red-800";

export default async function DriversPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const [actor, query] = await Promise.all([requirePlatformAdmin(), searchParams]);
  const { data: drivers, error: driversError } = await createAdminClient()
    .from("drivers")
    .select("id,full_name,vehicle_plate,vehicle_type,primary_zone,status,compliance_score")
    .order("created_at", { ascending: false });
  if (driversError) {
    console.error("[admin:load-drivers]", { code: driversError.code, message: driversError.message });
  }
  return (
    <AdminShell title="Driver registry" eyebrow="Permanent mobility network" adminName={actor.full_name || actor.email}>
      <Notice
        message={query.message}
        error={query.error || (driversError ? "The driver list could not load, but you can still register a driver." : undefined)}
      />
      <div className="mt-8 grid gap-7 xl:grid-cols-[0.78fr_1.22fr]">
        <form action={createDriver} className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Register driver</h2><p className="mt-2 text-sm leading-6 text-slate-500">A permanent QR is created automatically when the driver receives their first campaign assignment.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold sm:col-span-2">Full name<input className={input} name="fullName" required /></label>
            <label className="text-sm font-bold">Mobile number<input className={input} name="phone" type="tel" required placeholder="0911 234 567" /></label>
            <label className="text-sm font-bold">Vehicle plate<input className={input} name="vehiclePlate" required placeholder="AA-2-B12345" /></label>
            <label className="text-sm font-bold">Vehicle type<select className={input} name="vehicleType" defaultValue="ride_share"><option value="ride_share">Ride share</option><option value="taxi">Taxi</option><option value="fleet">Fleet vehicle</option></select></label>
            <label className="text-sm font-bold">Primary zone<input className={input} name="primaryZone" required placeholder="Bole" /></label>
            <label className="text-sm font-bold sm:col-span-2">Telegram handle<input className={input} name="telegramHandle" placeholder="driver_username" /></label>
          </div>
          <button className="mt-5 min-h-11 w-full rounded-xl bg-slate-950 px-4 font-black text-white hover:bg-red-900">Register driver</button>
        </form>
        <section><h2 className="text-xl font-black">Registered drivers</h2><div className="mt-4 space-y-3">
          {driversError ? <EmptyState>Registered drivers are temporarily unavailable.</EmptyState> : !drivers?.length ? <EmptyState>No drivers registered yet.</EmptyState> : drivers.map((driver) => <article key={driver.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h3 className="font-black">{driver.full_name}</h3><p className="mt-1 text-sm text-slate-500">{driver.vehicle_plate || "Plate pending"} · {driver.primary_zone || "Zone pending"} · {(driver.vehicle_type || "ride_share").replaceAll("_", " ")}</p><p className="mt-2 text-xs font-bold uppercase tracking-wider text-red-800">{driver.status} · compliance {driver.compliance_score ?? 100}%</p></div><form action={updateDriverStatus} className="flex gap-2"><input type="hidden" name="id" value={driver.id} /><select name="status" defaultValue={driver.status} className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-bold"><option value="registered">Registered</option><option value="shortlisted">Shortlisted</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="removed">Removed</option></select><button className="rounded-lg bg-slate-100 px-3 text-sm font-bold hover:bg-slate-200">Update</button></form></div></article>)}
        </div></section>
      </div>
    </AdminShell>
  );
}
