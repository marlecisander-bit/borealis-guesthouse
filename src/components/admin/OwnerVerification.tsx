'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function OwnerVerification({returnTo}:{returnTo:string}) {
  const [factor, setFactor] = useState('');
  const [setup, setSetup] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function initialize() {
    setBusy(true);
    setMessage('');
    try {
      const db = createClient();
      const {data,error} = await db.auth.mfa.listFactors();
      if (error) throw error;
      const enrolled = data.totp.find(item=>item.status==='verified');
      if (enrolled) setFactor(enrolled.id);
      else {
        const result = await db.auth.mfa.enroll({factorType:'totp',issuer:'Borealis Guest House'});
        if (result.error) throw result.error;
        setFactor(result.data.id);
        setSetup(result.data.totp.secret);
      }
    } catch {
      setMessage('Could not prepare verification. Try again or contact your Supabase administrator.');
    } finally { setBusy(false); }
  }

  async function verify() {
    setBusy(true);
    setMessage('');
    try {
      const {error} = await createClient().auth.mfa.challengeAndVerify({factorId:factor,code});
      if (error) throw error;
      window.location.assign(new URL(returnTo,window.location.origin).href);
    } catch {
      setMessage('Verification failed. Enter the current code from your authenticator.');
    } finally { setBusy(false); }
  }

  return <main className="min-h-dvh bg-ivory p-4 sm:p-8">
    <div className="mx-auto max-w-lg space-y-4 rounded-xl border border-stone-200 bg-white p-5">
      <h1 className="text-2xl font-bold">Verify admin access</h1>
      <p>Use a time-based code from your authenticator app.</p>
      {!factor ? <button type="button" disabled={busy} onClick={()=>void initialize()} className="min-h-11 rounded-lg bg-brand px-4 text-white">Continue</button> :
        <form onSubmit={event=>{event.preventDefault();void verify();}} className="grid gap-3">
          {setup && <div className="rounded bg-stone-100 p-3">
            <p>Add Borealis to your authenticator with this setup key.</p>
            <code className="break-all">{setup}</code>
          </div>}
          <label>Verification code<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required value={code} onChange={event=>setCode(event.target.value)} className="mt-1 min-h-11 w-full rounded border px-3"/></label>
          <button disabled={busy} className="min-h-11 rounded-lg bg-brand px-4 text-white">Verify</button>
        </form>}
      {message && <p role="alert">{message}</p>}
    </div>
  </main>;
}
