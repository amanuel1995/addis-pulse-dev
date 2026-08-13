"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";

type Contact = { phone: string; email: string | null };

export function SecureContact({ leadId, maskedPhone }: { leadId: string; maskedPhone: string }) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  async function reveal() {
    if (contact) {
      setContact(null);
      return;
    }
    setPending(true);
    setError(false);
    try {
      const response = await fetch(`/api/v1/advertiser/leads/${encodeURIComponent(leadId)}/contact`, { cache: "no-store" });
      if (!response.ok) throw new Error("Contact unavailable");
      setContact(await response.json() as Contact);
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <p className="font-mono text-sm font-bold">{contact?.phone || maskedPhone}</p>
      {contact?.email && <a href={`mailto:${contact.email}`} className="mt-1 block max-w-48 truncate text-xs font-semibold text-red-800 hover:underline">{contact.email}</a>}
      <button type="button" onClick={reveal} disabled={pending} className="mt-2 inline-flex items-center gap-1 text-xs font-black text-slate-500 hover:text-red-800 disabled:opacity-50">
        {pending ? <LoaderCircle className="size-3 animate-spin" /> : contact ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
        {pending ? "Loading" : contact ? "Hide contact" : "Reveal contact"}
      </button>
      {error && <p className="mt-1 text-xs font-semibold text-red-700">Contact unavailable</p>}
      <Link href={`/advertiser/leads/${leadId}`} className="mt-2 block text-xs font-black text-red-800 hover:underline">View details & activity</Link>
    </div>
  );
}
