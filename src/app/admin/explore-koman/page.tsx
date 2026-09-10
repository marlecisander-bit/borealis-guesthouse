import Link from 'next/link';

export default function ExploreKomanPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Explore Koman</h1>
          <p className="text-slate-600 mt-1">Manage tourism content</p>
        </div>
        <Link
          href="/admin/explore-koman/new"
          className="px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition"
        >
          + New Article
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
        <p className="text-slate-600">Explore Koman coming in Phase 6</p>
        <p className="text-sm text-slate-500 mt-1">This page is under development</p>
      </div>
    </div>
  );
}
