'use client';

import {useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {createPortal} from 'react-dom';
import {whatsAppHref} from '@/lib/whatsapp';

const subscribeToClient=()=>()=>{};
const clientReady=()=>true;
const serverReady=()=>false;

function WhatsAppIcon() {
  return <svg viewBox="0 0 32 32" width="26" height="26" fill="none" aria-hidden="true"><path d="M26.7 15.4a10.7 10.7 0 0 1-16 9.3l-6.4 1.7 1.7-6.2a10.7 10.7 0 1 1 20.7-4.8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M11.3 9.6c-.4-.1-1.1 0-1.5.6-.5.6-.9 1.5-.5 2.8 1 3.7 4.4 6.7 8 7.7 1.2.4 2.2.2 2.9-.4.7-.6.9-1.7.5-2l-2.7-1.4c-.3-.2-.6-.1-.8.2l-.8 1c-2.1-.7-3.6-2.1-4.5-4l.8-1c.2-.3.3-.5.1-.9l-1.5-2.6Z" fill="currentColor"/></svg>;
}

/** One validated destination, presented as a desktop icon or a mobile sticker, both fixed to the viewport. */
export function WhatsAppContact({value,menuOpen=false}:{value?:string;menuOpen?:boolean}) {
  const href=whatsAppHref(value),mobile=useRef<HTMLAnchorElement>(null),desktop=useRef<HTMLAnchorElement>(null),mounted=useSyncExternalStore(subscribeToClient,clientReady,serverReady),[obstructed,setObstructed]=useState(false);
  useEffect(()=>{
    if(!href||!mounted)return;
    let frame=0;
    const update=()=>{
      frame=0;
      const element=window.innerWidth<768?mobile.current:desktop.current;
      if(!element)return;
      const modal=[...document.querySelectorAll('[role="dialog"][aria-modal="true"],dialog[open]')].some(el=>!el.closest('[aria-hidden="true"],[inert]')&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden');
      const editing=window.innerWidth<768&&document.activeElement?.matches('input,textarea,select,[contenteditable="true"]');
      const keyboard=window.innerWidth<768&&window.visualViewport&&window.visualViewport.height<window.innerHeight*.8;
      // Text and images must not make the sticker disappear during ordinary scrolling.
      // If a control occupies this corner, move up the right edge rather than covering it.
      const base=window.innerWidth<768?100:24, gap=12;
      let offset=base;
      element.style.setProperty('--whatsapp-bottom',`${offset}px`);
      for(let attempt=0;attempt<4;attempt++){
        const r=element.getBoundingClientRect();
        if(!r.width)break;
        const collision=[[r.left+4,r.top+4],[r.right-4,r.top+4],[r.left+4,r.bottom-4],[r.right-4,r.bottom-4],[r.left+r.width/2,r.top+r.height/2]].flatMap(([x,y])=>document.elementsFromPoint(x,y)).find(el=>!element.contains(el)&&el!==element&&Boolean(el.closest('a,button,input,select,textarea,nav,[role="button"],.safe-bottom-bar,.safe-bottom-offset')));
        if(!collision)break;
        const control=collision.closest('.safe-bottom-bar,.safe-bottom-offset')||collision.closest('a,button,input,select,textarea,nav,[role="button"],.safe-bottom-bar,.safe-bottom-offset')!;
        offset=Math.min(window.innerHeight-140,Math.max(offset+gap,window.innerHeight-control.getBoundingClientRect().top+gap));
        element.style.setProperty('--whatsapp-bottom',`${offset}px`);
      }
      setObstructed(Boolean(modal||editing||keyboard));
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(update)};
    const observer=new MutationObserver(records=>{if(records.some(record=>record.target!==mobile.current&&record.target!==desktop.current))schedule()});observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open','aria-modal','aria-hidden','inert','class','style']});
    schedule();window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);document.addEventListener('focusin',schedule);document.addEventListener('focusout',schedule);document.addEventListener('transitionend',schedule);window.visualViewport?.addEventListener('resize',schedule);
    return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);document.removeEventListener('focusin',schedule);document.removeEventListener('focusout',schedule);document.removeEventListener('transitionend',schedule);window.visualViewport?.removeEventListener('resize',schedule)};
  },[href,mounted]);
  if(!href)return null;
  const hidden=menuOpen||obstructed;
  const content=<><a ref={desktop} href={href} target="_blank" rel="noopener noreferrer" aria-label="Chat with Borealis on WhatsApp (opens in a new tab)" className={`whatsapp-desktop ${hidden?'is-obstructed':''}`} data-ready={mounted} tabIndex={hidden?-1:undefined} aria-hidden={hidden?true:undefined}><WhatsAppIcon/></a><a ref={mobile} href={href} target="_blank" rel="noopener noreferrer" aria-label="Chat with Borealis on WhatsApp (opens in a new tab)" className={`whatsapp-sticker ${hidden?'is-obstructed':''}`} data-ready={mounted} tabIndex={hidden?-1:undefined} aria-hidden={hidden?true:undefined}><WhatsAppIcon/></a></>;
  return mounted?createPortal(content,document.body):content;
}
