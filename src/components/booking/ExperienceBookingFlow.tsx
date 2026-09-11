'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatMoney } from '@/lib/pricing/format';

type Slot = { slotId: string | null; date: string; startTime: string; endTime: string; remaining: number };
type Guest = { firstName: string; lastName: string; email: string; phone: string; country: string; notes: string };
type Experience = {
  id: string;
  title: string;
  price: number | null;
  currency: string;
  priceType: string;
  minimumQuantity: number;
  maxCapacity: number | null;
  slots: Slot[];
};

const blankGuest: Guest = { firstName: '', lastName: '', email: '', phone: '', country: '', notes: '' };

export function ExperienceBookingFlow({ experience, initialDate = '', initialTime = '', initialQuantity }: {
  experience: Experience;
  initialDate?: string;
  initialTime?: string;
  initialQuantity?: number;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [availability, setAvailability] = useState(experience.slots);
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [quantity, setQuantity] = useState(initialQuantity || experience.minimumQuantity);
  const [guest, setGuest] = useState(blankGuest);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const dates = useMemo(() => [...new Set(availability.map((slot) => slot.date))], [availability]);
  const slots = availability.filter((slot) => slot.date === date);
  const hasTimes = slots.some((slot) => slot.startTime);
  const selected = slots.find((slot) => slot.startTime === time) || (!hasTimes ? slots[0] : undefined);
  const dateRemaining = slots.length ? Math.max(...slots.map((slot) => slot.remaining)) : 0;
  const maximum = Math.max(0, Math.min(experience.maxCapacity ?? 99, selected?.remaining ?? dateRemaining));
  const lineQuantity = experience.priceType.includes('per person') ? quantity : 1;
  const total = (experience.price || 0) * lineQuantity;
  const validGuest = Boolean(
    guest.firstName.trim() && guest.lastName.trim() && guest.phone.trim() && /^\S+@\S+\.\S+$/.test(guest.email),
  );

  async function refreshAvailability() {
    setRefreshing(true);
    try {
      const fromDate = date || new Date().toISOString().slice(0, 10);
      const response = await fetch(
        `/api/bookings/experience?experienceId=${encodeURIComponent(experience.id)}&fromDate=${encodeURIComponent(fromDate)}`,
        { cache: 'no-store' },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setAvailability(payload.slots);
      return payload.slots as Slot[];
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Availability could not be refreshed.');
      return [];
    } finally {
      setRefreshing(false);
    }
  }

  function next() {
    setError('');
    if (step === 2 && (!date || !selected || selected.remaining < experience.minimumQuantity)) {
      setError('Choose an available date and time.');
      return;
    }
    if (step === 3 && (quantity < experience.minimumQuantity || quantity > maximum)) {
      setError(`Choose between ${experience.minimumQuantity} and ${maximum}.`);
      return;
    }
    if (step === 4 && !validGuest) {
      setError('Enter your full name, a valid email address and phone number.');
      return;
    }
    setStep((current) => Math.min(5, current + 1));
  }

  async function confirm() {
    setBusy(true);
    setError('');
    try {
      const holdResponse = await fetch('/api/bookings/experience', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ experienceId: experience.id, serviceDate: date, serviceTime: time || null, participants: quantity, guest }),
      });
      const hold = await holdResponse.json();
      if (!holdResponse.ok) throw new Error(hold.error);
      const response = await fetch('/api/bookings/confirm', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: hold.id, token: hold.token }),
      });
      const confirmation = await response.json();
      if (!response.ok) throw new Error(confirmation.error);
      router.replace(`/booking/confirmation/${confirmation.token}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Booking failed.');
      await refreshAvailability();
      setBusy(false);
    }
  }

  return <section className="mx-auto max-w-3xl rounded-[2rem] bg-white p-5 shadow-sm sm:p-7 md:p-10">
    <p className="eyebrow">Book experience</p>
    <h1 className="mt-3 font-serif text-4xl text-lake sm:text-5xl">{experience.title}</h1>
    <ol className="my-8 grid grid-cols-5 gap-1.5" aria-label="Booking progress">
      {['Experience', 'Date & time', 'Quantity', 'Guest', 'Review'].map((label, index) => <li key={label} className={`rounded-full px-1 py-2 text-center text-[10px] font-bold sm:text-xs ${index + 1 <= step ? 'bg-lake text-white' : 'bg-ivory text-muted'}`}>{label}</li>)}
    </ol>

    {step === 1 && <Block title="Your experience"><div className="rounded-2xl bg-ivory p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-muted">Selected</p>
      <p className="mt-2 font-serif text-3xl text-lake">{experience.title}</p>
      <p className="mt-2 text-sm text-muted">{experience.price === null ? 'Price on request' : `${formatMoney(experience.price, experience.currency)} / ${experience.priceType}`}</p>
    </div></Block>}

    {step === 2 && <Block title="Choose date and time">
      <div className="mb-4 flex justify-end"><button type="button" onClick={refreshAvailability} disabled={refreshing} className="text-sm font-bold text-lake underline">{refreshing ? 'Refreshing...' : 'Refresh availability'}</button></div>
      {dates.length ? <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">{dates.map((value) => {
          const remaining = Math.max(...availability.filter((slot) => slot.date === value).map((slot) => slot.remaining));
          return <button type="button" key={value} disabled={remaining < experience.minimumQuantity} onClick={() => { setDate(value); setTime(''); }} className={`rounded-xl p-4 text-left font-bold ${date === value ? 'bg-lake text-white' : 'bg-ivory text-lake'} disabled:cursor-not-allowed disabled:opacity-50`}>
            <span className="block">{formatDate(value)}</span><small className="mt-1 block font-normal">{remaining === 0 ? 'Sold out' : remaining <= 3 ? 'Limited availability' : 'Available'}</small>
          </button>;
        })}</div>
        {date && hasTimes && <div><p className="mb-3 text-sm font-bold text-lake">Available times</p><div className="grid gap-3 sm:grid-cols-2">
          {slots.map((slot) => <button type="button" key={`${slot.date}:${slot.startTime}`} disabled={slot.remaining < experience.minimumQuantity} onClick={() => setTime(slot.startTime)} className={`rounded-xl p-4 text-left ${time === slot.startTime ? 'bg-green text-white' : 'bg-ivory text-lake'} disabled:opacity-50`}>
            <strong>{slot.startTime.slice(0, 5)}</strong><small className="block">{slot.remaining ? `${slot.remaining} available` : 'Sold out'}</small>
          </button>)}
        </div></div>}
      </div> : <p className="rounded-xl bg-ivory p-5 text-muted">No bookable dates are currently published.</p>}
    </Block>}

    {step === 3 && <Block title="Quantity / participants"><label className="block text-sm font-bold text-lake">Quantity
      <input type="number" min={experience.minimumQuantity} max={maximum} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} className="booking-input mt-2 rounded-xl bg-ivory px-4" />
    </label><p className="mt-3 text-sm text-muted">Minimum {experience.minimumQuantity} / up to {maximum} currently available.</p></Block>}

    {step === 4 && <Block title="Guest details"><div className="grid gap-4 sm:grid-cols-2">
      {(['firstName', 'lastName', 'email', 'phone', 'country'] as const).map((key) => <label key={key} className="text-sm font-bold capitalize text-lake">{key.replace(/([A-Z])/g, ' $1')}
        <input required={key !== 'country'} value={guest[key]} type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'} onChange={(event) => setGuest({ ...guest, [key]: event.target.value })} className="booking-input mt-2 rounded-xl bg-ivory px-4" />
      </label>)}
      <label className="text-sm font-bold text-lake sm:col-span-2">Special requests<textarea value={guest.notes} onChange={(event) => setGuest({ ...guest, notes: event.target.value })} className="booking-input mt-2 rounded-xl bg-ivory p-4" /></label>
    </div></Block>}

    {step === 5 && <Block title="Review"><dl className="space-y-3 rounded-xl bg-ivory p-5">
      <Line label="Experience" value={experience.title} /><Line label="Date" value={formatDate(date)} /><Line label="Time" value={time || 'Flexible'} /><Line label="Quantity" value={String(quantity)} />
      <Line label="Guest" value={`${guest.firstName} ${guest.lastName}`} /><Line label="Email" value={guest.email} /><Line label="Phone" value={guest.phone} />
      <Line label="Total" value={experience.price === null ? 'On request' : formatMoney(total, experience.currency)} /><Line label="Payment" value="Pay at property / pending" />
    </dl><p className="mt-3 text-xs text-muted">Availability and price are checked again securely when you confirm.</p></Block>}

    {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
    <div className="mt-7 flex gap-3">
      {step > 1 && <button type="button" onClick={() => { setError(''); setStep((current) => current - 1); }} className="min-h-14 rounded-xl border border-lake/20 px-6 font-bold">Back</button>}
      <button type="button" disabled={busy || (step === 2 && !dates.length)} onClick={step === 5 ? confirm : next} className="min-h-14 flex-1 rounded-xl bg-lake px-6 font-bold text-white disabled:opacity-50">{busy ? 'Confirming...' : step === 5 ? 'Confirm booking' : 'Continue'}</button>
    </div>
  </section>;
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><h2 className="mb-5 font-serif text-3xl text-lake">{title}</h2>{children}</div>;
}

function Line({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4"><dt className="text-muted">{label}</dt><dd className="text-right font-bold text-lake">{value}</dd></div>;
}
