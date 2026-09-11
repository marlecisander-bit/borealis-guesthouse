import test from 'node:test';
import assert from 'node:assert/strict';
import { MEDIA_UPLOAD_CONFIG, MEBIBYTE } from '../src/lib/media-upload-config.ts';
import { fitImageDimensions, imageStorageSavings, optimizedImageFilename, prepareImageForUpload } from '../src/lib/media/optimize-image.ts';

test('media upload limits remain aligned with the storage and database limit', () => {
  assert.equal(MEDIA_UPLOAD_CONFIG.maxUploadBytes, 10 * MEBIBYTE);
  assert.equal(MEDIA_UPLOAD_CONFIG.optimizationTriggerBytes, MEDIA_UPLOAD_CONFIG.maxUploadBytes);
  assert.ok(MEDIA_UPLOAD_CONFIG.targetImageBytes < MEDIA_UPLOAD_CONFIG.maxUploadBytes);
});

test('large landscape and portrait images fit within 2560px without distortion', () => {
  assert.deepEqual(fitImageDimensions(6000, 4000), { width: 2560, height: 1707 });
  assert.deepEqual(fitImageDimensions(4000, 6000), { width: 1707, height: 2560 });
});

test('smaller images are never upscaled', () => {
  assert.deepEqual(fitImageDimensions(1600, 900), { width: 1600, height: 900 });
});

test('optimized filenames and savings describe the final uploaded asset', () => {
  assert.equal(optimizedImageFilename('Lake View.Final.JPG'), 'Lake View.Final.webp');
  assert.equal(optimizedImageFilename('transparent.png', 'image/png'), 'transparent.png');
  assert.equal(imageStorageSavings(20 * MEBIBYTE, 2 * MEBIBYTE), 90);
});

test('a 5 MiB image inside the upload limit remains byte-for-byte unchanged', async () => {
  const originalBitmap = Object.getOwnPropertyDescriptor(globalThis, 'createImageBitmap');
  Object.defineProperty(globalThis, 'createImageBitmap', {
    configurable: true,
    value: async () => ({ width: 1600, height: 900, close() {} }),
  });
  try {
    const source = new File([new Uint8Array(5 * MEBIBYTE)], 'ready.jpg', { type: 'image/jpeg' });
    const prepared = await prepareImageForUpload(source);
    assert.equal(prepared.file, source);
    assert.equal(prepared.optimized, false);
    assert.deepEqual({ width: prepared.width, height: prepared.height }, { width: 1600, height: 900 });
  } finally {
    if (originalBitmap) Object.defineProperty(globalThis, 'createImageBitmap', originalBitmap);
    else Reflect.deleteProperty(globalThis, 'createImageBitmap');
  }
});

test('oversized photos follow the adaptive WebP preparation path', async () => {
  const originalBitmap = Object.getOwnPropertyDescriptor(globalThis, 'createImageBitmap');
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const bitmap = { width: 6000, height: 4000, close() {} };
  Object.defineProperty(globalThis, 'createImageBitmap', {
    configurable: true,
    value: async () => bitmap,
  });
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      createElement: () => ({
        width: 0,
        height: 0,
        getContext: () => ({
          clearRect() {},
          drawImage() {},
          imageSmoothingEnabled: false,
          imageSmoothingQuality: 'low',
        }),
        toDataURL: () => 'data:image/webp;base64,',
        toBlob(callback: BlobCallback, mime = 'image/png', quality = 1) {
          const bytes = quality >= 0.88 ? 3 * MEBIBYTE : 2 * MEBIBYTE;
          callback(new Blob([new Uint8Array(bytes)], { type: mime }));
        },
      }),
    },
  });

  try {
    const source = new File([new Uint8Array(20 * MEBIBYTE)], 'phone-photo.jpg', { type: 'image/jpeg' });
    const prepared = await prepareImageForUpload(source);
    assert.equal(prepared.optimized, true);
    assert.equal(prepared.file.name, 'phone-photo.webp');
    assert.equal(prepared.file.type, 'image/webp');
    assert.equal(prepared.file.size, 2 * MEBIBYTE);
    assert.deepEqual({ width: prepared.width, height: prepared.height }, { width: 2560, height: 1707 });
    assert.equal(imageStorageSavings(prepared.originalBytes, prepared.file.size), 90);
  } finally {
    if (originalBitmap) Object.defineProperty(globalThis, 'createImageBitmap', originalBitmap);
    else Reflect.deleteProperty(globalThis, 'createImageBitmap');
    if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument);
    else Reflect.deleteProperty(globalThis, 'document');
  }
});
