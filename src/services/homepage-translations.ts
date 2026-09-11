import'server-only';
import{getEntityTranslationMap}from'@/services/translations';
import type{PublicHomepageCms}from'@/services/homepage-cms';
export async function localizeHomepageCms(content:PublicHomepageCms|null){if(!content)return null;const translated=await getEntityTranslationMap('homepage_section',content.sections.map(x=>x.id));return{...content,sections:content.sections.map(section=>{const t=translated.get(section.id)||{};return{...section,title:t.title||section.title,subtitle:t.subtitle||section.subtitle,body:t.body||section.body,eyebrow:t.eyebrow||section.eyebrow,ctaLabel:t.cta_label||section.ctaLabel}})}}
