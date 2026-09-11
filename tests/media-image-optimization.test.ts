import test from 'node:test';
import assert from 'node:assert/strict';
import { MEDIA_UPLOAD_CONFIG, MEBIBYTE } from '../src/lib/media-upload-config.ts';
import { fitImageDimensions, imageStorageSavings, optimizedImageFilename, prepareImageForUpload } from '../src/lib/media/optimize-image.ts';
import { mediaFileValidationError, settleWithConcurrency } from '../src/lib/media/upload-queue.ts';

test('media upload limits remain safe for the hosted request transport', () => {
  assert.equal(MEDIA_UPLOAD_CONFIG.maxUploadBytes, 4 * MEBIBYTE);
  assert.equal(MEDIA_UPLOAD_CONFIG.optimizationTriggerBytes, MEDIA_UPLOAD_CONFIG.maxUploadBytes);
  assert.ok(MEDIA_UPLOAD_CONFIG.targetImageBytes < MEDIA_UPLOAD_CONFIG.maxUploadBytes);
  assert.equal(MEDIA_UPLOAD_CONFIG.concurrentUploads, 2);
  assert.equal(MEDIA_UPLOAD_CONFIG.maxBatchFiles, 30);
});

test('the upload queue limits concurrency and isolates a failed image', async () => {
  let active = 0;
  let maximumActive = 0;
  const started: number[] = [];
  const results = await settleWithConcurrency([0, 1, 2, 3, 4], 2, async item => {
    started.push(item);
    active++;
    maximumActive = Math.max(maximumActive, active);
    await new Promise(resolve => setTimeout(resolve, 2));
    active--;
    if (item === 2) throw new Error('simulated network failure');
    return item;
  });

  assert.equal(maximumActive, 2);
  assert.deepEqual(started.sort((a, b) => a - b), [0, 1, 2, 3, 4]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 4);
  assert.equal(results[2].status, 'rejected');
});

test('mixed batch validation rejects only unsupported or oversized files', () => {
  const files = [
    { name: 'room.jpg', type: 'image/jpeg', size: 2 * MEBIBYTE },
    { name: 'lake.webp', type: 'image/webp', size: 12 * MEBIBYTE },
    { name: 'phone.heic', type: 'image/heic', size: 3 * MEBIBYTE },
    { name: 'broken.txt', type: 'text/plain', size: 10 },
    { name: 'huge.png', type: 'image/png', size: 51 * MEBIBYTE },
  ];
  const errors = files.map(mediaFileValidationError);
  assert.equal(errors[0], '');
  assert.equal(errors[1], '');
  assert.match(errors[2], /HEIC/);
  assert.match(errors[3], /JPEG/);
  assert.match(errors[4], /50 MB/);
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

test('a 3 MiB image inside the hosted upload limit remains byte-for-byte unchanged', async () => {
  const originalBitmap = Object.getOwnPropertyDescriptor(globalThis, 'createImageBitmap');
  Object.defineProperty(globalThis, 'createImageBitmap', {
    configurable: true,
    value: async () => ({ width: 1600, height: 900, close() {} }),
  });
  try {
    const source = new File([new Uint8Array(3 * MEBIBYTE)], 'ready.jpg', { type: 'image/jpeg' });
    const prepared = await prepareImageForUpload(source);
    assert.equal(prepared.file, source);
    assert.equal(prepared.optimized, false);
    assert.deepEqual({ width: prepared.width, height: prepared.height }, { width: 1600, height: 900 });
  } finally {
    if (originalBitmap) Object.defineProperty(globalThis, 'createImageBitmap', originalBitmap);
    else Reflect.deleteProperty(globalThis, 'createImageBitmap');
  }
});

test('an 8 MiB camera photo follows the adaptive WebP preparation path', async () => {
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
    const source = new File([new Uint8Array(8 * MEBIBYTE)], 'phone-photo.jpg', { type: 'image/jpeg' });
    const prepared = await prepareImageForUpload(source);
    assert.equal(prepared.optimized, true);
    assert.equal(prepared.file.name, 'phone-photo.webp');
    assert.equal(prepared.file.type, 'image/webp');
    assert.equal(prepared.file.size, 2 * MEBIBYTE);
    assert.deepEqual({ width: prepared.width, height: prepared.height }, { width: 2560, height: 1707 });
    assert.equal(imageStorageSavings(prepared.originalBytes, prepared.file.size), 75);
  } finally {
    if (originalBitmap) Object.defineProperty(globalThis, 'createImageBitmap', originalBitmap);
    else Reflect.deleteProperty(globalThis, 'createImageBitmap');
    if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument);
    else Reflect.deleteProperty(globalThis, 'document');
  }
});
