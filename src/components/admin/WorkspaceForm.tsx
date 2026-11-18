'use client';

import { useActionState, type ReactNode } from 'react';
import { saveTeamWorkspace } from '@/app/admin/workspace/actions';

export function WorkspaceForm({operation,target,confirm,children,label='Save'}:{
  operation:string;target?:string;confirm?:string;children?:ReactNode;label?:string;
}) {
  const [state,action,pending]=useActionState(saveTeamWorkspace,{ok:false,message:''});
  return <form action={action} className="grid gap-3" onSubmit={event=>{if(confirm&&!window.confirm(confirm))event.preventDefault();}}>
    <input type="hidden" name="operation" value={operation}/>
    {target && <input type="hidden" name="target" value={target}/>}
    {children}
    {state.message && <p role={state.ok?'status':'alert'} className="text-sm">{state.message}</p>}
    <button disabled={pending} className="min-h-11 justify-self-start rounded-lg bg-brand px-4 text-sm font-semibold text-white disabled:opacity-60">{label}</button>
  </form>;
}
