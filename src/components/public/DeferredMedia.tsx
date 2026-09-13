'use client';
import {type ReactNode,useEffect,useRef,useState} from 'react';

// Streamed media can briefly occupy a placeholder position. Defer external
// widgets and the footer background until their settled position is nearby.
export function DeferredMedia({children}:{children:ReactNode}) {
  const target=useRef<HTMLDivElement>(null),[visible,setVisible]=useState(false);
  useEffect(()=>{
    if(!target.current)return;
    const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){setVisible(true);observer.disconnect();}},{rootMargin:'400px'});
    observer.observe(target.current);return()=>observer.disconnect();
  },[]);
  return <div ref={target} className="absolute inset-0">{visible&&children}<noscript>{children}</noscript></div>;
}
