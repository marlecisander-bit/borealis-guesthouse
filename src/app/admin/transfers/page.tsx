import Link from 'next/link';

export default function TransfersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Transfers</h1>
          <p className="text-slate-600 mt-1">Manage transportation services</p>
        </div>
        <Link
          href="/admin/transfers/new"
          className="px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition"
        >
          + Add Transfer
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
        <p className="text-slate-600">Transfers coming in Phase 4</p>
        <p className="text-sm text-slate-500 mt-1">This page is under development</p>
      </div>
    </div>
  );
}
