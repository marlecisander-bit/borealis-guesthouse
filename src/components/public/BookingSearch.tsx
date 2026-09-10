export function BookingSearch({ hero = false }: { hero?: boolean }) {
  return (
    <form
      action="/book"
      aria-label="Check room availability"
      className={`grid gap-2 bg-white p-3 text-charcoal shadow-2xl shadow-lake/20 md:grid-cols-[1fr_1fr_.7fr_auto] ${hero ? 'rounded-[1.35rem] md:rounded-[1.5rem]' : 'rounded-[1.5rem]'}`}
    >
      <label className="rounded-xl bg-ivory px-4 py-3 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-muted">
        Check-in
        <input name="checkIn" type="date" className="mt-1 block min-h-7 w-full bg-transparent text-base font-medium text-charcoal outline-none" />
      </label>
      <label className="rounded-xl bg-ivory px-4 py-3 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-muted">
        Check-out
        <input name="checkOut" type="date" className="mt-1 block min-h-7 w-full bg-transparent text-base font-medium text-charcoal outline-none" />
      </label>
      <label className="rounded-xl bg-ivory px-4 py-3 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-muted">
        Guests
        <select name="guests" defaultValue="2" className="mt-1 block min-h-7 w-full bg-transparent text-base font-medium text-charcoal outline-none">
          <option value="1">1 guest</option><option value="2">2 guests</option><option value="3">3 guests</option><option value="4">4 guests</option>
        </select>
      </label>
      <button className="min-h-14 rounded-xl bg-lake px-6 py-4 text-sm font-bold text-white transition hover:bg-green">
        Check availability
      </button>
    </form>
  );
}
