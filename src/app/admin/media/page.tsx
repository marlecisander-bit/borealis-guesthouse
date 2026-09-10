'use client';

import Image from 'next/image';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { experiences, rooms, transfers } from '@/data/public-content';
import type { MediaAsset, MediaPlacement } from '@/types/media';

const placementOptions: { value: MediaPlacement; label: string }[] = [
  { value: 'gallery', label: 'Public gallery' },
  { value: 'home_hero', label: 'Homepage hero' },
  { value: 'room', label: 'Room gallery' },
  { value: 'experience', label: 'Experience gallery' },
  { value: 'transfer', label: 'Transfer image' },
  { value: 'about_hero', label: 'About page hero' },
];

export default function MediaPage() {
  const supabase = useMemo(() => createClient(), []);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [placement, setPlacement] = useState<MediaPlacement>('gallery');
  const [relatedSlug, setRelatedSlug] = useState('');
  const [altText, setAltText] = useState('');
  const [category, setCategory] = useState('Borealis');
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const loadAssets = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('media_assets').select('*').order('display_order').order('created_at', { ascending: false });
    setMessage(error ? error.message : '');
    setAssets((data as MediaAsset[] | null) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    let active = true;
    void supabase.from('media_assets').select('*').order('display_order').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (!active) return;
      setMessage(error ? error.message : '');
      setAssets((data as MediaAsset[] | null) || []);
      setLoading(false);
    });
    return () => { active = false; };
  }, [supabase]);

  const targets = placement === 'room'
    ? rooms.map((item) => ({ value: item.slug, label: item.name }))
    : placement === 'experience'
      ? experiences.map((item) => ({ value: item.slug, label: item.title }))
      : placement === 'transfer'
        ? transfers.filter((item) => item.active).map((item) => ({ value: item.id, label: `${item.origin} → ${item.destination}` }))
        : [];

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    if (!files?.length) return setMessage('Choose at least one image.');
    if (targets.length && !relatedSlug) return setMessage('Choose where this image should appear.');
    if (!altText.trim()) return setMessage('Add descriptive alternative text.');
    setUploading(true);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error('Your admin session has expired. Please sign in again.');
      const { data: admin, error: adminError } = await supabase.from('admin_users').select('property_id').eq('email', userData.user.email || '').single();
      if (adminError || !admin?.property_id) throw new Error('This account is not linked to a property in admin_users.');

      for (const [index, file] of Array.from(files).entries()) {
        if (!file.type.startsWith('image/')) throw new Error(`${file.name} is not an image.`);
        if (file.size > 10 * 1024 * 1024) throw new Error(`${file.name} is larger than 10 MB.`);
        const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
        const path = `${admin.property_id}/${crypto.randomUUID()}.${extension}`;
        const { error: storageError } = await supabase.storage.from('public-media').upload(path, file, { contentType: file.type, cacheControl: '31536000', upsert: false });
        if (storageError) throw storageError;

        const { error: insertError } = await supabase.from('media_assets').insert({
          property_id: admin.property_id,
          file_path: path, filename: file.name, mime_type: file.type,
          alt_text: files.length === 1 ? altText.trim() : `${altText.trim()} ${index + 1}`,
          title: category.trim() || 'Borealis',
          file_type: file.type,
          size_bytes: file.size,
          placement,
          related_slug: relatedSlug || null,
          display_order: assets.length + index,
          is_published: true, is_visible: true, status: 'published', sort_order: assets.length + index,
        });
        if (insertError) {
          await supabase.storage.from('public-media').remove([path]);
          throw insertError;
        }
      }

      setFiles(null);
      setAltText('');
      const input = document.getElementById('media-files') as HTMLInputElement | null;
      if (input) input.value = '';
      setMessage('Upload complete. The published image is now available to the public website.');
      await loadAssets();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  async function remove(asset: MediaAsset) {
    if (!window.confirm('Archive this image? It will disappear from the public website but remain recoverable.')) return;
    setMessage('');
    const { error } = await supabase.from('media_assets').update({ status: 'archived', is_published: false, is_visible: false, archived_at: new Date().toISOString() }).eq('id', asset.id);
    setMessage(error ? error.message : 'Image archived.');
    await loadAssets();
  }

  return <div className="space-y-8">
    <header><h1 className="text-3xl font-bold text-slate-900">Media Library</h1><p className="mt-1 text-slate-600">Upload and place images on the public Borealis website.</p></header>

    <form onSubmit={upload} className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 lg:grid-cols-2">
      <label className="text-sm font-semibold text-slate-800">Image files
        <input id="media-files" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={(event) => setFiles(event.target.files)} className="mt-2 block min-h-12 w-full rounded-lg border border-slate-300 p-2 text-sm" />
        <span className="mt-1 block text-xs font-normal text-slate-500">JPEG, PNG, WebP or AVIF. Maximum 10 MB each.</span>
      </label>
      <label className="text-sm font-semibold text-slate-800">Show on
        <select value={placement} onChange={(event) => { setPlacement(event.target.value as MediaPlacement); setRelatedSlug(''); }} className="mt-2 min-h-12 w-full rounded-lg border border-slate-300 px-3">{placementOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
      </label>
      {targets.length > 0 && <label className="text-sm font-semibold text-slate-800">Page item
        <select value={relatedSlug} onChange={(event) => setRelatedSlug(event.target.value)} required className="mt-2 min-h-12 w-full rounded-lg border border-slate-300 px-3"><option value="">Choose an item</option>{targets.map((target) => <option key={target.value} value={target.value}>{target.label}</option>)}</select>
      </label>}
      <label className="text-sm font-semibold text-slate-800">Alternative text
        <input value={altText} onChange={(event) => setAltText(event.target.value)} required placeholder="Describe what is visible in the image" className="mt-2 min-h-12 w-full rounded-lg border border-slate-300 px-3" />
      </label>
      <label className="text-sm font-semibold text-slate-800">Category / label
        <input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Lake, Stay, Experience…" className="mt-2 min-h-12 w-full rounded-lg border border-slate-300 px-3" />
      </label>
      <div className="flex items-end"><button disabled={uploading} className="min-h-12 w-full rounded-lg bg-slate-900 px-5 font-semibold text-white disabled:cursor-wait disabled:opacity-60">{uploading ? 'Uploading…' : 'Upload and publish'}</button></div>
      {message && <p role="status" className="lg:col-span-2 text-sm text-slate-700">{message}</p>}
    </form>

    <section aria-labelledby="uploaded-images"><div className="flex items-end justify-between"><div><h2 id="uploaded-images" className="text-xl font-bold text-slate-900">Uploaded images</h2><p className="text-sm text-slate-500">The first image for a room or experience is used as its main image.</p></div><button onClick={() => void loadAssets()} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">Refresh</button></div>
      {loading ? <p className="mt-6 text-slate-500">Loading media…</p> : assets.length === 0 ? <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">No uploaded images yet.</div> : <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{assets.map((asset) => {
        const publicUrl = supabase.storage.from('public-media').getPublicUrl(asset.file_path).data.publicUrl;
        return <article key={asset.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="relative aspect-[4/3] bg-slate-100"><Image src={publicUrl} alt={asset.alt_text || ''} fill sizes="(max-width:640px) 100vw,33vw" className="object-cover" /></div><div className="p-4"><p className="font-semibold text-slate-900">{asset.title || 'Borealis image'}</p><p className="mt-1 text-xs text-slate-500">{asset.placement.replace('_', ' ')}{asset.related_slug ? ` · ${asset.related_slug}` : ''}</p><p className="mt-3 line-clamp-2 text-sm text-slate-600">{asset.alt_text || 'No alternative text'}</p><button onClick={() => void remove(asset)} className="mt-4 text-sm font-semibold text-red-700">Delete image</button></div></article>;
      })}</div>}
    </section>
  </div>;
}
