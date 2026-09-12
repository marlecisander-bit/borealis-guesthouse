'use client';

import { useState } from 'react';

export function HomepagePreview() {
  const [device, setDevice] = useState<'Desktop' | 'Mobile' | null>(null);
  return <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5">
    <p className="text-sm text-slate-600">Save your draft, then preview the homepage at desktop or phone width.</p>
    <div className="mt-3 flex flex-wrap gap-2">
      {(['Desktop', 'Mobile'] as const).map(value => <button key={value} type="button" aria-pressed={device === value} onClick={() => setDevice(value)} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold aria-pressed:bg-slate-950 aria-pressed:text-white">{value}</button>)}
      {device && <button type="button" onClick={() => setDevice(null)} className="min-h-11 px-4 text-sm">Close preview</button>}
    </div>
    {device && <div className="mt-4 overflow-x-auto"><iframe key={device} title={`${device} homepage draft preview`} src="/?preview=homepage" width={device === 'Mobile' ? 390 : 1440} height={device === 'Mobile' ? 844 : 900} className="block border border-slate-200" /></div>}
  </section>;
}
