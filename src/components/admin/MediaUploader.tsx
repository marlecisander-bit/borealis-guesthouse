'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { MEDIA_UPLOAD_CONFIG } from '@/lib/media-upload-config';
import { imageStorageSavings, prepareImageForUpload } from '@/lib/media/optimize-image';
import { mediaFileValidationError, settleWithConcurrency } from '@/lib/media/upload-queue';
import type { AdminMediaAsset } from '@/types/media';

type QueueStatus = 'waiting' | 'optimizing' | 'uploading' | 'complete' | 'failed' | 'cancelled';

interface QueueItem {
  id: string;
  file?: File;
  filename: string;
  originalSize: number;
  previewUrl: string;
  status: QueueStatus;
  progress: number;
  error?: string;
  retryable: boolean;
}

function send(form: FormData, onProgress: (value: number) => void, signal: AbortSignal): Promise<AdminMediaAsset> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    const abort = () => request.abort();
    request.open('POST', '/admin/media/upload');
    request.upload.onprogress = event => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onerror = () => reject(new Error('The upload was interrupted. Check your connection and retry this image.'));
    request.onabort = () => reject(new DOMException('The upload was cancelled.', 'AbortError'));
    request.timeout = 120_000;
    request.ontimeout = () => reject(new Error('The upload took too long. Check your connection and retry this image.'));
    request.onload = () => {
      let body: { asset?: AdminMediaAsset; error?: string } = {};
      try {
        body = JSON.parse(request.responseText);
      } catch {}
      if (request.status >= 200 && request.status < 300 && body.asset) resolve(body.asset);
      else if (request.status === 413) reject(new Error('The prepared image is still too large for the server. Please try a smaller image.'));
      else if (request.status === 401 || request.status === 403) reject(new Error('Your Admin session has expired. Sign in again, then retry this image.'));
      else reject(new Error(body.error || `The image could not be uploaded${request.status ? ` (server response ${request.status})` : ''}.`));
    };
    request.onloadend = () => signal.removeEventListener('abort', abort);
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
    else request.send(form);
  });
}

const formatSize = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

function statusLabel(item: QueueItem) {
  if (item.status === 'uploading') return `Uploading ${item.progress}%`;
  if (item.status === 'optimizing') return 'Optimizing…';
  if (item.status === 'complete') return 'Complete ✓';
  if (item.status === 'failed') return 'Failed';
  if (item.status === 'cancelled') return 'Cancelled';
  return 'Waiting';
}

