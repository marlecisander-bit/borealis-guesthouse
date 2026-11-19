'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, useTransition, useActionState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import { AvailabilityBlockForm } from './AvailabilityBlockForm';
import { reopenAvailabilityState } from '@/app/admin/availability/actions';
import {
  assignedTo,
  availableUnitCount,
  bookingHref,
  cellState,
  closuresFor,
  liveStay,
  nights,
  occupies,
  pendingStay,
  shiftDay,
  spanWithin,
  propertyDay,
  validDay,
} from '@/lib/admin/availability-calendar';
import type { AvailabilityBlock, AvailabilityBooking, AvailabilityRoom } from '@/types/availability-admin';
type Props = {
  rooms: AvailabilityRoom[];
  blocks: AvailabilityBlock[];
  bookings: AvailabilityBooking[];
  from: string;
  today: string;
  initialView: 'room' | 'type';
  selectedRoom?: string;
  blockStart?: string;
  blockEnd?: string;
  timeZone?: string;
  restricted?: boolean;
  periodDays?: number;
};
type Panel =
  | {
      kind: 'close';
      roomId: string;
      start: string;
      end: string;
    }
  | {
      kind: 'booking';
      booking: AvailabilityBooking;
    }
  | {
      kind: 'block';
      block: AvailabilityBlock;
    };
