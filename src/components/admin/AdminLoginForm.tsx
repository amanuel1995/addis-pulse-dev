"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: String(form.get("email") || "").trim(),
      password: String(form.get("password") || ""),
    });
    if (signInError) {
      setError("Sign-in failed. Check the admin credentials and try again.");
      setPending(false);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-7 space-y-5">
      <label className="block text-sm font-bold text-slate-700">
        Admin email
        <input name="email" type="email" autoComplete="email" required className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 outline-none focus:border-red-800 focus:ring-2 focus:ring-red-800/10" />
      </label>
      <label className="block text-sm font-bold text-slate-700">
        Password
        <input name="password" type="password" autoComplete="current-password" required className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 outline-none focus:border-red-800 focus:ring-2 focus:ring-red-800/10" />
      </label>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}
      <button disabled={pending} className="min-h-12 w-full rounded-xl bg-slate-950 px-4 font-black text-white transition hover:bg-red-900 disabled:opacity-60">
        {pending ? "Signing in..." : "Sign in to operations"}
      </button>
    </form>
  );
}
