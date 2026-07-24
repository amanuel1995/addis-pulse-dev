export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8" aria-busy="true" aria-label="Loading advertiser dashboard">
      <div className="mx-auto max-w-7xl animate-pulse space-y-6">
        <div className="h-10 w-80 rounded-xl bg-slate-200" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 rounded-2xl bg-white" />)}</div>
        <div className="h-80 rounded-2xl bg-white" />
      </div>
    </main>
  );
}
