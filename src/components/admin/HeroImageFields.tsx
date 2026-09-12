'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { HERO_IMAGE_CONFIG, heroFocalPoint, heroResolutionWarning, type HeroAsset, type HeroAssetKind, type HeroFocalPoint } from '@/lib/hero-image-config';

type Selection = { asset?: HeroAsset; assetId?: string; legacyId: string; url: string; focal: HeroFocalPoint };
type Props = { desktopAssetId?: string; mobileAssetId?: string; desktopAsset?: HeroAsset; mobileAsset?: HeroAsset; desktopLegacyId: string; mobileLegacyId: string; desktopUrl: string; mobileUrl: string; desktopFocal: unknown; mobileFocal: unknown };
const previewUrl = (asset?: HeroAsset) => asset?.variants[asset.variants.length - 1]?.url || '';

export function HeroImageFields(props: Props) {
  const [desktop, setDesktop] = useState<Selection>({ assetId: props.desktopAssetId, asset: props.desktopAsset, legacyId: props.desktopLegacyId, url: previewUrl(props.desktopAsset) || props.desktopUrl, focal: heroFocalPoint(props.desktopFocal) });
  const [mobile, setMobile] = useState<Selection>({ assetId: props.mobileAssetId, asset: props.mobileAsset, legacyId: props.mobileLegacyId, url: previewUrl(props.mobileAsset) || props.mobileUrl, focal: heroFocalPoint(props.mobileFocal, true) });
  return <>
    <HeroImageControl kind="desktop_hero" value={desktop} onChange={setDesktop} />
    <HeroImageControl kind="mobile_hero" value={mobile} onChange={setMobile} fallback={desktop.url} />
  </>;
}

