'use server';

import { revalidatePath } from 'next/cache';
import { requireTeamMember } from '@/lib/admin/team-session';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function saveTeamWorkspace(_state:{ok:boolean;message:string}, form:FormData) {
  const member = await requireTeamMember();
  const operation=String(form.get('operation') || '');
  const fields=Object.fromEntries([...form.entries()].filter(([key,value])=>!key.startsWith('$') && typeof value==='string'));
  const target=String(form.get('target') || '');
  if(target && !/^[\da-f-]{36}$/i.test(target))return {ok:false,message:'Choose a valid item.'};
  const db=await createServerSupabaseClient();
  const {error}=await db.rpc('team_workspace_write',{
    target_property:member.propertyId,operation,target:target||null,
    payload:{...fields,...(operation==='room_content'?{amenities:form.getAll('amenity')}:{}),
      active:form.get('active')==='on',infantsCount:form.get('infantsCount')==='on'},
  });
  if(error)return {ok:false,message:error.code==='42501'?'Your current access does not allow this change.':error.code==='23P01'?'These dates overlap a booking or an existing block.':'The change could not be saved. Check the selected item and entered values.'};
  revalidatePath('/admin/workspace','layout');
  if (['publish','rate','room_content','room_capacity','offer'].includes(operation)) revalidatePath('/','layout');
  return {ok:true,message:operation==='publish'?'Changes published.':operation==='draft'?'Draft saved.':'Change saved.'};
}
