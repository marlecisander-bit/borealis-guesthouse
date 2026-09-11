import test from 'node:test';
import assert from 'node:assert/strict';
import { slugFrom, slugify } from '../src/lib/slugs.ts';

test('creates lowercase hyphenated slugs and removes accents', () => {
  assert.equal(slugify('  Dhomë Familjare & Lake View  '), 'dhome-familjare-lake-view');
});

test('uses the explicit slug when supplied and the label when blank', () => {
  assert.equal(slugFrom('Custom Address', 'Ignored title'), 'custom-address');
  assert.equal(slugFrom('', 'Paddle Rental'), 'paddle-rental');
});
