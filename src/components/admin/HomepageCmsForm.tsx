'use client';

import { useActionState, useState } from 'react';
import { saveHomepageCms } from '@/app/admin/content/homepage/actions';
import { MediaPicker } from '@/components/admin/MediaPicker';
import type { CmsOption, HomepageCmsState, HomepageEditorData, HomepageKey, HomepageReview, HomepageSection } from '@/types/homepage-cms';

const initial: HomepageCmsState = { ok: false, message: '' };
const input = 'mt-2 min-h-12 w-full rounded-lg border border-slate-300 bg-white px-4 font-normal text-slate-900';

type SectionConfig = {
  key: Exclude<HomepageKey, 'property_highlights'>;
  label: string;
  description: string;
  media?: boolean;
  imageAlt?: boolean;
  imageLabel?: boolean;
  bookingSearch?: boolean;
  mapLink?: boolean;
  cta?: boolean;
  choices?: keyof Pick<HomepageEditorData, 'rooms' | 'experiences' | 'articles' | 'transfers' | 'media'>;
};

const sectionConfigs: SectionConfig[] = [
  { key: 'hero', label: '1. Hero', description: 'The first screen, primary message, image and booking search.', media: true, imageAlt: true, bookingSearch: true, cta: true },
  { key: 'intro', label: '2. Lakefront introduction', description: 'The image-and-copy welcome section directly below the hero.', media: true, imageAlt: true, imageLabel: true, cta: true },
  { key: 'featured_rooms', label: '3. Featured rooms', description: 'Heading, supporting copy, link label and which room cards appear.', choices: 'rooms', cta: true },
  { key: 'featured_experiences', label: '4. Experiences introduction', description: 'Heading, supporting copy, link and featured Experience cards.', choices: 'experiences', cta: true },
  { key: 'explore_koman', label: '5. Explore Koman', description: 'Editorial introduction, link and selected guide articles.', choices: 'articles', cta: true },
  { key: 'transfers', label: '6. Guest transfers', description: 'Editorial introduction, link and selected transfer routes.', choices: 'transfers', cta: true },
  { key: 'gallery', label: '7. Gallery preview', description: 'Heading, link and Media Library images used in the homepage preview.', choices: 'media', cta: true },
  { key: 'reviews', label: '8. Guest notes', description: 'Section heading and the manually curated testimonials.' },
  { key: 'location', label: '9. Koman location', description: 'Location message, directions link and map reference.', mapLink: true, cta: true },
  { key: 'final_cta', label: '10. Final booking call to action', description: 'The closing image, message and booking button.', media: true, imageAlt: true, cta: true },
];

