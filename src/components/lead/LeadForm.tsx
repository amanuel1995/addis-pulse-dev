"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ETHIOPIAN_PHONE_INPUT_PATTERN } from "@/lib/passenger-flow/phone";

export function LeadForm({
  qrToken,
  brandColor,
  callToAction = "Continue",
  privacyNotice,
}: {
  qrToken: string;
  brandColor: string;
  callToAction?: string;
  privacyNotice?: string;
}) {
  const router = useRouter();
  const idempotencyKey = useRef(crypto.randomUUID());
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/v1/leads", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-device-fingerprint": getDeviceFingerprint(),
        },
        body: JSON.stringify({
          qrToken,
          idempotencyKey: idempotencyKey.current,
          fullName: form.get("fullName"),
          phone: form.get("phone"),
          email: form.get("email"),
          interestedService: form.get("interestedService"),
          consentGiven: form.get("consent") === "on",
          privacyNoticeVersion: "2026-07-v1",
        }),
      });
      const result = (await response.json()) as {
        error?: string;
        nextRoute?: string;
      };

      if (response.ok && result.nextRoute) {
        router.push(result.nextRoute);
        return;
      }
      setError(errorMessage(result.error));
    } catch {
      setError("We could not connect. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Full name / ሙሉ ስም" name="fullName" autoComplete="name" required />
      <Field
        label="Phone number / ስልክ ቁጥር"
        name="phone"
        type="tel"
        inputMode="tel"
        placeholder="0911 234 567"
        pattern={ETHIOPIAN_PHONE_INPUT_PATTERN}
        title="Use an Ethiopian mobile number such as 0911 234 567 or +251911234567"
        autoComplete="tel"
        required
      />
      <Field
        label="Email (optional) / ኢሜይል"
        name="email"
        type="email"
        autoComplete="email"
      />
      <Field label="Interest (optional) / ፍላጎት" name="interestedService" />
      <label className="flex items-start gap-3 text-sm text-gray-600">
        <input name="consent" type="checkbox" required className="mt-1 size-4" />
        <span>
          {privacyNotice ||
            "I agree to be contacted about this offer. / ስለዚህ ቅናሽ እንዲገናኙኝ ተስማምቻለሁ።"}
        </span>
      </label>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg px-4 py-3 font-semibold text-white disabled:opacity-60"
        style={{ backgroundColor: brandColor }}
      >
        {pending ? "Sending code…" : `${callToAction} / ይቀጥሉ`}
      </button>
    </form>
  );
}

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
};

function Field({ label, name, ...props }: FieldProps) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      <input
        {...props}
        name={name}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-3 text-base outline-none focus:border-gray-600"
      />
    </label>
  );
}

function getDeviceFingerprint() {
  const raw = `${navigator.userAgent}|${navigator.language}|${screen.width}x${screen.height}`;
  let hash = 0;
  for (let index = 0; index < raw.length; index += 1) {
    hash = (hash * 31 + raw.charCodeAt(index)) | 0;
  }
  return `browser-${Math.abs(hash)}`;
}

function errorMessage(code?: string) {
  if (code === "invalid_phone") return "Enter a valid Ethiopian mobile number.";
  if (code === "otp_delivery_failed") {
    return "Your details were saved, but the verification code could not be sent. Please try again.";
  }
  if (code === "invalid_or_inactive_qr" || code === "campaign_unavailable") {
    return "This campaign is unavailable.";
  }
  return "We could not submit your details. Please try again.";
}
