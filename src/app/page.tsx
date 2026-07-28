import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  CheckCircle2,
  MapPin,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

const services = [
  {
    icon: QrCode,
    title: "Campaign QR journeys",
    description: "Turn a vehicle scan into a branded, mobile-first campaign experience in seconds.",
  },
  {
    icon: Smartphone,
    title: "Verified passenger leads",
    description: "Capture consented interest and confirm Ethiopian phone numbers with secure OTP verification.",
  },
  {
    icon: Zap,
    title: "Realtime lead visibility",
    description: "Give authorized advertiser teams a live, company-scoped view of new and verified leads.",
  },
  {
    icon: BarChart3,
    title: "Campaign intelligence",
    description: "Build measurable mobility campaigns with attribution, conversion signals, and reporting-ready data.",
  },
];

const journey = [
  ["01", "Scan", "A passenger scans the permanent QR inside a participating vehicle."],
  ["02", "Discover", "The active advertiser campaign opens with localized content and a clear offer."],
  ["03", "Verify", "The passenger shares consented details and confirms their phone with OTP."],
  ["04", "Connect", "The verified lead appears for the authorized advertiser team in realtime."],
] as const;

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fbf8f6] text-[#21110e]">
      <header className="relative z-20 border-b border-[#eadbd7] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 sm:px-8">
          <Link href="/" aria-label="AddisPulse Media home" className="shrink-0">
            <Image src="/logo%20(2).png" alt="AddisPulse Media" width={260} height={100} priority className="h-12 w-auto object-contain sm:h-14" />
          </Link>
          <nav aria-label="Primary navigation" className="hidden items-center gap-7 text-sm font-bold text-[#5f514d] md:flex">
            <a href="#services" className="transition-colors hover:text-[#9f1f11]">Services</a>
            <a href="#how-it-works" className="transition-colors hover:text-[#9f1f11]">How it works</a>
            <a href="#why-addispulse" className="transition-colors hover:text-[#9f1f11]">Why AddisPulse</a>
          </nav>
          <Link href="/advertiser/login" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#8e1c10] px-5 py-2.5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(142,28,16,0.2)] transition hover:bg-[#641108] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8e1c10]">
            Advertiser login <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <section className="relative isolate">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_82%_20%,rgba(176,37,20,0.16),transparent_28%),radial-gradient(circle_at_10%_70%,rgba(11,31,51,0.10),transparent_30%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:py-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#e4c5be] bg-white px-4 py-2 text-sm font-extrabold text-[#8e1c10] shadow-sm">
              <MapPin className="size-4" aria-hidden="true" /> Built for movement in Addis Ababa
            </div>
            <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
              Every ride can start a <span className="text-[#a92314]">valuable connection.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#665854] sm:text-xl">
              AddisPulse turns mobility advertising into measurable action—connecting passengers, advertisers, and campaign teams through secure QR journeys and verified leads.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href="#how-it-works" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-[#8e1c10] px-6 py-3.5 font-extrabold text-white shadow-[0_16px_32px_rgba(142,28,16,0.22)] transition hover:-translate-y-0.5 hover:bg-[#641108]">
                Explore the platform <ArrowRight className="size-5" aria-hidden="true" />
              </a>
              <Link href="/advertiser/login" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl border border-[#dfcbc6] bg-white px-6 py-3.5 font-extrabold text-[#5d1710] transition hover:border-[#a92314] hover:bg-[#fff9f7]">
                <Building2 className="size-5" aria-hidden="true" /> Open advertiser portal
              </Link>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-[#665854]">
              {['Consent-first', 'OTP verified', 'Company-scoped'].map((item) => <span key={item} className="flex items-center gap-2"><CheckCircle2 className="size-4 text-[#a92314]" aria-hidden="true" />{item}</span>)}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[430px]">
            <div aria-hidden="true" className="absolute -inset-8 -z-10 rounded-full bg-[#a92314]/15 blur-3xl" />
            <div className="rounded-[42px] bg-[#171717] p-3.5 shadow-[0_34px_90px_rgba(38,18,12,0.28)]">
              <div className="overflow-hidden rounded-[31px] border border-white/15 bg-white">
                <div className="bg-[linear-gradient(135deg,#8e1c10_0%,#4d1109_100%)] px-5 pb-6 pt-4 text-white">
                  <div className="flex items-center justify-between text-[11px] font-bold text-white/75"><span>9:41</span><span>5G · 100%</span></div>
                  <div className="mt-5 flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-white font-black text-[#8e1c10]">AP</span><div><p className="font-extrabold">AddisPulse Media</p><p className="text-xs text-white/70">Smart ads. Real leads.</p></div></div>
                  <h2 className="mt-6 text-3xl font-black leading-[1.02] tracking-[-0.035em]">Move attention into action.</h2>
                  <p className="mt-3 text-sm leading-6 text-white/75">Scan, discover the offer, and connect in less than one minute.</p>
                  <div className="mt-5 flex gap-2"><span className="rounded-xl bg-white px-4 py-2.5 text-xs font-black text-[#8e1c10]">Get the offer</span><span className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-xs font-black">Learn more</span></div>
                </div>
                <div className="space-y-4 p-4">
                  <div className="grid aspect-video place-items-center rounded-[20px] bg-[radial-gradient(circle_at_30%_20%,#b86a5d_0%,#771c0f_35%,#0b1f33_100%)] text-center text-white"><div><span className="mx-auto grid size-12 place-items-center rounded-full bg-white text-[#8e1c10]">▶</span><p className="mt-3 text-sm font-black">Campaign story</p></div></div>
                  <div><p className="font-black text-[#771c0f]">Connected services</p><div className="mt-2 grid grid-cols-2 gap-2">{['QR campaigns', 'Lead capture', 'Passenger rewards', 'Live reporting'].map((item) => <div key={item} className="rounded-xl border border-[#eadbd7] bg-[#fffdfc] p-3 text-xs font-extrabold">{item}</div>)}</div></div>
                  <div className="rounded-[20px] border border-[#eadbd7] bg-white p-4 shadow-[0_14px_35px_rgba(119,28,15,0.08)]"><div className="flex items-center justify-between"><div><p className="text-xs font-bold text-[#6b5f5c]">Verified campaign activity</p><p className="mt-1 text-xl font-black text-[#771c0f]">Realtime</p></div><ShieldCheck className="size-7 text-[#771c0f]" aria-hidden="true" /></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f7edeb]"><div className="h-full w-3/4 rounded-full bg-[#771c0f]" /></div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-3xl"><p className="text-sm font-black uppercase tracking-[0.18em] text-[#a92314]">Connected services</p><h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">One passenger journey. A complete campaign signal.</h2></div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {services.map(({ icon: Icon, title, description }) => <article key={title} className="group rounded-[26px] border border-[#eadbd7] bg-[#fffdfc] p-6 transition hover:-translate-y-1 hover:border-[#c99389] hover:shadow-[0_18px_45px_rgba(82,36,24,0.10)]"><span className="grid size-12 place-items-center rounded-2xl bg-[#f7edeb] text-[#8e1c10] transition group-hover:bg-[#8e1c10] group-hover:text-white"><Icon className="size-6" aria-hidden="true" /></span><h3 className="mt-6 text-xl font-black">{title}</h3><p className="mt-3 leading-7 text-[#6b5f5c]">{description}</p></article>)}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-[#0b1f33] py-20 text-white sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div className="max-w-3xl"><p className="text-sm font-black uppercase tracking-[0.18em] text-[#f09a89]">How it works</p><h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">From street-level attention to verified action.</h2></div><p className="max-w-md text-lg leading-8 text-white/65">A focused path designed for quick passenger participation and useful advertiser outcomes.</p></div>
          <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{journey.map(([number, title, description]) => <article key={number} className="rounded-[24px] border border-white/10 bg-white/[0.06] p-6"><p className="text-sm font-black text-[#f09a89]">{number}</p><h3 className="mt-8 text-2xl font-black">{title}</h3><p className="mt-3 leading-7 text-white/65">{description}</p></article>)}</div>
        </div>
      </section>

      <section id="why-addispulse" className="py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div><p className="text-sm font-black uppercase tracking-[0.18em] text-[#a92314]">Why AddisPulse</p><h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">Local context. Secure infrastructure. Clear value.</h2><p className="mt-6 text-lg leading-8 text-[#6b5f5c]">Built around how people move and communicate in Addis Ababa, with bilingual-ready experiences and privacy-conscious lead verification.</p></div>
          <div className="grid gap-4 sm:grid-cols-2">{[[Users, 'Passenger-first', 'Fast, focused mobile experiences that respect attention and consent.'], [ShieldCheck, 'Secure by design', 'Hashed identifiers, protected data access, and verified phone ownership.'], [Building2, 'Advertiser value', 'Company-scoped visibility from engagement through verification.'], [Sparkles, 'Campaign flexibility', 'Localized content, rewards, media, and offers delivered through one QR.']].map(([Icon, title, description]) => { const ItemIcon = Icon as typeof Users; return <article key={title as string} className="rounded-[24px] bg-white p-6 shadow-[0_16px_45px_rgba(82,36,24,0.08)]"><ItemIcon className="size-6 text-[#a92314]" aria-hidden="true" /><h3 className="mt-5 text-lg font-black">{title as string}</h3><p className="mt-2 leading-7 text-[#6b5f5c]">{description as string}</p></article>; })}</div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 sm:pb-24"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 rounded-[32px] bg-[#8e1c10] p-8 text-white shadow-[0_25px_70px_rgba(142,28,16,0.24)] sm:p-12 lg:flex-row lg:items-center"><div><p className="font-black uppercase tracking-[0.16em] text-white/65">Ready to connect?</p><h2 className="mt-3 max-w-2xl text-3xl font-black tracking-[-0.03em] sm:text-4xl">See your verified campaign activity in one secure place.</h2></div><Link href="/advertiser/login" className="inline-flex min-h-13 shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 font-black text-[#721309] transition hover:bg-[#fff3ef]">Advertiser portal <ArrowRight className="size-5" aria-hidden="true" /></Link></div></section>

      <footer className="border-t border-[#eadbd7] bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-sm text-[#6b5f5c] sm:flex-row sm:items-center sm:justify-between sm:px-8"><div className="flex items-center gap-2 font-bold text-[#3b2925]"><BadgeCheck className="size-5 text-[#a92314]" aria-hidden="true" /> AddisPulse Media</div><p>QR-powered mobility campaigns for Addis Ababa.</p></div></footer>
    </main>
  );
}
