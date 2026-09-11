'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ACCEPTED_MEDIA_MIME_TYPES, MEDIA_UPLOAD_CONFIG } from '@/lib/media-upload-config';
import { imageStorageSavings, prepareImageForUpload } from '@/lib/media/optimize-image';
import type { AdminMediaAsset } from '@/types/media';

function send(form: FormData, onProgress: (value: number) => void): Promise<AdminMediaAsset> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', '/admin/media/upload');
    request.upload.onprogress = event => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onerror = () => reject(new Error('The upload was interrupted. Check your connection and try again.'));
    request.onabort = () => reject(new Error('The upload was cancelled before it completed.'));
    request.timeout = 120_000;
    request.ontimeout = () => reject(new Error('The upload took too long. Check your connection and try again.'));
    request.onload = () => {
      let body: { asset?: AdminMediaAsset; error?: string } = {};
      try {
        body = JSON.parse(request.responseText);
      } catch {}
      if (request.status >= 200 && request.status < 300 && body.asset) resolve(body.asset);
      else if (request.status === 413) reject(new Error('The prepared image is still too large for the server. Please try a smaller image.'));
      else if (request.status === 401 || request.status === 403) reject(new Error('Your Admin session has expired. Sign in again, then retry the upload.'));
      else reject(new Error(body.error || `The image could not be uploaded${request.status ? ` (server response ${request.status})` : ''}.`));
    };
    request.send(form);
  });
}

