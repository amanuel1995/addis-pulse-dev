import { redirect } from "next/navigation";
import { AdvertiserLoginForm } from "@/components/advertiser/AdvertiserLoginForm";
import { createClient } from "@/lib/supabase/server";

export default async function AdvertiserLoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/advertiser/dashboard");

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-12 text-slate-950">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-red-800">AddisPulse Media</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">Advertiser sign in</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Use the company representative account provided by AddisPulse.</p>
        <AdvertiserLoginForm />
      </section>
    </main>
  );
}
