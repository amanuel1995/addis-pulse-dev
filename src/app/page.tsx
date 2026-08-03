import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BellRing,
  Building2,
  Check,
  CircleCheck,
  MapPin,
  MessageCircleMore,
  QrCode,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const operatingLoop = [
  {
    number: "01",
    title: "Deploy the campaign",
    description:
      "Brand the offer, assign active drivers, and launch through permanent in-vehicle QR placements.",
  },
  {
    number: "02",
    title: "Meet passengers in motion",
    description:
      "A scan opens the right bilingual campaign for that driver, vehicle, and moment.",
  },
  {
    number: "03",
    title: "Verify real demand",
    description:
      "Consent-first capture and Ethiopian phone OTP turn anonymous attention into a qualified lead.",
  },
  {
    number: "04",
    title: "Put sales in the loop",
    description:
      "Verified interest reaches the advertiser dashboard and their chosen notification channel.",
  },
] as const;

const outcomes = [
  [QrCode, "Attributable engagement", "Connect every scan and verified response to its campaign and driver."],
  [BellRing, "Faster follow-up", "Help authorized sales teams act while passenger intent is still fresh."],
  [BarChart3, "Visible campaign value", "Move from impressions to verified leads, conversion signals, and CPL."],
  [ShieldCheck, "Controlled data access", "Keep advertiser records company-scoped, permissioned, and auditable."],
] as const;

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f4f0e8] text-[#17201b]">
      <header className="relative z-30 border-b border-[#17201b]/10 bg-[#f4f0e8]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-5 px-5 py-4 sm:px-8 lg:px-12">
          <Link href="/" aria-label="AddisPulse Media home" className="shrink-0">
            <Image
              src="/logo%20(2).png"
              alt="AddisPulse Media"
              width={260}
              height={100}
              priority
              className="h-11 w-auto object-contain sm:h-13"
            />
          </Link>
          <nav aria-label="Primary navigation" className="hidden items-center gap-8 text-sm font-bold text-[#465048] md:flex">
            <a href="#platform" className="transition-colors hover:text-[#8d2114]">Platform</a>
            <a href="#journey" className="transition-colors hover:text-[#8d2114]">How it works</a>
            <a href="#impact" className="transition-colors hover:text-[#8d2114]">Campaign value</a>
          </nav>
          <Link
            href="/advertiser/login"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#17201b] px-4 py-2.5 text-sm font-extrabold transition hover:bg-[#17201b] hover:text-white sm:px-5"
          >
            Client portal <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <section className="relative isolate border-b border-[#17201b]/10">
        <div aria-hidden="true" className="absolute inset-0 -z-20 bg-[linear-gradient(115deg,#f4f0e8_0%,#f4f0e8_58%,#e8ded0_100%)]" />
        <div aria-hidden="true" className="absolute left-[43%] top-0 -z-10 h-full w-px bg-[#17201b]/10 max-lg:hidden" />
        <div className="mx-auto grid min-h-[760px] max-w-[1400px] lg:grid-cols-[0.86fr_1.14fr]">
          <div className="flex flex-col justify-center px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#8d2114]">
              <MapPin className="size-4" aria-hidden="true" /> Addis Ababa, in motion
            </div>
            <h1 className="mt-7 max-w-3xl text-[clamp(3.4rem,7vw,6.8rem)] font-black leading-[0.84] tracking-[-0.075em]">
              Turn every ride into a real connection.
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-[#566058] sm:text-xl">
              AddisPulse transforms in-vehicle attention into verified customer demand—then delivers it to the businesses ready to act.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#journey"
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-[#8d2114] px-6 py-3.5 font-extrabold text-white shadow-[0_16px_34px_rgba(141,33,20,0.2)] transition hover:-translate-y-0.5 hover:bg-[#68170d]"
              >
                See the campaign loop <ArrowRight className="size-5" aria-hidden="true" />
              </a>
              <Link
                href="/advertiser/login"
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full border border-[#17201b]/20 bg-white/50 px-6 py-3.5 font-extrabold transition hover:border-[#17201b] hover:bg-white"
              >
                <Building2 className="size-5" aria-hidden="true" /> Advertiser access
              </Link>
            </div>
          </div>

          <div className="relative min-h-[620px] overflow-hidden bg-[#17201b] text-white lg:min-h-full">
            <div aria-hidden="true" className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:72px_72px]" />
            <div aria-hidden="true" className="absolute -right-28 -top-28 size-[520px] rounded-full border border-white/10" />
            <div aria-hidden="true" className="absolute -right-10 -top-10 size-[340px] rounded-full border border-[#df785f]/35" />
            <div aria-hidden="true" className="absolute bottom-[-150px] left-[-90px] size-[430px] rounded-full bg-[#8d2114] blur-[1px]" />

            <div className="relative flex h-full min-h-[620px] flex-col justify-between p-6 sm:p-10 lg:p-14">
              <div className="flex items-start justify-between gap-6">
                <p className="max-w-xs text-sm font-bold uppercase tracking-[0.17em] text-white/55">A live mobility media network</p>
                <span className="flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-2 text-xs font-bold">
                  <span className="size-2 rounded-full bg-[#72d59d] shadow-[0_0_0_5px_rgba(114,213,157,.12)]" /> Campaign active
                </span>
              </div>

              <div className="mx-auto w-full max-w-2xl py-12">
                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-5">
                  <div className="grid size-16 place-items-center rounded-full bg-[#f4f0e8] text-[#17201b] sm:size-20">
                    <QrCode className="size-7 sm:size-9" aria-hidden="true" />
                  </div>
                  <div className="relative h-px bg-white/25">
                    <span className="absolute left-0 top-1/2 h-[3px] w-2/3 -translate-y-1/2 bg-[linear-gradient(90deg,#df785f,transparent)]" />
                    <span className="absolute left-[63%] top-1/2 size-3 -translate-y-1/2 rounded-full bg-[#df785f] shadow-[0_0_0_7px_rgba(223,120,95,.15)]" />
                  </div>
                  <div className="grid size-16 place-items-center rounded-full border border-white/20 bg-white/10 sm:size-20">
                    <MessageCircleMore className="size-7 sm:size-9" aria-hidden="true" />
                  </div>
                </div>

                <div className="mt-10 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-white/45">Passenger</p>
                    <p className="mt-2 font-extrabold">Scans & chooses</p>
                  </div>
                  <div className="rounded-2xl border border-[#df785f]/30 bg-[#8d2114]/50 p-4 backdrop-blur-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#f6b2a3]">AddisPulse</p>
                    <p className="mt-2 font-extrabold">Verifies intent</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-white/45">Advertiser</p>
                    <p className="mt-2 font-extrabold">Acts in realtime</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between gap-5 border-t border-white/15 pt-6 sm:flex-row sm:items-end">
                <p className="max-w-sm text-sm leading-6 text-white/55">One permanent driver QR. The right active campaign. A measurable response path.</p>
                <div className="flex gap-6 text-right">
                  <div><p className="text-2xl font-black">OTP</p><p className="text-xs text-white/45">verified</p></div>
                  <div><p className="text-2xl font-black">Live</p><p className="text-xs text-white/45">delivery</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="platform" className="border-b border-[#17201b]/10 bg-[#fffdf8] py-20 sm:py-28">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8d2114]">Built as a connected system</p>
              <h2 className="mt-5 text-4xl font-black leading-[0.95] tracking-[-0.055em] sm:text-6xl">Media that keeps moving after the scan.</h2>
            </div>
            <div className="grid gap-px overflow-hidden rounded-[28px] border border-[#17201b]/10 bg-[#17201b]/10 sm:grid-cols-2">
              {outcomes.map(([Icon, title, description]) => (
                <article key={title} className="bg-[#fffdf8] p-7 sm:p-9">
                  <Icon className="size-7 text-[#8d2114]" strokeWidth={1.8} aria-hidden="true" />
                  <h3 className="mt-8 text-xl font-black tracking-[-0.02em]">{title}</h3>
                  <p className="mt-3 max-w-sm leading-7 text-[#5f6861]">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="journey" className="bg-[#f4f0e8] py-20 sm:py-28">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8d2114]">The operating loop</p>
              <h2 className="mt-5 text-4xl font-black leading-[0.95] tracking-[-0.055em] sm:text-6xl">From a seat-back moment to a sales conversation.</h2>
            </div>
            <p className="max-w-md text-lg leading-8 text-[#5f6861]">Every step connects the physical campaign to a verified, company-owned business outcome.</p>
          </div>

          <div className="mt-14 border-y border-[#17201b]/15">
            {operatingLoop.map((step) => (
              <article key={step.number} className="group grid gap-5 border-b border-[#17201b]/15 py-7 last:border-b-0 sm:grid-cols-[90px_0.8fr_1.2fr] sm:items-center sm:py-9">
                <p className="font-mono text-sm font-bold text-[#8d2114]">/{step.number}</p>
                <h3 className="text-2xl font-black tracking-[-0.03em] sm:text-3xl">{step.title}</h3>
                <div className="flex items-center justify-between gap-6">
                  <p className="max-w-2xl leading-7 text-[#5f6861]">{step.description}</p>
                  <ArrowRight className="hidden size-5 shrink-0 text-[#8d2114] transition-transform group-hover:translate-x-1 sm:block" aria-hidden="true" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="impact" className="bg-[#8d2114] py-20 text-white sm:py-28">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-12">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#f2b1a3]">
              <Sparkles className="size-4" aria-hidden="true" /> Built for advertiser action
            </div>
            <h2 className="mt-6 max-w-3xl text-4xl font-black leading-[0.95] tracking-[-0.055em] sm:text-6xl">The lead should arrive where the sales team already works.</h2>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/70">Advertisers get a protected live dashboard today, with configurable Telegram and email delivery forming the next layer of the platform.</p>
          </div>
          <div className="rounded-[28px] border border-white/15 bg-[#751a0f] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4 border-b border-white/15 pb-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/50">Verified lead signal</p>
                <p className="mt-2 text-xl font-black">Ready for follow-up</p>
              </div>
              <span className="grid size-12 place-items-center rounded-full bg-white text-[#8d2114]"><BellRing className="size-5" aria-hidden="true" /></span>
            </div>
            <div className="space-y-4 py-7">
              {["Phone ownership confirmed", "Campaign and driver attributed", "Company access enforced", "Notification job created once"].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-bold text-white/85">
                  <span className="grid size-6 place-items-center rounded-full bg-white/10"><Check className="size-3.5" aria-hidden="true" /></span>{item}
                </div>
              ))}
            </div>
            <Link href="/advertiser/login" className="flex min-h-13 items-center justify-between rounded-full bg-white px-6 py-3 font-black text-[#6d170d] transition hover:bg-[#fff0eb]">
              Open the advertiser portal <ArrowRight className="size-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#17201b] py-16 text-white">
        <div className="mx-auto flex max-w-[1400px] flex-col justify-between gap-8 px-5 sm:px-8 lg:flex-row lg:items-center lg:px-12">
          <div className="flex items-start gap-4">
            <CircleCheck className="mt-1 size-6 shrink-0 text-[#df785f]" aria-hidden="true" />
            <div><p className="text-2xl font-black tracking-[-0.03em]">Consent-first. OTP-verified. Company-scoped.</p><p className="mt-2 text-white/55">Designed for trustworthy mobility campaigns in Addis Ababa.</p></div>
          </div>
          <a href="#platform" className="inline-flex items-center gap-2 font-bold text-[#f2b1a3] hover:text-white">Explore the platform <ArrowRight className="size-4" aria-hidden="true" /></a>
        </div>
      </section>

      <footer className="bg-[#fffdf8]">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-5 py-9 text-sm text-[#5f6861] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <div className="flex items-center gap-2 font-extrabold text-[#17201b]"><BadgeCheck className="size-5 text-[#8d2114]" aria-hidden="true" /> AddisPulse Media</div>
          <div className="flex flex-wrap gap-x-6 gap-y-2"><span>Passengers</span><span>Advertisers</span><span>Drivers</span><span>One measurable network</span></div>
        </div>
      </footer>

    </main>
  );
}
