import {publicContentRepository} from '@/lib/repositories/public/content';

// Compatibility facade for existing page components. New code should use the
// explicit public repository method names.
export const contentRepository={
  ...publicContentRepository,
  getRoom:publicContentRepository.getRoomBySlug,
  getExperience:publicContentRepository.getExperienceBySlug,
  getTransfer:publicContentRepository.getTransferBySlug,
  getArticles:publicContentRepository.getExploreArticles,
  getArticle:publicContentRepository.getExploreArticleBySlug,
};
export type ContentRepository=typeof contentRepository;
