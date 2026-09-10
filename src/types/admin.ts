export type ContentStatus = 'draft' | 'published' | 'archived';
export interface CmsPageContent { heroHeading: string; heroCopy: string; eyebrow?: string }
export interface CmsPage { id: string; propertyId: string; slug: string; title: string; content: CmsPageContent; status: ContentStatus; seoTitle: string; seoDescription: string; updatedAt: string }
export interface AdminActionState { ok: boolean; message: string; errors?: Record<string,string> }
