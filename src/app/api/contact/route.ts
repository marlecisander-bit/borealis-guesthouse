import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  subject?: unknown;
  message?: unknown;
  website?: unknown;
};

const value = (input: unknown) => typeof input === 'string' ? input.trim() : '';

export async function POST(request: Request) {
  let body: ContactPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid contact request.' }, { status: 400 });
  }

  // Honeypot submissions receive a neutral response without touching the database.
  if (value(body.website)) return NextResponse.json({ ok: true });

  const payload = {
    sender_name: value(body.name),
    sender_email: value(body.email),
    sender_phone: value(body.phone),
    inquiry_subject: value(body.subject),
    inquiry_message: value(body.message),
  };
  if (payload.sender_name.length < 2 || !/^\S+@\S+\.\S+$/.test(payload.sender_email) || payload.inquiry_subject.length < 2 || payload.inquiry_message.length < 10) {
    return NextResponse.json({ error: 'Complete the required contact fields.' }, { status: 400 });
  }

  const db = await createServerSupabaseClient();
  const { error } = await db.rpc('submit_contact_inquiry', payload);
  if (error) {
    const migrationMissing = error.code === 'PGRST202' || error.message.includes('submit_contact_inquiry');
    const unavailable = error.code === '55000';
    const limited = error.code === '54000';
    return NextResponse.json({ error: migrationMissing
      ? 'Contact storage is not ready. Apply migration 20260904_022_frontend_readiness.sql.'
      : unavailable
        ? 'Contact is temporarily unavailable while the property is unpublished.'
        : limited
          ? 'Too many messages were submitted. Please try again later.'
          : 'Your message could not be saved. Please try again.' }, { status: limited ? 429 : 503 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

