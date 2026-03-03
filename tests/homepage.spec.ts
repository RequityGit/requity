import { test, expect } from '@playwright/test';

test.describe('Homepage / Login page loads', () => {
  test('login page renders without errors', async ({ page }) => {
    const response = await page.goto('/login');

    // Page should return 200
    expect(response?.status()).toBe(200);

    // Should have a title
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('login page has email input and submit button', async ({ page }) => {
    await page.goto('/login');

    // Email input should be visible
    const emailInput = page.locator('input#email');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('type', 'email');

    // Magic link button should be visible
    const submitButton = page.getByRole('button', { name: /send magic link/i });
    await expect(submitButton).toBeVisible();
  });

  test('login page has Google OAuth button', async ({ page }) => {
    await page.goto('/login');

    const googleButton = page.getByRole('button', {
      name: /continue with google/i,
    });
    await expect(googleButton).toBeVisible();
  });

  test('login page has no broken images', async ({ page }) => {
    const brokenImages: string[] = [];

    // Listen for failed image requests
    page.on('response', (response) => {
      const url = response.url();
      const contentType = response.headers()['content-type'] || '';
      if (
        (contentType.includes('image') || /\.(png|jpg|jpeg|gif|svg|ico|webp)(\?|$)/i.test(url)) &&
        response.status() >= 400
      ) {
        brokenImages.push(`${response.status()} ${url}`);
      }
    });

    await page.goto('/login');

    // Wait for network to settle
    await page.waitForLoadState('networkidle');

    // Check that all <img> elements loaded (naturalWidth > 0)
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const src = await img.getAttribute('src');
      const naturalWidth = await img.evaluate(
        (el: HTMLImageElement) => el.naturalWidth,
      );
      if (naturalWidth === 0) {
        brokenImages.push(`Broken <img>: ${src}`);
      }
    }

    expect(brokenImages, `Broken images found:\n${brokenImages.join('\n')}`).toHaveLength(0);
  });

  test('login page has no console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Filter out known benign errors (e.g. third-party analytics)
    const criticalErrors = consoleErrors.filter(
      (msg) =>
        !msg.includes('favicon') &&
        !msg.includes('analytics') &&
        !msg.includes('gtag'),
    );

    expect(
      criticalErrors,
      `Console errors found:\n${criticalErrors.join('\n')}`,
    ).toHaveLength(0);
  });

  test('unauthenticated user is redirected to /login from protected routes', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('/login');
  });
});
