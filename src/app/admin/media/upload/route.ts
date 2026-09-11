import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin/auth';
import { mediaBucket, resolvePublicMediaUrl } from '@/lib/media-url';
import { MEDIA_UPLOAD_CONFIG } from '@/lib/media-upload-config';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const signatures = [
  { mime: 'image/jpeg', ext: 'jpg', test: (b: Uint8Array) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/png', ext: 'png', test: (b: Uint8Array) => b.slice(0, 8).every((v, i) => v === [137,80,78,71,13,10,26,10][i]) },
  { mime: 'image/webp', ext: 'webp', test: (b: Uint8Array) => String.fromCharCode(...b.slice(0,4)) === 'RIFF' && String.fromCharCode(...b.slice(8,12)) === 'WEBP' },
  { mime: 'image/avif', ext: 'avif', test: (b: Uint8Array) => String.fromCharCode(...b.slice(4,12)).includes('ftyp') && ['avif','avis'].includes(String.fromCharCode(...b.slice(8,12))) },
];

export async function POST(request: Request) {
  const session = await getCurrentAdmin();
  if (!session) return NextResponse.json({ error: 'Administrator access is required.' }, { status: 401 });
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Choose an image.' }, { status: 400 });
  if (!file.size || file.size > MEDIA_UPLOAD_CONFIG.maxUploadBytes) return NextResponse.json({ error: 'The prepared image must be between 1 byte and 4 MB.' }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = signatures.find(signature => signature.test(bytes));
  if (!detected) return NextResponse.json({ error: 'Only genuine JPEG, PNG, WebP, and AVIF images are accepted.' }, { status: 415 });
  const submittedWidth = Number(form.get('width') || 0), submittedHeight = Number(form.get('height') || 0);
  const width = Number.isInteger(submittedWidth) && submittedWidth > 0 && submittedWidth <= 50_000 ? submittedWidth : null;
  const height = Number.isInteger(submittedHeight) && submittedHeight > 0 && submittedHeight <= 50_000 ? submittedHeight : null;
  const filenameBase = file.name.replace(/\.[^.]+$/, '').replace(/[^\p{L}\p{N}._ -]+/gu, '-').trim().slice(0, 240) || 'image';
  const filename = `${filenameBase}.${detected.ext}`;
  const requestedUploadId = String(form.get('uploadId') || '');
  const assetId = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestedUploadId)
    ? requestedUploadId
    : crypto.randomUUID();
  const path = `${session.propertyId}/${assetId}.${detected.ext}`;
  const db = await createServerSupabaseClient();
  const existing = await db.from('media_assets').select(columns).eq('id', assetId).eq('property_id', session.propertyId).maybeSingle();
  if (existing.error) return NextResponse.json({ error: existing.error.message }, { status: 500 });
  if (existing.data) return NextResponse.json({ asset: { ...existing.data, publicUrl: resolvePublicMediaUrl(existing.data.file_path, existing.data.storage_bucket), referencedByPublishedContent: false } });
  const upload = await db.storage.from(mediaBucket).upload(path, bytes, { contentType: detected.mime, cacheControl: '31536000', upsert: false });
  if (upload.error) return NextResponse.json({ error: upload.error.message }, { status: 400 });
  const { data, error } = await db.from('media_assets').insert({ id: assetId, property_id: session.propertyId, storage_bucket: mediaBucket, file_path: path, filename, title: String(form.get('displayName') || filenameBase).trim().slice(0, 255), mime_type: detected.mime, file_type: detected.mime, size_bytes: file.size, width, height, alt_text: String(form.get('altText') || '').trim().slice(0, 500) || null, caption: String(form.get('caption') || '').trim().slice(0, 2000) || null, status: 'published', is_published: true, is_visible: true, placement: 'gallery', created_by: session.userId, updated_by: session.userId }).select(columns).single();
  if (error) { await db.storage.from(mediaBucket).remove([path]); return NextResponse.json({ error: error.message }, { status: 400 }); }
  return NextResponse.json({ asset: { ...data, publicUrl: resolvePublicMediaUrl(path, mediaBucket), referencedByPublishedContent: false } }, { status: 201 });
}

const columns = 'id,property_id,storage_bucket,file_path,filename,title,mime_type,file_type,size_bytes,width,height,alt_text,caption,focal_x,focal_y,placement,related_slug,display_order,is_published,status,is_visible,sort_order,created_at,updated_at';
