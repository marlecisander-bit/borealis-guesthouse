# Borealis Guest House web application

Next.js public website, booking flow and property administration platform.

## Local development

Install dependencies and start the development server from this directory:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Local Supabase values must be present in `.env.local`; use `.env.local.example` as the key-name reference and never commit secrets.

## Automated browser testing

The Playwright suite starts a separate Next.js development server automatically on `127.0.0.1:3100`. Its build output uses `.next-playwright`, so it does not collide with the normal development server.

Install the Chromium browser once after `npm install`:

```bash
npm run test:e2e:install
```

Run all mobile Chromium profiles:

```bash
npm run test:e2e
```

Run with a visible browser or Playwright's interactive UI:

```bash
npm run test:e2e:headed
npm run test:e2e:ui
```

To test an already-running or deployed instance, provide its origin:

```powershell
$env:PLAYWRIGHT_BASE_URL='https://example.netlify.app'
npm run test:e2e
```

The exact viewport matrix covers 320×568, 360×800, 375×812, 390×844, 393×852, 430×932 and 768×1024, with additional iPhone 13, Pixel 7 and iPad Mini projects. Named visual captures are written to `test-results/screenshots/<project>/`. Failure traces, screenshots and videos are written to `test-results/playwright-artifacts/`; the HTML report is written to `playwright-report/`.

## Project checks

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```
