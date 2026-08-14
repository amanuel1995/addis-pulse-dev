import type { ReactNode } from "react";
import { RidePerkBrand, CampaignFooter, PassengerShell } from "./PassengerShell";

export function FlowStatusCard({
  icon,
  eyebrow,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <PassengerShell>
      <main className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-lg items-center px-4 py-10 sm:px-6">
        <section className="w-full rounded-[28px] border border-[var(--passenger-line)] bg-white p-6 text-center shadow-[0_24px_70px_rgba(82,36,24,0.1)] sm:p-9">
          <div className="mb-5 flex justify-center border-b border-[var(--passenger-line)] pb-4">
            <RidePerkBrand />
          </div>
          <div className="mx-auto mb-5 grid size-16 place-items-center rounded-2xl bg-[var(--passenger-primary-soft)] text-[var(--passenger-primary)]">
            {icon}
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--passenger-primary)]">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mx-auto mt-3 max-w-md text-base leading-7 text-[var(--passenger-muted)]">{description}</p>
          {children && <div className="mt-7">{children}</div>}
        </section>
      </main>
      <CampaignFooter />
    </PassengerShell>
  );
}
