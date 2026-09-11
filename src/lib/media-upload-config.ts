export const MEBIBYTE = 1024 * 1024;

export const MEDIA_UPLOAD_CONFIG = {
  maxUploadBytes: 10 * MEBIBYTE,
  optimizationTriggerBytes: 10 * MEBIBYTE,
  targetImageBytes: Math.floor(2.5 * MEBIBYTE),
  maxSourceImageBytes: 50 * MEBIBYTE,
  maxImageDimension: 2560,
  minimumImageDimension: 1280,
  initialQuality: 0.88,
  minimumQuality: 0.7,
  acceptedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const,
} as const;

export const ACCEPTED_MEDIA_MIME_TYPES = new Set<string>(MEDIA_UPLOAD_CONFIG.acceptedMimeTypes);