export function HomepageCmsForm({ data }: { data: HomepageEditorData }) {
  const [state, action, pending] = useActionState(saveHomepageCms, initial);
  const [reviews, setReviews] = useState<HomepageReview[]>(data.reviews);
  const hero = findSection(data, 'hero');
  const updated = data.workflow?.updatedAt
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(data.workflow.updatedAt))
    : 'Not saved yet';
  const status = data.workflow?.hasDraft ? 'Modified since publish' : hero.status === 'published' ? 'Published' : 'Draft';

  return <form action={action} className="grid gap-6">
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div><p className="text-xs font-bold uppercase tracking-widest text-slate-500">Public page order</p><p className="mt-1 text-sm text-slate-600">Fields follow the homepage from top to bottom. Product details remain in their domain modules.</p></div>
      <div className="text-right"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${data.workflow?.hasDraft ? 'bg-amber-100 text-amber-800' : hero.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>{status}</span><p className="mt-2 text-xs text-slate-500">Last updated {updated}</p></div>
    </div>

    {sectionConfigs.map(config => <HomepageSectionEditor key={config.key} config={config} section={findSection(data, config.key)} data={data} />)}

    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div><p className="text-xs font-bold uppercase tracking-widest text-slate-500">Homepage · Guest notes</p><h2 className="mt-1 text-2xl font-bold text-slate-950">Testimonials</h2><p className="mt-3 text-sm leading-6 text-slate-600">These quotes appear only when the Guest notes section above is visible.</p></div>
      <input type="hidden" name="reviewCount" value={reviews.length} />
      <div className="mt-6 grid gap-4">
        {reviews.map((review, index) => <div key={`${review.id}-${index}`} className="grid gap-4 rounded-xl bg-slate-50 p-4 lg:grid-cols-[1fr_1fr_2fr_auto]">
          <Field label="Guest name"><input name={`review_${index}_author`} defaultValue={review.author} className={input} /></Field>
          <Field label="Origin"><input name={`review_${index}_origin`} defaultValue={review.origin} className={input} /></Field>
          <Field label="Quote"><textarea name={`review_${index}_quote`} defaultValue={review.quote} rows={3} className={`${input} py-3`} /></Field>
          <div className="flex flex-col justify-end gap-2"><input type="hidden" name={`review_${index}_order`} value={index * 10} /><label className="flex min-h-10 items-center gap-2 text-sm"><input name={`review_${index}_visible`} type="checkbox" defaultChecked={review.visible} /> Visible</label><button type="button" onClick={() => setReviews(items => items.filter((_, itemIndex) => itemIndex !== index))} className="text-left text-sm font-semibold text-red-700">Remove</button></div>
        </div>)}
      </div>
      <button type="button" onClick={() => setReviews(items => [...items, emptyReview(items.length)])} className="mt-4 min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold">Add testimonial</button>
    </section>

    <PreservedRetiredHighlights data={data} />
    <div className="sticky bottom-3 z-20 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between"><p role="status" className={`text-sm ${state.ok ? 'text-emerald-700' : 'text-red-700'}`}>{state.message}</p><div className="flex gap-2"><button name="status" value="draft" disabled={pending} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold">Save Draft</button><button name="status" value="published" disabled={pending} className="min-h-11 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white">Publish</button></div></div>
  </form>;
}

function HomepageSectionEditor({ config, section, data }: { config: SectionConfig; section: HomepageSection; data: HomepageEditorData }) {
  const options = config.choices ? data[config.choices] : [];
  const selected = new Set(section.links.map(link => link.id));
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
    <div><p className="text-xs font-bold uppercase tracking-widest text-slate-500">Homepage</p><h2 className="mt-1 text-2xl font-bold text-slate-950">{config.label}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{config.description}</p></div>
    <div className="mt-6 grid gap-5 sm:grid-cols-2">
      <Field label="Eyebrow"><input name={`${config.key}_eyebrow`} defaultValue={section.eyebrow} className={input} /></Field>
      <Field label="Heading"><input name={`${config.key}_title`} defaultValue={section.title} className={input} /></Field>
      <Field label="Supporting text"><textarea name={`${config.key}_${config.key === 'hero' ? 'subtitle' : 'body'}`} defaultValue={config.key === 'hero' ? section.subtitle : section.body || section.subtitle} rows={3} className={`${input} py-3`} /></Field>
      {config.key === 'hero' ? <input type="hidden" name="hero_body" value={section.body} /> : <input type="hidden" name={`${config.key}_subtitle`} value="" />}
      {config.media && <MediaPicker name={`${config.key}_media`} label="Section image" assets={data.media} defaultValue={section.backgroundMediaId} />}
      {config.imageAlt && <Field label="Image alternative text"><input name={`${config.key}_imageAlt`} defaultValue={String(section.settings.imageAlt || '')} className={input} /></Field>}
      {config.imageLabel && <Field label="Image caption"><input name={`${config.key}_imageLabel`} defaultValue={String(section.settings.imageLabel || '')} className={input} /></Field>}
      {config.cta ? <><Field label="Button label"><input name={`${config.key}_ctaLabel`} defaultValue={section.ctaLabel} className={input} /></Field><Field label="Button destination"><input name={`${config.key}_ctaLink`} defaultValue={section.ctaLink} placeholder="/book" className={input} /></Field></> : <><input type="hidden" name={`${config.key}_ctaLabel`} value={section.ctaLabel} /><input type="hidden" name={`${config.key}_ctaLink`} value={section.ctaLink} /></>}
      {config.mapLink && <Field label="Map link"><input name={`${config.key}_mapLink`} defaultValue={String(section.settings.mapLink || '')} className={input} /></Field>}
      {config.bookingSearch && <><Field label="Booking search button label"><input name={`${config.key}_bookingCtaLabel`} defaultValue={String(section.settings.bookingCtaLabel || '')} placeholder="Check availability" className={input} /></Field><label className="flex min-h-12 items-center gap-3 rounded-xl bg-slate-50 px-4 text-sm font-semibold"><input name={`${config.key}_showBookingSearch`} type="checkbox" defaultChecked={section.settings.showBookingSearch !== false} /> Show booking search</label></>}
      <Field label="Section order"><input name={`${config.key}_order`} type="number" defaultValue={section.sortOrder} className={input} /></Field>
      <label className="flex min-h-12 items-center gap-3 rounded-xl bg-slate-50 px-4 text-sm font-semibold"><input name={`${config.key}_visible`} type="checkbox" defaultChecked={section.visible} /> Show this section publicly</label>
    </div>
    {options.length > 0 && <div className="mt-6"><p className="text-sm font-semibold text-slate-800">Featured selections</p><p className="mt-1 text-xs text-slate-500">Select none to use all currently published items.</p><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{options.map((option, index) => <Choice key={option.id} sectionKey={config.key} option={option} checked={selected.has(option.id)} order={section.links.find(link => link.id === option.id)?.sortOrder ?? index * 10} />)}</div></div>}
  </section>;
}

