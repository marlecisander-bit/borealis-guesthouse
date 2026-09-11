import Image from 'next/image';import Link from 'next/link';import type{Experience,Room,TourismArticle}from'@/types/public';import{formatRoomRate}from'@/lib/pricing/format';
export function SectionHeader({eyebrow,title,copy}:{eyebrow:string;title:string;copy?:string}){return <div className="max-w-2xl"><p className="eyebrow">{eyebrow}</p><h2 className="mt-3 font-serif text-4xl leading-tight text-lake md:text-6xl">{title}</h2>{copy&&<p className="mt-5 leading-7 text-muted">{copy}</p>}</div>}
export function RoomCard({room,variant='standard'}:{room:Room;variant?:'standard'|'featured'}){
  const featured=variant==='featured';
  return <article className={`group flex h-full flex-col ${featured?'w-[84vw] shrink-0 snap-center md:w-auto':''}`}>
    <Link href={`/rooms/${room.slug}`} className="block shrink-0 overflow-hidden rounded-[1.75rem]">
      <div className="relative aspect-[4/5] overflow-hidden">
        <Image src={room.image} alt={`${room.name} at Borealis Guest House`} fill sizes={featured?'(max-width: 768px) 84vw, 33vw':'(max-width: 768px) 92vw, 33vw'} className="object-cover transition duration-700 group-hover:scale-105"/>
        {featured&&room.slug.includes('lake')&&<span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-2 text-xs font-bold text-lake">Lake view</span>}
      </div>
    </Link>
    <div className="flex flex-1 flex-col px-1 pt-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          {!featured&&<p className="eyebrow">{room.eyebrow}</p>}
          <h3 className={`${featured?'':'mt-2 '}font-serif text-3xl leading-tight text-lake md:min-h-[4.5rem]`}><Link href={`/rooms/${room.slug}`}>{room.name}</Link></h3>
          <p className="mt-2 text-sm leading-5 text-muted md:min-h-10">Up to {room.capacity} guests · {featured?room.beds:room.size}</p>
        </div>
        <p className="shrink-0 whitespace-nowrap text-right text-xs text-muted">{room.priceFrom===null?'Pricing':'From'}<br/><strong className="text-lg text-lake">{formatRoomRate(room.priceFrom,room.currency)}</strong></p>
      </div>
      {featured&&<div className="mt-auto grid grid-cols-2 gap-2 pt-5"><Link href={`/rooms/${room.slug}`} className="rounded-xl bg-white px-4 py-3 text-center text-sm font-bold text-lake">View room</Link><Link href={`/book?room=${room.slug}`} className="rounded-xl bg-lake px-4 py-3 text-center text-sm font-bold text-white">Check availability</Link></div>}
    </div>
  </article>
}
export function ExperienceCard({item}:{item:Experience}){return <article className="group relative min-h-[30rem] overflow-hidden rounded-[1.75rem] text-white"><Image src={item.image} alt={item.title} fill sizes="(max-width: 768px) 92vw, 33vw" className="object-cover transition duration-700 group-hover:scale-105"/><div className="absolute inset-0 bg-gradient-to-t from-lake/90 via-lake/10 to-transparent"/><div className="absolute inset-x-0 bottom-0 p-7"><p className="text-xs font-bold uppercase tracking-[.18em] text-sand">{item.category} · {item.duration}</p><h3 className="mt-3 font-serif text-3xl">{item.title}</h3><p className="mt-3 text-sm leading-6 text-white/80">{item.description}</p><Link href={`/experiences/${item.slug}`} className="mt-5 inline-block border-b border-white pb-1 text-sm font-semibold">Discover</Link></div></article>}
export function ArticleCard({article}:{article:TourismArticle}){return <article><Link href={`/explore-koman/${article.slug}`} className="group block"><div className="relative aspect-[4/3] overflow-hidden rounded-2xl"><Image src={article.image} alt={article.title} fill sizes="(max-width: 768px) 92vw, 33vw" className="object-cover transition duration-700 group-hover:scale-105"/></div><p className="eyebrow mt-5">{article.category.name} · {article.readTime}</p><h3 className="mt-2 font-serif text-2xl text-lake">{article.title}</h3><p className="mt-2 text-sm leading-6 text-muted">{article.excerpt}</p></Link></article>}
