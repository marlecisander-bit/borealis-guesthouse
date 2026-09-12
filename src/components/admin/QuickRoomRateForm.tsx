'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { saveBaseRate } from '@/app/admin/rates/actions';
import { CurrencySelect } from '@/components/admin/CurrencySelect';
import type { RateActionState } from '@/types/rates-admin';

const initial: RateActionState = { ok: false, message: '' };

interface QuickRoomRateFormProps {
  roomId: string;
  roomName: string;
  price: number | null;
  currency: string;
  active: boolean;
}

export function QuickRoomRateForm({ roomId, roomName, price, currency, active }: QuickRoomRateFormProps) {
  const [state, action, pending] = useActionState(saveBaseRate, initial);

  return (
    <details className="relative max-sm:w-full">
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center justify-center rounded-lg border border-slate-300 px-3 text-xs font-bold">Price</summary>
      <form action={action} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xl sm:absolute sm:right-0 sm:z-20 sm:w-76">
        <input type="hidden" name="roomTypeId" value={roomId}/>
        <input type="hidden" name="active" value={active ? 'on' : ''}/>
        <p className="font-bold text-slate-950">{roomName}</p>
        <p className="mt-1 text-xs text-slate-500">Standard nightly price</p>
        <div className="mt-4 grid grid-cols-[1fr_7rem] gap-2">
          <label className="text-xs font-bold text-slate-600">Price<input name="price" required type="number" min="0" step="0.01" defaultValue={price ?? ''} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-base font-normal"/></label>
          <label className="text-xs font-bold text-slate-600">Currency<CurrencySelect defaultValue={currency} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-2 text-sm font-normal"/></label>
        </div>
        {state.message && <p role="status" aria-live="polite" className={`mt-3 text-xs ${state.ok ? 'text-emerald-700' : 'text-red-700'}`}>{state.message}</p>}
        <div className="mt-4 flex items-center justify-between gap-3">
          <Link href="/admin/rates" className="text-xs font-bold text-slate-600 underline">Seasonal rates</Link>
          <button disabled={pending} className="min-h-11 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white disabled:opacity-60">{pending ? 'Saving…' : 'Save price'}</button>
        </div>
      </form>
    </details>
  );
}
