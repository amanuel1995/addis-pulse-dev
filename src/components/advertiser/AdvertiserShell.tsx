import Link from "next/link";
import type { ReactNode } from "react";
import { BarChart3, Bell, Building2, LayoutDashboard, ListChecks, MessageSquare, Truck, Users } from "lucide-react";
import { signOutAdvertiser } from "@/app/advertiser/actions";

const nav = [
  ["Dashboard", "/advertiser/dashboard", LayoutDashboard],
  ["Lead pipeline", "/advertiser/leads", ListChecks],
  ["Campaign value", "/advertiser/campaigns", BarChart3],
  ["Operations", "/advertiser/operations", Truck],
  ["Notifications", "/advertiser/settings/notifications", Bell],
  ["Engagement", "/advertiser/engagement", MessageSquare],
  ["Company", "/advertiser/settings/profile", Building2],
  ["Team", "/advertiser/settings/team", Users],
] as const;

export function AdvertiserShell({ title, companies, children }: { title: string; companies: string[]; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div><Link href="/advertiser/dashboard" className="text-xl font-black tracking-tight">RidePerk Client Portal</Link><p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-red-800">{companies.join(" · ") || "Advertiser access"}</p></div>
          <nav aria-label="Advertiser navigation" className="flex flex-wrap gap-2">{nav.map(([label, href, Icon]) => <Link key={href} href={href} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 px-4 text-sm font-bold hover:border-slate-950 hover:bg-slate-950 hover:text-white"><Icon className="size-4" aria-hidden="true" />{label}</Link>)}</nav>
          <form action={signOutAdvertiser}><button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-black hover:bg-slate-950 hover:text-white">Sign out</button></form>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-5 py-8"><h1 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>{children}</div>
    </main>
  );
}
