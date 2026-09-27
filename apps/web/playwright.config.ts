import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:3333', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' },
    },
  ],
  webServer: [
    {
      command: 'bun --bun x vite --config tests/harness/vite.config.mts',
      url: 'http://127.0.0.1:3334',
      reuseExistingServer: false,
    },
    {
      command: 'node tests/mock-backend.mjs',
      url: 'http://127.0.0.1:4322/health',
      reuseExistingServer: false,
    },
    {
      command: 'bun run dev --port 3333',
      url: 'http://127.0.0.1:3333',
      reuseExistingServer: false,
      timeout: 120000,
      env: {
        NEXT_DIST_DIR: '.next-test',
        NEXT_PUBLIC_CONVEX_URL: 'http://127.0.0.1:4322',
        NEXT_PUBLIC_CONVEX_SITE_URL: 'http://127.0.0.1:4322',
        NEXT_PUBLIC_SITE_URL: 'http://127.0.0.1:3333',
        CONTACT_INGEST_SECRET: 'test-only',
        REVALIDATE_SECRET: 'test-only',
      },
    },
  ],
});
