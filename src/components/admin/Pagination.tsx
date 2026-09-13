import Link from 'next/link';

export function Pagination({page,total,pageSize,pathname,filters={},hasNext}:{page:number;total?:number;hasNext?:boolean;pageSize:number;pathname:string;filters?:Record<string,string|undefined>}) {
  const pages=Math.max(1,Math.ceil((total||0)/pageSize));
  const href=(next:number)=>{const query=new URLSearchParams();for(const[key,value]of Object.entries(filters))if(value)query.set(key,value);query.set('page',String(next));return `${pathname}?${query}`;};
  return <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 text-sm">
    <p>{total} results · Page {page} of {pages}</p>
    <div className="flex gap-2">{page>1&&<Link prefetch={false} href={href(page-1)} className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4">Previous</Link>}{(hasNext??page<pages)&&<Link prefetch={false} href={href(page+1)} className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4">Next</Link>}</div>
  </nav>;
}
