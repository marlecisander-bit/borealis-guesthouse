import { MEDIA_UPLOAD_CONFIG } from '../media-upload-config.ts';

const qualitySteps = [MEDIA_UPLOAD_CONFIG.initialQuality, 0.82, 0.76, MEDIA_UPLOAD_CONFIG.minimumQuality] as const;

export interface PreparedImage {
  file: File;
  width: number;
  height: number;
  optimized: boolean;
  originalBytes: number;
}

export function fitImageDimensions(width: number, height: number, maxLongEdge: number = MEDIA_UPLOAD_CONFIG.maxImageDimension) {
  const longEdge = Math.max(width, height);
  if (!Number.isFinite(longEdge) || longEdge <= 0) return { width: 0, height: 0 };
  const scale = Math.min(1, maxLongEdge / longEdge);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function optimizedImageFilename(filename: string, mime = 'image/webp') {
  const base = filename.replace(/\.[^.]+$/, '').trim() || 'image';
  const extension = mime === 'image/jpeg' ? 'jpg' : mime === 'image/png' ? 'png' : 'webp';
  return `${base}.${extension}`;
}

export function imageStorageSavings(originalBytes: number, finalBytes: number) {
  if (originalBytes <= 0 || finalBytes >= originalBytes) return 0;
  return Math.round((1 - finalBytes / originalBytes) * 100);
}

async function decodeImage(file: File) {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return {
        source: bitmap as CanvasImageSource,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close(),
      };
    } catch {
      // Older mobile browsers can implement createImageBitmap without the
      // options overload. The default decode still follows image orientation.
      try {
        const bitmap = await createImageBitmap(file);
        return {
          source: bitmap as CanvasImageSource,
          width: bitmap.width,
          height: bitmap.height,
          release: () => bitmap.close(),
        };
      } catch {}
    }
  }

  const url = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = 'async';
  image.src = url;
  try {
    await image.decode();
    return {
      source: image as CanvasImageSource,
      width: image.naturalWidth,
      height: image.naturalHeight,
      release: () => URL.revokeObjectURL(url),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

function encode(canvas: HTMLCanvasElement, mime: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('The browser could not encode this image.'));
    }, mime, quality);
  });
}

function outputMime(sourceMime: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const probe = canvas.toDataURL('image/webp');
  if (probe.startsWith('data:image/webp')) return 'image/webp';
  return sourceMime === 'image/png' ? 'image/png' : 'image/jpeg';
}

export async function prepareImageForUpload(file: File): Promise<PreparedImage> {
  const decoded = await decodeImage(file).catch(() => {
    throw new Error(`We couldn't read ${file.name}. Please choose a valid JPEG, PNG, WebP or AVIF image.`);
  });

  try {
    if (!decoded.width || !decoded.height) throw new Error(`We couldn't read the dimensions of ${file.name}.`);
    if (file.size <= MEDIA_UPLOAD_CONFIG.optimizationTriggerBytes) {
      return { file, width: decoded.width, height: decoded.height, optimized: false, originalBytes: file.size };
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) throw new Error('Image optimization is unavailable in this browser.');

    const mime = outputMime(file.type);
    let dimensions = fitImageDimensions(decoded.width, decoded.height);
    let smallest: { blob: Blob; width: number; height: number } | null = null;

    for (let resizeAttempt = 0; resizeAttempt < 6; resizeAttempt++) {
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(decoded.source, 0, 0, canvas.width, canvas.height);

      const steps = mime === 'image/png' ? [undefined] : qualitySteps;
      for (const quality of steps) {
        const candidate = await encode(canvas, mime, quality);
        if (!smallest || candidate.size < smallest.blob.size) {
          smallest = { blob: candidate, width: dimensions.width, height: dimensions.height };
        }
        if (candidate.size <= MEDIA_UPLOAD_CONFIG.targetImageBytes) {
          return {
            file: new File([candidate], optimizedImageFilename(file.name, candidate.type), { type: candidate.type, lastModified: file.lastModified }),
            width: dimensions.width,
            height: dimensions.height,
            optimized: true,
            originalBytes: file.size,
          };
        }
      }

      const longEdge = Math.max(dimensions.width, dimensions.height);
      if (longEdge <= MEDIA_UPLOAD_CONFIG.minimumImageDimension) break;
      dimensions = fitImageDimensions(
        dimensions.width,
        dimensions.height,
        Math.max(MEDIA_UPLOAD_CONFIG.minimumImageDimension, Math.round(longEdge * 0.85)),
      );
    }

    if (smallest && smallest.blob.size <= MEDIA_UPLOAD_CONFIG.maxUploadBytes) {
      return {
        file: new File([smallest.blob], optimizedImageFilename(file.name, smallest.blob.type), { type: smallest.blob.type, lastModified: file.lastModified }),
        width: smallest.width,
        height: smallest.height,
        optimized: true,
        originalBytes: file.size,
      };
    }
    throw new Error(`We couldn't optimize ${file.name} below the upload limit. Please try a smaller image.`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("We couldn't")) throw error;
    throw new Error(`We couldn't optimize ${file.name} automatically. Please try a smaller image.`);
  } finally {
    decoded.release();
  }
}
