'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { AdminMediaAsset } from '@/types/media';
import type { AdminRoomImage } from '@/types/rooms-admin';
import { MediaUploader } from './MediaUploader';

type RoomImagesManagerProps = {
  propertyId: string;
  roomTypeId: string;
  initialImages: AdminRoomImage[];
};

export function RoomImagesManager({ propertyId, roomTypeId, initialImages }: RoomImagesManagerProps) {
  const db = useMemo(() => createClient(), []);
  const [images, setImages] = useState(initialImages);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [dragged, setDragged] = useState<number | null>(null);

  async function attach(assets: AdminMediaAsset[]) {
    setBusy(true);
    setMessage('');
    try {
      const { data: { user } } = await db.auth.getUser();
      if (!user) throw new Error('Sign in again.');

      const rows = assets.map((asset, index) => ({
        property_id: propertyId,
        room_type_id: roomTypeId,
        media_asset_id: asset.id,
        status: 'published',
        is_visible: true,
        sort_order: images.length + index,
        is_featured: images.length === 0 && index === 0,
        created_by: user.id,
      }));
      const { data, error } = await db
        .from('room_images')
        .insert(rows)
        .select('id,media_asset_id,is_featured,sort_order');
      if (error) throw error;

      setImages((current) => [
        ...current,
        ...(data || []).map((link) => {
          const asset = assets.find((item) => item.id === link.media_asset_id);
          if (!asset) throw new Error('The uploaded image could not be matched.');
          return {
            id: link.id,
            mediaAssetId: asset.id,
            publicUrl: asset.publicUrl,
            altText: asset.alt_text || '',
            isFeatured: link.is_featured,
            sortOrder: link.sort_order,
          };
        }),
      ]);
      setMessage('Room photos added.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not add the photos.');
    } finally {
      setBusy(false);
    }
  }

  async function setCover(id: string) {
    setBusy(true);
    setMessage('');
    const previousCover = images.find((item) => item.isFeatured)?.id;
    try {
      const { error: clearError } = await db
        .from('room_images')
        .update({ is_featured: false })
        .eq('property_id', propertyId)
        .eq('room_type_id', roomTypeId);
      if (clearError) throw clearError;

      const { error } = await db
        .from('room_images')
        .update({ is_featured: true })
        .eq('id', id)
        .eq('property_id', propertyId)
        .eq('room_type_id', roomTypeId);
      if (error) {
        if (previousCover) {
          await db
            .from('room_images')
            .update({ is_featured: true })
            .eq('id', previousCover)
            .eq('property_id', propertyId)
            .eq('room_type_id', roomTypeId);
        }
        throw error;
      }
      setImages((items) => items.map((item) => ({ ...item, isFeatured: item.id === id })));
      setMessage('Cover image updated.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update the cover image.');
    } finally {
      setBusy(false);
    }
  }

  async function updateAlt(image: AdminRoomImage, value: string) {
    const { error } = await db
      .from('media_assets')
      .update({ alt_text: value })
      .eq('id', image.mediaAssetId)
      .eq('property_id', propertyId);
    setMessage(error ? error.message : 'Alternative text saved.');
    if (!error) {
      setImages((items) => items.map((item) => item.id === image.id ? { ...item, altText: value } : item));
    }
  }

  async function archive(image: AdminRoomImage) {
    if (!confirm('Remove this image from the room gallery?')) return;
    setBusy(true);
    const { error } = await db
      .from('room_images')
      .update({ status: 'archived', is_visible: false })
      .eq('id', image.id)
      .eq('property_id', propertyId)
      .eq('room_type_id', roomTypeId);
    setMessage(error ? error.message : 'Image removed from this room.');
    if (!error) setImages((items) => items.filter((item) => item.id !== image.id));
    setBusy(false);
  }

  async function reorder(from: number, to: number) {
    if (from === to) return;
    const previous = images;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setImages(next);
    setBusy(true);
    const results = await Promise.all(next.map((item, index) => db
      .from('room_images')
      .update({ sort_order: index })
      .eq('id', item.id)
      .eq('property_id', propertyId)
      .eq('room_type_id', roomTypeId)));
    const failed = results.find((result) => result.error);
    if (failed?.error) setImages(previous);
    setMessage(failed?.error?.message || 'Image order saved.');
    setBusy(false);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div>
        <h2 className="text-xl font-bold">Room photos</h2>
        <p className="mt-1 text-sm text-slate-500">Upload through the shared Media Library. Drag existing photos to reorder them.</p>
      </div>
      <div className="mt-5"><MediaUploader compact onUploaded={attach} /></div>
      {message && <p role="status" aria-live="polite" className="mt-4 text-sm text-slate-600">{message}</p>}
      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {images.map((image, index) => (
          <article key={image.id} draggable onDragStart={() => setDragged(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (dragged !== null) void reorder(dragged, index); setDragged(null); }} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            <div className="relative aspect-[4/3]">
              <Image src={image.publicUrl} alt={image.altText} fill sizes="(max-width:640px) 100vw,33vw" className="object-cover" />
              {image.isFeatured && <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-bold">Cover</span>}
            </div>
            <div className="space-y-3 p-4">
              <label className="block text-xs font-bold text-slate-600">
                Alternative text
                <input defaultValue={image.altText} onBlur={(event) => void updateAlt(image, event.target.value)} className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal" />
              </label>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => void setCover(image.id)} disabled={busy || image.isFeatured} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold disabled:opacity-50">Set cover</button>
                <button onClick={() => void reorder(index, Math.max(0, index - 1))} disabled={index === 0 || busy} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold disabled:opacity-50">Move up</button>
                <button onClick={() => void archive(image)} disabled={busy} className="rounded-lg px-3 py-2 text-xs font-bold text-red-700 disabled:opacity-50">Remove</button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {images.length === 0 && <div className="mt-6 rounded-xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500">No room photos yet.</div>}
    </section>
  );
}
