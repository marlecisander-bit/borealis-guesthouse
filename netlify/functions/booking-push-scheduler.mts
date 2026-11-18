export const config = { schedule: '* * * * *' };

export default async function runBookingPush() {
  const secret = process.env.BOOKING_PUSH_WORKER_SECRET;
  const origin = process.env.APP_URL;
  if (!secret || secret.length < 32 || !origin) return new Response(null, { status: 204 });
  const destination = new URL('/api/internal/booking-push', origin);
  if (destination.protocol !== 'https:' || destination.username || destination.password) return new Response(null, { status: 503 });
  try {
    const result = await fetch(destination, {
      method: 'POST', headers: { Authorization: `Bearer ${secret}` }, redirect: 'error', signal: AbortSignal.timeout(23000),
    });
    return new Response(null, { status: result.ok ? 204 : 503 });
  } catch {
    return new Response(null, { status: 503 });
  }
}
