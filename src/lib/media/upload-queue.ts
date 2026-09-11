import { ACCEPTED_MEDIA_MIME_TYPES, MEDIA_UPLOAD_CONFIG } from '../media-upload-config.ts';

export function mediaFileValidationError(file: Pick<File, 'name' | 'type' | 'size'>) {
  if (/heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)) return 'HEIC/HEIF is not supported. Export this photo as JPEG first.';
  const extension = file.name.match(/\.([^.]+)$/)?.[1]?.toLowerCase();
  if (!extension || !['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(extension)) return 'Use a JPEG, PNG, WebP or AVIF file.';
  if (file.type && !ACCEPTED_MEDIA_MIME_TYPES.has(file.type)) {
    return 'The image format is not supported.';
  }
  if (file.size <= 0) return 'The file is empty.';
  if (file.size > MEDIA_UPLOAD_CONFIG.maxSourceImageBytes) return 'The source image is larger than 50 MB.';
  return '';
}

export async function settleWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  task: (item: T, index: number) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  if (!items.length) return [];
  const results = new Array<PromiseSettledResult<R>>(items.length);
  let nextIndex = 0;
  const workerCount = Math.max(1, Math.min(Math.floor(concurrency), items.length));

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      try {
        results[index] = { status: 'fulfilled', value: await task(items[index], index) };
      } catch (reason) {
        results[index] = { status: 'rejected', reason };
      }
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}
