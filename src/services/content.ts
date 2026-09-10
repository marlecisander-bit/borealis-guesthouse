import { aboutContent, articles, experiences, gallery, property, rooms, transfers } from '@/data/public-content';
import { getPublicMedia } from '@/services/media';
import { getDatabaseRooms } from '@/services/database-rooms';

async function mediaFor(placement: string, relatedSlug?: string) {
  const media = await getPublicMedia();
  return media.filter((asset) => asset.placement === placement && (!relatedSlug || asset.related_slug === relatedSlug));
}

export const contentRepository = {
  getProperty: async () => {
    const hero = (await mediaFor('home_hero'))[0];
    return hero ? { ...property, heroImage: hero.publicUrl } : property;
  },
  getRooms: async () => { const databaseRooms=await getDatabaseRooms(); if(databaseRooms.length)return databaseRooms; return Promise.all(rooms.map(async (room) => {
    const media = await mediaFor('room', room.slug);
    return media.length ? { ...room, image: media[0].publicUrl, gallery: media.map((asset) => asset.publicUrl) } : room;
  }))},
  getRoom: async (slug: string) => (await contentRepository.getRooms()).find((room) => room.slug === slug),
  getExperiences: async () => Promise.all(experiences.map(async (experience) => {
    const media = await mediaFor('experience', experience.slug);
    return media.length ? { ...experience, image: media[0].publicUrl, gallery: media.map((asset) => asset.publicUrl) } : experience;
  })),
  getExperience: async (slug: string) => (await contentRepository.getExperiences()).find((experience) => experience.slug === slug),
  getTransfers: async () => Promise.all(transfers.map(async (transfer) => {
    const media = (await mediaFor('transfer', transfer.id))[0];
    return media ? { ...transfer, image: media.publicUrl } : transfer;
  })),
  getArticles: async () => articles,
  getArticle: async (slug: string) => articles.find((article) => article.slug === slug),
  getGallery: async () => {
    const uploaded = await mediaFor('gallery');
    const uploadedItems = uploaded.map((asset) => ({ id: asset.id, src: asset.publicUrl, alt: asset.alt_text || asset.title || 'Borealis Guest House', category: asset.title || 'Borealis' }));
    return [...uploadedItems, ...gallery];
  },
  getAbout: async () => {
    const hero = (await mediaFor('about_hero'))[0];
    return hero ? { ...aboutContent, heroImage: hero.publicUrl } : aboutContent;
  },
};
export type ContentRepository = typeof contentRepository;
