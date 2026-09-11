'use client';

import { useEffect } from 'react';

export default function AdminError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm sm:p-12">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-red-50 text-xl text-red-700" aria-hidden="true">!</span>
      <h1 className="mt-5 text-2xl font-bold text-slate-950">This admin page could not be loaded</h1>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">Your information has not been intentionally changed. Check the connection and try loading this section again.</p>
      <button type="button" onClick={() => retry()} className="mt-6 min-h-11 rounded-lg bg-slate-950 px-5 text-sm font-bold text-white">Try again</button>
      {error.digest && <p className="mt-4 text-xs text-slate-400">Reference: {error.digest}</p>}
    </section>
  );
}
