'use client';
import { useState } from 'react';
export function CopyCalendarUrl({url}:{url:string}){const[copied,setCopied]=useState(false);return <button type="button" onClick={async()=>{await navigator.clipboard.writeText(url);setCopied(true);setTimeout(()=>setCopied(false),1800)}} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#9ebfbc] bg-white px-3 text-center text-sm font-semibold text-[#164b59]">{copied?'Copied':'Copy export URL'}</button>}

