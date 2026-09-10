import Link from 'next/link';

export default function RateRulesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Rate Rules</h1>
          <p className="mt-1 text-slate-600">Manage minimum stays, date restrictions and future pricing rules.</p>
        </div>
        <Link href="/admin/rates" className="rounded-lg bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-slate-800">
          View rates
        </Link>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-8 sm:p-12">
        <p className="font-medium text-slate-700">No rate rules have been configured.</p>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
          Rate-rule editing will be connected when live pricing and availability management are implemented.
        </p>
      </div>
    </div>
  );
}
