// Actual calendar views with synthetic inventory/actions and outbound requests denied.
import { chromium, webkit } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildFixture } from '../booking-fixture/build.mjs';

const { html, out } = await buildFixture(process.env, { admin: true, calendar: true });
const results = [];
for (const [engine, launch, widths] of [
  [chromium, { channel: 'chrome' }, [360, 1440]],
  [webkit, {}, [360, 390, 1440]],
]) {
  const browser = await engine.launch(launch);
  try {
    for (const width of widths) {
      const mobile = width < 768;
      console.log(engine.name(), width);
      const context = await browser.newContext({
        viewport: { width, height: mobile ? 800 : 900 }, isMobile: mobile, hasTouch: mobile,
        reducedMotion: 'reduce', serviceWorkers: 'block',
      });
      const page = await context.newPage();
      page.setDefaultTimeout(15000);
      const outbound = [], errors = [];
      await context.route('**/*', route => { outbound.push(route.request().url()); return route.abort(); });
      page.on('pageerror', error => { errors.push(error.message); console.error(error.message); });
      await page.evaluate(() => { window.__BOREALIS_FIXTURE_HEADLESS__ = true; });
      await page.setContent(html);
      await page.addStyleTag({ content: 'body>main{max-width:none!important;padding:0!important}.fixture-banner{display:none!important}' });
      await page.getByRole('button', { name: 'Today', exact: true }).waitFor();
      const dialog = page.getByRole('dialog');
      const tap = async control => {
        await control.evaluate(element => element.scrollIntoView({ behavior: 'instant', block: 'nearest' }));
        await control.click();
      };
      const night = (day, unit = 'left') => page.locator('#night-' + unit + '-2026-10-' + day);
      const chooseDay = async day => {
        const name = new Date('2026-10-' + day + 'T12:00:00Z').toLocaleDateString('en', {
          weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC',
        });
        await tap(page.getByRole('navigation', { name: 'Seven-day calendar' }).getByRole('button', { name, exact: true }));
      };
      const fixtureImage = name => path.join(out, engine.name() + '-' + width + '-' + name + '.png');
      const close = async () => { await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'hidden' }); };
      if (mobile) {
        await page.getByRole('navigation', { name: 'Seven-day calendar' }).waitFor();
        assert.equal(await page.locator('.calendar-week-strip button').count(), 7);
      } else {
        await page.getByRole('region', { name: /Room calendar/ }).waitFor();
        await page.getByLabel('Inventory view').selectOption('type');
        await page.getByRole('cell', { name: '2026-10-19: 1 of 2 units available' }).waitFor();
        await page.getByRole('button', { name: /Triple room/ }).click();
        assert.equal(await night('19', 'right').isEnabled(), true);
        assert.equal(await night('19').isEnabled(), false);
        await page.getByLabel('Inventory view').selectOption('room');
        await page.locator('.calendar-type-row').first().waitFor({ state: 'hidden' });
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      if (width === 1440 || width === 360) await page.screenshot({ path: fixtureImage('calendar') });

      const roomFilter = page.getByLabel('Room', { exact: true });
      await roomFilter.selectOption('type:triple');
      await page.waitForFunction(() => new URL(window.__calendarNavigation, 'https://fixture.invalid').searchParams.get('room') === 'type:triple');
      const inventoryNames = mobile ? '.calendar-agenda article' : '.calendar-scroll';
      await page.locator(inventoryNames).getByText('Family Room', { exact: true }).first().waitFor({ state: 'hidden' });
      assert.match(await page.locator(inventoryNames).allTextContents().then(values => values.join(' ')), /Triple Room L/);
      assert.doesNotMatch(await page.locator(inventoryNames).allTextContents().then(values => values.join(' ')), /Family Room/);
      await roomFilter.selectOption('');
      await page.locator(inventoryNames).getByText('Family Room', { exact: true }).first().waitFor();

      if (mobile) {
        await chooseDay('25');
        await page.getByRole('button', { name: 'Next period' }).click();
        await chooseDay('27');
        await page.locator('.calendar-agenda article').filter({ hasText: 'Triple Room L' }).getByRole('button', { name: 'Block dates' }).click();
        await dialog.getByLabel(/last closed night/).fill('2026-10-29');
      } else {
        await night('27').focus();
        await page.keyboard.press('Enter');
        await page.getByText('Selected', { exact: true }).waitFor();
        await night('27').press('ArrowRight');
        await night('28').press('ArrowRight');
        assert.equal(await night('29').evaluate(element => element === document.activeElement), true);
        await night('29').press('Enter');
      }
      await dialog.getByText(/3 nights, 2026-10-27 to 2026-10-30/).waitFor().catch(async error => {
        console.error(await page.evaluate(() => ({ active: document.activeElement?.id, dialogs: document.querySelector('[role=dialog]')?.textContent, values: [...document.querySelectorAll('[role=dialog] input')].map(input => input.value) })));
        throw error;
      });
      await dialog.getByLabel('Reason details (optional)').fill('Floor repair');
      if (width === 1440 || width === 360) await page.screenshot({ path: fixtureImage('block-editor') });
      await page.evaluate(() => { window.__calendarConflict = true; });
      await dialog.getByRole('button', { name: 'Close room', exact: true }).click();
      await dialog.getByRole('alert').filter({ hasText: 'booking or active hold' }).waitFor();
      assert.equal(await dialog.getByLabel(/last closed night/).inputValue(), '2026-10-29');
      assert.equal(await dialog.getByLabel('Reason details (optional)').inputValue(), 'Floor repair');
      await page.evaluate(() => { window.__calendarConflict = false; });
      const before = await page.evaluate(() => window.scrollY);
      await dialog.getByRole('button', { name: 'Close room', exact: true }).click();
      await dialog.waitFor({ state: 'hidden' });
      assert.equal(await page.evaluate(() => window.scrollY), before);
      if (!mobile) {
        for (const day of ['27', '28', '29']) assert.equal(await night(day).isEnabled(), false);
        for (const day of ['26', '30']) assert.equal(await night(day).isEnabled(), true);
        await page.getByRole('button', { name: /closed 2026-10-27 through 2026-10-29/ }).click();
      } else {
        for (const day of ['26', '27', '28', '29', '30']) {
          await chooseDay(day);
          const room = page.locator('.calendar-agenda article').filter({ hasText: 'Triple Room L' });
          if (['27','28','29'].includes(day)) await room.getByRole('button', { name: /Blocked · maintenance/ }).waitFor();
          else await room.getByRole('button', { name: 'Block dates' }).waitFor();
        }
        await chooseDay('27');
        await page.getByRole('button', { name: /Blocked · maintenance/ }).click();
      }
      await dialog.getByText(/Floor repair/).waitFor();
      await dialog.getByRole('checkbox').check();
      await dialog.getByRole('button', { name: 'Reopen dates' }).click();
      await dialog.waitFor({ state: 'hidden' });
      if (!mobile) assert.equal(await night('27').isEnabled(), true);
      else await page.locator('.calendar-agenda article').filter({ hasText: 'Triple Room L' }).getByRole('button', { name: 'Block dates' }).waitFor();

      await tap(page.getByRole('button', { name: 'Today', exact: true }));
      if (mobile) {
        await page.getByRole('button', { name: /Booked · Staying · Alex Example/ }).click();
      } else {
        await page.getByRole('button', { name: /Alex Example, confirmed/ }).click();
      }
      const bookingLink = dialog.getByRole('link', { name: 'Open full booking' });
      await bookingLink.waitFor();
      assert.match(await bookingLink.getAttribute('href'), /^\/admin\/bookings\/a\?calendarReturn=/);
      await close();
      if (mobile) await page.getByRole('button', { name: /Temporary hold · Synthetic Guest hold/ }).click();
      else await page.getByRole('button', { name: /Synthetic Guest hold, held/ }).click();
      await dialog.getByText(/Hold expires/).waitFor();
      await close();
      if (mobile) {
        await chooseDay('24');
        await page.getByRole('button', { name: /Blocked · external calendar/ }).press('Enter');
      } else {
        await page.getByRole('button', { name: /Triple Room R, closed.*external calendar/ }).press('Enter');
      }
      await dialog.getByText(/Sample partner calendar/).waitFor();
      assert.equal(await dialog.getByRole('button', { name: 'Reopen dates' }).count(), 0);
      await close();
      await page.getByLabel('Room', { exact: true }).selectOption('right');
      await page.locator(mobile ? '.calendar-agenda article' : '.calendar-room[role=rowheader]').filter({ hasText: 'Triple Room L' }).waitFor({ state: 'hidden' });
      await page.locator('.calendar-range').press('Enter');
      await dialog.getByLabel('Start date').fill('2026-12-30');
      if (!mobile) await dialog.getByLabel('Last displayed date').fill('2027-01-04');
      await dialog.getByRole('button', { name: 'Show dates' }).press('Enter');
      await dialog.waitFor({ state: 'hidden' });
      const navigation = new URL(await page.evaluate(() => window.__calendarNavigation), 'https://fixture.invalid');
      assert.equal(navigation.searchParams.get('from'), '2026-12-30');
      assert.equal(navigation.searchParams.get('room'), 'right');
      if (!mobile) assert.equal(navigation.searchParams.get('to'), '2027-01-04');
      await page.selectOption('#scenario', 'restricted', { force: true });
      await tap(page.getByRole('button', { name: 'Today', exact: true }));
      if (mobile) await page.getByRole('button', { name: /Booked · Staying · confirmed/ }).first().click();
      else await page.getByRole('button', { name: /Reserved, confirmed/ }).first().click();
      await dialog.getByText('Inventory reservation', { exact: true }).waitFor();
      assert.equal(await dialog.getByRole('link', { name: 'Open full booking' }).count(), 0);
      assert.equal(await page.getByText('Alex Example', { exact: false }).count(), 0);
      assert.deepEqual(errors, []);
      assert.deepEqual(outbound, []);
      results.push({ browser: engine.name(), width, threeNightBlock: true, staleConflict: true, reopen: true, protectedEntries: true, restricted: true });
      await context.close();
    }
  } finally { await browser.close(); }
}
// A fresh load of the same local URL verifies the calendar return state outside the fixture router.
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 1024, height: 810 } });
  await page.route(/^https?:/, route => route.abort());
  const returnUrl = pathToFileURL(path.join(out, 'index.html'));
  returnUrl.search = '?from=2026-10-19&view=type&room=left';
  await page.goto(returnUrl.href);
  await page.getByRole('button', { name: /Triple room/ }).press('Enter');
  await page.getByRole('button', { name: /Alex Example, confirmed/ }).press('Enter');
  const link = page.getByRole('link', { name: 'Open full booking' });
  await link.waitFor();
  await page.evaluate(() => {
    document.querySelector('.calendar-scroll').scrollLeft = 180;
    document.addEventListener('click', event => {
      if (event.target.closest('a[href^="/admin/bookings/"]')) event.preventDefault();
    });
  });
  const offset = await page.locator('.calendar-scroll').evaluate(element => element.scrollLeft);
  assert.ok(offset > 0);
  await link.press('Enter');
  assert.match(await link.getAttribute('href'), /from%3D2026-10-19%26view%3Dtype%26room%3Dleft/);
  assert.ok(await page.evaluate(() => sessionStorage.getItem('borealis-calendar-position')));
  await page.reload();
  await page.getByRole('rowheader', { name: /Triple Room L/ }).waitFor();
  await page.waitForFunction(expected => document.querySelector('.calendar-scroll')?.scrollLeft === expected, offset);
  assert.equal(await page.getByLabel('Room', { exact: true }).inputValue(), 'left');
  assert.equal(await page.getByLabel('Inventory view').inputValue(), 'type');
} finally { await browser.close(); }
console.log(JSON.stringify({ results, isolatedReturnScroll: true, screenshots: out }, null, 2));
