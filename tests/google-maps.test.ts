import assert from 'node:assert/strict';
import test from 'node:test';
import { googleMapsEmbedUrl, googleMapsQueryFromUrl, isGoogleMapsUrl, isShortGoogleMapsUrl } from '../src/lib/google-maps.ts';
import { validateSettings } from '../src/lib/admin/settings-validation.ts';

test('accepts supported secure Google Maps share links', () => {
  for (const url of [
    'https://maps.app.goo.gl/AbCdEf123',
    'https://www.google.com/maps/place/Borealis+Guest+House/@42.105,19.822,15z',
    'https://maps.google.com/?q=Borealis+Guest+House',
    'https://goo.gl/maps/AbCdEf123',
  ]) assert.equal(isGoogleMapsUrl(url), true, url);
  assert.equal(isShortGoogleMapsUrl('https://maps.app.goo.gl/AbCdEf123'), true);
});

test('rejects insecure, unrelated and deceptive URLs', () => {
  for (const url of [
    'http://www.google.com/maps/place/Borealis',
    'https://example.com/maps/Borealis',
    'https://google.com.evil.example/maps/Borealis',
    'javascript:alert(1)',
    'not a url',
  ]) assert.equal(isGoogleMapsUrl(url), false, url);
});

test('extracts a stable place query from common long URL formats', () => {
  assert.equal(googleMapsQueryFromUrl('https://maps.google.com/?q=Borealis%20Guest%20House'), 'Borealis Guest House');
  assert.equal(googleMapsQueryFromUrl('https://www.google.com/maps/place/Borealis+Guest+House/@42.105,19.822,15z'), '42.105,19.822');
  assert.equal(googleMapsQueryFromUrl('https://www.google.com/maps/place/Borealis+Guest+House/data=!3d42.105!4d19.822'), '42.105,19.822');
  assert.equal(googleMapsQueryFromUrl('https://www.google.com/maps/place/Borealis+Guest+House'), 'Borealis Guest House');
});

test('builds a keyless lazy-iframe compatible Google Maps URL', () => {
  const embed = new URL(googleMapsEmbedUrl('Borealis Guest House, Koman'));
  assert.equal(embed.origin, 'https://www.google.com');
  assert.equal(embed.pathname, '/maps');
  assert.equal(embed.searchParams.get('q'), 'Borealis Guest House, Koman');
  assert.equal(embed.searchParams.get('output'), 'embed');
  assert.equal(embed.searchParams.get('z'), '15');
});

test('Admin settings rejects an invalid map link with a field-level message', () => {
  const data = new FormData();
  data.set('name', 'Borealis Guest House');
  data.set('currency', 'EUR');
  data.set('mapsUrl', 'https://example.com/not-google-maps');
  const result = validateSettings(data);
  assert.equal(result.state?.errors?.mapsUrl, 'Please enter a valid Google Maps link.');

  data.set('mapsUrl', 'https://maps.app.goo.gl/AbCdEf123');
  assert.equal(validateSettings(data).state?.errors?.mapsUrl, undefined);
});

test('Admin settings validates independent guest age bands',()=>{
  const data=new FormData();data.set('name','Borealis Guest House');data.set('currency','EUR');
  data.set('infantMaxAge','2');data.set('childMaxAge','2');data.set('minimumBookingHolderAge','17');
  const result=validateSettings(data);
  assert.equal(result.state?.errors?.childMaxAge,'Child maximum age must be greater than the infant maximum age.');
  assert.equal(result.state?.errors?.minimumBookingHolderAge,'Booking holders must be at least 18.');
  data.set('childMaxAge','12');data.set('minimumBookingHolderAge','18');
  assert.equal(validateSettings(data).state,undefined);
});
