'use client';

import Image from 'next/image';
import {useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {whatsAppHref} from '@/lib/whatsapp';

const subscribeToClient=()=>()=>{};
const clientReady=()=>true;
const serverReady=()=>false;
const regions='.safe-bottom-bar,.safe-bottom-offset,[data-floating-contact-obstacle],[data-cookie-notice]';

/** One destination and one focus target; CSS displays the compact icon. */
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
      // Use the untransformed position so an in-progress transition cannot feed back into placement.
      const rect=element.getBoundingClientRect();
      const baseTop=element.offsetTop;
      let top=Math.min(baseTop,window.innerHeight-clearance-rect.height);
      const selector=mobile
        ? '.hero-section .booking-search'
        : '.booking-search,[data-booking-actions],a[href^="/book"]';
      const controls=[...document.querySelectorAll<HTMLElement>(selector)]
        .filter(control=>!control.closest('[aria-hidden="true"],[inert]') &&
          (control.checkVisibility?.({opacityProperty:true,visibilityProperty:true}) ?? getComputedStyle(control).visibility!=='hidden'))
        .map(control=>control.getBoundingClientRect())
        .filter(bounds=>bounds.width>0&&bounds.height>0&&rect.right+8>bounds.left&&rect.left-8<bounds.right)
        .sort((a,b)=>b.bottom-a.bottom);
      for(const bounds of controls){
        if(top+rect.height+8>bounds.top&&top-8<bounds.bottom)top=bounds.top-12-rect.height;
      }
      const headerBottom=document.querySelector('.public-header')?.getBoundingClientRect().bottom ?? 0;
      const noRoom=top<Math.max(0,headerBottom)+8;
      const lift=`${noRoom?0:Math.round(top-baseTop)}px`;
      if(element.style.getPropertyValue('--whatsapp-lift')!==lift)element.style.setProperty('--whatsapp-lift',lift);
      setObstructed(Boolean(modal||editing||keyboard||noRoom));
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(update)};
    const sizes=new ResizeObserver(schedule);
    const observeRegions=()=>document.querySelectorAll(regions).forEach(el=>sizes.observe(el));
    const observer=new MutationObserver(records=>{
      if(records.some(record=>record.target!==button.current)){observeRegions();schedule();}
    });
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open','aria-modal','aria-hidden','inert','class','style','data-floating-contact-active','data-cookie-notice']});
    observeRegions();schedule();
    window.addEventListener('resize',schedule);window.addEventListener('scroll',schedule,{passive:true,capture:true});document.addEventListener('focusin',schedule);document.addEventListener('focusout',schedule);window.visualViewport?.addEventListener('resize',schedule);
    return()=>{cancelAnimationFrame(frame);observer.disconnect();sizes.disconnect();window.removeEventListener('resize',schedule);window.removeEventListener('scroll',schedule,true);document.removeEventListener('focusin',schedule);document.removeEventListener('focusout',schedule);window.visualViewport?.removeEventListener('resize',schedule)};
  },[href,mounted]);
  if(!href)return null;
  const hidden=menuOpen||obstructed;
  const content=<a ref={button} href={href} target="_blank" rel="noopener noreferrer" aria-label={accessibleLabel} className={`whatsapp-contact ${hidden?'is-obstructed':''}`} data-ready={mounted} tabIndex={hidden?-1:undefined} aria-hidden={hidden?true:undefined}><Image src="/brand/whatsapp-glyph-white.svg" width={28} height={28} alt="" aria-hidden="true" loading="eager" className="whatsapp-contact__logo"/><span className="whatsapp-contact__label">{label}</span></a>;
  return content;
}
