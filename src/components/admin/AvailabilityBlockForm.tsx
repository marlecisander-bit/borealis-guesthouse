'use client';

import { useActionState } from 'react';
import { createAvailabilityBlock } from '@/app/admin/availability/actions';
import type { AvailabilityRoom, AvailabilityState } from '@/types/availability-admin';

const initial: AvailabilityState = { ok: false, message: '' };

export function AvailabilityBlockForm({
  rooms,
  defaultStartDate,
  defaultEndDate,
}: {
  rooms: AvailabilityRoom[];
  defaultStartDate?: string;
  defaultEndDate?: string;
}) {
  const [state, action, pending] = useActionState(createAvailabilityBlock, initial);
  const input = 'mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm';
  const roomTypes = [...new Map(rooms.map((room) => [room.roomTypeId, { id: room.roomTypeId, name: room.roomTypeName }])).values()];

  return (
    <form action={action} className="grid gap-4">
      <Field label="Room or room category">
        <select name="target" required className={input}>
          <option value="">Choose inventory</option>
          <optgroup label="Individual room units">
            {rooms.map((room) => <option key={room.id} value={`room:${room.id}`}>{room.name} · {room.roomTypeName}</option>)}
          </optgroup>
          <optgroup label="Room categories">
            {roomTypes.map((type) => <option key={type.id} value={`type:${type.id}`}>All {type.name} rooms</option>)}
          </optgroup>
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start date"><input name="startDate" required type="date" defaultValue={defaultStartDate} className={input}/></Field>
        <Field label="End date"><input name="endDate" required type="date" defaultValue={defaultEndDate} className={input}/></Field>
      </div>
      <Field label="Reason">
        <select name="reasonCode" className={input}>
          <option value="maintenance">Maintenance</option>
          <option value="owner_use">Owner use</option>
          <option value="manual_closure">Manual closure</option>
          <option value="other">Other</option>
        </select>
      </Field>
      <Field label="Reason details (optional)"><input name="reason" maxLength={300} placeholder="Short explanation" className={input}/></Field>
      <Field label="Internal notes (optional)"><textarea name="notes" maxLength={2000} rows={4} className={`${input} py-3`}/></Field>
      <p role="status" aria-live="polite" className={`text-sm ${state.ok ? 'text-emerald-700' : 'text-red-700'}`}>{state.message}</p>
      <button disabled={pending} className="min-h-11 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-60">{pending ? 'Blocking…' : 'Block dates'}</button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="text-sm font-semibold text-slate-800">{label}{children}</label>;
}
