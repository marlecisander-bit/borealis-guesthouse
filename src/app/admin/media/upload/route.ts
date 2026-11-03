import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin/auth';
import { mediaBucket, resolvePublicMediaUrl } from '@/lib/media-url';
import { MEDIA_UPLOAD_CONFIG } from '@/lib/media-upload-config';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { canUploadMedia, detectMediaImage } from '@/lib/media-upload-security';

export async function POST(request: Request) {
  const session = await getCurrentAdmin();
  if (!session) return NextResponse.json({ error: 'Administrator access is required.' }, { status: 401 });
  if (!canUploadMedia(session)) return NextResponse.json({ error: 'Permission to edit media is required.' }, { status: 403 });
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Choose an image.' }, { status: 400 });
  if (!file.size || file.size > MEDIA_UPLOAD_CONFIG.maxUploadBytes) return NextResponse.json({ error: 'The prepared image must be between 1 byte and 4 MiB.' }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = detectMediaImage(bytes);
  if (!detected) return NextResponse.json({ error: 'Only genuine JPEG, PNG, WebP, and AVIF images are accepted.' }, { status: 415 });
  const submittedWidth = Number(form.get('width') || 0), submittedHeight = Number(form.get('height') || 0);
  const width = Number.isInteger(submittedWidth) && submittedWidth > 0 && submittedWidth <= 50_000 ? submittedWidth : null;
  const height = Number.isInteger(submittedHeight) && submittedHeight > 0 && submittedHeight <= 50_000 ? submittedHeight : null;
  const filenameBase = file.name.replace(/\.[^.]+$/, '').replace(/[^\p{L}\p{N}._ -]+/gu, '-').trim().slice(0, 240) || 'image';
  const filename = `${filenameBase}.${detected.ext}`;
  const requestedUploadId = String(form.get('uploadId') || '');
  const assetId = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestedUploadId)
    ? requestedUploadId.toLowerCase()
    : crypto.randomUUID();
  const path = `${session.propertyId}/${assetId}.${detected.ext}`;
  const db = await createServerSupabaseClient();
  const existing = await db.from('media_assets').select(columns).eq('id', assetId).eq('property_id', session.propertyId).maybeSingle();
  if (existing.error) return NextResponse.json({ error: 'The media record could not be checked. Please retry.' }, { status: 500 });
  if (existing.data) return NextResponse.json({ asset: { ...existing.data, publicUrl: resolvePublicMediaUrl(existing.data.file_path, existing.data.storage_bucket), referencedByPublishedContent: false } });
  const upload = await db.storage.from(mediaBucket).upload(path, bytes, { contentType: detected.mime, cacheControl: '31536000', upsert: false });
  if (upload.error) return NextResponse.json({ error: 'Upload failed. Check your session and retry.' }, { status: 400 });
  const { data, error } = await db.from('media_assets').insert({ id: assetId, property_id: session.propertyId, storage_bucket: mediaBucket, file_path: path, filename, title: String(form.get('displayName') || filenameBase).trim().slice(0, 255), mime_type: detected.mime, file_type: detected.mime, size_bytes: file.size, width, height, alt_text: String(form.get('altText') || '').trim().slice(0, 500) || null, caption: String(form.get('caption') || '').trim().slice(0, 2000) || null, status: 'published', is_published: true, is_visible: true, placement: 'gallery', created_by: session.userId, updated_by: session.userId }).select(columns).single();
  if (error) {
    let cleanupFailed = false;
    try { cleanupFailed = !!(await db.storage.from(mediaBucket).remove([path])).error; } catch { cleanupFailed = true; }
    return NextResponse.json({ error: cleanupFailed ? 'The media record could not be saved and cleanup failed. Contact an administrator before retrying.' : 'The media record could not be saved. The incomplete upload was removed.' }, { status: 400 });
  }
  return NextResponse.json({ asset: { ...data, publicUrl: resolvePublicMediaUrl(path, mediaBucket), referencedByPublishedContent: false } }, { status: 201 });
}

const columns = 'id,property_id,storage_bucket,file_path,filename,title,mime_type,file_type,size_bytes,width,height,alt_text,caption,focal_x,focal_y,placement,related_slug,display_order,is_published,status,is_visible,sort_order,created_at,updated_at';
