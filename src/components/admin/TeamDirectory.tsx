'use client';

import { useActionState, useState } from 'react';
import { updateTeam } from '@/app/admin/settings/team/actions';
import { dependsOn, effectiveTeamPermissions, permissionGroups, permissionLabels, teamPresets, type TeamPermission } from '@/lib/admin/team-permissions';

export type TeamMember = {
  id:string; name:string|null; email:string; preset:string;
  permissions:TeamPermission[]|null; status:'Invited'|'Active'|'Suspended';
};

export type TeamRole = { id:string; name:string; permissions:TeamPermission[] };

const input='min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3';
const primary='min-h-11 rounded-lg bg-brand px-4 text-sm font-semibold text-white disabled:opacity-60';
const secondary='min-h-11 rounded-lg border border-stone-300 px-4 text-sm font-semibold disabled:opacity-60';

export function TeamDirectory({ members, roles }: { members:TeamMember[]; roles:TeamRole[] }) {
  const [query,setQuery]=useState('');
  return <div className="space-y-5">
    <details className="rounded-xl border border-stone-200 bg-white p-4">
      <summary className="cursor-pointer font-bold">Create role</summary>
      <TeamForm roles={roles} createRole />
      {roles.length > 0 && (
        <ul aria-label="Saved roles" className="mt-4 space-y-2 border-t border-stone-200 pt-4">
          {roles.map(role => <li key={role.id} className="break-words text-sm">
            <strong>{role.name}</strong>
            <p>{role.permissions.map(permission => permissionLabels.get(permission)).join(' · ') || 'No workspace access'}</p>
          </li>)}
        </ul>
      )}
    </details>
    <details className="rounded-xl border border-stone-200 bg-white p-4">
      <summary className="cursor-pointer font-bold">Invite user</summary>
      <TeamForm roles={roles}/>
    </details>
    <label className="block">Search team<input className={input} value={query} onChange={event=>setQuery(event.target.value)} type="search" placeholder="Name or email"/></label>
    <ul className="space-y-2">
      {members.filter(member=>`${member.name} ${member.email} ${member.preset}`.toLowerCase().includes(query.trim().toLowerCase())).map(member=>
        <li key={member.id} className="rounded-xl border border-stone-200 bg-white p-4">
          <details>
            <summary className="cursor-pointer">
              <span className="font-semibold">{member.name || member.email}</span>
              <span className="ml-2 rounded bg-stone-100 px-2 py-1 text-xs">{member.status}</span>
              <span className="block break-all text-sm text-slate-600">{member.email} · {member.preset}</span>
            </summary>
            {member.preset==='Super Admin' ? <p className="mt-3 text-sm">Protected ownership account.</p> : <TeamForm member={member} roles={roles}/>}
          </details>
        </li>)}
    </ul>
  </div>;
}

function TeamForm({ member, roles, createRole = false }: { member?:TeamMember; roles:TeamRole[]; createRole?:boolean }) {
  const savedRole = roles.find(role => role.name === member?.preset);
  const initialPreset=member?.preset && member.preset in teamPresets ? member.preset : 'Bookings Viewer';
  const [preset,setPreset]=useState(savedRole?.id ?? initialPreset);
  const selectedRole = roles.find(role => role.id === preset);
  const [chosen,setChosen]=useState<readonly TeamPermission[]>(member?.permissions ?? (member || createRole ? [] : teamPresets[initialPreset]));
  const [result,action,pending]=useActionState(updateTeam,{ok:false,message:'',link:undefined});
  const effective=effectiveTeamPermissions(chosen);
  const editable=member?.status!=='Invited';
  return <form action={action} className="mt-4 space-y-4" onSubmit={event=>{
    const operation=((event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null)?.value;
    if(member && operation && !window.confirm('Apply this access change for '+member.email+'?'))event.preventDefault();
  }}>
    {selectedRole && !createRole && <input type="hidden" name="roleId" value={selectedRole.id}/>}
    {createRole ? <label className="block">Role name<input className={input} name="name" maxLength={60} required/></label> : member ? <input type="hidden" name="target" value={member.id}/> : <div className="grid gap-3 sm:grid-cols-2">
      <label>Name<input className={input} name="name" maxLength={100} required/></label>
      <label>Email<input className={input} name="email" type="email" maxLength={254} required/></label>
    </div>}
    {editable && <>
      {member?.permissions===null && <p className="rounded bg-amber-50 p-3 text-sm">This account keeps its legacy access until you save a new permission set. Saving replaces its legacy access.</p>}
      {!createRole && <label className="block">Role<select name="preset" className={input} value={preset} onChange={event=>{
        const value = event.target.value;
        setPreset(value);
        setChosen(roles.find(role => role.id === value)?.permissions ?? teamPresets[value]);
      }}>
        {Object.keys(teamPresets).map(name=><option key={name}>{name}</option>)}
        {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
      </select></label>}
      <div className="grid gap-3 sm:grid-cols-2">{permissionGroups.map(group=><fieldset key={group.label} className="rounded border border-stone-200 p-3">
        <legend className="px-1 font-semibold">{group.label}</legend>
        {group.items.map(([value,label])=><label key={value} className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" name="permission" value={value} checked={chosen.includes(value)} disabled={Boolean(selectedRole) && !createRole} onChange={event=>setChosen(current=>event.target.checked?[...current,value]:current.filter(item=>item!==value))}/>
          <span>{label}{dependsOn[value as TeamPermission] && <small className="block text-slate-600">Includes {permissionLabels.get(dependsOn[value as TeamPermission]!)?.toLowerCase()}</small>}</span>
        </label>)}
      </fieldset>)}</div>
    </>}
    <div className="rounded bg-stone-50 p-3 text-sm"><strong>Effective access</strong>
      <p>{(editable ? effective : member?.permissions || []).map(permission=>permissionLabels.get(permission)).join(' · ') || 'No workspace access'}</p>
    </div>
    {result.message && <p role={result.ok?'status':'alert'} className="text-sm">{result.message} {result.link && <a className="underline" href={result.link}>Acceptance link</a>}</p>}
    <div className="flex flex-wrap gap-2">
      {editable && <button name="operation" value={createRole?'create_role':member?'permissions':'invite'} className={primary} disabled={pending}>{createRole?'Create role':member?'Save permissions':'Invite user'}</button>}
      {member?.status==='Invited' && <><button name="operation" value="resend" className={secondary} disabled={pending}>Resend invitation</button><button name="operation" value="cancel" className={secondary} disabled={pending}>Cancel invitation</button></>}
      {member && editable && <button name="operation" value={member.status==='Active'?'suspend':'restore'} disabled={pending} className={secondary}>{member.status==='Active'?'Suspend access':'Restore access'}</button>}
    </div>
  </form>;
}
