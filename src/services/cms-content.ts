import { cache } from 'react';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { fetchSupabase } from '@/lib/supabase/fetch';
import type { CmsPageContent } from '@/types/admin';
const createClient=(url:string,key:string,options:Parameters<typeof createSupabaseClient>[2])=>createSupabaseClient(url,key,{...options,global:{...options?.global,fetch:fetchSupabase}});
export const getPublishedPageContent=cache(async(slug:string):Promise<CmsPageContent|null>=>{const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;if(!url||!key)return null;try{const supabase=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});const{data,error}=await supabase.from('pages').select('content').eq('slug',slug).eq('status','published').maybeSingle();if(error||!data?.content)return null;const parsed=JSON.parse(data.content);return{heroHeading:String(parsed.heroHeading||''),heroCopy:String(parsed.heroCopy||''),eyebrow:parsed.eyebrow?String(parsed.eyebrow):undefined}}catch{return null}})
