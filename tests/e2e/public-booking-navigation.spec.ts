import { expect, test, type Page, type TestInfo } from '@playwright/test';

const representativeProjects = new Set(['desktop-1440x900', 'mobile-390x844']);

function runOnRepresentativeViewports(testInfo: TestInfo) {
  test.skip(!representativeProjects.has(testInfo.project.name), 'Covered on one desktop and one narrow mobile viewport.');
}

function dateLabel(date: Date) {
  return date.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
}

function futureDate(offset: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test('header Book now responds immediately and reaches the prefetched booking route', async ({ page }, testInfo) => {
  runOnRepresentativeViewports(testInfo);
  await page.route('**/book**', async route => {
    if (new URL(route.request().url()).pathname === '/book') await new Promise(resolve => setTimeout(resolve, 700));
    await route.continue();
  });
  await page.goto('/rooms');
  const cta = page.locator('[data-public-header] [data-booking-link][href="/book"]').first();
  await expect(cta).toBeVisible();
  await expect(cta).toHaveCSS('background-color', 'rgb(36, 82, 62)');
  await cta.click();
  await expect(cta.locator('[aria-busy="true"]')).toBeVisible();
  await expect(page).toHaveURL(/\/book$/);
  await expect(page.getByRole('heading', { name:'Your Koman stay, made simple.' })).toBeVisible();
  if (testInfo.project.name === 'desktop-1440x900') {
    await expect(page.getByText('Booking summary', { exact:true }).locator('..')).toHaveCSS('background-color', 'rgb(36, 82, 62)');
  }
  await expectNoHorizontalOverflow(page);
  await page.goBack();
  await expect(page).toHaveURL(/\/rooms$/);
  await expect(cta).toBeVisible();
  await expect(cta.locator('[aria-busy="true"]')).toHaveCount(0);
});

test('homepage criteria use client navigation and remain pre-populated on /book', async ({ page }, testInfo) => {
  runOnRepresentativeViewports(testInfo);
  const checkIn = futureDate(7);
  const checkOut = futureDate(9);
  await page.goto('/');
  const search = page.getByRole('form', { name:'Check room availability' });
  await search.getByRole('button', { name:/^Check-in,/ }).click();
  await page.getByRole('button', { name:dateLabel(checkIn), exact:true }).click();
  await page.getByRole('button', { name:dateLabel(checkOut), exact:true }).click();
  await search.getByRole('button',{name:/Guests/}).click();
  await page.getByRole('button',{name:'Add adults'}).click();
  await page.getByRole('button',{name:'Done'}).click();
  const submit = search.getByRole('button', { name:/Check availability/i });
  await submit.click();
  await expect(page).toHaveURL(new RegExp(`/book\\?checkIn=${checkIn.toISOString().slice(0,10)}&checkOut=${checkOut.toISOString().slice(0,10)}&guests=3&adults=3&children=0&infants=0`));
  await expect(page.getByRole('button', { name:/Check-in/ })).toContainText(checkIn.toLocaleDateString('en-GB'));
  await expectNoHorizontalOverflow(page);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  const restoredSubmit = page.getByRole('form', { name:'Check room availability' }).getByRole('button', { name:/Check availability/i });
  await expect(restoredSubmit).toBeVisible();
  await expect(restoredSubmit).not.toHaveAttribute('aria-busy', 'true');
});

test('mobile guest selector keeps categories clear and blocks a no-adult party',async({page},testInfo)=>{
  runOnRepresentativeViewports(testInfo);
  await page.goto('/');
  const search=page.getByRole('form',{name:'Check room availability'});
  await search.getByRole('button',{name:/Guests/}).click();
  await page.getByRole('button',{name:'Remove adults'}).click();
  await page.getByRole('button',{name:'Remove adults'}).click();
  await page.getByRole('button',{name:'Add children'}).click();
  await expect(search.getByRole('alert')).toHaveText('At least one adult is required for bookings with children or infants.');
  await expect(search.getByRole('button',{name:/Check availability/i})).toBeDisabled();
  await expectNoHorizontalOverflow(page);
});

test('room availability entry preserves its room selection', async ({ page }, testInfo) => {
  runOnRepresentativeViewports(testInfo);
  await page.goto('/rooms');
  const roomCta = page.locator('[data-booking-link][href^="/book?room="]').first();
  await expect(roomCta).toBeVisible();
  const href = await roomCta.getAttribute('href');
  await roomCta.click();
  await expect(page).toHaveURL(new RegExp(`${href!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
  await page.goBack();
  await expect(roomCta).toBeVisible();
});

test('multi-room accommodation is clear and responsive',async({page},testInfo)=>{
  runOnRepresentativeViewports(testInfo);
  const checkIn=futureDate(10).toISOString().slice(0,10),checkOut=futureDate(12).toISOString().slice(0,10);
  const makeRoom=(id:string,name:string,capacity:number)=>({id,slug:id,name,eyebrow:'',description:'',longDescription:'',image:'/borealis-placeholder.svg',gallery:[],priceFrom:100,currency:'EUR',capacity,beds:String(capacity),size:'',viewType:'Lake view',amenities:[],seo:{title:name,description:''},occupancyPolicy:{maxAdults:capacity,maxChildren:capacity,maxInfants:capacity,maxTotalOccupancy:capacity,minAdults:1,infantsCountTowardCapacity:true}});
  const family=makeRoom('family','Family Room',5),triple=makeRoom('triple','Triple Room',3);
  await page.route('**/api/pricing',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({options:[{id:'family:5.0.0|triple:3.0.0',rooms:[{room:family,quantity:1,occupancies:[{adults:5,children:0,infants:0}],guestCounts:[5],subtotal:240,currency:'EUR'},{room:triple,quantity:1,occupancies:[{adults:3,children:0,infants:0}],guestCounts:[3],subtotal:160,currency:'EUR'}],requestedGuests:8,requestedOccupancy:{adults:8,children:0,infants:0},totalRooms:2,totalCapacity:8,unusedCapacity:0,subtotal:400,currency:'EUR',nights:2,minimumStay:1}]})}));
  await page.goto(`/book?checkIn=${checkIn}&checkOut=${checkOut}&guests=8`);
  await expect(page.getByText('Recommended',{exact:true})).toBeVisible();
  await expect(page.getByText('2-room combination')).toBeVisible();
  await expect(page.getByText('1 × Family Room')).toBeVisible();
  await expect(page.getByText('1 × Triple Room')).toBeVisible();
  await expect(page.getByText('8 adults · 2 nights')).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
