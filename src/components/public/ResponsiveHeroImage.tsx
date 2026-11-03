'use client';

import {getImageProps} from 'next/image';
import {useEffect,useState,type CSSProperties} from 'react';
import {heroFocalPoint,type HeroAsset} from '@/lib/hero-image-config';

export type ResponsiveHeroProps={desktopImage:string;mobileImage?:string;alt:string;mobileAlt?:string;desktopFocal?:unknown;mobileFocal?:unknown;desktopAsset?:HeroAsset;mobileAsset?:HeroAsset;sizes?:string;fallbackImage?:string;className?:string;quality?:number};

/** One image request selected by picture, with no competing image preload. */
export function ResponsiveHeroImage({desktopImage,mobileImage,alt,mobileAlt,desktopFocal,mobileFocal,desktopAsset,mobileAsset,sizes='100vw',fallbackImage='/borealis-placeholder.svg',className='object-cover',quality=75}:ResponsiveHeroProps){
  const[phone,setPhone]=useState(false),[failed,setFailed]=useState('');
  useEffect(()=>{const media=matchMedia('(max-width: 767px)');const update=()=>setPhone(media.matches);update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update)},[]);
  const failedSelection=failed===`${desktopImage}|${mobileImage||''}`;
  const desktopSrc=desktopImage||fallbackImage;
  const common={alt,fill:true,sizes,quality,loading:'eager' as const,fetchPriority:'high' as const};
  const desktop=getImageProps({...common,src:failedSelection?fallbackImage:desktopSrc}).props;
  const mobile=getImageProps({...common,src:mobileImage||desktopSrc}).props;
  const variants=(asset?:HeroAsset)=>asset?.variants.length?asset.variants.map(v=>`${v.url} ${v.width}w`).join(', '):undefined;
  const d=heroFocalPoint(desktopFocal),m=heroFocalPoint(mobileFocal,true);
  return <picture style={{'--hero-desktop-position':`${d.x}% ${d.y}%`,'--hero-mobile-position':`${m.x}% ${m.y}%`} as CSSProperties}>
    {!failedSelection&&<source media="(max-width: 767px)" srcSet={variants(mobileAsset)||(!mobileImage?variants(desktopAsset):undefined)||mobile.srcSet||mobile.src} sizes={sizes}/>}
    <img {...desktop} src={!failedSelection&&desktopAsset?.variants.length?desktopAsset.variants[desktopAsset.variants.length-1].url:desktop.src} srcSet={!failedSelection?variants(desktopAsset)||desktop.srcSet:desktop.srcSet} className={`hero-responsive-image ${className}`} alt={!failedSelection&&phone&&(mobileImage||mobileAsset)&&mobileAlt?mobileAlt:alt} onError={()=>setFailed(`${desktopImage}|${mobileImage||''}`)}/>
  </picture>;
}
