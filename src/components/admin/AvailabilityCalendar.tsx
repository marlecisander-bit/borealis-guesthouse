'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, useTransition, useActionState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import { AvailabilityBlockForm } from './AvailabilityBlockForm';
import { reopenAvailabilityState } from '@/app/admin/availability/actions';
import { assignedTo, bookingHref, cellState, closuresFor, liveStay, nights, occupies, pendingStay, shiftDay, spanWithin, tiraneDay, validDay } from '@/lib/admin/availability-calendar';
import type { AvailabilityBlock, AvailabilityBooking, AvailabilityRoom } from '@/types/availability-admin';
type Props = {
    rooms: AvailabilityRoom[];
    blocks: AvailabilityBlock[];
    bookings: AvailabilityBooking[];
    daily: AvailabilityBooking[];
    from: string;
    today: string;
    initialView: 'room' | 'type';
    blockStart?: string;
    blockEnd?: string;
};
type Panel = {
    kind: 'select' | 'close';
    roomId: string;
    start: string;
    end: string;
} | {
    kind: 'booking';
    booking: AvailabilityBooking;
} | {
    kind: 'block';
    block: AvailabilityBlock;
} | {
    kind: 'summary';
    title: string;
    items: AvailabilityBooking[];
};
const button = 'calendar-button';
function dayLabel(day: string, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) { return new Date(day + 'T12:00:00Z').toLocaleDateString('en', { ...options, timeZone: 'UTC' }); }
export function AvailabilityCalendar(props: Props) {
    const { rooms, blocks, from, initialView, blockStart, blockEnd } = props, router = useRouter();
    const [days, setDays] = useState<7 | 14>(14), [mode, setMode] = useState<'agenda' | 'grid'>('grid'), [group, setGroup] = useState(initialView), [now, setNow] = useState(() => Date.now()), [panel, setPanel] = useState<Panel | null>(null), [picker, setPicker] = useState(false), [options, setOptions] = useState(false), [anchor, setAnchor] = useState<{
        roomId: string;
        day: string;
    } | null>(null), [busy, startNavigation] = useTransition();
    function closePanel() { setPanel(null); if (location.hash === '#block-dates')
        history.replaceState(history.state, '', location.pathname + location.search); }
    const suppressClick = useRef(false);
    const drag = useRef<{
        roomId: string;
        day: string;
    } | null>(null), drawer = useRef<HTMLDivElement>(null), pickerRef = useRef<HTMLDivElement>(null);
    useDialogFocus(drawer, Boolean(panel), () => closePanel());
    useDialogFocus(pickerRef, picker, () => setPicker(false));
    useEffect(() => { const media = matchMedia('(max-width:767px)'); const resize = () => { setDays(media.matches ? 7 : 14); setMode(media.matches ? 'agenda' : 'grid'); }; resize(); media.addEventListener('change', resize); const timer = setInterval(() => setNow(Date.now()), 1000); return () => { media.removeEventListener('change', resize); clearInterval(timer); }; }, []);
    useEffect(() => { const open = () => { if (location.hash === '#block-dates') {
        setPanel({ kind: 'close', roomId: rooms[0]?.id || '', start: blockStart || from, end: shiftDay(blockEnd || blockStart || from, 1) });
    } }; open(); addEventListener('hashchange', open); return () => removeEventListener('hashchange', open); }, [rooms, from, blockStart, blockEnd]);
    useEffect(() => { if (panel)
        drawer.current?.focus(); }, [panel]);
    const today = tiraneDay(new Date(now)), bookings = props.bookings.filter(b => liveStay(b, now)), daily = props.daily.filter(b => (liveStay(b, now) || b.status === 'completed') && (b.roomIds.length || b.roomTypeIds.length));
    const arrivals = daily.filter(b => b.checkIn === today), departures = daily.filter(b => b.checkOut === today), tonight = daily.filter(b => liveStay(b, now) && !pendingStay(b) && occupies(b, today)), occupied = new Set(tonight.flatMap(b => b.roomIds).filter(id => rooms.some(r => r.id === id))), unallocated = tonight.some(b => b.unassignedTypeIds?.length || !b.roomIds.length);
    useEffect(() => { if (today !== props.today)
        router.refresh(); }, [today, props.today, router]);
    const dates = Array.from({ length: days }, (_, i) => shiftDay(from, i)), types = [...new Set(rooms.map(r => r.roomTypeId))];
    function navigate(date: string) { if (!validDay(date))
        return; setPicker(false); setAnchor(null); closePanel(); startNavigation(() => router.push(`/admin/availability?from=${date}&view=${group}`)); }
    function select(r: AvailabilityRoom, date: string, extend = false) { if (cellState(r, date, blocks, bookings) !== 'Available')
        return; if (extend && anchor?.roomId === r.id) {
        const start = anchor.day < date ? anchor.day : date, end = shiftDay(anchor.day > date ? anchor.day : date, 1);
        if (Array.from({ length: nights(start, end) }, (_, i) => shiftDay(start, i)).some(d => cellState(r, d, blocks, bookings) !== 'Available'))
            return;
        setPanel({ kind: 'select', roomId: r.id, start, end });
        setAnchor(null);
    }
    else {
        setAnchor({ roomId: r.id, day: date });
        setPanel({ kind: 'select', roomId: r.id, start: date, end: shiftDay(date, 1) });
    } }
    function row(r: AvailabilityRoom) { const stays = bookings.filter(b => assignedTo(b, r)), closures = closuresFor(r, blocks); const events = [...stays.map(b => ({ key: 'b' + b.id, start: b.checkIn, end: b.checkOut, booking: b, block: null })), ...closures.map(b => ({ key: 'c' + b.id, start: b.startDate, end: shiftDay(b.endDate, 1), booking: null, block: b }))].filter(e => spanWithin(e.start, e.end, from, days)).sort((a, b) => a.start.localeCompare(b.start)); const lanes: string[] = []; const positioned = events.map(e => { let lane = lanes.findIndex(end => end <= e.start); if (lane < 0)
        lane = lanes.length; lanes[lane] = e.end; return { ...e, lane }; }); return <div key={r.id} className="calendar-row" style={{ minHeight: Math.max(80, lanes.length * 48 + 16) }} role="row"><div className="calendar-room" role="rowheader"><strong>{r.name}</strong><span>{r.roomTypeName}{!r.active ? ' · Inactive' : ''}</span></div><div className="calendar-nights" style={{ gridTemplateColumns: `repeat(${days},minmax(58px,1fr))` }}>{dates.map(date => { const state = cellState(r, date, blocks, bookings), weekend = [0, 6].includes(new Date(date + 'T12:00:00Z').getUTCDay()); return <div key={date} role="cell" className={`calendar-night ${weekend ? 'weekend' : ''} ${date === today ? 'today' : ''}`}><button disabled={state !== 'Available'} aria-label={`${r.name}, ${date}, ${state}. Select night; Shift-click extends range.`} aria-pressed={anchor?.roomId === r.id && anchor.day === date} onPointerDown={e => { if (e.pointerType === 'mouse' && state === 'Available')
        drag.current = { roomId: r.id, day: date }; }} onPointerUp={e => { if (e.pointerType === 'mouse' && drag.current?.roomId === r.id && drag.current.day !== date) {
        setAnchor(drag.current);
        const a = drag.current.day, start = a < date ? a : date, end = shiftDay(a > date ? a : date, 1);
        if (Array.from({ length: nights(start, end) }, (_, i) => shiftDay(start, i)).every(d => cellState(r, d, blocks, bookings) === 'Available')) {
            setPanel({ kind: 'select', roomId: r.id, start, end });
            setAnchor(null);
        }
        drag.current = null;
        suppressClick.current = true;
        setTimeout(() => suppressClick.current = false, 0);
        e.preventDefault();
    } }} onClick={e => { if (suppressClick.current && e.detail > 0) {
        suppressClick.current = false;
        return;
    } suppressClick.current = false; drag.current = null; select(r, date, e.shiftKey); }} onKeyDown={e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const next = shiftDay(date, e.key === 'ArrowRight' ? 1 : -1);
        if (e.shiftKey) {
            if (!dates.includes(next)) return;
            const first = anchor?.roomId === r.id ? anchor.day : date;
            const start = first < next ? first : next, end = shiftDay(first > next ? first : next, 1);
            if (Array.from({length:nights(start,end)},(_,i)=>shiftDay(start,i)).every(day=>cellState(r,day,blocks,bookings)==='Available')) {
                setPanel({kind:'select',roomId:r.id,start,end});setAnchor(null);
            }
        }
        else
            document.getElementById(`night-${r.id}-${next}`)?.focus();
    } }} id={`night-${r.id}-${date}`}/>{state === 'Category reservation — check allocation' && <span className="calendar-unassigned" title={state}>?</span>}</div>; })}<div className="calendar-bars" style={{ gridTemplateColumns: `repeat(${days},minmax(58px,1fr))`, gridTemplateRows: `repeat(${Math.max(1, lanes.length)},44px)` }}>{positioned.map(e => { const span = spanWithin(e.start, e.end, from, days)!; return <button key={e.key} style={{ gridColumn: `${span.start + 1}/span ${span.length}`, gridRow: e.lane + 1 }} className={`calendar-stay ${e.block ? 'closure' : pendingStay(e.booking!) ? 'pending' : 'confirmed'}`} onClick={() => setPanel(e.block ? { kind: 'block', block: e.block } : { kind: 'booking', booking: e.booking! })} aria-label={e.block ? `${r.name}, closed ${e.start} through ${e.block.endDate}, ${e.block.reasonCode.replaceAll('_', ' ')}` : `${e.booking!.guestName || e.booking!.reference}, ${e.booking!.guestCount ?? 'unknown'} guests total, ${e.booking!.status}, check-in ${e.start}, checkout ${e.end}`}><span className="calendar-bar-label">{e.start < from ? '← ' : ''}{e.block ? '▧ Closed · ' + e.block.reasonCode.replaceAll('_', ' ') : `${pendingStay(e.booking!) ? '◷' : '✓'} ${e.booking!.guestName || e.booking!.reference} · ${e.booking!.guestCount ?? '?'} guests total`}{e.end > shiftDay(from, days) ? ' →' : ''}</span></button>; })}</div></div></div>; }
    return <div id="block-dates" className="availability-calendar" aria-busy={busy}>
 <div className="calendar-metrics">{[{ title: 'Arrivals today', value: arrivals.length, items: arrivals }, { title: 'Departures today', value: departures.length, items: departures }, { title: 'Rooms occupied tonight', value: occupied.size + (unallocated ? ' + unassigned' : ''), items: tonight }].map(m => <button key={m.title} onClick={() => setPanel({ kind: 'summary', title: m.title, items: m.items })}><strong>{m.value}</strong><span>{m.title}</span></button>)}</div>
 <section className="calendar-surface"><div className="calendar-toolbar"><button className={button} onClick={() => navigate(today)}>Today</button><button className={button} aria-label="Previous period" onClick={() => navigate(shiftDay(from, mode === 'agenda' ? -1 : -days))}>‹</button><button className={`${button} calendar-range`} aria-haspopup="dialog" onClick={() => setPicker(true)}>{mode === 'agenda' ? dayLabel(from, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : `${dayLabel(from)} – ${dayLabel(shiftDay(from, days - 1), { month: 'short', day: 'numeric', year: 'numeric' })}`} ▾</button><button className={button} aria-label="Next period" onClick={() => navigate(shiftDay(from, mode === 'agenda' ? 1 : days))}>›</button><div className="calendar-period" aria-label="Days displayed">{([7, 14] as const).map(n => <button className={button} aria-pressed={mode === 'grid' && days === n} key={n} onClick={() => { setDays(n); setMode('grid'); }}>{n} days</button>)}</div><Link className={`${button} calendar-primary`} href="/admin/bookings/new">+ Add booking</Link><button className={button} aria-expanded={options} onClick={() => setOptions(!options)}>View options</button></div>
 {options && <div className="calendar-options"><label>Layout <select aria-label="Calendar layout" value={mode} onChange={e => setMode(e.target.value as 'agenda' | 'grid')}><option value="agenda">Daily agenda</option><option value="grid">Week grid</option></select></label>{rooms.some((r, i) => rooms.findIndex(x => x.roomTypeId === r.roomTypeId) !== i) && <label>Group <select aria-label="Group rooms" value={group} onChange={e => setGroup(e.target.value as 'room' | 'type')}><option value="room">By unit</option><option value="type">By room category</option></select></label>}<button className={button} onClick={() => setPanel({ kind: 'close', roomId: rooms[0]?.id || '', start: from, end: shiftDay(from, 1) })}>Close room…</button></div>}
 <div className="calendar-key"><span>✓ Confirmed</span><span>◷ Pending / hold</span><span>▧ Closed</span><span>Empty = available night · checkout releases the next cell</span></div>
 {busy && <p role="status" className="p-3 text-sm">Loading dates…</p>}{!rooms.length ? <p className="p-6">No rooms yet. <Link href="/admin/rooms/new">Add a room</Link> to manage availability.</p> : mode === 'agenda' ? <div className="calendar-agenda"><h2>{dayLabel(from, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h2>{rooms.map(r => { const current = bookings.filter(b => assignedTo(b, r) && occupies(b, from)), leaving = bookings.filter(b => assignedTo(b, r) && b.checkOut === from), closed = closuresFor(r, blocks).filter(b => b.startDate <= from && b.endDate >= from), state = cellState(r, from, blocks, bookings); return <article key={r.id}><h3>{r.name}</h3><p className="text-sm text-slate-500">{r.roomTypeName}</p>{leaving.map(b => <button className={button} key={b.id} onClick={() => setPanel({ kind: 'booking', booking: b })}>Departure · {b.guestName || b.reference}</button>)}{current.map(b => <button key={b.id} className={`calendar-stay ${pendingStay(b) ? 'pending' : 'confirmed'}`} onClick={() => setPanel({ kind: 'booking', booking: b })}>{b.checkIn === from ? 'Arrival' : 'Staying'} · {b.guestName || b.reference} · {b.guestCount ?? '?'} guests total · {b.status}</button>)}{closed.map(b => <button key={b.id} className="calendar-stay closure" onClick={() => setPanel({ kind: 'block', block: b })}>▧ Closed · {b.reasonCode.replaceAll('_', ' ')}</button>)}{!current.length && !closed.length && <p>{state}</p>}{state === 'Available' && <button className={button} onClick={() => select(r, from)}>Select dates / add booking</button>}</article>; })}</div> : <div className="calendar-scroll" role="region" aria-label="Room calendar — scroll dates horizontally" tabIndex={0}><div role="table" aria-label="Room availability by night" className="calendar-table" style={{ minWidth: 190 + days * 58 }}><div className="calendar-date-row" role="row"><div className="calendar-room" role="columnheader">Room / unit</div><div className="calendar-date-columns" style={{ gridTemplateColumns: `repeat(${days},minmax(58px,1fr))` }}>{dates.map(date => <div role="columnheader" key={date} className={`${date === today ? 'today' : ''} ${[0, 6].includes(new Date(date + 'T12:00:00Z').getUTCDay()) ? 'weekend' : ''}`} aria-label={`${date}${date === today ? ', today' : ''}`}><span>{dayLabel(date, { weekday: 'short' })}</span><strong>{dayLabel(date)}</strong>{date === today && <small>Today</small>}</div>)}</div></div>{group === 'room' ? rooms.map(row) : types.map(type => <div key={type} role="rowgroup"><div className="calendar-group">{rooms.find(r => r.roomTypeId === type)?.roomTypeName} · {rooms.filter(r => r.roomTypeId === type).length} physical units</div>{rooms.filter(r => r.roomTypeId === type).map(row)}</div>)}</div></div>}
 {bookings.some(b => b.unassignedTypeIds?.length || !b.roomIds.length) && <div className="calendar-unallocated"><h2>Category reservations awaiting unit assignment</h2><p>These affect category availability; no physical room is implied.</p>{bookings.filter(b => b.unassignedTypeIds?.length || !b.roomIds.length).map(b => <button key={b.id} className={button} onClick={() => setPanel({ kind: 'booking', booking: b })}>{b.guestName || b.reference} · {b.checkIn} → {b.checkOut} · {b.status}</button>)}</div>}
 </section>
 {anchor && <p className="text-sm text-slate-600">To extend a selection, close the drawer and Shift-click another night in the same room, or edit the dates in the drawer. Desktop dragging is also supported.</p>}
 {picker && createPortal(<div className="calendar-backdrop"><div ref={pickerRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Choose calendar date" className="calendar-date-picker"><h2>Go to date</h2><form onSubmit={e => { e.preventDefault(); navigate(String(new FormData(e.currentTarget).get('from'))); }}><label>Start date<input type="date" name="from" required defaultValue={from}/></label><button className={`${button} calendar-primary`}>Show dates</button><button type="button" className={button} onClick={() => setPicker(false)}>Cancel</button></form></div></div>, document.body)}
 {panel && createPortal(<div className="calendar-backdrop" onClick={e => { if (e.target === e.currentTarget)
            closePanel(); }}><div ref={drawer} tabIndex={-1} role="dialog" aria-modal="true" aria-label={panel.kind === 'booking' ? 'Booking details' : panel.kind === 'block' ? 'Closure details' : panel.kind === 'summary' ? panel.title : panel.kind === 'close' ? 'Close room' : 'Selected dates'} className="calendar-drawer"><header><h2>{panel.kind === 'booking' ? 'Booking details' : panel.kind === 'block' ? 'Closure details' : panel.kind === 'summary' ? panel.title : panel.kind === 'close' ? 'Close room' : 'Selected dates'}</h2><button aria-label="Close drawer" className={button} onClick={() => closePanel()}>×</button></header>
 {panel.kind === 'booking' ? <><h3>{panel.booking.guestName || panel.booking.reference}</h3><p>{panel.booking.reference} · {panel.booking.status}</p><p>{panel.booking.guestCount ?? 'Unknown'} guests in this booking</p>{panel.booking.status === 'held' && !liveStay(panel.booking, now) && <p role="status">Hold expired — these nights have been released.</p>}<p>Check-in {panel.booking.checkIn}<br />Checkout {panel.booking.checkOut} · {nights(panel.booking.checkIn, panel.booking.checkOut)} nights</p>{panel.booking.holdExpiresAt && <p>Hold expires {new Date(panel.booking.holdExpiresAt).toLocaleString('en', { timeZone: 'Europe/Tirane' })} (Tirane)</p>}<Link className={`${button} calendar-primary`} href={`/admin/bookings/${panel.booking.id}`}>Open full booking</Link></> : panel.kind === 'block' ? <><h3>{panel.block.targetName}</h3><p>{panel.block.startDate} through {panel.block.endDate} · {nights(panel.block.startDate, shiftDay(panel.block.endDate, 1))} closed nights</p><p>Reopens {shiftDay(panel.block.endDate, 1)}</p><p>{panel.block.reasonCode.replaceAll('_', ' ')}{panel.block.reason ? ' · ' + panel.block.reason : ''}</p>{panel.block.notes && <p>Internal note: {panel.block.notes}</p>}{panel.block.source === 'manual' ? <Reopen block={panel.block}/> : <p>Managed by a connected calendar. Reopen at the source.</p>}</> : panel.kind === 'summary' ? <>{panel.items.length ? panel.items.map(b => <Link className={button} key={b.id} href={`/admin/bookings/${b.id}`}>{b.guestName || b.reference} · {b.checkIn} → {b.checkOut} · {b.status}</Link>) : <p>No matching bookings today.</p>}<Link className={button} href="/admin/bookings">All bookings</Link></> : panel.kind === 'close' ? <AvailabilityBlockForm rooms={rooms} defaultTarget={panel.roomId ? `room:${panel.roomId}` : ''} defaultStartDate={panel.start} defaultEndDate={shiftDay(panel.end, -1)} onCancel={() => closePanel()}/> : <Selection rangeStart={from} rooms={rooms} panel={panel} blocks={blocks} bookings={bookings} onClose={value => setPanel({ ...value, kind: 'close' })}/>}
 </div></div>, document.body)}
 </div>;
}
function Selection({ rangeStart, rooms, panel, blocks, bookings, onClose }: {
    rangeStart: string;
    rooms: AvailabilityRoom[];
    panel: Extract<Panel, {
        kind: 'select' | 'close';
    }>;
    blocks: AvailabilityBlock[];
    bookings: AvailabilityBooking[];
    onClose: (p: Extract<Panel, {
        kind: 'select' | 'close';
    }>) => void;
}) { const [roomId, setRoom] = useState(panel.roomId), [start, setStart] = useState(panel.start), [end, setEnd] = useState(panel.end), r = rooms.find(x => x.id === roomId), count = nights(start, end), outside = start < rangeStart || end > shiftDay(rangeStart, 14), conflict = !r || !count || Array.from({ length: 14 }, (_, i) => shiftDay(rangeStart, i)).filter(day => day >= start && day < end).some(day => cellState(r, day, blocks, bookings) !== 'Available'); return <><label>Room<select aria-label="Room" value={roomId} onChange={e => setRoom(e.target.value)}>{rooms.map(r => <option value={r.id} key={r.id}>{r.name} · {r.roomTypeName}</option>)}</select></label><label>Check-in / start<input type="date" value={start} onChange={e => setStart(e.target.value)}/></label><label>Checkout / end<input type="date" value={end} min={start} onChange={e => setEnd(e.target.value)}/></label><p>{count} nights · checkout is not occupied.</p>{outside && <p role="note">Part of this range is outside the loaded calendar. Availability will be checked by the existing booking or closure action before saving.</p>}{conflict ? <p role="alert">Choose an available range. Refresh if availability has changed.</p> : <><Link className={`${button} calendar-primary`} href={bookingHref(r!, start, end)}>Add booking</Link><button className={button} onClick={() => onClose({ kind: 'close', roomId, start, end })}>Close room</button></>}<p className="text-sm text-slate-500">The booking form opens with this category and dates. The existing allocator assigns an available unit; this selection does not reserve a specific unit.</p></>; }
function Reopen({ block }: {
    block: AvailabilityBlock;
}) { const [state, action, pending] = useActionState(reopenAvailabilityState, { ok: false, message: '' }); const submitting = useRef(false); useEffect(() => { if (!pending)
    submitting.current = false; }, [pending, state]); return <form action={action} onSubmit={e => { if (submitting.current || pending || state.ok)
    e.preventDefault();
else
    submitting.current = true; }}><input type="hidden" name="id" value={block.id}/><label className="flex gap-2"><input type="checkbox" required/>Confirm reopening {block.targetName}, {block.startDate} through {block.endDate}</label><p role="status">{state.message}</p><button className={button} disabled={pending || state.ok}>{pending ? 'Reopening…' : state.ok ? 'Reopened' : 'Reopen dates'}</button></form>; }
