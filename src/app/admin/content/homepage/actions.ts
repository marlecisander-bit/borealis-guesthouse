'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { adminHomepageRepository, clearHomepageDraft, saveHomepageDraft } from '@/lib/repositories/admin/homepage';
import { homepageKeys, type HomepageCmsState, type HomepageHighlight, type HomepageReview, type HomepageSection } from '@/types/homepage-cms';

const text = (data: FormData, key: string) => String(data.get(key) || '').trim();

export async function saveHomepageCms(_: HomepageCmsState, data: FormData): Promise<HomepageCmsState> {
  const session = await requireAdmin(['owner', 'manager', 'editor']);
  const status = text(data, 'status') as 'draft' | 'published';
  if (!['draft', 'published'].includes(status)) return { ok: false, message: 'Choose Save Draft or Publish.' };

  const sections: HomepageSection[] = homepageKeys.map((key, index) => ({
    id: '', key,
    title: text(data, `${key}_title`), subtitle: text(data, `${key}_subtitle`), body: text(data, `${key}_body`), eyebrow: text(data, `${key}_eyebrow`),
    ctaLabel: text(data, `${key}_ctaLabel`), ctaLink: text(data, `${key}_ctaLink`), backgroundMediaId: text(data, `${key}_media`),
    settings: {
      showBookingSearch: data.get(`${key}_showBookingSearch`) === 'on',
      bookingCtaLabel: text(data, `${key}_bookingCtaLabel`),
      imageAlt: text(data, `${key}_imageAlt`),
      imageLabel: text(data, `${key}_imageLabel`),
    },
    status, visible: data.get(`${key}_visible`) === 'on', sortOrder: Number(text(data, `${key}_order`) || index * 10),
    links: data.getAll(`${key}_links`).map((id, itemIndex) => ({ type: linkType(key), id: String(id), sortOrder: Number(text(data, `${key}_link_order_${id}`) || itemIndex * 10) })).sort((a, b) => a.sortOrder - b.sortOrder),
  }));
  const highlights: HomepageHighlight[] = Array.from({ length: Number(text(data, 'highlightCount') || 0) }, (_, index) => ({
    id: '', title: text(data, `highlight_${index}_title`), description: text(data, `highlight_${index}_description`), icon: text(data, `highlight_${index}_icon`),
    visible: data.get(`highlight_${index}_visible`) === 'on', sortOrder: Number(text(data, `highlight_${index}_order`) || index * 10), status,
  })).filter(item => item.title);
  const reviews: HomepageReview[] = Array.from({ length: Number(text(data, 'reviewCount') || 0) }, (_, index) => ({
    id: '', author: text(data, `review_${index}_author`), origin: text(data, `review_${index}_origin`), quote: text(data, `review_${index}_quote`),
    visible: data.get(`review_${index}_visible`) === 'on', sortOrder: Number(text(data, `review_${index}_order`) || index * 10), status,
  })).filter(item => item.quote);
  const hero = sections.find(item => item.key === 'hero')!;
  const intro = sections.find(item => item.key === 'intro')!;

  if (status === 'published' && hero.title.length < 3) return { ok: false, message: 'Add a hero headline before publishing.' };
  if (status === 'published' && intro.visible && intro.title.length < 3) return { ok: false, message: 'Add an introduction heading before publishing.' };
  if (hero.ctaLabel && !hero.ctaLink) return { ok: false, message: 'Add a destination for the primary button, or leave both button fields blank.' };
  if (hero.ctaLink && !hero.ctaLabel) return { ok: false, message: 'Add a label for the primary button, or leave both button fields blank.' };
  if (intro.ctaLabel && !intro.ctaLink) return { ok: false, message: 'Add a destination for the introduction button.' };
  if (intro.ctaLink && !intro.ctaLabel) return { ok: false, message: 'Add a label for the introduction button.' };
  if (intro.backgroundMediaId && !intro.settings.imageAlt) return { ok: false, message: 'Add alternative text for the introduction image.' };
  if (sections.some(item => item.ctaLink && !/^\/(?:[a-z0-9-]+\/?)*$/i.test(item.ctaLink))) return { ok: false, message: 'Homepage button destinations must use a safe internal path beginning with /.' };

  try {
    if (status === 'draft') await saveHomepageDraft(session, { sections, highlights, reviews });
    else {
      await adminHomepageRepository.save(session, { status, sections, highlights, reviews });
      await clearHomepageDraft(session);
    }
    revalidatePath('/admin/content');
    revalidatePath('/admin/content/homepage');
    revalidatePath('/');
    return { ok: true, message: status === 'published' ? 'Homepage content published.' : 'Draft saved. The public website has not changed.' };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Homepage could not be saved.' };
  }
}

function linkType(key: string) {
  if (key === 'featured_rooms') return 'room_type';
  if (key === 'featured_experiences') return 'experience';
  if (key === 'explore_koman') return 'tourism_article';
  if (key === 'transfers') return 'transfer_route';
  return 'media_asset';
}
