"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function OtpForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const code = new FormData(event.currentTarget).get("code");

    try {
      const response = await fetch("/api/v1/otp/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const result = (await response.json()) as {
        verified?: boolean;
        error?: string;
        nextRoute?: string;
      };
      if (response.ok && result.verified && result.nextRoute) {
        router.replace(result.nextRoute);
        return;
      }
      setError(otpError(result.error));
    } catch {
      setError("We could not connect. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  async function resend() {
    if (resending) return;
    setResending(true);
    setNotice(null);
    setError(null);

    try {
      const response = await fetch("/api/v1/otp/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      const result = (await response.json()) as { error?: string };
      if (response.ok) setNotice("A new code was sent.");
      else {
        setError(
          result.error === "resend_cooldown"
            ? "Please wait before requesting another code."
            : "Could not resend the code.",
        );
      }
    } catch {
      setError("We could not connect. Check your connection and try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={verify} className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Verification code / የማረጋገጫ ኮድ
          <input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-2xl tracking-[0.4em]"
          />
        </label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {notice && <p className="text-sm text-green-700">{notice}</p>}
        <button
          disabled={pending || resending}
          className="w-full rounded-lg bg-gray-900 px-4 py-3 font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Verifying…" : "Verify / ያረጋግጡ"}
        </button>
      </form>
      <button
        type="button"
        onClick={resend}
        disabled={pending || resending}
        className="w-full text-sm font-medium text-gray-600 underline disabled:opacity-60"
      >
        {resending ? "Requesting…" : "Resend code / ኮድ እንደገና ይላኩ"}
      </button>
    </div>
  );
}

function otpError(code?: string) {
  if (code === "otp_expired") return "This code expired. Request a new one.";
  if (code === "attempts_exhausted") return "Too many incorrect attempts. Request a new code.";
  if (code === "incorrect_otp") return "The code is incorrect.";
  if (code === "invalid_or_expired_flow") {
    return "This verification session expired. Scan the QR code again.";
  }
  return "Verification failed. Please try again.";
}
