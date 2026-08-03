import { AdvertiserShell } from "@/components/advertiser/AdvertiserShell";
import { requireAdvertiserContext } from "@/lib/advertiser/auth";
import { connectEmail, connectTelegram, sendTelegramTest, toggleDestination } from "./actions";

export const dynamic = "force-dynamic";
const input = "mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3";

export default async function NotificationSettingsPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const [{ supabase, memberships }, query] = await Promise.all([requireAdvertiserContext(), searchParams]);
  const manageable = memberships.filter((m) => m.can_manage_notifications);
  const companyIds = memberships.map((m) => m.company_id);
  const { data: destinations, error } = companyIds.length
    ? await supabase.from("notification_destinations").select("id,company_id,channel,event_type,frequency,digest_time_utc,destination_value,label,active,is_primary,updated_at").in("company_id", companyIds).order("updated_at", { ascending: false })
    : { data: [], error: null };
  if (error) throw new Error(`Unable to load notification settings: ${error.message}`);
  const names = Object.fromEntries(memberships.map((m) => [m.company_id, m.companies?.name || "Company"]));
  return <AdvertiserShell title="Notification settings" companies={Object.values(names)}>
    <p className="mt-3 max-w-3xl text-slate-600">Send verified leads directly to your sales team. Add the AddisPulse bot to the Telegram group first, then enter its public handle or numeric chat ID.</p>
    {query.message && <p className="mt-5 rounded-xl bg-emerald-50 p-3 font-semibold text-emerald-900">{query.message}</p>}
    {query.error && <p className="mt-5 rounded-xl bg-red-50 p-3 font-semibold text-red-900">{query.error}</p>}
    <div className="mt-8 grid gap-6 xl:grid-cols-3">
      <form action={connectTelegram} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black">Connect Telegram group</h2>
        <label className="mt-5 block text-sm font-bold">Company<select name="companyId" required className={input}>{manageable.map((m) => <option key={m.company_id} value={m.company_id}>{names[m.company_id]}</option>)}</select></label>
        <label className="mt-4 block text-sm font-bold">Group handle or chat ID<input name="chatId" required className={input} placeholder="@NoahSalesTeam or -1001234567890" /></label>
        <label className="mt-4 block text-sm font-bold">Label<input name="label" required className={input} placeholder="Noah sales team" /></label>
        <label className="mt-4 block text-sm font-bold">Frequency<select name="frequency" className={input}><option value="instant">Instant streaming</option><option value="daily_digest">Daily digest</option></select></label>
        <label className="mt-4 block text-sm font-bold">Digest time (UTC)<input name="digestTime" type="time" defaultValue="09:00" className={input} /></label>
        <button disabled={!manageable.length} className="mt-6 min-h-11 rounded-xl bg-slate-950 px-5 font-bold text-white disabled:opacity-40">Connect destination</button>
      </form>
      <form action={connectEmail} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black">Connect email inbox</h2>
        <label className="mt-5 block text-sm font-bold">Company<select name="companyId" required className={input}>{manageable.map((m) => <option key={m.company_id} value={m.company_id}>{names[m.company_id]}</option>)}</select></label>
        <label className="mt-4 block text-sm font-bold">Email address<input name="email" type="email" required className={input} placeholder="sales@example.com" /></label>
        <label className="mt-4 block text-sm font-bold">Label<input name="label" required className={input} placeholder="Sales inbox" /></label>
        <label className="mt-4 block text-sm font-bold">Frequency<select name="frequency" className={input}><option value="instant">Instant</option><option value="daily_digest">Daily digest</option></select></label>
        <label className="mt-4 block text-sm font-bold">Digest time (UTC)<input name="digestTime" type="time" defaultValue="09:00" className={input} /></label>
        <button disabled={!manageable.length} className="mt-6 min-h-11 rounded-xl bg-slate-950 px-5 font-bold text-white disabled:opacity-40">Connect email</button>
      </form>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-black">Connected destinations</h2><div className="mt-5 space-y-3">
        {(destinations || []).map((d) => <article key={d.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-black">{d.label || d.destination_value}</p><p className="mt-1 text-sm text-slate-600">{names[d.company_id]} · {d.channel} · {d.event_type.replaceAll("_", " ")} · {d.frequency.replaceAll("_", " ")}</p><p className="mt-1 font-mono text-xs text-slate-500">{d.destination_value}</p></div><div className="flex gap-2">{d.channel === "telegram" && <form action={sendTelegramTest}><input type="hidden" name="id" value={d.id}/><button className="rounded-full border border-slate-300 px-3 py-1 text-xs font-black">Send test</button></form>}<form action={toggleDestination}><input type="hidden" name="id" value={d.id}/><input type="hidden" name="active" value={String(!d.active)}/><button className={`rounded-full px-3 py-1 text-xs font-black ${d.active ? "bg-emerald-100 text-emerald-900" : "bg-slate-200"}`}>{d.active ? "Active" : "Paused"}</button></form></div></div></article>)}
        {!destinations?.length && <p className="text-sm text-slate-500">No destinations configured yet.</p>}
      </div></section>
    </div>
  </AdvertiserShell>;
}
