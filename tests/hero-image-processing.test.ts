import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { processHeroImage } from '../src/lib/hero-image-processing.ts';
import { heroFocalPoint, heroResolutionWarning } from '../src/lib/hero-image-config.ts';

test('Hero desktop derivatives preserve aspect ratio and never exceed source size', async () => {
  const source = await sharp({ create: { width: 3200, height: 1800, channels: 3, background: '#658991' } }).jpeg({ quality: 95 }).toBuffer();
  const result = await processHeroImage(source, 'desktop_hero');
  assert.deepEqual(result.variants.map(item => item.width), [1920, 2560, 3000]);
  for (const variant of result.variants) {
    const metadata = await sharp(variant.bytes).metadata();
    assert.equal(metadata.width, variant.width);
    assert.equal(metadata.height, Math.round(variant.width * 1800 / 3200));
    assert.equal(metadata.format, 'webp');
  }
});

test('An already suitable mobile source is copied byte-for-byte and smaller variants derive from it', async () => {
  const source = await sharp({ create: { width: 1440, height: 1920, channels: 3, background: '#456776' } }).jpeg({ quality: 94 }).toBuffer();
  const result = await processHeroImage(source, 'mobile_hero');
  assert.deepEqual(result.variants.map(item => item.width), [1080, 1440]);
  assert.deepEqual(result.variants[1].bytes, source);
  assert.equal(result.variants[1].mime, 'image/jpeg');
});

test('Small uploads remain accepted, warn about softness, and are never upscaled', async () => {
  const source = await sharp({ create: { width: 400, height: 300, channels: 3, background: '#abc' } }).png().toBuffer();
  const result = await processHeroImage(source, 'desktop_hero');
  assert.equal(result.variants.length, 1);
  assert.equal(result.variants[0].width, 400);
  assert.deepEqual(result.variants[0].bytes, source);
  assert.match(heroResolutionWarning('desktop_hero', 400), /Retina/);
});

test('EXIF orientation is applied to variants while the source buffer stays untouched', async () => {
  const source = await sharp({ create: { width: 1200, height: 800, channels: 3, background: '#abc' } }).jpeg().withMetadata({ orientation: 6 }).toBuffer();
  const copy = Buffer.from(source);
  const result = await processHeroImage(source, 'mobile_hero');
  assert.equal(result.width, 800);
  assert.equal(result.height, 1200);
  assert.equal((await sharp(result.variants[0].bytes).metadata()).height, 1200);
  assert.deepEqual(source, copy);
});

test('Invalid files and active SVGs are rejected; focal settings remain bounded', async () => {
  await assert.rejects(processHeroImage(Buffer.from('not an image'), 'desktop_hero'));
  await assert.rejects(processHeroImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>'), 'mobile_hero'));
  assert.deepEqual(heroFocalPoint({ x: Infinity, y: -100 }), { x: 50, y: 50 });
  assert.deepEqual(heroFocalPoint({ x: 21, y: 68 }, true), { x: 21, y: 68 });
});
