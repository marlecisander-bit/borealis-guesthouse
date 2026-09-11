import type{ArticleBlock,ArticleStatus,BlockType}from '@/types/explore-admin';
import{slugFrom}from '../slugs.ts';

const text=(d:FormData,k:string)=>String(d.get(k)||'').trim();
const allowed:BlockType[]=['rich_text','heading','image','gallery','quote','info','faq','cta','related_experience','related_transfer','related_room'];
const string=(value:unknown,max=20000)=>typeof value==='string'?value.trim().slice(0,max):'';
const safeHref=(value:string)=>value.startsWith('/')&&!value.startsWith('//')||/^https:\/\//i.test(value);

export function sanitizeArticleBlocks(value:string):ArticleBlock[]{
  try{
    const raw=JSON.parse(value)as unknown;if(!Array.isArray(raw))return[];
    const ids=new Set<string>();
    return raw.slice(0,100).flatMap((item,index)=>{
      if(!item||typeof item!=='object')return[];
      const source=item as Record<string,unknown>,type=String(source.type)as BlockType;if(!allowed.includes(type))return[];
      let id=string(source.id,100)||`block-${index}`;while(ids.has(id))id=`${id}-${index}`;ids.add(id);
      const clean:ArticleBlock={id,type};
      for(const key of ['heading','text','caption','quote','attribution','label']as const){const value=string(source[key]);if(value)clean[key]=value}
      for(const key of ['mediaId','relatedId']as const){const value=string(source[key],100);if(value)clean[key]=value}
      const href=string(source.href,2048);if(href&&safeHref(href))clean.href=href;
      if(Array.isArray(source.mediaIds))clean.mediaIds=Array.from(new Set(source.mediaIds.map(x=>string(x,100)).filter(Boolean)));
      if(Array.isArray(source.items))clean.items=source.items.slice(0,30).flatMap(x=>{if(!x||typeof x!=='object')return[];const question=string((x as Record<string,unknown>).question,500),answer=string((x as Record<string,unknown>).answer);return question&&answer?[{question,answer}]:[]});
      return[clean];
    });
  }catch{return[]}
}

function invalidBlocks(blocks:ArticleBlock[]){return blocks.some(block=>{
  if(block.type==='rich_text'||block.type==='info')return!block.text;
  if(block.type==='heading')return!block.heading&&!block.text;
  if(block.type==='image')return!block.mediaId;
  if(block.type==='gallery')return!block.mediaIds?.length;
  if(block.type==='quote')return!block.quote;
  if(block.type==='faq')return!block.items?.length;
  if(block.type==='cta')return!block.label||!block.href;
  return!block.relatedId;
})}

export function validateArticle(d:FormData){
  const errors:Record<string,string>={},title=text(d,'title'),slug=slugFrom(text(d,'slug'),title),excerpt=text(d,'excerpt'),status=text(d,'status')as ArticleStatus,content=sanitizeArticleBlocks(text(d,'blocks'));
  if(!title)errors.title='Title is required.';
  if(!slug)errors.slug='Enter a title that can be used to generate the URL slug.';
  if(!['draft','published','archived'].includes(status))errors.status='Article status is invalid.';
  if(status==='published'&&(!excerpt||!text(d,'categoryId')||content.length===0))errors.content='Category, excerpt and at least one content block are required to publish.';
  else if(status==='published'&&invalidBlocks(content))errors.content='Complete every content block before publishing.';
  const canonical=text(d,'canonicalOverride');if(canonical&&!/^https:\/\//i.test(canonical))errors.canonicalOverride='Canonical URL must use HTTPS.';
  if(Object.keys(errors).length)return{state:{ok:false,message:'Review the highlighted fields.',errors}as const};
  return{data:{title,slug,subtitle:text(d,'subtitle'),excerpt,categoryId:text(d,'categoryId')||null,heroMediaId:text(d,'heroMediaId')||null,galleryMediaIds:Array.from(new Set(d.getAll('galleryMediaIds').map(String))),status,featured:d.get('featured')==='on',publishDate:text(d,'publishDate')||null,author:text(d,'author'),sortOrder:Number(text(d,'sortOrder')||0),blocks:content,relatedArticleIds:Array.from(new Set(d.getAll('relatedArticleIds').map(String))),relatedExperienceIds:Array.from(new Set(d.getAll('relatedExperienceIds').map(String))),relatedTransferIds:Array.from(new Set(d.getAll('relatedTransferIds').map(String))),seoTitle:text(d,'seoTitle'),seoDescription:text(d,'seoDescription'),ogMediaId:text(d,'ogMediaId')||null,canonicalOverride:canonical,noindex:d.get('noindex')==='on'}};
}
