"use client";

import { FormEvent, useRef, useState } from "react";
import { ArrowRight, LoaderCircle, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { ETHIOPIAN_PHONE_INPUT_PATTERN } from "@/lib/passenger-flow/phone";
import {
  isValidPassengerPhoneInput,
  leadErrorMessage,
  type PassengerLeadFieldErrors,
  validatePassengerLeadFields,
} from "@/lib/passenger-flow/ui";

export function LeadForm({
  qrToken,
  callToAction,
  privacyNotice,
  privacyNoticeVersion,
  services,
  companyName,
}: {
  qrToken: string;
  callToAction: string;
  privacyNotice?: string;
  privacyNoticeVersion: string;
  services: string[];
  companyName: string;
}) {
  const router = useRouter();
  const idempotencyKey = useRef<string | null>(null);
  const [values, setValues] = useState({ fullName: "", phone: "", email: "", interestedService: "" });
  const [consent, setConsent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<PassengerLeadFieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function update(name: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    if (name in fieldErrors) {
      setFieldErrors((current) => ({ ...current, [name]: undefined }));
    }
  }

  function validatePhone() {
    const valid = isValidPassengerPhoneInput(values.phone);
    setFieldErrors((current) => ({
      ...current,
      phone: valid ? undefined : "Use an Ethiopian mobile number beginning with 09 or 07.",
    }));
    return valid;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextFieldErrors = validatePassengerLeadFields({ ...values, consent });
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) return;
    setPending(true);
    setError(null);

    try {
      // Generate browser-only entropy in response to user interaction. Calling
      // crypto.randomUUID() during render can fail during Server Component
      // prerendering and also produces a different value during hydration.
      idempotencyKey.current ??= crypto.randomUUID();
      const response = await fetch("/api/v1/leads", {
        method: "POST",
        headers: { "content-type": "application/json", "x-device-fingerprint": getDeviceFingerprint() },
        body: JSON.stringify({
          qrToken,
          idempotencyKey: idempotencyKey.current,
          fullName: values.fullName,
          phone: values.phone,
          email: values.email,
          interestedService: values.interestedService,
          consentGiven: consent,
          privacyNoticeVersion,
        }),
      });
      const result = (await response.json()) as { error?: string; nextRoute?: string };
      if (response.ok && result.nextRoute) {
        router.push(result.nextRoute);
        return;
      }
      setError(leadErrorMessage(result.error));
    } catch {
      setError("We could not submit your request. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  const inputClass = "mt-2 min-h-12 w-full rounded-xl border border-[var(--passenger-line)] bg-[#fffdfc] px-4 text-base text-[var(--passenger-ink)] outline-none transition focus:border-[var(--passenger-primary)] focus:ring-3 focus:ring-[rgba(119,28,15,0.14)] aria-invalid:border-red-600";

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <label className="block text-sm font-bold">Full name <span aria-hidden="true" className="text-[var(--passenger-primary)]">*</span><input name="fullName" value={values.fullName} onChange={(event) => update("fullName", event.target.value)} autoComplete="name" placeholder="Enter your full name" minLength={2} required aria-invalid={Boolean(fieldErrors.fullName)} aria-describedby={fieldErrors.fullName ? "full-name-error" : undefined} className={inputClass} />{fieldErrors.fullName && <span id="full-name-error" role="alert" className="mt-2 block text-sm font-semibold text-red-700">{fieldErrors.fullName}</span>}</label>
      <label className="block text-sm font-bold">Phone number <span aria-hidden="true" className="text-[var(--passenger-primary)]">*</span><input name="phone" value={values.phone} onChange={(event) => update("phone", event.target.value)} onBlur={validatePhone} type="tel" inputMode="tel" autoComplete="tel" placeholder="09... / 07..." pattern={ETHIOPIAN_PHONE_INPUT_PATTERN} title="Use an Ethiopian mobile number such as 0911 234 567 or +251911234567" required aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={fieldErrors.phone ? "phone-help phone-error" : "phone-help"} className={inputClass} /><span id="phone-help" className="mt-2 block text-sm font-normal text-[var(--passenger-muted)]">Ethiopian mobile format, for example 0911 234 567.</span>{fieldErrors.phone && <span id="phone-error" role="alert" className="mt-2 block text-sm font-semibold text-red-700">{fieldErrors.phone}</span>}</label>
      <label className="block text-sm font-bold">Email <span className="font-normal text-[var(--passenger-muted)]">(optional)</span><input name="email" value={values.email} onChange={(event) => update("email", event.target.value)} type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "email-error" : undefined} className={inputClass} />{fieldErrors.email && <span id="email-error" role="alert" className="mt-2 block text-sm font-semibold text-red-700">{fieldErrors.email}</span>}</label>
      {services.length > 0 ? <label className="block text-sm font-bold">Interested service <span className="font-normal text-[var(--passenger-muted)]">(optional)</span><select name="interestedService" value={values.interestedService} onChange={(event) => update("interestedService", event.target.value)} className={inputClass}><option value="">Choose a service</option>{services.map((service) => <option key={service} value={service}>{service}</option>)}</select></label> : <label className="block text-sm font-bold">What interests you? <span className="font-normal text-[var(--passenger-muted)]">(optional)</span><input name="interestedService" value={values.interestedService} onChange={(event) => update("interestedService", event.target.value)} placeholder="Tell us briefly" className={inputClass} /></label>}
      <div><label className="flex cursor-pointer items-start gap-3 rounded-xl bg-[var(--passenger-primary-soft)] p-4 text-sm leading-6 text-[var(--passenger-muted)]"><input name="consent" type="checkbox" checked={consent} onChange={(event) => { setConsent(event.target.checked); setFieldErrors((current) => ({ ...current, consent: undefined })); }} required aria-invalid={Boolean(fieldErrors.consent)} aria-describedby={fieldErrors.consent ? "consent-error" : undefined} className="mt-1 size-5 shrink-0 accent-[var(--passenger-primary)]" /><span>{privacyNotice || `I agree that ${companyName} may contact me about this campaign.`}</span></label>{fieldErrors.consent && <p id="consent-error" role="alert" className="mt-2 text-sm font-semibold text-red-700">{fieldErrors.consent}</p>}</div>
      <div aria-live="polite" aria-atomic="true">{error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}</div>
      <button type="submit" disabled={pending} aria-disabled={pending} className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--passenger-primary)] px-5 py-3 font-bold text-white shadow-[0_12px_26px_rgba(119,28,15,0.2)] transition-colors hover:bg-[var(--passenger-primary-dark)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--passenger-primary)] disabled:cursor-not-allowed disabled:opacity-60">
        {pending ? <><LoaderCircle aria-hidden="true" className="size-5 animate-spin motion-reduce:animate-none" />Sending verification code…</> : <>{callToAction}<ArrowRight aria-hidden="true" className="size-5" /></>}
      </button>
      <p className="flex items-center justify-center gap-2 text-sm text-[var(--passenger-muted)]"><LockKeyhole aria-hidden="true" className="size-4" />Your information is sent securely.</p>
    </form>
  );
}

function getDeviceFingerprint() {
  const raw = `${navigator.userAgent}|${navigator.language}|${screen.width}x${screen.height}`;
  let hash = 0;
  for (let index = 0; index < raw.length; index += 1) hash = (hash * 31 + raw.charCodeAt(index)) | 0;
  return `browser-${Math.abs(hash)}`;
}
