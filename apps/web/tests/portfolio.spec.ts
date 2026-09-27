import { test, expect } from '@playwright/test';
// Keep third-party WebGL/network work out of interaction tests. Production still
// loads the original viewer automatically; the integration test checks its URL.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    customElements.define('spline-viewer', class extends HTMLElement {});
  });
});
test('public content renders without JavaScript', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(baseURL!);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Kurtik');
  await expect(
    page.getByRole('heading', { name: 'Featured Work' }),
  ).toBeVisible();
  expect(await page.locator('#projects [role=button]').count()).toBeGreaterThan(
    0,
  );
  await expect(
    page
      .getByText('Software Engineer & Data Scientist', { exact: true })
      .first(),
  ).toBeVisible();
  await context.close();
});
test('filters are keyboard accessible and mobile layout fits', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  const filters = page
    .locator('#projects')
    .getByRole('button', { name: 'All', exact: true });
  await filters.focus();
  await page.keyboard.press('Enter');
  await expect(filters).toHaveAttribute('aria-pressed', 'true');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({
    path: testInfo.outputPath('public.png'),
    fullPage: true,
  });
});
test('contact preserves input on failure and clears only after acceptance', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByLabel('Name', { exact: true }).fill('A visitor');
  await page
    .getByRole('textbox', { name: 'Email', exact: true })
    .fill('visitor@example.com');
  await page
    .getByLabel('Message', { exact: true })
    .fill('I would like to discuss a project.');
  await page.route('**/api/contact', (route) =>
    route.fulfill({ status: 503, json: { error: 'Please try again.' } }),
  );
  await page.getByRole('button', { name: 'Send Message', exact: true }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Please try again.' }),
  ).toHaveText('Please try again.');
  await expect(page.getByLabel('Message', { exact: true })).not.toHaveValue('');
  await page.unroute('**/api/contact');
  await page.getByRole('button', { name: 'Send Message', exact: true }).click();
  await expect(
    page
      .locator('#contact')
      .getByRole('status')
      .filter({ hasText: 'Message received' }),
  ).toBeVisible();
  await expect(page.getByLabel('Message', { exact: true })).toHaveValue('');
});
test('admin and preview deny anonymous access and signup redirects', async ({
  page,
}) => {
  for (const path of ['/admin', '/admin/preview', '/admin/signup']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(
      page.getByRole('button', { name: 'Continue with GitHub' }),
    ).toBeEnabled();
  }
});
test('write endpoints enforce origin and secret', async ({
  request,
  baseURL,
}) => {
  expect((await request.post('/api/revalidate')).status()).toBe(401);
  expect(
    (
      await request.post('/api/contact', { data: { name: 'Visitor' } })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post('/api/contact', {
        headers: { origin: baseURL! },
        data: {},
      })
    ).status(),
  ).toBe(400);
});

test('original visual features and project interactions remain intact', async ({
  page,
  isMobile,
}, testInfo) => {
  await page.goto('/');
  await expect(page.locator('spline-viewer')).toHaveAttribute(
    'url',
    'https://prod.spline.design/shkwkPFMXQSo6skr/scene.splinecode',
  );
  await expect(
    page.getByRole('button', { name: 'Enable background motion' }),
  ).toHaveCount(0);
  await expect(page.locator('#home .noise-overlay')).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath('original-hero.png') });
  const projects = page.locator('#projects');
  await projects.scrollIntoViewIfNeeded();
  await projects.locator('[role=button]').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Close project' })
    .first()
    .click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  if (isMobile)
    await expect(
      projects.getByRole('button', { name: 'Next project' }),
    ).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('original-projects.png') });
  await expect(page.locator('.tech-track-animate').first()).toHaveCSS(
    'animation-name',
    'tech-scroll',
  );
});