function Choice({ sectionKey, option, checked, order }: { sectionKey: string; option: CmsOption; checked: boolean; order: number }) {
  return <label className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-200 px-3 text-sm"><input name={`${sectionKey}_links`} value={option.id} type="checkbox" defaultChecked={checked} /><span className="min-w-0 flex-1 truncate">{option.label}</span><input name={`${sectionKey}_link_order_${option.id}`} type="number" defaultValue={order} aria-label={`${option.label} order`} className="w-16 rounded border border-slate-300 px-2 py-1" /></label>;
}

function PreservedRetiredHighlights({ data }: { data: HomepageEditorData }) {
  const retired = data.sections.find(section => section.key === 'property_highlights');
  return <div className="hidden" aria-hidden="true">
    {retired && <><input name="property_highlights_title" value={retired.title} readOnly /><input name="property_highlights_subtitle" value={retired.subtitle} readOnly /><input name="property_highlights_body" value={retired.body} readOnly /><input name="property_highlights_eyebrow" value={retired.eyebrow} readOnly /><input name="property_highlights_ctaLabel" value={retired.ctaLabel} readOnly /><input name="property_highlights_ctaLink" value={retired.ctaLink} readOnly /><input name="property_highlights_media" value={retired.backgroundMediaId} readOnly /><input name="property_highlights_order" value={retired.sortOrder} readOnly />{retired.visible && <input name="property_highlights_visible" value="on" readOnly />}</>}
    <input name="highlightCount" value={data.highlights.length} readOnly />
    {data.highlights.map((item, index) => <span key={`highlight-${index}`}><input name={`highlight_${index}_title`} value={item.title} readOnly /><input name={`highlight_${index}_description`} value={item.description} readOnly /><input name={`highlight_${index}_icon`} value={item.icon} readOnly /><input name={`highlight_${index}_order`} value={item.sortOrder} readOnly />{item.visible && <input name={`highlight_${index}_visible`} value="on" readOnly />}</span>)}
  </div>;
}

function findSection(data: HomepageEditorData, key: Exclude<HomepageKey, 'property_highlights'>): HomepageSection {
  return data.sections.find(section => section.key === key) || { id: '', key, title: '', subtitle: '', body: '', eyebrow: '', ctaLabel: '', ctaLink: '', backgroundMediaId: '', settings: {}, status: 'draft', visible: true, sortOrder: sectionConfigs.findIndex(config => config.key === key) * 10, links: [] };
}

function emptyReview(index: number): HomepageReview { return { id: '', author: '', origin: '', quote: '', visible: true, sortOrder: index * 10, status: 'draft' }; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="text-sm font-semibold text-slate-800">{label}{children}</label>; }