async function heroRequest(body: Record<string, unknown>) {
  const response = await fetch('/admin/content/homepage/hero-upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (response.redirected) throw new Error('Your Admin session has expired. Sign in again, then retry.');
  let result;
  try { result = await response.json(); } catch { throw new Error('The server could not finish this upload. Please retry.'); }
  if (!response.ok) throw new Error(result.error || 'Hero upload failed. Please retry.');
  return result;
}

function HeroImageControl({ kind, value, onChange, fallback = '' }: { kind: HeroAssetKind; value: Selection; onChange: (value: Selection) => void; fallback?: string }) {
  const mobile = kind === 'mobile_hero';
  const label = mobile ? 'Mobile Hero Image' : 'Desktop Hero Image';
  const prefix = mobile ? 'mobile' : 'desktop';
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<{ file: File; url: string; width: number; height: number }>();
  const [focal, setFocal] = useState(value.focal);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadId, setUploadId] = useState('');
  const selectionVersion = useRef(0);
  useEffect(() => () => { if (chosen) URL.revokeObjectURL(chosen.url); }, [chosen]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const element = dialog.current;
    element?.showModal();
    return () => { element?.close(); document.body.style.overflow = previous; };
  }, [open]);

  function close() { if (!busy) { selectionVersion.current++; setOpen(false); setChosen(undefined); setUploadId(''); } }
  async function choose(file?: File) {
    if (!file || busy) return;
    const version = ++selectionVersion.current;
    setMessage('');
    if (!(file.type in HERO_IMAGE_CONFIG.mimeExtensions) || !file.size || file.size > HERO_IMAGE_CONFIG.maxBytes) { setMessage('Choose a JPEG, PNG, WebP or AVIF image up to 24 MB.'); return; }
    const url = URL.createObjectURL(file);
    try {
      const image = new window.Image();
      image.src = url;
      await image.decode();
      if (image.naturalWidth * image.naturalHeight > HERO_IMAGE_CONFIG.maxPixels) throw new Error('Choose an image with fewer than 60 megapixels.');
      if (version !== selectionVersion.current) { URL.revokeObjectURL(url); return; }
      setChosen({ file, url, width: image.naturalWidth, height: image.naturalHeight });
      setUploadId('');
      setFocal(heroFocalPoint(null, mobile));
    } catch (error) { URL.revokeObjectURL(url); setMessage(error instanceof Error ? error.message : 'This image could not be opened.'); }
  }

  async function save() {
    if (!chosen) { onChange({ ...value, focal }); close(); return; }
    setBusy(true);
    try {
      let id = uploadId;
      if (!id) {
        setMessage('Uploading original image…');
        const started = await heroRequest({ action: 'start', kind, filename: chosen.file.name, size: chosen.file.size, mime: chosen.file.type });
        const db = createClient();
        const uploaded = await db.storage.from('public-media').uploadToSignedUrl(started.path, started.token, chosen.file, { contentType: chosen.file.type, cacheControl: '31536000' });
        if (uploaded.error) throw new Error('Upload interrupted. Check your connection and retry.');
        id = started.id;
        setUploadId(id);
      }
      setMessage('Preparing high-quality Hero images…');
      const result = await heroRequest({ action: 'finish', id });
      const asset = result.asset as HeroAsset;
      onChange({ asset, legacyId: '', url: previewUrl(asset), focal });
      setOpen(false); setChosen(undefined); setUploadId(''); setMessage('');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'The image could not be saved. Please retry.'); }
    finally { setBusy(false); }
  }

  const currentUrl = value.url || fallback;
  const largeUrl = chosen?.url || value.url;
  const width = chosen?.width || value.asset?.width;
  const height = chosen?.height || value.asset?.height;
  const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
  const ratio = width && height ? `${width / gcd(width, height)}:${height / gcd(width, height)}` : '';
  const guidance = mobile ? 'Recommended: 1200–1600px wide portrait image.' : 'Recommended: 2560px+ landscape image.';
  const frame = mobile ? 'aspect-[3/4] max-w-60' : 'aspect-video';
  return <div className="min-w-0 text-sm text-slate-800">
    <p className="font-semibold">{label}</p>
    <input type="hidden" name={mobile ? 'hero_mobileMedia' : 'hero_media'} value={value.legacyId} />
    <input type="hidden" name={`hero_${prefix}HeroAssetId`} value={value.asset?.id || value.assetId || ''} />
    <input type="hidden" name={`hero_${prefix}Focal`} value={JSON.stringify(value.focal)} />
    <input type="hidden" name={`hero_${prefix}Uploading`} value={busy ? 'yes' : ''} />
    <div className={`relative mt-2 overflow-hidden rounded-xl bg-slate-100 ${frame}`}>
      {/* Native images display already-prepared variants without recompression. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {currentUrl ? <img src={currentUrl} alt={`${label} preview`} className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: `${value.focal.x}% ${value.focal.y}%` }} /> : <p className="p-5 text-slate-500">Using the website fallback image.</p>}
    </div>
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" onClick={() => { setFocal(value.focal); setMessage(''); setOpen(true); }} className="min-h-11 rounded-lg border border-slate-300 px-4 font-semibold">Replace image</button>
      <button type="button" disabled={!value.url && !value.assetId} onClick={() => onChange({ legacyId: '', url: '', focal: heroFocalPoint(null, mobile) })} className="min-h-11 rounded-lg px-3 font-semibold text-red-700 disabled:opacity-40">Remove image</button>
    </div>
    <p className="mt-2 text-xs leading-5 text-slate-500">{guidance}</p>
    {mobile && <p className="mt-1 text-xs leading-5 text-slate-500">{!value.url ? 'Using Desktop Hero Image as fallback.' : 'Optional portrait image. If empty, the desktop hero image will be used.'}</p>}

    <dialog ref={dialog} aria-label={`Upload Hero Image — ${label}`} onCancel={event => { event.preventDefault(); close(); }} className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 text-slate-800 shadow-xl backdrop:bg-slate-950/60">
      <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold">Upload Hero Image</h2><button type="button" disabled={busy} onClick={close} className="min-h-11 rounded-lg border px-4">Close</button></div>
      <p className="mt-2 text-sm">{label} · {guidance}</p>
      <div onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); void choose(event.dataTransfer.files[0]); }} className="mt-4 rounded-xl border-2 border-dashed border-slate-300 p-5 text-center">
        <p>Drag &amp; drop an image here</p><p className="my-2 text-xs">or</p>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={busy} className="sr-only" aria-label={`Choose ${label}`} onChange={event => { void choose(event.target.files?.[0]); event.target.value = ''; }} />
        <button type="button" disabled={busy} onClick={() => input.current?.click()} className="min-h-11 rounded-lg border border-slate-300 px-4 font-semibold">Choose image</button>
      </div>
      {largeUrl && <>
        <p className="mt-4 break-words font-semibold">{chosen?.file.name || value.asset?.filename || 'Current Hero image'}</p>
        {width && height && <p className="mt-1 text-sm">{width} × {height} · {((chosen?.file.size || value.asset?.sizeBytes || 0) / 1024 / 1024).toFixed(1)} MB · {ratio}</p>}
        {width && heroResolutionWarning(kind, width) && <p role="status" className="mt-2 text-sm text-amber-800">{heroResolutionWarning(kind, width)}</p>}
        <p className="mt-4 text-sm">Optional: click the important part of the full image. You can also use the arrow keys to adjust the focal point.</p>
        <button type="button" disabled={busy} aria-label="Set Hero focal point" onClick={event => { const bounds = event.currentTarget.getBoundingClientRect(); if (event.detail) setFocal({ x: Math.round((event.clientX - bounds.left) / bounds.width * 100), y: Math.round((event.clientY - bounds.top) / bounds.height * 100) }); }} onKeyDown={event => { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) { event.preventDefault(); setFocal(point => ({ x: Math.max(0, Math.min(100, point.x + (event.key === 'ArrowLeft' ? -5 : event.key === 'ArrowRight' ? 5 : 0))), y: Math.max(0, Math.min(100, point.y + (event.key === 'ArrowUp' ? -5 : event.key === 'ArrowDown' ? 5 : 0))) })); } }} className="relative mt-2 block w-full overflow-hidden rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={largeUrl} alt="Full image for choosing a focal point" className="block h-auto w-full" />
          <span className="pointer-events-none absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-slate-950/50 shadow" style={{ left: `${focal.x}%`, top: `${focal.y}%` }} />
        </button>
        <p className="mt-4 text-sm font-semibold">Approximate {mobile ? 'phone' : 'desktop'} crop</p>
        <div className={`relative mx-auto mt-2 overflow-hidden rounded-xl bg-slate-100 ${frame}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={largeUrl} alt="Hero crop preview" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: `${focal.x}% ${focal.y}%` }} />
        </div>
      </>}
      <p className="mt-4 text-xs leading-5 text-slate-500">Your original is preserved. High-quality versions are prepared automatically. The preview does not crop the saved source.</p>
      <p role="status" aria-live="polite" className="mt-3 text-sm">{message}</p>
      <button type="button" disabled={busy || !largeUrl} onClick={() => void save()} className="mt-4 min-h-11 w-full rounded-lg bg-slate-950 px-5 font-semibold text-white disabled:opacity-50">{busy ? 'Saving image…' : 'Use image'}</button>
      <p className="mt-2 text-xs text-slate-500">Then save the homepage draft or publish your changes.</p>
    </dialog>
  </div>;
}
