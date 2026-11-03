'use client';

import Image from 'next/image';
import {useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {whatsAppHref} from '@/lib/whatsapp';

const subscribeToClient=()=>()=>{};
const clientReady=()=>true;
const serverReady=()=>false;
const regions='.safe-bottom-bar,.safe-bottom-offset,[data-floating-contact-obstacle],[data-cookie-notice]';

/** One destination and one focus target; CSS switches circle/pill at 768px. */
export function WhatsAppContact({value,menuOpen=false,label='Chat with us',accessibleLabel='Chat with Borealis on WhatsApp (opens in a new tab)'}:{value?:string;menuOpen?:boolean;label?:string;accessibleLabel?:string}) {
  const href=whatsAppHref(value),button=useRef<HTMLAnchorElement>(null),mounted=useSyncExternalStore(subscribeToClient,clientReady,serverReady),[obstructed,setObstructed]=useState(false);
  useEffect(()=>{
    if(!href||!mounted)return;
    let frame=0;
    const update=()=>{
      frame=0;
      const element=button.current;
      if(!element)return;
      const modal=[...document.querySelectorAll('[role="dialog"][aria-modal="true"],dialog[open]')].some(el=>!el.closest('[aria-hidden="true"],[inert]')&&el.getClientRects().length&&(el.getAttribute('aria-hidden')==='false'||getComputedStyle(el).visibility!=='hidden'));
      const mobile=window.innerWidth<768;
      const editing=mobile&&document.activeElement?.matches('input,textarea,select,[contenteditable="true"]');
      const keyboard=mobile&&window.visualViewport&&window.visualViewport.height<window.innerHeight*.8;
      // Only reserve space for fixed bottom UI. Normal page content must never move this control.
      let clearance=0;
      for(const region of document.querySelectorAll<HTMLElement>(regions)){
        const style=getComputedStyle(region);
        if(style.position!=='fixed'||style.display==='none'||style.visibility==='hidden'||(style.opacity==='0'&&region.dataset.floatingContactActive!=='true')||region.dataset.floatingContactActive==='false')continue;
        const bottom=Number.parseFloat(style.bottom);
        if(Number.isFinite(bottom))clearance=Math.max(clearance,bottom+region.offsetHeight+12);
      }
      element.style.setProperty('--whatsapp-clearance',`${clearance}px`);
      setObstructed(Boolean(modal||editing||keyboard));
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(update)};
    const sizes=new ResizeObserver(schedule);
    const observeRegions=()=>document.querySelectorAll(regions).forEach(el=>sizes.observe(el));
    const observer=new MutationObserver(records=>{
      if(records.some(record=>record.target!==button.current)){observeRegions();schedule();}
    });
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open','aria-modal','aria-hidden','inert','class','style','data-floating-contact-active','data-cookie-notice']});
    observeRegions();schedule();
    window.addEventListener('resize',schedule);document.addEventListener('focusin',schedule);document.addEventListener('focusout',schedule);window.visualViewport?.addEventListener('resize',schedule);
    return()=>{cancelAnimationFrame(frame);observer.disconnect();sizes.disconnect();window.removeEventListener('resize',schedule);document.removeEventListener('focusin',schedule);document.removeEventListener('focusout',schedule);window.visualViewport?.removeEventListener('resize',schedule)};
  },[href,mounted]);
  if(!href)return null;
  const hidden=menuOpen||obstructed;
  const content=<a ref={button} href={href} target="_blank" rel="noopener noreferrer" aria-label={accessibleLabel} className={`whatsapp-contact ${hidden?'is-obstructed':''}`} data-ready={mounted} tabIndex={hidden?-1:undefined} aria-hidden={hidden?true:undefined}><Image src="/brand/whatsapp-glyph-white.svg" width={28} height={28} alt="" aria-hidden="true" loading="eager" className="whatsapp-contact__logo"/><span className="whatsapp-contact__label">{label}</span></a>;
  return content;
}
