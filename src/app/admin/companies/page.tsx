import { AdminShell, EmptyState, Notice } from "@/components/admin/AdminShell";
import { createCompany, updateCompanyLogo, updateCompanyStatus } from "@/app/admin/actions";
import { requirePlatformAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
const input = "mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 outline-none focus:border-red-800";

export default async function CompaniesPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const [actor, query] = await Promise.all([requirePlatformAdmin(), searchParams]);
  const { data: companies, error } = await createAdminClient().from("companies").select("id,identifier,name,sector,status,brand_color,public_contact_email,public_contact_phone,updated_at").order("created_at", { ascending: false });
  if (error) throw new Error(`Unable to load companies: ${error.message}`);
  return (
    <AdminShell title="Advertiser companies" eyebrow="Tenant setup" adminName={actor.full_name || actor.email}>
      <Notice message={query.message} error={query.error} />
      <div className="mt-8 grid gap-7 xl:grid-cols-[0.82fr_1.18fr]">
        <form action={createCompany} className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Create company</h2><p className="mt-2 text-sm leading-6 text-slate-500">Start in draft status. Branding assets can be uploaded after the tenant exists.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold">Company name<input className={input} name="name" required maxLength={120} /></label>
            <label className="text-sm font-bold">Identifier<input className={input} name="identifier" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="noah-real-estate" /></label>
            <label className="text-sm font-bold">Sector<input className={input} name="sector" required placeholder="Real estate" /></label>
            <label className="text-sm font-bold">Brand color<input className={`${input} h-11 p-1`} name="brandColor" type="color" defaultValue="#8d2114" required /></label>
            <label className="text-sm font-bold">Public email<input className={input} name="contactEmail" type="email" /></label>
            <label className="text-sm font-bold">Public phone<input className={input} name="contactPhone" type="tel" placeholder="0911 234 567" /></label>
          </div>
          <label className="mt-4 block text-sm font-bold">Description<textarea className={`${input} min-h-24 py-3`} name="description" maxLength={500} /></label>
          <button className="mt-5 min-h-11 w-full rounded-xl bg-slate-950 px-4 font-black text-white hover:bg-red-900">Create draft company</button>
        </form>
        <section><h2 className="text-xl font-black">Company directory</h2><div className="mt-4 space-y-3">
          {!companies?.length ? <EmptyState>No companies created yet.</EmptyState> : companies.map((company) => <article key={company.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="flex items-start gap-3"><span className="mt-1 size-4 rounded-full border border-black/10" style={{ backgroundColor: company.brand_color || "#cbd5e1" }} /><div><h3 className="font-black">{company.name}</h3><p className="mt-1 text-sm text-slate-500">{company.identifier} · {company.sector || "Sector pending"}</p><p className="mt-2 text-xs font-bold uppercase tracking-wider text-red-800">{company.status}</p></div></div><form action={updateCompanyStatus} className="flex gap-2"><input type="hidden" name="id" value={company.id} /><select name="status" defaultValue={company.status} className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-bold"><option value="draft">Draft</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="archived">Archived</option></select><button className="rounded-lg bg-slate-100 px-3 text-sm font-bold hover:bg-slate-200">Update</button></form></div><form action={updateCompanyLogo} encType="multipart/form-data" className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-end"><input type="hidden" name="id" value={company.id} /><label className="min-w-0 flex-1 text-sm font-bold">Company logo <span className="font-normal text-slate-500">(PNG, JPEG, or WebP · max 2 MB)</span><input className={`${input} py-2 text-sm`} name="logo" type="file" accept="image/png,image/jpeg,image/webp" required /></label><button className="min-h-11 shrink-0 rounded-xl bg-slate-950 px-4 text-sm font-black text-white hover:bg-red-900">Upload logo</button></form></article>)}
        </div></section>
      </div>
    </AdminShell>
  );
}
