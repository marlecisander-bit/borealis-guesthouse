'use client';

import {createContext,useContext,useEffect,useId,useRef,useState} from 'react';
import type {ReactNode} from 'react';

type EditorContextValue={tab:string;select:(tab:string)=>void;prefix:string};
const Context=createContext<EditorContextValue|null>(null);
export function useEditor(){const value=useContext(Context);if(!value)throw new Error('Editor panel requires an editor workspace');return value}
export function EditorWorkspace({tabs,children,hashTabs,trailing}:{tabs:string[];children:ReactNode;hashTabs?:Record<string,string>;trailing?:ReactNode}){
 const [tab,select]=useState(tabs[0]),prefix=useId();
 useEffect(()=>{if(!hashTabs)return;const update=()=>{const next=hashTabs[location.hash.slice(1)];if(next)select(next)};update();window.addEventListener('hashchange',update);return()=>window.removeEventListener('hashchange',update)},[hashTabs]);
 return <Context.Provider value={{tab,select,prefix}}><div className="mx-auto w-full max-w-5xl space-y-5"><div role="tablist" aria-label="Editor sections" className="flex flex-wrap gap-1 rounded-xl border border-[#d5e5e2] bg-white p-1.5">{tabs.map((label,index)=><button key={label} type="button" role="tab" id={`${prefix}-tab-${encodeURIComponent(label)}`} aria-selected={tab===label} tabIndex={tab===label?0:-1} onClick={()=>select(label)} onKeyDown={event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;select(tabs[next]);document.getElementById(`${prefix}-tab-${encodeURIComponent(tabs[next])}`)?.focus()}}} className={`min-h-11 rounded-lg px-4 text-sm font-semibold ${tab===label?'bg-[#164b59] text-white':'text-[#45656a] hover:bg-[#edf6f4]'}`}>{label}</button>)}{trailing}</div>{children}</div></Context.Provider>
}
export function EditorPanel({name,children}:{name:string;children:ReactNode}){const{tab,prefix}=useEditor();const id=useId();return <div role="tabpanel" id={`${prefix}-panel-${encodeURIComponent(name)}-${id}`} aria-labelledby={`${prefix}-tab-${encodeURIComponent(name)}`} hidden={tab!==name} className={tab===name?'space-y-5':'hidden'}>{children}</div>}
export function EditorSection({title,children}:{title:string;children:ReactNode}){return <section className="space-y-4 rounded-xl border border-[#d5e5e2] bg-white p-4 sm:p-6"><h2 className="text-lg font-bold text-[#164b59]">{title}</h2>{children}</section>}

/** Watches this form only; neither values nor credentials are stored outside it. */
export function useEditorForm(saved:object){
 const dirty=useRef(false),generation=useRef(0),submitted=useRef(-1);
 const [revision,setRevision]=useState(0);
 useEffect(()=>{if('ok'in saved&&saved.ok&&generation.current===submitted.current){dirty.current=false}},[saved]);
 useEffect(()=>{
  const unload=(event:BeforeUnloadEvent)=>{if(dirty.current){event.preventDefault();event.returnValue=''}};
  const leave=(event:MouseEvent)=>{const link=(event.target as Element)?.closest?.('a');if(!dirty.current||!link||link.target==='_blank'||event.defaultPrevented||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;const url=new URL(link.href,location.href);if(url.pathname===location.pathname&&url.search===location.search)return;if(!window.confirm('You have unsaved changes. Leave this editor?')){event.preventDefault();event.stopPropagation()}};
  const traverse=(event:Event)=>{const nav=event as Event&{navigationType?:string};if(nav.navigationType==='traverse'&&dirty.current&&event.cancelable&&!window.confirm('You have unsaved changes. Leave this editor?'))event.preventDefault()};
  const navigation=(window as Window&{navigation?:EventTarget}).navigation;
  window.addEventListener('beforeunload',unload);document.addEventListener('click',leave,true);navigation?.addEventListener('navigate',traverse);
  return()=>{window.removeEventListener('beforeunload',unload);document.removeEventListener('click',leave,true);navigation?.removeEventListener('navigate',traverse)};
 },[]);
 const changed=()=>{dirty.current=true;generation.current++;setRevision(n=>n+1)};
 const submit=()=>{submitted.current=generation.current};
 return{revision,changed,submit,onChange:changed};
}
export function EditorActions({pending,message,ok,preview}:{pending:boolean;message:string;ok:boolean;preview?:string}){
 return <div className="admin-form-actions sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#c7dddb] bg-white/95 p-3 shadow-lg backdrop-blur"><input type="hidden" name="status" defaultValue="draft"/><p role="status" aria-live="polite" className={`text-sm ${ok?'text-emerald-700':'text-red-700'}`}>{message}</p><div className="flex flex-wrap gap-2">{preview&&<a href={preview} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-lg border px-4 text-sm font-semibold">Preview ↗</a>}<button type="submit" onClick={event=>{const status=event.currentTarget.form?.elements.namedItem('status');if(status instanceof HTMLInputElement)status.value='draft'}} disabled={pending} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold">Save draft</button><button type="submit" onClick={event=>{const status=event.currentTarget.form?.elements.namedItem('status');if(status instanceof HTMLInputElement)status.value='published'}} disabled={pending} className="min-h-11 rounded-lg bg-[#164b59] px-4 text-sm font-semibold text-white">{pending?'Saving…':'Publish'}</button></div></div>
}
