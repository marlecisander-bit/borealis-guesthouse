export type WebsiteStatus = 'Live' | 'Unpublished changes' | 'Draft only' | 'Archived' | 'Status unavailable';

export function websiteStatus(status: string | undefined, hasDraft: boolean): WebsiteStatus {
  if (status === 'archived') return 'Archived';
  if (status === 'published') return hasDraft ? 'Unpublished changes' : 'Live';
  if (status === 'draft') return 'Draft only';
  if (status !== undefined) return 'Status unavailable';
  // A successful lookup with no override serves the built-in public version.
  return hasDraft ? 'Draft only' : 'Live';
}
