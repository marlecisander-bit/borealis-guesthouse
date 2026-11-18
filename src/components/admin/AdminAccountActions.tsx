'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export function AdminAccountActions() {
  const {signOut}=useAuth(), router=useRouter();
  const [pending,setPending]=useState(false), [error,setError]=useState(false);

  async function leave() {
    setPending(true);
    setError(false);
    try {
      await signOut();
      router.replace('/admin/login');
      router.refresh();
    } catch {
      setPending(false);
      setError(true);
    }
  }

  return <div>
    <button type="button" onClick={()=>void leave()} disabled={pending} className="min-h-11 rounded-lg px-3 text-sm font-bold text-red-800">{pending?'Signing out…':'Sign out'}</button>
    {error&&<p role="alert" className="text-sm text-red-800">Sign-out failed. Try again.</p>}
  </div>;
}
