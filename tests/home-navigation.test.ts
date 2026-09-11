import test from 'node:test';
import assert from 'node:assert/strict';
import { isCleanHomepageLocation, isHomeNavigationItem } from '../src/lib/navigation/home.ts';

test('recognizes root and legacy homepage navigation destinations', () => {
  assert.equal(isHomeNavigationItem('Home', '/'), true);
  assert.equal(isHomeNavigationItem('Home', '/unexpected'), true);
  assert.equal(isHomeNavigationItem('Start', '/#home'), true);
  assert.equal(isHomeNavigationItem('Start', '#home'), true);
  assert.equal(isHomeNavigationItem('Rooms', '/rooms'), false);
});

test('only treats the clean root URL as a same-route homepage click', () => {
  assert.equal(isCleanHomepageLocation('/', '', ''), true);
  assert.equal(isCleanHomepageLocation('/', '?preview=1', ''), false);
  assert.equal(isCleanHomepageLocation('/', '', '#gallery'), false);
  assert.equal(isCleanHomepageLocation('/rooms', '', ''), false);
});
