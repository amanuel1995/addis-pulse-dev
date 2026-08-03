import Image from "next/image";
import QRCode from "qrcode";
import { AdminShell, Notice } from "@/components/admin/AdminShell";
import { requirePlatformAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateQrStatus } from "../control-actions";
export const dynamic = "force-dynamic";
export default async function QrPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const [actor, query] = await Promise.all([requirePlatformAdmin(), searchParams]); const db = createAdminClient();
  const [{ data: codes }, { data: settings }] = await Promise.all([db.from("qr_codes").select("id,qr_type,public_path,status,error_correction,created_at,companies(name),drivers(full_name,vehicle_plate)").order("created_at", { ascending: false }), db.from("app_settings").select("public_base_url").eq("id", 1).single()]);
  if (!settings) throw new Error("Platform public URL is not configured.");
  const rows = await Promise.all((codes || []).map(async (code) => { const url = `${settings.public_base_url.replace(/\/$/, "")}/${code.public_path}`; return { ...code, url, image: await QRCode.toDataURL(url, { errorCorrectionLevel: code.error_correction as "L"|"M"|"Q"|"H", width: 240, margin: 2 }) }; }));
  return <AdminShell title="QR-code registry" eyebrow="Permanent campaign routing" adminName={actor.full_name}><Notice {...query}/><div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{rows.map((row) => <article key={row.id} className="rounded-2xl bg-white p-5"><Image src={row.image} width={192} height={192} unoptimized alt={`QR for ${row.public_path}`} className="mx-auto size-48"/><h2 className="mt-3 font-black">{row.drivers?.full_name || row.companies?.name}</h2><p className="mt-1 break-all text-xs text-slate-500">{row.url}</p><div className="mt-4 flex flex-wrap gap-2"><a href={row.image} download={`${row.public_path.replaceAll("/", "-")}.png`} className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold text-white">Download PNG</a><form action={updateQrStatus} className="flex gap-2"><input type="hidden" name="id" value={row.id}/><select name="status" defaultValue={row.status} className="rounded-lg border px-2 text-xs"><option>active</option><option>inactive</option><option>retired</option></select><button className="rounded-lg border px-3 text-xs font-bold">Save</button></form></div></article>)}</div></AdminShell>;
}
