'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { effectiveTeamPermissions } from '@/lib/admin/team-permissions';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceSupabaseClient } from '@/lib/supabase/service';

const operations = new Set(['invite','resend','cancel','permissions','suspend','restore','create_role']);

export async function updateTeam(_previous:{message:string;ok:boolean}, form:FormData) {
  const admin = await requireAdmin(['owner']);
  const operation = String(form.get('operation') || '');
  const target = String(form.get('target') || '');
  if (!operations.has(operation) || (!['invite','create_role'].includes(operation) && !/^[\da-f-]{36}$/i.test(target))) return {ok:false,message:'Choose a valid team action.'};
  let permissions;
  try { permissions=effectiveTeamPermissions(form.getAll('permission').map(String)); }
  catch { return {ok:false,message:'Choose supported permissions.'}; }

  const sends = operation === 'invite' || operation === 'resend';
  let delivery;
  let origin: URL | undefined;
  if (sends) {
    try {
      origin = new URL(process.env.APP_URL || '');
      if (origin.protocol !== 'https:' && !(origin.protocol === 'http:' && ['localhost','127.0.0.1'].includes(origin.hostname))) throw new Error();
      delivery = createServiceSupabaseClient();
    } catch { return {ok:false,message:'Invitation delivery is unavailable. Configure the trusted site URL and Supabase Auth service key.'}; }
  }
  const db=await createServerSupabaseClient();
  const {data,error}=await db.rpc('team_manage',{
    target_property:admin.propertyId,operation,target:target||null,
    payload:{email:form.get('email'),name:form.get('name'),preset:form.get('preset'),roleId:form.get('roleId'),permissions},
  });
  if (error) return {ok:false,message:error.code==='23505'?'That role name or team membership already exists.':'The team change could not be saved.'};
  revalidatePath('/admin/settings/team');
  if (delivery && origin && data?.email && data?.id) {
    const link=new URL('/team/accept',origin);
    link.searchParams.set('invitation',data.id);
    try {
      const {error:mailError}=await delivery.auth.admin.inviteUserByEmail(data.email,{redirectTo:link.toString()});
      if (!mailError) return {ok:true,message:'Invitation sent.'};
    } catch { /* The reserved invitation can be retried or accepted by a verified existing account. */ }
    return {ok:false,message:'Invitation saved. Supabase did not confirm email delivery. Resend, or share this acceptance link with the verified existing account.',link:link.toString()};
  }
  return {ok:true,message:'Team change saved.'};
}
