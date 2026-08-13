import { Check, LockKeyhole, RotateCw } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { BrandMark } from "@/components/passenger/PassengerShell";
import { requirePlatformAdmin } from "@/lib/admin/auth";

export default async function PassengerPreviewPage() {
  const actor = await requirePlatformAdmin();
  return <AdminShell title="Passenger flow preview" eyebrow="Interface review · no SMS or lead changes" adminName={actor.full_name || actor.email}>
    <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">Preview only: these controls do not send an SMS, verify a lead, or issue a reward.</div>
    <div className="mt-7 grid gap-7 xl:grid-cols-2">
      <PreviewFrame label="OTP verification">
        <div className="flex items-center gap-3 border-b border-[#ead8d3] pb-5"><BrandMark name="School Bridge" /><div><p className="font-extrabold">School Bridge</p><p className="text-sm text-[#746763]">Secure phone verification</p></div></div>
        <div className="pt-6 text-center"><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#f8e5e0] text-[#771c0f]"><LockKeyhole className="size-7" /></div><h2 className="mt-4 text-3xl font-black tracking-tight">Verify your phone</h2><p className="mt-3 leading-7 text-[#746763]">Enter the code sent to <strong className="text-[#26130f]">+251 ••• ••23</strong>.</p></div>
        <div className="mt-7"><label className="block text-sm font-bold">Six-digit verification code<input value="123456" readOnly className="mt-2 min-h-16 w-full rounded-2xl border border-[#ead8d3] bg-[#fffdfc] px-4 text-center text-3xl font-extrabold tracking-[.32em]" /></label><p className="mt-3 text-sm text-[#746763]">Code expires in 4:32.</p><button type="button" className="mt-5 min-h-13 w-full rounded-2xl bg-[#771c0f] px-5 py-3 font-bold text-white">Verify phone</button><button type="button" className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 text-sm font-bold text-[#771c0f]"><RotateCw className="size-4" />Resend verification code</button></div>
      </PreviewFrame>
      <PreviewFrame label="Verified thank-you">
        <div className="text-center"><div className="flex justify-center"><BrandMark name="School Bridge" /></div><div className="mx-auto mt-6 grid size-16 place-items-center rounded-full bg-green-100 text-green-800"><Check className="size-8" strokeWidth={3} /></div><p className="mt-5 text-sm font-bold uppercase tracking-[.1em] text-[#771c0f]">Phone verified</p><h2 className="mt-2 text-3xl font-black tracking-tight">Thank you</h2><p className="mx-auto mt-3 max-w-md leading-7 text-[#746763]">Your request was received. School Bridge may contact you with the next steps for this campaign.</p><div className="mt-6 rounded-2xl bg-[#f8e5e0] p-5 text-left"><p className="text-sm font-bold uppercase tracking-[.08em] text-[#771c0f]">Reward information</p><p className="mt-2 font-semibold">Your campaign reward or next-step message appears here.</p><p className="mt-2 text-sm text-[#746763]">Eligibility remains subject to the campaign terms.</p></div><button type="button" className="mt-7 min-h-12 w-full rounded-2xl bg-[#771c0f] px-4 py-3 font-bold text-white">Return to campaign details</button></div>
      </PreviewFrame>
    </div>
  </AdminShell>;
}

function PreviewFrame({label,children}:{label:string;children:React.ReactNode}){return <section><p className="mb-3 text-sm font-black uppercase tracking-wider text-slate-500">{label}</p><div className="rounded-[32px] bg-[#fbf7f5] p-4 shadow-inner sm:p-7"><div className="mx-auto max-w-lg rounded-[28px] border border-[#ead8d3] bg-white p-6 shadow-[0_24px_70px_rgba(82,36,24,.1)] sm:p-8">{children}</div></div></section>}
