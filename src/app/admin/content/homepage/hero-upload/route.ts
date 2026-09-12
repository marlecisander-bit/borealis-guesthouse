import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { mediaBucket } from '@/lib/media-url';
import { HERO_IMAGE_CONFIG } from '@/lib/hero-image-config';
import { heroAssetColumns, mapHeroAsset, type HeroAssetRow } from '@/lib/hero-assets';
import { processHeroImage } from '@/lib/hero-image-processing';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(request: Request) {
  const session = await getCurrentAdmin();
  if (!session || !['owner', 'manager', 'editor'].includes(session.role)) return NextResponse.json({ error: 'Sign in with permission to edit the homepage.' }, { status: 403 });
  if (request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  const db = await createServerSupabaseClient();
  try {
    const body = await request.json();
    if (body.action === 'start') {
      if (!['desktop_hero', 'mobile_hero'].includes(body.kind) || !Number.isInteger(body.size) || body.size <= 0 || body.size > HERO_IMAGE_CONFIG.maxBytes) throw new Error('Choose a Hero image up to 24 MB.');
      const ext = HERO_IMAGE_CONFIG.mimeExtensions[body.mime as keyof typeof HERO_IMAGE_CONFIG.mimeExtensions];
      if (!ext) throw new Error('Choose a JPEG, PNG, WebP or AVIF image.');
      const id = crypto.randomUUID();
      const path = `${session.propertyId}/hero/${body.kind}/${id}/original/source.${ext}`;
      const { error } = await db.from('homepage_hero_assets').insert({ id, property_id: session.propertyId, kind: body.kind, original_path: path, filename: String(body.filename || 'Hero image').slice(0, 255), size_bytes: body.size, created_by: session.userId });
      if (error) throw new Error('Hero uploads are unavailable. Check that the Hero assets database migration is installed.');
      const signed = await db.storage.from(mediaBucket).createSignedUploadUrl(path, { upsert: false });
      if (signed.error) throw signed.error;
      return NextResponse.json({ id, path, token: signed.data.token });
    }
    if (body.action !== 'finish' || !/^[0-9a-f-]{36}$/i.test(body.id)) throw new Error('Invalid Hero upload.');
    const result = await db.from('homepage_hero_assets').select('*').eq('id', body.id).eq('property_id', session.propertyId).single();
    if (result.error || !result.data) throw new Error('This Hero upload could not be found.');
    const row = result.data;
    if (row.status === 'ready') return NextResponse.json({ asset: mapHeroAsset(row as HeroAssetRow) });
    if (!row.original_path.startsWith(`${session.propertyId}/hero/${row.kind}/${row.id}/original/`)) throw new Error('Invalid Hero source.');
    // A stale processing lease can be retried after an interrupted server request.
    const cutoff = new Date(Date.now() - 5 * 60_000).toISOString();
    const locked = await db.from('homepage_hero_assets').update({ status: 'processing', updated_at: new Date().toISOString() }).eq('id', row.id).eq('property_id', session.propertyId)
      .or(`status.eq.pending,and(status.eq.processing,updated_at.lt.${cutoff})`).select('id').maybeSingle();
    if (locked.error || !locked.data) throw new Error('This image is still processing. Please retry in a few minutes.');
    const written: string[] = [];
    try {
      const download = await db.storage.from(mediaBucket).download(row.original_path);
      if (download.error || !download.data) throw new Error('The original upload is incomplete. Choose the image again.');
      if (download.data.size !== row.size_bytes) throw new Error('The uploaded file size does not match the original.');
      const processed = await processHeroImage(Buffer.from(await download.data.arrayBuffer()), row.kind);
      const attempt = crypto.randomUUID();
      const variants = [];
      for (const variant of processed.variants) {
        const path = `${session.propertyId}/hero/${row.kind}/${row.id}/optimized/${attempt}/${variant.width}.${variant.ext}`;
        const upload = await db.storage.from(mediaBucket).upload(path, variant.bytes, { contentType: variant.mime, cacheControl: '31536000', upsert: false });
        if (upload.error) throw upload.error;
        written.push(path);
        variants.push({ path, width: variant.width, height: variant.height });
      }
      const saved = await db.from('homepage_hero_assets').update({ width: processed.width, height: processed.height, variants, status: 'ready', updated_at: new Date().toISOString() }).eq('id', row.id).eq('property_id', session.propertyId).select(heroAssetColumns).single();
      if (saved.error) throw saved.error;
      return NextResponse.json({ asset: mapHeroAsset(saved.data as HeroAssetRow) });
    } catch (error) {
      // Only incomplete derivatives are removed; the original is always retained.
      if (written.length) await db.storage.from(mediaBucket).remove(written);
      await db.from('homepage_hero_assets').update({ status: 'pending', updated_at: new Date().toISOString() }).eq('id', row.id).eq('property_id', session.propertyId);
      throw error;
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Hero upload failed. Please retry.' }, { status: 400 });
  }
}
