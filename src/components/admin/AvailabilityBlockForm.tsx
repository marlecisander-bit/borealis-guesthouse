'use client';
import { useActionState, useState, startTransition, useRef, useEffect } from 'react';
import { createAvailabilityBlock } from '@/app/admin/availability/actions';
import { nights, shiftDay, validDay } from '@/lib/admin/availability-calendar';
import type { AvailabilityRoom, AvailabilityState } from '@/types/availability-admin';
const initial: AvailabilityState = { ok: false, message: '' };
export function AvailabilityBlockForm({ rooms, defaultTarget = '', defaultStartDate = '', defaultEndDate = '', onCancel }: {
    rooms: AvailabilityRoom[];
    defaultTarget?: string;
    defaultStartDate?: string;
    defaultEndDate?: string;
    onCancel?: () => void;
}) {
    const [state, action, pending] = useActionState(createAvailabilityBlock, initial), [target, setTarget] = useState(defaultTarget), [start, setStart] = useState(defaultStartDate), [end, setEnd] = useState(defaultEndDate), [reason, setReason] = useState('maintenance');
    const submitting = useRef(false);
    useEffect(() => { if (!pending)
        submitting.current = false; }, [pending, state]);
    const count = validDay(end) ? nights(start, shiftDay(end, 1)) : 0, types = [...new Map(rooms.map(r => [r.roomTypeId, r.roomTypeName]))], targetName = target.startsWith('room:') ? rooms.find(r => 'room:' + r.id === target)?.name : types.find(([id]) => 'type:' + id === target)?.[1];
    return <form onSubmit={e => { e.preventDefault(); if (submitting.current || pending || state.ok)
        return; submitting.current = true; const data = new FormData(e.currentTarget); startTransition(() => action(data)); }} className="grid gap-4"><label>Room<select name="target" required value={target} onChange={e => setTarget(e.target.value)}><option value="">Choose inventory</option><optgroup label="Physical units">{rooms.map(r => <option key={r.id} value={'room:' + r.id}>{r.name} · {r.roomTypeName}</option>)}</optgroup><optgroup label="All units in a category">{types.map(([id, name]) => <option key={id} value={'type:' + id}>{name} · all units</option>)}</optgroup></select></label><label>Start date<input name="startDate" type="date" required value={start} onChange={e => setStart(e.target.value)}/></label><label>End date · last closed night<input name="endDate" type="date" required min={start} value={end} onChange={e => setEnd(e.target.value)}/></label><label>Reason<select name="reasonCode" value={reason} onChange={e => setReason(e.target.value)}><option value="maintenance">Maintenance</option><option value="owner_use">Owner use</option><option value="other">Other</option></select></label><input type="hidden" name="reason" value=""/><label>Internal note (optional)<textarea name="notes" maxLength={2000} rows={3}/></label><p className="rounded-lg bg-slate-50 p-3 text-sm">Close {targetName || 'selected inventory'} for {count} affected nights{count > 0 ? `, ${start} through ${end}. Reopens ${shiftDay(end, 1)}.` : '. Choose valid dates.'} Existing bookings and holds remain protected.</p>{target.startsWith('type:') && <p role="note">This closes every physical unit in the selected category.</p>}<p role={state.ok ? 'status' : 'alert'} aria-live="polite" className={state.ok ? 'text-emerald-700' : 'text-red-700'}>{state.message}</p>{state.errors && <ul className="text-sm text-red-700">{Object.entries(state.errors).map(([key, value]) => <li key={key}>{value}</li>)}</ul>}<div className="flex gap-2"><button type="button" className="calendar-button" onClick={onCancel} disabled={pending}>Cancel</button><button className="calendar-button calendar-primary" disabled={pending || state.ok || !target || count < 1}>{pending ? 'Closing room…' : state.ok ? 'Room closed' : 'Close room'}</button></div></form>;
}