const button = 'calendar-button';
function dayLabel(day: string, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) {
  return new Date(day + 'T12:00:00Z').toLocaleDateString('en', { ...options, timeZone: 'UTC' });
}
export function AvailabilityCalendar(props: Props) {
  const { rooms, blocks, from, initialView, selectedRoom, blockStart, blockEnd } = props,
    router = useRouter();
  const days = props.periodDays ?? 14;
  const [mode, setMode] = useState<'agenda' | 'grid'>('grid');
  const group = initialView;
  const [now, setNow] = useState(() => Date.now()),
    [panel, setPanel] = useState<Panel | null>(null);
  const [picker, setPicker] = useState(false),
    [expanded, setExpanded] = useState<string[]>([]);
  const [anchor, setAnchor] = useState<{ roomId: string; day: string } | null>(null);
  const [selection, setSelection] = useState<{ target: string; start: string; end: string } | null>(null);
  const [message, setMessage] = useState(''),
    [busy, startNavigation] = useTransition();
  const closePanel = useCallback(() => {
    setPanel(null);
    setSelection(null);
    if (location.hash === '#block-dates')
      history.replaceState(history.state, '', location.pathname + location.search);
  }, []);
  const saved = useCallback(
    (feedback: string) => {
      setMessage(feedback);
      setAnchor(null);
      closePanel();
      router.refresh();
    },
    [closePanel, router]
  );
  const updateSelection = useCallback(
    (target: string, start: string, end: string) => setSelection({ target, start, end }),
    []
  );
  const suppressClick = useRef(false);
  const drag = useRef<{
      roomId: string;
      day: string;
    } | null>(null),
    drawer = useRef<HTMLDivElement>(null),
    pickerRef = useRef<HTMLDivElement>(null);
  useDialogFocus(drawer, Boolean(panel), () => closePanel());
  useDialogFocus(pickerRef, picker, () => setPicker(false));
  useEffect(() => {
    const media = matchMedia('(max-width:767px)');
    const resize = () => {
      setMode(media.matches ? 'agenda' : 'grid');
    };
    resize();
    media.addEventListener('change', resize);
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      media.removeEventListener('change', resize);
      clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    const open = () => {
      if (location.hash === '#block-dates' && rooms.some((room) => room.active)) {
        setPanel({
          kind: 'close',
          roomId:
            rooms.find((room) => room.active && room.id === selectedRoom)?.id ||
            rooms.find((room) => room.active)?.id ||
            '',
          start: blockStart || from,
          end: shiftDay(blockEnd || blockStart || from, 1),
        });
      }
    };
    open();
    addEventListener('hashchange', open);
    return () => removeEventListener('hashchange', open);
  }, [rooms, from, selectedRoom, blockStart, blockEnd]);
  useEffect(() => {
    if (panel) drawer.current?.focus({ preventScroll: true });
  }, [panel]);
  const today = propertyDay(new Date(now), props.timeZone),
    bookings = props.bookings.filter((b) => liveStay(b, now));
  useEffect(() => {
    if (today !== props.today) router.refresh();
  }, [today, props.today, router]);
  const dates = Array.from({ length: days }, (_, i) => shiftDay(from, i)),
    types = [...new Set(rooms.map((r) => r.roomTypeId))];
  function navigate(date: string, room = selectedRoom, length = days, view = group) {
    if (!validDay(date)) return;
    const search = new URLSearchParams({ from: date, view });
    if (length !== 14) search.set('to', shiftDay(date, length - 1));
    if (room) search.set('room', room);
    setPicker(false);
    setAnchor(null);
    setMessage('');
    closePanel();
    startNavigation(() => router.push('/admin/availability?' + search.toString(), { scroll: false }));
  }
  const filtered = rooms.filter((room) => !selectedRoom || room.id === selectedRoom);

  function saveScroll() {
    try {
      sessionStorage.setItem(
        'borealis-calendar-position',
        JSON.stringify({
          path: location.pathname + location.search,
          top: window.scrollY,
          left: document.querySelector('.calendar-scroll')?.scrollLeft ?? 0,
          gridTop: document.querySelector('.calendar-scroll')?.scrollTop ?? 0,
          expanded,
        })
      );
    } catch {
      /* Navigation still works when storage is unavailable. */
    }
  }
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('borealis-calendar-position');
      if (!stored) return;
      const { path, top, left, gridTop, expanded: expandedTypes } = JSON.parse(stored);
      if (path !== location.pathname + location.search) return;
      sessionStorage.removeItem('borealis-calendar-position');
      requestAnimationFrame(() => {
        if (Array.isArray(expandedTypes) && expandedTypes.every((type) => typeof type === 'string')) {
          setExpanded(expandedTypes);
        }
        requestAnimationFrame(() => {
          window.scrollTo({ top, behavior: 'instant' });
          document.querySelector('.calendar-scroll')?.scrollTo({ left, top: gridTop, behavior: 'instant' });
        });
      });
    } catch {
      /* Normal browser scroll restoration remains available. */
    }
  }, []);
  function select(r: AvailabilityRoom, date: string) {
    if (cellState(r, date, blocks, bookings) !== 'Available') return;
    if (mode === 'agenda') {
      setPanel({ kind: 'close', roomId: r.id, start: date, end: shiftDay(date, 1) });
      return;
    }
    if (anchor?.roomId !== r.id) {
      setAnchor({ roomId: r.id, day: date });
      setMessage('Start night selected. Choose the last night in the same room.');
      return;
    }
    const start = anchor.day < date ? anchor.day : date;
    const end = shiftDay(anchor.day > date ? anchor.day : date, 1);
    if (
      Array.from({ length: nights(start, end) }, (_, i) => shiftDay(start, i)).some(
        (d) => cellState(r, d, blocks, bookings) !== 'Available'
      )
    ) {
      setMessage('This range includes an unavailable night. Choose an earlier end or clear the selection.');
      return;
    }
    setPanel({ kind: 'close', roomId: r.id, start, end });
    setAnchor(null);
    setMessage('');
  }
  function row(r: AvailabilityRoom) {
    const stays = bookings.filter((b) => assignedTo(b, r)),
      closures = closuresFor(r, blocks);
    const events = [
      ...stays.map((b) => ({ key: 'b' + b.id, start: b.checkIn, end: b.checkOut, booking: b, block: null })),
      ...closures.map((b) => ({
        key: 'c' + b.id,
        start: b.startDate,
        end: shiftDay(b.endDate, 1),
        booking: null,
        block: b,
      })),
    ]
      .filter((e) => spanWithin(e.start, e.end, from, days))
      .sort((a, b) => a.start.localeCompare(b.start));
    const lanes: string[] = [];
    const positioned = events.map((e) => {
      let lane = lanes.findIndex((end) => end <= e.start);
      if (lane < 0) lane = lanes.length;
      lanes[lane] = e.end;
      return { ...e, lane };
    });
    return (
      <div
        key={r.id}
        className="calendar-row"
        style={{ minHeight: Math.max(80, lanes.length * 48 + 16) }}
        role="row"
      >
        <div className="calendar-room" role="rowheader">
          <strong>{r.name}</strong>
          <span>
            {r.roomTypeName}
            {!r.active ? ' · Inactive' : ''}
          </span>
        </div>
        <div className="calendar-nights" style={{ gridTemplateColumns: `repeat(${days},minmax(58px,1fr))` }}>
          {dates.map((date) => {
            const state = cellState(r, date, blocks, bookings),
              selected =
                (anchor?.roomId === r.id && anchor.day === date) ||
                Boolean(
                  selection &&
                    (selection.target === 'room:' + r.id || selection.target === 'type:' + r.roomTypeId) &&
                    date >= selection.start &&
                    date <= selection.end
                ),
              weekend = [0, 6].includes(new Date(date + 'T12:00:00Z').getUTCDay());
            return (
              <div
                key={date}
                role="cell"
                className={`calendar-night ${weekend ? 'weekend' : ''} ${date === today ? 'today' : ''} ${selected ? 'calendar-selected' : ''}`}
              >
                <button
                  disabled={state !== 'Available'}
                  aria-label={`${r.name}, ${date}, ${state}. Select night.`}
                  aria-pressed={selected}
                  onPointerDown={(e) => {
                    if (e.pointerType === 'mouse' && state === 'Available')
                      drag.current = { roomId: r.id, day: date };
                  }}
                  onPointerUp={(e) => {
                    if (
                      e.pointerType === 'mouse' &&
                      drag.current?.roomId === r.id &&
                      drag.current.day !== date
                    ) {
                      setAnchor(drag.current);
                      const a = drag.current.day,
                        start = a < date ? a : date,
                        end = shiftDay(a > date ? a : date, 1);
                      if (
                        Array.from({ length: nights(start, end) }, (_, i) => shiftDay(start, i)).every(
                          (d) => cellState(r, d, blocks, bookings) === 'Available'
                        )
                      ) {
                        setPanel({ kind: 'close', roomId: r.id, start, end });
                        setAnchor(null);
                      }
                      drag.current = null;
                      suppressClick.current = true;
                      setTimeout(() => (suppressClick.current = false), 0);
                      e.preventDefault();
                    }
                  }}
                  onClick={(e) => {
                    if (suppressClick.current && e.detail > 0) {
                      suppressClick.current = false;
                      return;
                    }
                    suppressClick.current = false;
                    drag.current = null;
                    select(r, date);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                      e.preventDefault();
                      const next = shiftDay(date, e.key === 'ArrowRight' ? 1 : -1);
                      if (e.shiftKey) {
                        if (!dates.includes(next)) return;
                        const first = anchor?.roomId === r.id ? anchor.day : date;
                        const start = first < next ? first : next,
                          end = shiftDay(first > next ? first : next, 1);
                        if (
                          Array.from({ length: nights(start, end) }, (_, i) => shiftDay(start, i)).every(
                            (day) => cellState(r, day, blocks, bookings) === 'Available'
                          )
                        ) {
                          setPanel({ kind: 'close', roomId: r.id, start, end });
                          setAnchor(null);
                        }
                      } else document.getElementById(`night-${r.id}-${next}`)?.focus();
                    }
                  }}
                  id={`night-${r.id}-${date}`}
                >
                  {selected && <span>Selected</span>}
                </button>
                {state === 'Category reservation — check allocation' && (
                  <span className="calendar-unassigned" title={state}>
                    ?
                  </span>
                )}
              </div>
            );
          })}
          <div
            className="calendar-bars"
            style={{
              gridTemplateColumns: `repeat(${days},minmax(58px,1fr))`,
              gridTemplateRows: `repeat(${Math.max(1, lanes.length)},44px)`,
            }}
          >
            {positioned.map((e) => {
              const span = spanWithin(e.start, e.end, from, days)!;
              return (
                <button
                  key={e.key}
                  style={{ gridColumn: `${span.start + 1}/span ${span.length}`, gridRow: e.lane + 1 }}
                  className={`calendar-stay ${e.block ? 'closure' : pendingStay(e.booking!) ? 'pending' : 'confirmed'}`}
                  onClick={() =>
                    setPanel(
                      e.block ? { kind: 'block', block: e.block } : { kind: 'booking', booking: e.booking! }
                    )
                  }
                  aria-label={
                    e.block
                      ? `${r.name}, closed ${e.start} through ${e.block.endDate}, ${e.block.reasonCode.replaceAll('_', ' ')}`
                      : `${props.restricted ? (pendingStay(e.booking!) ? 'Hold / pending' : 'Reserved') : e.booking!.guestName || e.booking!.reference || 'Reservation'}, ${e.booking!.status}, check-in ${e.start}, checkout ${e.end}`
                  }
                >
                  <span className="calendar-bar-label">
                    {e.start < from ? '← ' : ''}
                    {e.block
                      ? '▧ Closed · ' + (e.block.reason || e.block.reasonCode.replaceAll('_', ' '))
                      : `${pendingStay(e.booking!) ? '◷' : '✓'} ${props.restricted ? (pendingStay(e.booking!) ? 'Hold / pending' : 'Reserved') : e.booking!.guestName || e.booking!.reference || 'Reservation'}`}
                    {e.end > shiftDay(from, days) ? ' →' : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
  const agendaRow = (r: AvailabilityRoom) => {
    const current = bookings.filter((b) => assignedTo(b, r) && occupies(b, from)),
      leaving = bookings.filter((b) => assignedTo(b, r) && b.checkOut === from),
      closed = closuresFor(r, blocks).filter((b) => b.startDate <= from && b.endDate >= from),
      state = cellState(r, from, blocks, bookings);
    return (
      <article key={r.id}>
        <h3>{r.name}</h3>
        <p className="text-sm text-slate-500">{r.roomTypeName}</p>
        {leaving.map((b) => (
          <button className={button} key={b.id} onClick={() => setPanel({ kind: 'booking', booking: b })}>
            Departure{!props.restricted && ` · ${b.guestName || b.reference}`}
          </button>
        ))}
        {current.map((b) => (
          <button
            key={b.id}
            className={`calendar-stay ${pendingStay(b) ? 'pending' : 'confirmed'}`}
            onClick={() => setPanel({ kind: 'booking', booking: b })}
          >
            {pendingStay(b)
              ? b.status === 'held'
                ? 'Temporary hold'
                : 'Pending reservation'
              : b.checkIn === from
                ? 'Booked · Arrival'
                : 'Booked · Staying'}{' '}
            · {props.restricted ? b.status : `${b.guestName || b.reference} · ${b.status}`}
          </button>
        ))}
        {closed.map((b) => (
          <button
            key={b.id}
            className="calendar-stay closure"
            onClick={() => setPanel({ kind: 'block', block: b })}
          >
            ▧ Blocked · {b.reasonCode.replaceAll('_', ' ')}
            {b.reason ? ' · ' + b.reason : ''}
          </button>
        ))}
        {!current.length && !closed.length && (
          <p
            className={
              state === 'Available' ? 'font-semibold text-emerald-800' : 'font-semibold text-slate-700'
            }
          >
            {state}
          </p>
        )}
        {state === 'Available' && (
          <button className={button} onClick={() => select(r, from)}>
            Block dates
          </button>
        )}
      </article>
    );
  };
  const selectedUnit = rooms.find((room) => selection?.target === 'room:' + room.id);
  const selectedRooms = selection
    ? rooms.filter(
        (room) => selection.target === 'room:' + room.id || selection.target === 'type:' + room.roomTypeId
      )
    : [];
  const conflict =
    selection &&
    dates.find(
      (date) =>
        date >= selection.start &&
        date <= selection.end &&
        selectedRooms.some((room) => room.active && cellState(room, date, blocks, bookings) !== 'Available')
    );

  return (
    <div id="block-dates" className="availability-calendar" aria-busy={busy}>
      <section className="calendar-surface">
        <div className="calendar-toolbar">
          <div className="calendar-nav">
            <button className={button} onClick={() => navigate(today)}>
              Today
            </button>
            <button
              className={button}
              aria-label="Previous period"
              onClick={() => navigate(shiftDay(from, mode === 'agenda' ? -7 : -days))}
            >
              ‹
            </button>
            <button
              className={`${button} calendar-range`}
              aria-haspopup="dialog"
              onClick={() => setPicker(true)}
            >
              {mode === 'agenda'
                ? dayLabel(from, { month: 'short', day: 'numeric', year: 'numeric' })
                : `${dayLabel(from)} – ${dayLabel(shiftDay(from, days - 1))}`}{' '}
              ▾
            </button>
            <button
              className={button}
              aria-label="Next period"
              onClick={() => navigate(shiftDay(from, mode === 'agenda' ? 7 : days))}
            >
              ›
            </button>
          </div>
          <label className="calendar-room-filter">
            <span>Room</span>
            <select
              className="admin-panel-input"
              aria-label="Room"
              value={selectedRoom || ''}
              onChange={(event) => navigate(from, event.target.value)}
            >
              <option value="">All rooms</option>
              {rooms.map((room) => (
                <option value={room.id} key={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </label>
          <label className="calendar-group-filter">
            <span>Inventory view</span>
            <select
              className="admin-panel-input"
              value={group}
              onChange={(event) => {
                const view = event.target.value as 'room' | 'type';
                navigate(from, selectedRoom, days, view);
              }}
            >
              <option value="room">By room unit</option>
              <option value="type">By room type</option>
            </select>
          </label>
          <button
            className={`${button} calendar-primary`}
            disabled={!filtered.some((room) => room.active)}
            onClick={() =>
              setPanel({
                kind: 'close',
                roomId: anchor?.roomId || filtered.find((room) => room.active)?.id || '',
                start: anchor?.day || from,
                end: shiftDay(anchor?.day || from, 1),
              })
            }
          >
            Block dates
          </button>
        </div>
        {mode === 'agenda' && (
          <nav className="calendar-week-strip" aria-label="Seven-day calendar">
            {Array.from({ length: 7 }, (_, index) =>
              shiftDay(shiftDay(from, -((new Date(from + 'T12:00:00Z').getUTCDay() + 6) % 7)), index)
            ).map((day) => (
              <button
                key={day}
                type="button"
                aria-pressed={day === from}
                aria-current={day === today ? 'date' : undefined}
                aria-label={dayLabel(day, { weekday: 'long', month: 'long', day: 'numeric' })}
                onClick={() => navigate(day)}
              >
                <span>{dayLabel(day, { weekday: 'short' })}</span>
                <strong>{day.slice(-2)}</strong>
              </button>
            ))}
          </nav>
        )}
        <div className="calendar-feedback">
          <p role="status">
            {message || (mode === 'grid' ? 'Choose a start night and a last night in the same room.' : '')}
          </p>
          {anchor && (
            <button
              className={button}
              onClick={() => {
                setAnchor(null);
                setMessage('');
              }}
            >
              Clear selection
            </button>
          )}
        </div>
        <div className="calendar-key">
          <span>✓ Confirmed</span>
          <span>◷ Pending / hold</span>
          <span>▧ Closed</span>
          <span>Empty = available night · checkout releases the next cell</span>
        </div>
        {busy && (
          <p role="status" className="p-3 text-sm">
            Loading dates…
          </p>
        )}
        {!rooms.length ? (
          <p className="p-6">
            No rooms yet. <Link href="/admin/rooms/new">Add a room</Link> to manage availability.
          </p>
        ) : mode === 'agenda' ? (
          <div className="calendar-agenda">
            <h2>{dayLabel(from, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h2>
            {group === 'room'
              ? filtered.map(agendaRow)
              : types.map((type) => {
                  const units = filtered.filter((room) => room.roomTypeId === type);
                  if (!units.length) return null;
                  const count = availableUnitCount(units, from, blocks, bookings);
                  return (
                    <details className="calendar-type-agenda" key={type}>
                      <summary>
                        <strong>{units[0].roomTypeName}</strong>
                        <span>
                          {count.available} of {count.total} units available
                        </span>
                      </summary>
                      {units.map(agendaRow)}
                    </details>
                  );
                })}
          </div>
        ) : (
          <div
            className="calendar-scroll"
            role="region"
            aria-label="Room calendar — scroll dates horizontally"
            tabIndex={0}
          >
            <div
              role="table"
              aria-label="Room availability by night"
              className="calendar-table"
              style={{ minWidth: 190 + days * 58 }}
            >
              <div className="calendar-date-row" role="row">
                <div className="calendar-room" role="columnheader">
                  Room / unit
                </div>
                <div
                  className="calendar-date-columns"
                  style={{ gridTemplateColumns: `repeat(${days},minmax(58px,1fr))` }}
                >
                  {dates.map((date) => (
                    <div
                      role="columnheader"
                      key={date}
                      className={`${date === today ? 'today' : ''} ${[0, 6].includes(new Date(date + 'T12:00:00Z').getUTCDay()) ? 'weekend' : ''}`}
                      aria-label={`${date}${date === today ? ', today' : ''}`}
                    >
                      <span>{dayLabel(date, { weekday: 'short' })}</span>
                      <strong>{dayLabel(date)}</strong>
                      {date === today && <small>Today</small>}
                    </div>
                  ))}
                </div>
              </div>
              {group === 'room'
                ? filtered.map(row)
                : types.map((type) => {
                    const units = filtered.filter((room) => room.roomTypeId === type);
                    if (!units.length) return null;
                    const isExpanded = expanded.includes(type);
                    return (
                      <div key={type} role="rowgroup">
                        <div className="calendar-row calendar-type-row" role="row">
                          <div className="calendar-room" role="rowheader">
                            <button
                              className={button}
                              aria-expanded={isExpanded}
                              onClick={() =>
                                setExpanded((current) =>
                                  isExpanded ? current.filter((id) => id !== type) : [...current, type]
                                )
                              }
                            >
                              {isExpanded ? '−' : '+'} {units[0].roomTypeName}
                            </button>
                          </div>
                          <div
                            className="calendar-date-columns"
                            style={{ gridTemplateColumns: `repeat(${days},minmax(58px,1fr))` }}
                          >
                            {dates.map((date) => {
                              const count = availableUnitCount(units, date, blocks, bookings);
                              return (
                                <div
                                  role="cell"
                                  className="calendar-type-count"
                                  key={date}
                                  aria-label={`${date}: ${count.available} of ${count.total} units available`}
                                >
                                  <strong>
                                    {count.available}/{count.total}
                                  </strong>
                                  <span>available</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        {isExpanded && units.map(row)}
                      </div>
                    );
                  })}
            </div>
          </div>
        )}
        {!props.restricted && bookings.some((b) => b.unassignedTypeIds?.length || !b.roomIds.length) && (
          <div className="calendar-unallocated">
            <h2>Category reservations awaiting unit assignment</h2>
            <p>These affect category availability; no physical room is implied.</p>
            {bookings
              .filter((b) => b.unassignedTypeIds?.length || !b.roomIds.length)
              .map((b) => (
                <button key={b.id} className={button} onClick={() => setPanel({ kind: 'booking', booking: b })}>
                  {b.guestName || b.reference} · {b.checkIn} → {b.checkOut} · {b.status}
                </button>
              ))}
          </div>
        )}
      </section>
      {picker &&
        createPortal(
          <div className="calendar-backdrop">
            <div
              ref={pickerRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-label="Choose calendar date range"
              className="calendar-date-picker"
            >
              <h2>{mode === 'agenda' ? 'Go to date' : 'Choose calendar range'}</h2>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const values = new FormData(event.currentTarget),
                    start = String(values.get('from')),
                    end = String(values.get('to'));
                  if (mode === 'grid' && (!validDay(end) || end < start || nights(start, end) > 27)) {
                    (event.currentTarget.elements.namedItem('to') as HTMLInputElement).setCustomValidity(
                      'Choose a range between 1 and 28 days.'
                    );
                    event.currentTarget.reportValidity();
                    return;
                  }
                  navigate(start, selectedRoom, mode === 'grid' ? nights(start, end) + 1 : days);
                }}
              >
                <label>
                  Start date
                  <input type="date" name="from" required defaultValue={from} />
                </label>
                {mode === 'grid' && (
                  <label>
                    Last displayed date
                    <input
                      type="date"
                      name="to"
                      required
                      defaultValue={shiftDay(from, days - 1)}
                      onChange={(event) => event.currentTarget.setCustomValidity('')}
                    />
                  </label>
                )}
                <button className={`${button} calendar-primary`}>Show dates</button>
                <button type="button" className={button} onClick={() => setPicker(false)}>
                  Cancel
                </button>
              </form>
            </div>
          </div>,
          document.body
        )}
      {panel &&
        createPortal(
          <div
            className="calendar-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) closePanel();
            }}
          >
            <div
              ref={drawer}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-label={
                panel.kind === 'booking'
                  ? 'Booking details'
                  : panel.kind === 'block'
                    ? 'Closure details'
                    : 'Block dates'
              }
              className="calendar-drawer"
            >
              <header>
                <h2>
                  {panel.kind === 'booking'
                    ? 'Booking details'
                    : panel.kind === 'block'
                      ? 'Closure details'
                      : 'Block dates'}
                </h2>
                <button aria-label="Close drawer" className={button} onClick={() => closePanel()}>
                  ×
                </button>
              </header>
              {panel.kind === 'booking' ? (
                <>
                  <h3>
                    {props.restricted
                      ? 'Inventory reservation'
                      : panel.booking.guestName || panel.booking.reference || 'Reservation'}
                  </h3>
                  <p>
                    {!props.restricted && panel.booking.reference && panel.booking.reference + ' · '}
                    {panel.booking.status}
                  </p>
                  {!props.restricted && panel.booking.guestCount != null && (
                    <p>{panel.booking.guestCount} guests in this booking</p>
                  )}
                  {panel.booking.status === 'held' && !liveStay(panel.booking, now) && (
                    <p role="status">Hold expired — these nights have been released.</p>
                  )}
                  <p>
                    Check-in {panel.booking.checkIn}
                    <br />
                    Checkout {panel.booking.checkOut} · {nights(panel.booking.checkIn, panel.booking.checkOut)}{' '}
                    nights
                  </p>
                  {panel.booking.holdExpiresAt && (
                    <p>
                      Hold expires{' '}
                      {new Date(panel.booking.holdExpiresAt).toLocaleString('en', {
                        timeZone: props.timeZone || 'Europe/Tirane',
                      })}{' '}
                      ({props.timeZone || 'Europe/Tirane'})
                    </p>
                  )}
                  {!props.restricted && (
                    <Link
                      onClick={saveScroll}
                      className={`${button} calendar-primary`}
                      href={
                        `/admin/bookings/${panel.booking.id}?` +
                        new URLSearchParams({ calendarReturn: location.pathname + location.search })
                      }
                    >
                      Open full booking
                    </Link>
                  )}
                </>
              ) : panel.kind === 'block' ? (
                <>
                  <h3>{panel.block.targetName}</h3>
                  <p>
                    {panel.block.startDate} through {panel.block.endDate} ·{' '}
                    {nights(panel.block.startDate, shiftDay(panel.block.endDate, 1))} closed nights
                  </p>
                  <p>Reopens {shiftDay(panel.block.endDate, 1)}</p>
                  <p>
                    {panel.block.reasonCode.replaceAll('_', ' ')}
                    {panel.block.reason ? ' · ' + panel.block.reason : ''}
                  </p>
                  {panel.block.notes && <p>Internal note: {panel.block.notes}</p>}
                  {panel.block.source === 'manual' ? (
                    <>
                      <p>Source: Manual block</p>
                      <Reopen block={panel.block} onSaved={saved} />
                    </>
                  ) : (
                    <p>
                      Source: {panel.block.sourceName || panel.block.source.replaceAll('_', ' ')}. Manage this
                      closure in the connected calendar.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <AvailabilityBlockForm
                    rooms={rooms.filter((room) => room.active)}
                    defaultTarget={panel.roomId ? `room:${panel.roomId}` : ''}
                    defaultStartDate={panel.start}
                    defaultEndDate={shiftDay(panel.end, -1)}
                    onCancel={closePanel}
                    onSaved={saved}
                    onRangeChange={updateSelection}
                    conflict={
                      conflict
                        ? `Inventory is unavailable on ${dayLabel(conflict)}. Choose different nights.`
                        : undefined
                    }
                    unitOnly={props.restricted}
                  />
                  {!props.restricted &&
                    selectedUnit &&
                    selection &&
                    validDay(selection.start) &&
                    validDay(selection.end) &&
                    selection.end >= selection.start && (
                      <Link
                        className={button}
                        href={bookingHref(selectedUnit, selection.start, shiftDay(selection.end, 1))}
                      >
                        Open manual booking form
                      </Link>
                    )}
                </>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
function Reopen({ block, onSaved }: { block: AvailabilityBlock; onSaved: (message: string) => void }) {
  const [state, action, pending] = useActionState(reopenAvailabilityState, { ok: false, message: '' });
  const submitting = useRef(false);
  useEffect(() => {
    if (!pending) submitting.current = false;
  }, [pending, state]);
  useEffect(() => {
    if (state.ok) onSaved(state.message);
  }, [state, onSaved]);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (submitting.current || pending || state.ok) e.preventDefault();
        else submitting.current = true;
      }}
    >
      <input type="hidden" name="id" value={block.id} />
      <label className="flex gap-2">
        <input type="checkbox" required />
        Confirm reopening {block.targetName}, {block.startDate} through {block.endDate}
      </label>
      <p role="status">{state.message}</p>
      <button className={button} disabled={pending || state.ok}>
        {pending ? 'Reopening…' : state.ok ? 'Reopened' : 'Reopen dates'}
      </button>
    </form>
  );
}
