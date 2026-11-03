// Browser-only fixture contract. Never imported by src/ or used as a Next route.
export function createFixtureTransport({ validateBookingSearch, findAccommodationOptions, calculateStayPriceFromCatalog, scenario = 'available' }) {
  const calls = [], violations = [];
  let hold = null, confirmed = false, cancelled = false;
  const image = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#315f43"/><text x="30" y="200" fill="white" font-size="30">SYNTHETIC ROOM</text></svg>');
  const rooms = [
    { id: '10000000-0000-4000-8000-000000000001', slug: 'fixture-double', name: 'Fictional Double', capacity: 2, base: 80, seasonal: 100, units: 2 },
    { id: '10000000-0000-4000-8000-000000000002', slug: 'fixture-family', name: 'Fictional Family', capacity: 4, base: 140, seasonal: 160, units: 1 },
  ];
  const reject = message => { violations.push(message); throw new Error('FIXTURE BOUNDARY: ' + message); };
  const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
  async function fetchFixture(input, init = {}) {
    if (typeof input !== 'string') return reject('Only explicit fixture URL strings are allowed');
    const url = new URL(input, 'http://127.0.0.1:3107');
    if (url.origin !== 'http://127.0.0.1:3107' || url.username || url.password || url.search || url.hash || /[%\\]/.test(input)) return reject('Unexpected URL');
    const headers = new Headers(init.headers);
    if (init.method !== 'POST' || headers.get('content-type') !== 'application/json' || [...headers.keys()].some(k => k !== 'content-type') || init.credentials === 'include') return reject('Unexpected method/headers/credentials');
    if (!['/api/pricing', '/api/bookings/hold', '/api/bookings/confirm', '/__fixtures/cancel'].includes(url.pathname)) return reject('Unexpected endpoint');
    let body; try { body = JSON.parse(init.body); } catch { return reject('Invalid JSON'); }
    calls.push({ path: url.pathname, method: 'POST' });
    if (url.pathname === '/api/pricing') {
      const search = validateBookingSearch(body, '2026-10-21');
      if (!search) return json({ error: 'Fixture: choose valid dates and consistent guest counts.' }, 400);
      if (scenario === 'empty') return json({ options: [] });
      if (scenario === 'pricing-error') return json({ error: 'Fixture: pricing is temporarily unavailable.' }, 503);
      const candidates = rooms.map(value => {
        const room = { ...value, image, gallery: [], eyebrow: '', description: 'Synthetic room; not real inventory.', longDescription: '', beds: String(value.capacity), size: '', viewType: '', amenities: [], priceFrom: value.base, currency: 'EUR', seo: { title: value.name, description: '' }, occupancyPolicy: { maxAdults: value.capacity, maxChildren: value.capacity, maxInfants: 1, maxTotalOccupancy: value.capacity, minAdults: 1, infantsCountTowardCapacity: true } };
        const quote = calculateStayPriceFromCatalog({ currency: 'EUR', baseRates: [{ roomTypeId: room.id, amount: value.base, active: true }], seasonalRates: [{ id: 'fixture-season', name: 'Synthetic season', roomTypeIds: [room.id], startDate: '2026-11-18', endDate: '2026-11-30', amount: value.seasonal, active: true }], minimumStayRules: [] }, room.id, search.checkIn, search.checkOut);
        return { room, availableUnits: value.units, quotes: Array.from({ length: room.capacity }, (_, i) => ({ guests: i + 1, subtotal: quote.subtotal, currency: quote.currency, nights: quote.nights, minimumStay: 1 })) };
      });
      return json({ options: findAccommodationOptions(candidates, search) });
    }
    if (url.pathname === '/api/bookings/hold') {
      if (scenario === 'hold-error') return json({ error: 'Fixture: rooms are no longer available.' }, 409);
      const search = validateBookingSearch(body.search, '2026-10-21');
      if (!search || !Array.isArray(body.rooms) || !body.rooms.length || !body.guest?.firstName || !body.guest?.lastName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.guest.email || '') || !body.guest.phone) return json({ error: 'Fixture: complete valid guest information.' }, 400);
      hold = { id: 'FIXTURE-HOLD-ONLY', token: 'FIXTURE-TOKEN-NOT-VALID', reference: 'FICTIONAL-BOREALIS-0001', expiresAt: '2026-10-21T13:00:00Z', total: 0, currency: 'EUR' };
      return json(hold);
    }
    if (url.pathname === '/api/bookings/confirm') {
      if (scenario === 'confirm-error') return json({ error: 'Fixture: confirmation failed; no real reservation exists.' }, 409);
      if (!hold || body.id !== hold.id || body.token !== hold.token) return json({ error: 'Fixture: invalid hold.' }, 409);
      confirmed = true;
      return json({ reference: hold.reference, status: 'confirmed', token: hold.token });
    }
    if (!confirmed || body.reference !== hold?.reference) return json({ error: 'Fixture: no synthetic confirmation to cancel.' }, 409);
    cancelled = true;
    return json({ status: 'cancelled', reference: hold.reference });
  }
  return { fetch: fetchFixture, calls, violations, state: () => ({ confirmed, cancelled, hasHold: !!hold }) };
}