export function MediaUploader({
  onUploaded,
  compact = false,
}: {
  onUploaded?: (assets: AdminMediaAsset[]) => void | Promise<void>;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [altText, setAltText] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [caption, setCaption] = useState('');
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState('');
  const [message, setMessage] = useState('');
  const previews = useMemo(
    () => files.map(file => ({ file, url: URL.createObjectURL(file) })),
    [files],
  );

  useEffect(
    () => () => previews.forEach(preview => URL.revokeObjectURL(preview.url)),
    [previews],
  );

  function choose(selected: File[]) {
    const unsupported = selected.find(file => !ACCEPTED_MEDIA_MIME_TYPES.has(file.type));
    if (unsupported) {
      setFiles([]);
      const heic = /\.(heic|heif)$/i.test(unsupported.name) || /heic|heif/i.test(unsupported.type);
      setMessage(heic
        ? 'HEIC/HEIF photos are not supported by this browser workflow. Export the photo as JPEG first.'
        : `${unsupported.name} must be a JPEG, PNG, WebP or AVIF image.`);
      return;
    }
    const invalidSize = selected.find(file => file.size <= 0 || file.size > MEDIA_UPLOAD_CONFIG.maxSourceImageBytes);
    if (invalidSize) {
      setFiles([]);
      setMessage(`${invalidSize.name} is empty or too large to optimize safely. Choose an image smaller than 50 MB.`);
      return;
    }
    setFiles(selected);
    setMessage('');
    if (selected.length === 1 && !displayName) {
      setDisplayName(selected[0].name.replace(/\.[^.]+$/, ''));
    }
  }

  function remove(index: number) {
    setFiles(current => current.filter((_, fileIndex) => fileIndex !== index));
    if (files.length === 1 && inputRef.current) inputRef.current.value = '';
  }

  function clear() {
    setFiles([]);
    setDisplayName('');
    if (inputRef.current) inputRef.current.value = '';
  }

  async function upload() {
    if (!files.length) {
      setMessage('Choose at least one image.');
      return;
    }
    setBusy(true);
    setProgress(0);
    setPhase('Preparing image…');
    setMessage('');
    try {
      const uploaded: AdminMediaAsset[] = [];
      let optimizedCount = 0;
      let originalBytes = 0;
      let finalBytes = 0;
      for (let index = 0; index < files.length; index++) {
        const source = files[index];
        if (source.size > MEDIA_UPLOAD_CONFIG.optimizationTriggerBytes) setPhase('Optimizing image…');
        else setPhase('Preparing image…');
        const prepared = await prepareImageForUpload(source);
        if (prepared.file.size > MEDIA_UPLOAD_CONFIG.maxUploadBytes) {
          throw new Error(`We couldn't reduce ${source.name} enough for a reliable upload. Please try a smaller image.`);
        }
        if (prepared.optimized) optimizedCount++;
        originalBytes += prepared.originalBytes;
        finalBytes += prepared.file.size;
        const form = new FormData();
        form.set('file', prepared.file);
        form.set('width', String(prepared.width));
        form.set('height', String(prepared.height));
        form.set('displayName', files.length === 1 ? displayName : source.name.replace(/\.[^.]+$/, ''));
        form.set('altText', files.length === 1 ? altText : altText ? `${altText} ${index + 1}` : '');
        form.set('caption', caption);
        uploaded.push(
          await send(form, value => {
            const nextProgress = Math.round((index * 100 + value) / files.length);
            setProgress(nextProgress);
            setPhase(`Uploading ${nextProgress}%…`);
          }),
        );
      }
      await onUploaded?.(uploaded);
      setFiles([]);
      setAltText('');
      setDisplayName('');
      setCaption('');
      setProgress(100);
      if (inputRef.current) inputRef.current.value = '';
      const savings = imageStorageSavings(originalBytes, finalBytes);
      setMessage(`Upload complete. ${uploaded.length} image${uploaded.length === 1 ? '' : 's'} uploaded.${optimizedCount ? ` Large image${optimizedCount === 1 ? '' : 's'} optimized automatically${savings ? `, saving ${savings}%` : ''}.` : ''}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={compact ? 'space-y-3' : 'rounded-2xl border border-slate-200 bg-white p-5 sm:p-6'}>
      <div
        onDragOver={event => event.preventDefault()}
        onDrop={event => {
          event.preventDefault();
          choose(Array.from(event.dataTransfer.files));
        }}
        className="rounded-xl border-2 border-dashed border-slate-300 p-5 text-center"
      >
        <p className="text-sm font-semibold text-slate-800">Drop images here or choose files</p>
        <p className="mt-1 text-xs text-slate-500">JPEG, PNG, WebP or AVIF · large photos optimized automatically</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-3 min-h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold"
        >
          Choose images
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="sr-only"
          onChange={event => choose(Array.from(event.target.files || []))}
        />
        {files.length > 0 && (
          <p className="mt-2 text-sm text-slate-600">
            {files.length} selected: {files.map(file => file.name).join(', ')}
          </p>
        )}
      </div>

      {previews.length > 0 && (
        <section aria-label="Selected image previews" className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Preview before upload</h3>
              <p className="text-xs text-slate-500">These images have not been saved yet.</p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={clear}
              className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-red-700"
            >
              Clear selection
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {previews.map((preview, index) => (
              <article
                key={`${preview.file.name}-${preview.file.lastModified}-${index}`}
                className="overflow-hidden rounded-lg border border-slate-200 bg-white"
              >
                <div className="relative aspect-[4/3] bg-slate-100">
                  <Image
                    src={preview.url}
                    alt={`Preview of ${preview.file.name}`}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-contain"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-800">{preview.file.name}</p>
                    <p className="text-xs text-slate-500">{(preview.file.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => remove(index)}
                    className="min-h-9 shrink-0 rounded-lg border border-slate-300 px-3 text-xs font-bold text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold">
          Display name
          <input
            value={displayName}
            onChange={event => setDisplayName(event.target.value)}
            disabled={files.length > 1}
            placeholder={files.length > 1 ? 'Uses each filename' : 'Lake view at sunrise'}
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 font-normal"
          />
        </label>
        <label className="text-sm font-semibold">
          Alternative text
          <input
            value={altText}
            onChange={event => setAltText(event.target.value)}
            placeholder="Describe what the image shows"
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 font-normal"
          />
        </label>
        {!compact && (
          <label className="text-sm font-semibold sm:col-span-2">
            Caption (optional)
            <input
              value={caption}
              onChange={event => setCaption(event.target.value)}
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 font-normal"
            />
          </label>
        )}
      </div>
      {busy && (
        <div className="mt-4" role="status" aria-live="polite">
          <p className="mb-2 text-sm font-medium text-slate-700">{phase}</p>
          <div className="h-2 overflow-hidden rounded bg-slate-200" aria-label={`Upload ${progress}% complete`}>
            <div className="h-full bg-emerald-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy || !files.length}
          onClick={() => void upload()}
          className="min-h-11 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? phase : 'Upload images'}
        </button>
        {message && <p role="status" className="text-sm text-slate-600">{message}</p>}
      </div>
    </div>
  );
}
