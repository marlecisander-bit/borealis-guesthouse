import { revalidatePath, revalidateTag } from 'next/cache';
import { PUBLIC_CMS_TAG } from '@/lib/supabase/public-cms';

// Invalidate only the CMS tables changed by this action, including data shared
// across routes. Authenticated and live booking requests never use these tags.
function forTables(tables: readonly string[] | null) {
  return (path:string,type?:'page'|'layout') => {
    revalidatePath(path,type);
    if(!path.startsWith('/admin'))for(const tag of tables?.map(table=>`public-cms:${table}`)||[PUBLIC_CMS_TAG])revalidateTag(tag,{expire:0});
  };
}
export const roomsRevalidatePath = forTables(["room_types","room_images","room_type_amenities","amenities","seo_metadata"]);
export const experiencesRevalidatePath = forTables(["experiences","experience_images","seo_metadata"]);
export const transfersRevalidatePath = forTables(["transfer_routes","transfer_images","seo_metadata"]);
export const exploreRevalidatePath = forTables(["tourism_articles","tourism_article_images","tourism_categories","seo_metadata"]);
export const homepageRevalidatePath = forTables(["homepage_sections","homepage_section_links","homepage_hero_assets","cms_documents","reviews"]);
export const contentRevalidatePath = forTables(["cms_documents","gallery_items","navigation_items","site_settings","homepage_sections"]);
export const languagesRevalidatePath = forTables(["languages","translations"]);
export const seoRevalidatePath = forTables(["site_settings","seo_metadata","page_seo","cms_documents"]);
export const settingsRevalidatePath = forTables(["properties","languages","translations","site_settings","navigation_items","cms_documents"]);
export const mediaRevalidatePath = forTables(null);
