'use client';
export function ConfirmAction({action,label,confirmMessage}:{action:()=>Promise<void>;label:string;confirmMessage:string}){return <form action={action} onSubmit={(event)=>{if(!window.confirm(confirmMessage))event.preventDefault()}}><button className="min-h-11 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-700">{label}</button></form>}
