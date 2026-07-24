"use client";

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
      <section className="max-w-lg rounded-2xl border border-red-200 bg-white p-7 text-center">
        <h1 className="text-2xl font-black">Dashboard data could not be loaded</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Your session is still protected. Try loading the company-scoped data again.</p>
        <button onClick={reset} className="mt-5 min-h-11 rounded-xl bg-slate-950 px-5 font-bold text-white">Try again</button>
      </section>
    </main>
  );
}
