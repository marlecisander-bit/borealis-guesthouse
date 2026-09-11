export default function AdminLoading() {
  return (
    <div role="status" aria-label="Loading admin page" className="animate-pulse space-y-8">
      <div className="space-y-3">
        <div className="h-8 w-64 rounded-lg bg-slate-200" />
        <div className="h-4 w-full max-w-xl rounded bg-slate-200" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-36 rounded-2xl border border-slate-200 bg-white" />)}
      </div>
      <div className="h-72 rounded-2xl border border-slate-200 bg-white" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
