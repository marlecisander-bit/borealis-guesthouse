'use client';

import Image from 'next/image';
import {useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {createPortal} from 'react-dom';
import {whatsAppHref} from '@/lib/whatsapp';

const subscribeToClient=()=>()=>{};
const clientReady=()=>true;
const serverReady=()=>false;
const obstacles='a,button,input,select,textarea,label,h1,h2,h3,p,nav,[role="button"],[role="alert"],[role="status"],.safe-bottom-bar,.safe-bottom-offset,[data-floating-contact-obstacle],[data-cookie-notice]';
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
      const modal=[...document.querySelectorAll('[role="dialog"][aria-modal="true"],dialog[open]')].some(el=>!el.closest('[aria-hidden="true"],[inert]')&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden');
      const mobile=window.innerWidth<768;
      const editing=mobile&&document.activeElement?.matches('input,textarea,select,[contenteditable="true"]');
      const keyboard=mobile&&window.visualViewport&&window.visualViewport.height<window.innerHeight*.8;
      const base=mobile?16:24, gap=12;
      let offset=base, unavailable=false;
      element.style.setProperty('--whatsapp-bottom',`${offset}px`);
      // Measure whole controls/notice regions rather than sampling a few points in a wide pill.
      const candidates=[...new Set([...document.querySelectorAll(obstacles)].map(el=>el.closest(regions)||el))].filter(el=>el!==element&&!element.contains(el)&&!el.closest('[aria-hidden="true"],[inert]'));
      for(let attempt=0;attempt<=candidates.length;attempt++){
        const r=element.getBoundingClientRect();
        const collisions=candidates.map(el=>({el,rect:el.getBoundingClientRect()})).filter(({el,rect})=>{
          if(!rect.width||!rect.height||rect.right<=r.left-gap||rect.left>=r.right+gap||rect.bottom<=r.top-gap||rect.top>=r.bottom+gap)return false;
          const style=getComputedStyle(el);
          return style.visibility!=='hidden'&&style.display!=='none'&&Number(style.opacity)>0;
        });
        if(!collisions.length)break;
        const top=Math.min(...collisions.map(x=>x.rect.top));
        offset+=r.bottom-top+gap;
        element.style.setProperty('--whatsapp-bottom',`${offset}px`);
        if(element.getBoundingClientRect().top<(window.visualViewport?.offsetTop||0)+8){unavailable=true;break;}
      }
      setObstructed(Boolean(modal||editing||keyboard||unavailable));
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(update)};
    const observer=new MutationObserver(records=>{if(records.some(record=>record.target!==button.current))schedule()});
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open','aria-modal','aria-hidden','inert','class','style','data-floating-contact-obstacle','data-cookie-notice']});
    schedule();window.addEventListener('scroll',schedule,{passive:true,capture:true});window.addEventListener('resize',schedule);document.addEventListener('focusin',schedule);document.addEventListener('focusout',schedule);document.addEventListener('transitionend',schedule);window.visualViewport?.addEventListener('resize',schedule);
    return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('scroll',schedule,true);window.removeEventListener('resize',schedule);document.removeEventListener('focusin',schedule);document.removeEventListener('focusout',schedule);document.removeEventListener('transitionend',schedule);window.visualViewport?.removeEventListener('resize',schedule)};
  },[href,mounted]);
  if(!href)return null;
  const hidden=menuOpen||obstructed;
  const content=<a ref={button} href={href} target="_blank" rel="noopener noreferrer" aria-label={accessibleLabel} className={`whatsapp-contact ${hidden?'is-obstructed':''}`} data-ready={mounted} tabIndex={hidden?-1:undefined} aria-hidden={hidden?true:undefined}><Image src="/brand/whatsapp-glyph-white.svg" width={28} height={28} alt="" aria-hidden="true" loading="eager" className="whatsapp-contact__logo"/><span className="whatsapp-contact__label">{label}</span></a>;
  return mounted?createPortal(content,document.body):content;
}
