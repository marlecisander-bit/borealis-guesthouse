'use client';

import Image from 'next/image';
import {useState} from 'react';

export function CmsImage({src,fallbackSrc='/borealis-placeholder.svg',alt,priority=false,sizes='100vw',className='object-cover'}:{src:string;fallbackSrc?:string;alt:string;priority?:boolean;sizes?:string;className?:string}){
  const[failedSrc,setFailedSrc]=useState(''),selectedSrc=src||fallbackSrc,displaySrc=failedSrc===selectedSrc?fallbackSrc:selectedSrc;
  return <Image src={displaySrc} alt={alt} fill priority={priority} sizes={sizes} className={className} onError={()=>{if(displaySrc!==fallbackSrc)setFailedSrc(selectedSrc)}}/>;
}
