import Link from "next/link";
import type { ReactNode } from "react";
import { Bell, Building2, CalendarRange, CarFront, CircleDollarSign, FileSliders, Gauge, Gift, Link2, ScanLine, ShieldCheck, Smartphone, Truck, Video } from "lucide-react";
import { signOutAdmin } from "@/app/admin/actions";

const navigation = [
  ["Overview", "/admin", Gauge],
  ["Companies", "/admin/companies", Building2],
  ["Campaigns", "/admin/campaigns", CalendarRange],
  ["Drivers", "/admin/drivers", CarFront],
  ["Assignments", "/admin/assignments", Link2],
  ["Review", "/admin/review", ShieldCheck],
  ["Field ops", "/admin/field-ops", Truck],
  ["Delivery", "/admin/notifications", Bell],
  ["Billing", "/admin/billing", CircleDollarSign],
  ["Content", "/admin/content", FileSliders],
  ["Media", "/admin/media", Video],
  ["Flow preview", "/admin/passenger-preview", Smartphone],
  ["QR", "/admin/qr-codes", ScanLine],
  ["Rewards", "/admin/rewards", Gift],
  ["System", "/admin/system", Gauge],
] as const;

export function AdminShell({ title, eyebrow, adminName, children }: { title: string; eyebrow: string; adminName: string | null; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div><Link href="/admin" className="text-xl font-black tracking-tight">AddisPulse Operations</Link><p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-red-300">Campaign control center</p></div>
          <nav aria-label="Admin navigation" className="flex flex-wrap gap-2">
            {navigation.map(([label, href, Icon]) => <Link key={href} href={href} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-sm font-bold transition hover:bg-white hover:text-slate-950"><Icon className="size-4" aria-hidden="true" />{label}</Link>)}
          </nav>
          <div className="flex items-center gap-3 text-sm text-white/60"><div><span className="font-bold text-white">{adminName}</span><br />Platform admin</div><form action={signOutAdmin}><button className="rounded-full border border-white/15 px-3 py-2 text-xs font-black text-white hover:bg-white hover:text-slate-950">Sign out</button></form></div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-5 py-9">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-red-800">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
        {children}
      </div>
    </main>
  );
}

export function Notice({ message, error }: { message?: string; error?: string }) {
  if (!message && !error) return null;
  return <p className={`mt-6 rounded-xl border p-4 text-sm font-bold ${error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{error || message}</p>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">{children}</div>;
}
