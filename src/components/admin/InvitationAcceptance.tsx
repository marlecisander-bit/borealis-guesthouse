'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { acceptInvitation } from '@/app/team/accept/actions';

export function InvitationAcceptance({invitation}:{invitation:string}) {
  const [db] = useState(createClient);
  const [identity,setIdentity] = useState('');
  const [message,setMessage] = useState('');
  const [busy,setBusy] = useState(false);

  useEffect(()=>{
    const {data:{subscription}}=db.auth.onAuthStateChange((_event,session)=>setIdentity(session?.user.email || ''));
    return ()=>subscription.unsubscribe();
  },[db]);

  async function submit(form: FormData) {
    setBusy(true);
    setMessage('');
    try {
      if (!identity) {
        const {error}=await db.auth.signInWithPassword({email:String(form.get('email')),password:String(form.get('password'))});
        if (error) { setMessage('Could not sign in. Check your credentials or ask the owner for a new invitation.'); return; }
      } else {
        const password = String(form.get('newPassword') || '');
        if (password) {
          const {error}=await db.auth.updateUser({password});
          if (error) { setMessage('The password could not be saved. Choose another password.'); return; }
        }
      }
      if (await acceptInvitation(invitation)) window.location.assign(new URL('/admin/workspace',window.location.origin).href);
      else setMessage('This invitation has expired, was cancelled, or belongs to a different verified account.');
    } catch { setMessage('The invitation could not be accepted. Try again.'); }
    finally { setBusy(false); }
  }

  return <main className="min-h-dvh bg-ivory p-4">
    <div className="mx-auto max-w-lg space-y-4 rounded-xl border border-stone-200 bg-white p-5">
      <h1 className="text-2xl font-bold">Join the Borealis team</h1>
      {!invitation ? <p role="alert">The invitation link is incomplete.</p> : <form action={submit} className="grid gap-3">
        {identity ? <>
          <p>Signed in as <strong>{identity}</strong></p>
          <label>Set a password for future sign-ins (optional)<input name="newPassword" type="password" minLength={12} autoComplete="new-password" className="min-h-11 w-full rounded border px-3"/></label>
          <button type="button" className="min-h-11 underline" onClick={()=>void db.auth.signOut()}>Use a different account</button>
        </> : <>
          <label>Email<input name="email" type="email" required autoComplete="email" className="min-h-11 w-full rounded border px-3"/></label>
          <label>Password<input name="password" type="password" required autoComplete="current-password" className="min-h-11 w-full rounded border px-3"/></label>
        </>}
        {message && <p role="alert">{message}</p>}
        <button disabled={busy} className="min-h-11 rounded-lg bg-brand px-4 text-white">{identity?'Accept invitation':'Sign in and accept invitation'}</button>
      </form>}
    </div>
  </main>;
}
