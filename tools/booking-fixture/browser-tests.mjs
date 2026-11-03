import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { buildFixture } from './build.mjs';

const { html, out, manifest } = await buildFixture();
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--disable-background-networking', '--disable-component-update', '--disable-extensions', '--no-first-run'] });
const results = [];
try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, serviceWorkers: 'block' });
    const outbound = [], errors = [];
    await context.route('**/*', route => { outbound.push(route.request().url()); return route.abort('blockedbyclient'); });
    const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
    await page.evaluate(() => { window.__BOREALIS_FIXTURE_HEADLESS__ = true; });
    await page.setContent(html, { waitUntil: 'load' });
    await page.getByRole('button', { name: /Fictional Double/ }).first().waitFor({timeout:10000}).catch(async error=>{fs.writeFileSync(path.join(out,'browser-diagnostic.json'),JSON.stringify({errors,body:(await page.locator('body').innerText()).slice(-1600)},null,2));throw error;});
    assert.match(await page.locator('body').innerText(), /16\/11\/2026/);
    assert.match(await page.locator('body').innerText(), /20\/11\/2026/);
    assert.match(await page.locator('body').innerText(), /€360\.00/);
    assert.match(await page.locator('body').innerText(), /2 adults/i);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(overflow <= 1, 'Horizontal overflow: ' + overflow);
    await page.screenshot({ path: path.join(out, `availability-${viewport.width}.png`), fullPage: true });
    await page.getByRole('button', { name: /Fictional Double/ }).first().click();
    await page.getByRole('button', { name: 'Skip and continue', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'Review booking', exact: true }).first().isDisabled(), true);
    for (const [label, value] of [['First name','Fixture'],['Last name','Guest'],['Email','fixture@example.test'],['Phone','000000000']]) await page.getByLabel(label, { exact: true }).fill(value);
    await page.getByRole('button', { name: 'Review booking', exact: true }).first().click();
    await page.getByRole('button', { name: 'Confirm reservation request', exact: true }).click();
    await page.getByText('Reference: FICTIONAL-BOREALIS-0001', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Cancel synthetic reservation' }).click();
    await page.getByText('FICTIONAL RESERVATION CANCELLED', { exact: true }).waitFor();
    assert.deepEqual(await page.evaluate(() => window.__fixture.state()), { confirmed: true, cancelled: true, hasHold: true });
    await page.screenshot({ path: path.join(out, `confirmation-${viewport.width}.png`), fullPage: true });
    await page.getByLabel('Fixture scenario').selectOption('multi');
    await page.getByRole('button', { name: /2-room combination/ }).first().waitFor();
    assert.match(await page.locator('body').innerText(), /6 adults/i);
    await page.getByRole('button', { name: /2-room combination/ }).first().click();
    await page.getByRole('button', { name: 'Skip and continue', exact: true }).waitFor();
    await page.getByLabel('Fixture scenario').selectOption('empty');
    await page.getByText('No matching room allocation', { exact: true }).waitFor();
    await page.getByLabel('Fixture scenario').selectOption('pricing-error');
    await page.getByText('Fixture: pricing is temporarily unavailable.', { exact: true }).waitFor();
    for (const scenario of ['hold-error','confirm-error']) {
      await page.getByLabel('Fixture scenario').selectOption(scenario);
      await page.getByRole('button', { name: /Fictional Double/ }).first().click();
      await page.getByRole('button', { name: 'Skip and continue', exact: true }).click();
      for (const [label, value] of [['First name','Fixture'],['Last name','Guest'],['Email','fixture@example.test'],['Phone','000000000']]) await page.getByLabel(label, { exact: true }).fill(value);
      await page.getByRole('button', { name: 'Review booking', exact: true }).first().click();
      await page.getByRole('button', { name: 'Confirm reservation request', exact: true }).click();
      await page.getByText(scenario === 'hold-error' ? 'Fixture: rooms are no longer available.' : 'Fixture: confirmation failed; no real reservation exists.', { exact: true }).waitFor();
    }
    assert.deepEqual(errors, []);
    // Explicit escape probes: all fail inside the boundary; context route/OS policy are additional layers.
    const probes = await page.evaluate(async () => {
      const cases = [
        () => fetch('https://rlqyruulxyanfgvnzkpe.supabase.co/rest/v1/rpc/create_booking_hold', { method: 'POST', headers: { 'content-type':'application/json' }, body: '{}' }),
        () => fetch('/api/pricing', { method: 'POST', headers: { 'content-type':'application/json', 'next-action':'bad' }, body: '{}' }),
        () => fetch('/api/calendars/private'),
        () => navigator.sendBeacon('https://example.test', 'no'),
        () => new WebSocket('wss://example.test'),
        () => new XMLHttpRequest(),
        () => window.open('https://example.test'),
      ]; const denied=[]; for (const action of cases) { try { await action(); denied.push(false); } catch { denied.push(true); } } return denied;
    });
    assert.ok(probes.every(Boolean)); assert.deepEqual(outbound, []);
    results.push({ viewport, workflow: 'PASS', multiRoom: 'PASS', guestValidation: 'PASS', emptyAndFailureStates: 'PASS', syntheticCancellation: 'PASS', horizontalOverflow: overflow, escapeProbesDenied: probes.length, outboundRequests: outbound.length, pageErrors: errors });
    await context.close();
  }
  const report = { status: 'PASS', html_sha256: manifest.html_sha256, serverStarted: false, persistentInterfaceStarted: false, osNetworkDenied: true, browserProfiles: 'ephemeral no sessions imported', results };
  fs.writeFileSync(path.join(out, 'browser-results.json'), JSON.stringify(report, null, 2), { mode: 0o600 });
  console.log(JSON.stringify(report));
} finally { await browser.close(); }
