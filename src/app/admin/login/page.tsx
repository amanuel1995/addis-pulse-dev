import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { getPlatformAdmin } from "@/lib/admin/auth";

export default async function AdminLoginPage() {
  if (await getPlatformAdmin()) redirect("/admin");
  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_right,#fee2e2,transparent_35%),#f1f5f9] px-4 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-900/10">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-red-800">RidePerk</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">Operations sign in</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Restricted to authorized RidePerk platform administrators.</p>
        <AdminLoginForm />
        <Link href="/" className="mt-6 block text-center text-sm font-bold text-slate-500 hover:text-red-800">Return to public site</Link>
      </section>
    </main>
  );
}
