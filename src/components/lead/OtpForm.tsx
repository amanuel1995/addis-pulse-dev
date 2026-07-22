"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, LoaderCircle, RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatOtpCountdown, otpErrorMessage, otpSecondsRemaining } from "@/lib/passenger-flow/ui";

export function OtpForm({ expiresAt }: { expiresAt?: string | null }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(() => otpSecondsRemaining(expiresAt));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsRemaining(otpSecondsRemaining(expiresAt));
      setCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the complete six-digit code.");
      return;
    }
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/otp/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }) });
      const result = (await response.json()) as { verified?: boolean; error?: string; nextRoute?: string };
      if (response.ok && result.verified && result.nextRoute) {
        router.replace(result.nextRoute);
        return;
      }
      setError(otpErrorMessage(result.error));
    } catch {
      setError("We could not verify the code. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  async function resend() {
    if (resending || cooldown > 0) return;
    setResending(true);
    setNotice(null);
    setError(null);
    try {
      const response = await fetch("/api/v1/otp/send", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
      const result = (await response.json()) as { error?: string };
      if (response.ok) {
        setNotice("A new verification code was sent.");
        setCooldown(60);
        setCode("");
      } else {
        setError(result.error === "resend_cooldown" ? "Please wait before requesting another code." : "We could not resend the code. Please try again.");
      }
    } catch {
      setError("We could not resend the code. Check your connection and try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={verify} className="space-y-5">
        <label className="block text-left text-sm font-bold" htmlFor="otp-code">Six-digit verification code</label>
        <input id="otp-code" name="code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required autoFocus aria-describedby="otp-expiry otp-feedback" className="min-h-16 w-full rounded-2xl border border-[var(--passenger-line)] bg-[#fffdfc] px-4 text-center text-3xl font-extrabold tracking-[0.32em] outline-none transition focus:border-[var(--passenger-primary)] focus:ring-3 focus:ring-[rgba(119,28,15,0.14)]" />
        <p id="otp-expiry" className="text-sm text-[var(--passenger-muted)]">{secondsRemaining > 0 ? `Code expires in ${formatOtpCountdown(secondsRemaining)}.` : "This code may have expired. You can request a new one."}</p>
        <div id="otp-feedback" aria-live="polite" aria-atomic="true">{error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}{notice && <p className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-800"><CheckCircle2 aria-hidden="true" className="size-4" />{notice}</p>}</div>
        <button disabled={pending || resending} className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--passenger-primary)] px-5 py-3 font-bold text-white transition-colors hover:bg-[var(--passenger-primary-dark)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--passenger-primary)] disabled:cursor-not-allowed disabled:opacity-60">{pending ? <><LoaderCircle aria-hidden="true" className="size-5 animate-spin motion-reduce:animate-none" />Verifying…</> : "Verify phone"}</button>
      </form>
      <button type="button" onClick={resend} disabled={pending || resending || cooldown > 0} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-[var(--passenger-primary)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--passenger-primary)] disabled:text-[var(--passenger-muted)]"><RotateCw aria-hidden="true" className={`size-4 ${resending ? "animate-spin motion-reduce:animate-none" : ""}`} />{resending ? "Requesting a new code…" : cooldown > 0 ? `Resend available in ${cooldown}s` : "Resend verification code"}</button>
    </div>
  );
}
