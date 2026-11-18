'use client';

import {createClient} from '@/lib/supabase/client';

export function WorkspaceAccount() {
  return <div className="flex flex-wrap items-center gap-3 text-sm">
    <button className="min-h-11 rounded-lg border px-3" onClick={async()=>{await createClient().auth.signOut();window.location.assign(new URL('/admin/login',window.location.origin).href);}}>Sign out</button>
  </div>;
}
