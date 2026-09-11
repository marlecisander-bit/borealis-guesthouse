import { defineConfig, devices, type Project } from '@playwright/test';

const localBaseUrl = 'http://127.0.0.1:3100';
const baseURL = process.env.PLAYWRIGHT_BASE_URL || localBaseUrl;

const exactMobileProjects: Project[] = [
  ['mobile-320x568', 320, 568],
  ['mobile-360x800', 360, 800],
  ['mobile-375x812', 375, 812],
  ['mobile-390x844', 390, 844],
  ['mobile-393x852', 393, 852],
  ['mobile-430x932', 430, 932],
  ['tablet-768x1024', 768, 1024],
].map(([name, width, height]) => ({
  name: String(name),
  use: {
    browserName: 'chromium' as const,
    viewport: { width: Number(width), height: Number(height) },
    deviceScaleFactor: 1,
    hasTouch: true,
    isMobile: true,
  },
}));

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './test-results/playwright-artifacts',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL,
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  expect: { timeout: 8_000 },
  projects: [
    ...exactMobileProjects,
    { name: 'iphone-13', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
    { name: 'pixel-7', use: { ...devices['Pixel 7'] } },
    { name: 'ipad-mini', use: { ...devices['iPad Mini'], browserName: 'chromium' } },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: 'node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3100',
    url: localBaseUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: { NEXT_DIST_DIR: '.next-playwright' },
  },
});
