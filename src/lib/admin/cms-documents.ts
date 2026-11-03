import type { AdminSession } from './auth';
import { SITE_DOCUMENT_KEYS, type SiteDocumentKey } from '@/types/site-content-cms';

export interface CmsRpcClient {
  rpc(name: string, args: Record<string, unknown>): PromiseLike<{data: unknown; error: unknown}>;
}
export interface PrivateCmsDocument {
  id: string;
  property_id: string;
  document_key: SiteDocumentKey;
  data: Record<string, string>;
  draft_data: Record<string, string> | null;
  status: 'draft' | 'published' | 'archived';
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const object = (value: unknown): value is Record<string, string> => value !== null && typeof value === 'object' && !Array.isArray(value);
export function assertCmsSession(session: AdminSession) {
  if (!session || !['owner','manager','editor'].includes(session.role) || !uuid.test(session.propertyId) || !uuid.test(session.userId)) {
    throw new Error('CMS access denied.');
  }
}
function assertKey(key: unknown): asserts key is SiteDocumentKey {
  if (!SITE_DOCUMENT_KEYS.includes(key as SiteDocumentKey)) throw new Error('Invalid CMS document key.');
}
/** Uses only the current user's SSR client. Database membership checks remain authoritative. */
export async function readPrivateCmsDocuments(db: CmsRpcClient, session: AdminSession, key: SiteDocumentKey | null = null): Promise<PrivateCmsDocument[]> {
  assertCmsSession(session);
  if (key !== null) assertKey(key);
  const {data, error} = await db.rpc('borealis_admin_cms_documents', {target_property: session.propertyId, target_document_key: key});
  if (error) throw new Error('Private CMS read failed. No public fallback was used.');
  if (!Array.isArray(data)) throw new Error('Invalid private CMS response.');
  const seen = new Set<string>();
  for (const value of data) {
    const row = value as PrivateCmsDocument;
    if (!row || !uuid.test(row.id) || row.property_id !== session.propertyId || !SITE_DOCUMENT_KEYS.includes(row.document_key) || (key !== null && row.document_key !== key) || !object(row.data) || (row.draft_data !== null && !object(row.draft_data)) || !['draft','published','archived'].includes(row.status) || seen.has(row.document_key)) {
      throw new Error('Invalid private CMS response.');
    }
    seen.add(row.document_key);
  }
  return data as PrivateCmsDocument[];
}
export function privateCmsPayload(row: PrivateCmsDocument): Record<string,string> {
  return {...row.data, ...(row.draft_data ?? {})};
}
export async function savePrivateCmsDocument(db: CmsRpcClient, session: AdminSession, key: SiteDocumentKey, data: Record<string,string>, status: 'draft' | 'published'): Promise<string> {
  assertCmsSession(session);
  assertKey(key);
  if (!object(data) || Object.values(data).some(value => typeof value !== 'string') || !['draft','published'].includes(status)) throw new Error('Invalid CMS document.');
  const result = await db.rpc('borealis_save_cms_document', {target_property: session.propertyId, target_document_key: key, input_data: data, target_status: status});
  if (result.error || typeof result.data !== 'string' || !uuid.test(result.data)) throw new Error('CMS save failed. No direct-table fallback was used.');
  return result.data;
}
