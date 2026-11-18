'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function acceptInvitation(invitation:string) {
  if (!/^[\da-f-]{36}$/i.test(invitation)) return false;
  const db=await createServerSupabaseClient();
  const {data:{user}}=await db.auth.getUser();
  if (!user) return false;
  const {data,error}=await db.rpc('team_accept',{invitation});
  return Boolean(data && !error);
}
