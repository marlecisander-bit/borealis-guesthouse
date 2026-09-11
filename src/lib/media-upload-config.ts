export const MEBIBYTE = 1024 * 1024;

export const MEDIA_UPLOAD_CONFIG = {
  // Keep the final multipart request safely below hosted function payload
  // limits. Source photos can still be much larger and are reduced locally.
  maxUploadBytes: 4 * MEBIBYTE,
  optimizationTriggerBytes: 4 * MEBIBYTE,
  targetImageBytes: Math.floor(2.5 * MEBIBYTE),
  maxSourceImageBytes: 50 * MEBIBYTE,
  maxImageDimension: 2560,
  minimumImageDimension: 1280,
  initialQuality: 0.88,
  minimumQuality: 0.7,
  acceptedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const,
} as const;

export const ACCEPTED_MEDIA_MIME_TYPES = new Set<string>(MEDIA_UPLOAD_CONFIG.acceptedMimeTypes);
