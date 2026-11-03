'use client';
import{useEffect,useRef}from'react';import type{RefObject}from'react';
/** Focus and visual-viewport bounds for custom dialogs, including a raised mobile keyboard. */
export function useDialogFocus(ref:RefObject<HTMLElement|null>,open:boolean,onClose:()=>void){
 const close=useRef(onClose);useEffect(()=>{close.current=onClose},[onClose]);
 useEffect(()=>{if(!open)return;const panel=ref.current;if(!panel)return;const previous=document.activeElement instanceof HTMLElement?document.activeElement:null,overflow=document.body.style.overflow;
  const bounds=()=>{const viewport=window.visualViewport;panel.style.setProperty('--dialog-viewport-height',`${viewport?.height||innerHeight}px`);panel.style.setProperty('--dialog-viewport-top',`${viewport?.offsetTop||0}px`);panel.style.maxHeight=`${Math.max(0,(viewport?.height||innerHeight)-32)}px`};
  const controls=()=>[...panel.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),input:not(:disabled):not([type="hidden"]),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')].filter(el=>el.getClientRects().length>0);
  const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();close.current();return}if(event.key!=='Tab')return;const all=controls();if(!all.length){event.preventDefault();panel.focus();return}const first=all[0],last=all[all.length-1];if(event.shiftKey&&(document.activeElement===first||document.activeElement===panel)){event.preventDefault();last.focus()}else if(!event.shiftKey&&(document.activeElement===last||!panel.contains(document.activeElement))){event.preventDefault();first.focus()}};
  bounds();document.body.style.overflow='hidden';panel.focus({preventScroll:true});document.addEventListener('keydown',key);window.visualViewport?.addEventListener('resize',bounds);window.visualViewport?.addEventListener('scroll',bounds);window.addEventListener('resize',bounds);
  return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',key);window.visualViewport?.removeEventListener('resize',bounds);window.visualViewport?.removeEventListener('scroll',bounds);window.removeEventListener('resize',bounds);if(previous?.isConnected)previous.focus({preventScroll:true})};
 },[open,ref]);
}