export function MediaUploader({ onUploaded, compact = false }: {
  onUploaded?: (assets: AdminMediaAsset[]) => void | Promise<void>;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const queueRef = useRef<QueueItem[]>([]);
  const controllersRef = useRef(new Map<string, AbortController>());
  const cancelledRef = useRef(new Set<string>());
  const [queue, setQueueState] = useState<QueueItem[]>([]);
  const [altText, setAltText] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  function setQueue(update: (current: QueueItem[]) => QueueItem[]) {
    setQueueState(current => {
      const next = update(current);
      queueRef.current = next;
      return next;
    });
  }

  function updateItem(id: string, values: Partial<QueueItem>) {
    setQueue(current => current.map(item => item.id === id ? { ...item, ...values } : item));
  }

  useEffect(() => () => {
    controllersRef.current.forEach(controller => controller.abort());
    queueRef.current.forEach(item => {
      if (item.previewUrl.startsWith('blob:')) URL.revokeObjectURL(item.previewUrl);
    });
  }, []);

  function choose(selected: File[]) {
    if (busy) {
      setMessage('Wait for the current batch to finish or cancel pending uploads first.');
      return;
    }
    if (!selected.length) return;
    if (queueRef.current.length + selected.length > MEDIA_UPLOAD_CONFIG.maxBatchFiles) {
      setMessage(`You can upload up to ${MEDIA_UPLOAD_CONFIG.maxBatchFiles} images at a time. Clear completed items or select fewer photos.`);
      return;
    }
    const wasEmpty = queueRef.current.length === 0;
    const additions: QueueItem[] = selected.map(file => {
      const error = mediaFileValidationError(file);
      return { id: crypto.randomUUID(), file, filename: file.name, originalSize: file.size, previewUrl: URL.createObjectURL(file), status: error ? 'failed' : 'waiting', progress: 0, error: error || undefined, retryable: !error };
    });
    setQueue(current => [...current, ...additions]);
    setMessage(additions.some(item => item.error) ? 'Some files need attention. Valid images can still be uploaded.' : '');
    if (wasEmpty && selected.length === 1 && !displayName) setDisplayName(selected[0].name.replace(/\.[^.]+$/, ''));
    if (inputRef.current) inputRef.current.value = '';
  }

  function remove(id: string) {
    const item = queueRef.current.find(candidate => candidate.id === id);
    if (!item) return;
    cancelledRef.current.add(id);
    controllersRef.current.get(id)?.abort();
    if (item.previewUrl.startsWith('blob:')) URL.revokeObjectURL(item.previewUrl);
    setQueue(current => current.filter(candidate => candidate.id !== id));
  }

  function clearQueue() {
    queueRef.current.forEach(item => {
      if (item.previewUrl.startsWith('blob:')) URL.revokeObjectURL(item.previewUrl);
    });
    cancelledRef.current.clear();
    setQueue(() => []);
    setDisplayName('');
    setAltText('');
    setCaption('');
    setMessage('');
    if (inputRef.current) inputRef.current.value = '';
  }

  function cancelPending() {
    queueRef.current.forEach(item => {
      if (item.status === 'waiting' || item.status === 'optimizing' || item.status === 'uploading') cancelledRef.current.add(item.id);
    });
    controllersRef.current.forEach(controller => controller.abort());
    setQueue(current => current.map(item => item.status === 'waiting' ? { ...item, status: 'cancelled', progress: 0, error: 'Cancelled before upload.' } : item));
  }

  async function processItem(item: QueueItem): Promise<AdminMediaAsset> {
    if (!item.file) throw new Error('The original file is no longer available. Choose it again.');
    if (cancelledRef.current.has(item.id)) throw new DOMException('Cancelled', 'AbortError');
    updateItem(item.id, { status: 'optimizing', progress: 5, error: undefined });
    const prepared = await prepareImageForUpload(item.file);
    if (cancelledRef.current.has(item.id)) throw new DOMException('Cancelled', 'AbortError');
    if (prepared.file.size > MEDIA_UPLOAD_CONFIG.maxUploadBytes) throw new Error(`We couldn't reduce ${item.filename} enough for a reliable upload. Please try a smaller image.`);
    const form = new FormData();
    form.set('uploadId', item.id);
    form.set('file', prepared.file);
    form.set('width', String(prepared.width));
    form.set('height', String(prepared.height));
    form.set('displayName', queueRef.current.length === 1 ? displayName : item.filename.replace(/\.[^.]+$/, ''));
    form.set('altText', queueRef.current.length === 1 ? altText : altText || '');
    form.set('caption', caption);
    const controller = new AbortController();
    controllersRef.current.set(item.id, controller);
    updateItem(item.id, { status: 'uploading', progress: 10 });
    try {
      const asset = await send(form, progress => updateItem(item.id, { progress: Math.max(10, progress) }), controller.signal);
      if (item.previewUrl.startsWith('blob:')) URL.revokeObjectURL(item.previewUrl);
      updateItem(item.id, { file: undefined, previewUrl: asset.publicUrl, status: 'complete', progress: 100, error: undefined, retryable: false });
      return asset;
    } finally {
      controllersRef.current.delete(item.id);
    }
  }

  async function upload(ids?: string[]) {
    const candidates = queueRef.current.filter(item => ids ? ids.includes(item.id) : item.status === 'waiting' || item.status === 'cancelled');
    if (!candidates.length) {
      setMessage('Choose at least one valid image.');
      return;
    }
    candidates.forEach(item => cancelledRef.current.delete(item.id));
    setQueue(current => current.map(item => candidates.some(candidate => candidate.id === item.id) ? { ...item, status: 'waiting', progress: 0, error: undefined } : item));
    setBusy(true);
    setMessage('');
    const results = await settleWithConcurrency(candidates, MEDIA_UPLOAD_CONFIG.concurrentUploads, processItem);
    const uploaded: AdminMediaAsset[] = [];
    results.forEach((result, index) => {
      const item = candidates[index];
      if (result.status === 'fulfilled') uploaded.push(result.value);
      else if (cancelledRef.current.has(item.id) || (result.reason instanceof DOMException && result.reason.name === 'AbortError')) updateItem(item.id, { status: 'cancelled', progress: 0, error: 'Cancelled before completion.' });
      else updateItem(item.id, { status: 'failed', progress: 0, error: result.reason instanceof Error ? result.reason.message : 'The image could not be uploaded.', retryable: true });
    });
    try {
      if (uploaded.length) await onUploaded?.(uploaded);
      const failed = results.length - uploaded.length;
      const originalBytes = candidates.reduce((sum, item) => sum + item.originalSize, 0);
      const finalBytes = uploaded.reduce((sum, asset) => sum + (asset.size_bytes || 0), 0);
      const savings = imageStorageSavings(originalBytes, finalBytes);
      setMessage(`${uploaded.length} of ${results.length} uploaded${failed ? `; ${failed} need attention` : ' successfully'}${savings ? `. Batch storage reduced by ${savings}%` : ''}.`);
    } catch (error) {
      setMessage(error instanceof Error ? `Images uploaded, but the current editor could not refresh: ${error.message}` : 'Images uploaded, but the current editor could not refresh.');
    } finally {
      setBusy(false);
    }
  }

  const completeCount = queue.filter(item => item.status === 'complete').length;
  const failedCount = queue.filter(item => item.status === 'failed').length;
  const readyCount = queue.filter(item => item.status === 'waiting' || item.status === 'cancelled').length;
  const retryableFailed = queue.filter(item => item.status === 'failed' && item.retryable && item.file);
  const overallProgress = queue.length ? Math.round(queue.reduce((sum, item) => sum + (item.status === 'failed' || item.status === 'cancelled' ? 100 : item.progress), 0) / queue.length) : 0;

  return <div className={compact ? 'space-y-3' : 'rounded-2xl border border-slate-200 bg-white p-5 sm:p-6'}>
    <div onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); choose(Array.from(event.dataTransfer.files)); }} className="rounded-xl border-2 border-dashed border-slate-300 p-5 text-center">
      <p className="text-sm font-semibold text-slate-800">Drag photos here or choose photos</p>
      <p className="mt-1 text-xs text-slate-500">JPEG, PNG, WebP or AVIF · up to {MEDIA_UPLOAD_CONFIG.maxBatchFiles} photos · large photos optimized automatically</p>
      <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="mt-3 min-h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold disabled:opacity-50">Choose photos</button>
      <input ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif,.jpg,.jpeg,.png,.webp,.avif" className="sr-only" onChange={event => choose(Array.from(event.target.files || []))} />
    </div>
    {queue.length > 0 && <section aria-label="Image upload queue" className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-sm font-bold text-slate-900">Upload queue</h3><p className="text-xs text-slate-500">{completeCount} of {queue.length} complete{failedCount ? ` · ${failedCount} failed` : ''}</p></div><div className="flex flex-wrap gap-2">{busy && <button type="button" onClick={cancelPending} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-red-700">Cancel pending</button>}{!busy && <button type="button" onClick={clearQueue} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700">Clear queue</button>}</div></div>
      <div className="mt-3 h-2 overflow-hidden rounded bg-slate-200" aria-label={`Batch ${overallProgress}% complete`}><div className="h-full bg-emerald-600 transition-all" style={{ width: `${overallProgress}%` }} /></div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">{queue.map(item => <article key={item.id} className="flex min-w-0 gap-3 rounded-lg border border-slate-200 bg-white p-3">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-slate-100"><Image src={item.previewUrl} alt="" fill unoptimized={item.previewUrl.startsWith('blob:')} sizes="80px" className="object-cover" /></div>
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900" title={item.filename}>{item.filename}</p><p className="text-xs text-slate-500">{formatSize(item.originalSize)}</p><p className={`mt-1 text-xs font-bold ${item.status === 'failed' ? 'text-red-700' : item.status === 'complete' ? 'text-emerald-700' : 'text-slate-700'}`}>{statusLabel(item)}</p>{item.error && <p className="mt-1 text-xs leading-5 text-red-700">{item.error}</p>}<div className="mt-2 flex flex-wrap gap-2">{item.status === 'failed' && item.retryable && item.file && <button type="button" disabled={busy} onClick={() => void upload([item.id])} aria-label={`Retry ${item.filename}`} className="min-h-10 rounded-lg border border-slate-300 px-3 text-xs font-bold disabled:opacity-50">Retry</button>}{(item.status === 'waiting' || item.status === 'failed' || item.status === 'cancelled' || item.status === 'complete') && <button type="button" disabled={busy && item.status === 'complete'} onClick={() => remove(item.id)} aria-label={`Remove ${item.filename} from upload queue`} className="min-h-10 rounded-lg px-3 text-xs font-bold text-red-700 disabled:opacity-50">Remove</button>}</div></div>
      </article>)}</div>
    </section>}
    <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold">Display name<input value={displayName} onChange={event => setDisplayName(event.target.value)} disabled={queue.length > 1} placeholder={queue.length > 1 ? 'Uses each filename' : 'Lake view at sunrise'} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 font-normal disabled:bg-slate-50" /></label><label className="text-sm font-semibold">Alternative text<input value={altText} onChange={event => setAltText(event.target.value)} placeholder={queue.length > 1 ? 'Optional shared description' : 'Describe what the image shows'} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" /></label>{!compact && <label className="text-sm font-semibold sm:col-span-2">Caption (optional)<input value={caption} onChange={event => setCaption(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" /></label>}</div>
    <div className="mt-4 grid items-center gap-3 sm:flex sm:flex-wrap"><button type="button" disabled={busy || readyCount === 0} onClick={() => void upload()} className="min-h-11 w-full rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto">{busy ? 'Uploading photos…' : readyCount ? `Upload ${readyCount} image${readyCount === 1 ? '' : 's'}` : 'Upload images'}</button>{!busy && retryableFailed.length > 0 && <button type="button" onClick={() => void upload(retryableFailed.map(item => item.id))} className="min-h-11 w-full rounded-lg border border-slate-300 px-4 text-sm font-semibold sm:w-auto">Retry failed</button>}{message && <p role="status" aria-live="polite" className="text-sm text-slate-600">{message}</p>}</div>
    {busy && <p role="status" aria-live="polite" className="sr-only">Uploading photos. {completeCount} of {queue.length} complete.</p>}
  </div>;
}
