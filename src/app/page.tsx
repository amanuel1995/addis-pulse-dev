import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  CirclePlay,
  MapPin,
  MessageCircleMore,
  QrCode,
  Sparkles,
} from "lucide-react";

const steps = [
  [QrCode, "A passenger scans", "A permanent vehicle QR opens the campaign currently assigned to that driver."],
  [CirclePlay, "The story earns attention", "Video, bilingual content, and a useful reward make the moment worth engaging with."],
  [BadgeCheck, "Real interest is verified", "Consent-first lead capture and Ethiopian phone OTP separate demand from noise."],
  [BellRing, "Sales acts while intent is fresh", "Verified leads reach the advertiser portal and configured notification channels."],
] as const;

const proof = [
  ["01", "Attribution", "Connect every scan, lead, and verification to the right campaign and vehicle."],
  ["02", "Quality", "Protect lead value with OTP verification, fraud signals, and controlled contact access."],
  ["03", "Operations", "Run assignments, compliance, inventory, QR codes, rewards, and billing in one system."],
] as const;

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f4f0e8] text-[#17201b]">
      <header className="sticky top-0 z-40 border-b border-[#17201b]/10 bg-[#f4f0e8]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-5 px-5 py-4 sm:px-8 lg:px-12">
          <Link href="/" aria-label="AddisPulse Media home">
            <Image src="/logo%20(2).png" alt="AddisPulse Media" width={260} height={100} priority className="h-11 w-auto object-contain" />
          </Link>
          <nav aria-label="Primary navigation" className="hidden items-center gap-7 text-sm font-bold md:flex">
            <a href="#how-it-works" className="hover:text-[#8d2114]">How it works</a>
            <a href="#value" className="hover:text-[#8d2114]">Campaign value</a>
            <Link href="/portal" className="hover:text-[#8d2114]">Portal access</Link>
          </nav>
          <Link href="/portal" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#17201b] px-5 py-2.5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#2a342d]">
            Sign in <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <section className="relative isolate">
        <div aria-hidden="true" className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_82%_18%,#e8ded0_0,transparent_26%),radial-gradient(circle_at_14%_78%,#f1c7bc_0,transparent_24%)]" />
        <div className="mx-auto grid min-h-[760px] max-w-[1440px] lg:grid-cols-[1.05fr_.95fr]">
          <div className="flex flex-col justify-center px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
            <div className="home-reveal flex w-fit items-center gap-2 rounded-full border border-[#17201b]/10 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] shadow-sm">
              <MapPin className="size-4 text-[#8d2114]" aria-hidden="true" /> Addis Ababa, in motion
            </div>
            <h1 className="home-reveal home-delay-1 mt-7 max-w-4xl text-[clamp(3.5rem,7.4vw,7.2rem)] font-black leading-[0.84] tracking-[-0.075em]">
              Attention that <span className="relative whitespace-nowrap text-[#8d2114]">moves<span aria-hidden="true" className="home-line absolute -bottom-1 left-0 h-2 w-full origin-left rounded-full bg-[#e0a232]/45" /></span> business.
            </h1>
            <p className="home-reveal home-delay-2 mt-8 max-w-2xl text-lg leading-8 text-[#566058] sm:text-xl">
              AddisPulse turns everyday rides into measurable brand experiences—connecting passenger attention to verified customer demand.
            </p>
            <div className="home-reveal home-delay-3 mt-9 flex flex-col gap-3 sm:flex-row">
              <a href="#campaign-inquiry" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-[#8d2114] px-7 py-3.5 font-extrabold text-white shadow-[0_18px_45px_rgba(141,33,20,.2)] transition hover:-translate-y-0.5 hover:bg-[#68170d]">
                Launch a campaign <ArrowRight className="size-5" aria-hidden="true" />
              </a>
              <Link href="/portal" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full border border-[#17201b]/15 bg-white/70 px-7 py-3.5 font-extrabold transition hover:border-[#17201b] hover:bg-white">
                Open your portal
              </Link>
            </div>
          </div>

          <div className="home-reveal home-delay-2 relative m-4 min-h-[620px] overflow-hidden rounded-[36px] bg-[#17201b] p-6 text-white shadow-[0_30px_90px_rgba(23,32,27,.22)] sm:m-8 sm:p-10 lg:my-10 lg:ml-0 lg:mr-10 lg:p-12">
            <div aria-hidden="true" className="home-orbit absolute -right-20 -top-20 size-72 rounded-full bg-[#8d2114] blur-[2px]" />
            <div aria-hidden="true" className="home-float absolute -bottom-24 -left-20 size-80 rounded-full bg-[#df785f]" />
            <div className="relative flex h-full min-h-[530px] flex-col justify-between">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/55">Live campaign signal</p>
                <span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-bold"><span className="size-2 rounded-full bg-[#72d59d]" /> Active</span>
              </div>
              <div className="mx-auto w-full max-w-md py-12">
                <div className="rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur-md">
                  <div className="flex items-center justify-between"><span className="grid size-14 place-items-center rounded-2xl bg-white text-[#17201b]"><QrCode className="size-7" /></span><span className="text-xs font-bold text-white/55">SCAN → VERIFY → ACT</span></div>
                  <div className="mt-8 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[72%] rounded-full bg-[#df785f]" /></div>
                  <div className="mt-6 grid grid-cols-3 gap-2 text-center"><Metric value="450" label="Scans" /><Metric value="120" label="Verified" /><Metric value="26.7%" label="Rate" /></div>
                </div>
                <div className="home-float mt-4 ml-auto flex w-[88%] items-center gap-3 rounded-2xl bg-white p-4 text-[#17201b] shadow-2xl">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#f7edeb]"><MessageCircleMore className="size-5 text-[#8d2114]" /></span>
                  <div><p className="text-xs font-bold text-[#6b5f5c]">New verified lead</p><p className="font-black">Ready for client follow-up</p></div>
                </div>
              </div>
              <p className="max-w-sm text-sm leading-6 text-white/55">Physical reach, digital attribution, and a sales-ready outcome in one operating loop.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
            <div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#8d2114]">One connected journey</p><h2 className="mt-5 max-w-3xl text-4xl font-black leading-[0.95] tracking-[-0.055em] sm:text-6xl">From the back seat to the sales team.</h2></div>
            <p className="max-w-md text-lg leading-8 text-[#5f6861]">The passenger experience stays effortless while every important action becomes measurable.</p>
          </div>
          <div className="mt-14 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {steps.map(([Icon, title, description], index) => <article key={title} className="group rounded-[28px] border border-[#17201b]/10 bg-[#f4f0e8] p-7 transition hover:-translate-y-1 hover:border-[#8d2114]"><div className="flex items-center justify-between"><span className="grid size-12 place-items-center rounded-2xl bg-[#17201b] text-white"><Icon className="size-5" /></span><span className="font-mono text-sm font-black text-[#8d2114]">0{index + 1}</span></div><h3 className="mt-9 text-2xl font-black tracking-[-0.03em]">{title}</h3><p className="mt-3 leading-7 text-[#5f6861]">{description}</p></article>)}
          </div>
        </div>
      </section>

      <section id="value" className="bg-[#e8ded0] py-20 sm:py-28">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-5 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:px-12">
          <div><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#8d2114]"><Sparkles className="size-4" /> Built for proof</div><h2 className="mt-5 text-4xl font-black leading-[.95] tracking-[-0.055em] sm:text-6xl">Media value you can see and improve.</h2><p className="mt-6 max-w-xl text-lg leading-8 text-[#5f6861]">Advertisers get more than impressions: verified demand, campaign visibility, secure follow-up, and a clear operating record.</p></div>
          <div className="space-y-3">{proof.map(([number, title, description]) => <article key={number} className="grid gap-4 rounded-2xl border border-[#17201b]/10 bg-white/75 p-6 sm:grid-cols-[64px_180px_1fr] sm:items-center"><span className="font-mono text-sm font-black text-[#8d2114]">/{number}</span><h3 className="text-xl font-black">{title}</h3><p className="leading-7 text-[#5f6861]">{description}</p></article>)}</div>
        </div>
      </section>

      <section id="campaign-inquiry" className="bg-[#8d2114] py-20 text-white sm:py-24">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-10 px-5 sm:px-8 lg:flex-row lg:items-center lg:px-12">
          <div><p className="text-xs font-black uppercase tracking-[0.2em]">Campaign planning</p><h2 className="mt-4 max-w-4xl text-4xl font-black leading-[.95] tracking-[-0.055em] sm:text-6xl">Put your brand in motion across Addis Ababa.</h2></div>
          <Link href="/portal" className="inline-flex min-h-14 shrink-0 items-center justify-center gap-2 rounded-full bg-[#17201b] px-8 py-4 font-black text-white transition hover:-translate-y-0.5 hover:bg-[#2a342d]">Continue to portal <ArrowRight className="size-5" /></Link>
        </div>
      </section>

      <footer className="bg-[#17201b] py-10 text-white">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12"><p className="font-black">AddisPulse Media</p><div className="flex flex-wrap gap-5 text-sm text-white/55"><span>Passengers scan in vehicle</span><Link href="/portal" className="hover:text-white">Portal access</Link><span>Consent-first · OTP-verified</span></div></div>
      </footer>
    </main>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return <div className="rounded-xl bg-white/5 p-3"><p className="text-xl font-black">{value}</p><p className="mt-1 text-[11px] font-bold text-white/45">{label}</p></div>;
}
