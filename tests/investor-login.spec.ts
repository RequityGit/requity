import { test, expect } from '@playwright/test';
import { loginAsUser, requireEnv } from './helpers/auth';

test.describe('Investor login flow', () => {
  test.beforeEach(async () => {
    requireEnv('INVESTOR_EMAIL');
    requireEnv('SUPABASE_URL');
    requireEnv('SUPABASE_ANON_KEY');
    requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  });

  test('investor can log in and is redirected to dashboard', async ({ page }) => {
    await loginAsUser(page, process.env.INVESTOR_EMAIL!);

    await page.goto('/investor/dashboard');
    await page.waitForLoadState('networkidle');

    // Should NOT be redirected to login
    expect(page.url()).not.toContain('/login');

    // Should be on an investor page
    expect(page.url()).toContain('/investor');
  });

  test('investor dashboard renders without errors', async ({ page }) => {
    await loginAsUser(page, process.env.INVESTOR_EMAIL!);

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const response = await page.goto('/investor/dashboard');
    await page.waitForLoadState('networkidle');

    // No server error
    expect(response?.status()).toBeLessThan(500);

    // No error boundary
    const errorHeading = page.locator('h1:has-text("Application error")');
    await expect(errorHeading).not.toBeVisible();
  });

  test('investor portfolio / funds page loads', async ({ page }) => {
    await loginAsUser(page, process.env.INVESTOR_EMAIL!);

    const response = await page.goto('/investor/funds');
    await page.waitForLoadState('networkidle');

    expect(page.url()).not.toContain('/login');
    expect(response?.status()).toBeLessThan(500);

    // Should see "My Investments" or related heading
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
  });

  test('investor documents page loads', async ({ page }) => {
    await loginAsUser(page, process.env.INVESTOR_EMAIL!);

    const response = await page.goto('/investor/documents');
    await page.waitForLoadState('networkidle');

    expect(page.url()).not.toContain('/login');
    expect(response?.status()).toBeLessThan(500);
  });

  test('investor cannot access admin routes', async ({ page }) => {
    await loginAsUser(page, process.env.INVESTOR_EMAIL!);

    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    // Should be redirected away from admin
    expect(page.url()).not.toContain('/admin');
  });

  test('investor cannot access borrower routes', async ({ page }) => {
    await loginAsUser(page, process.env.INVESTOR_EMAIL!);

    await page.goto('/borrower/dashboard');
    await page.waitForLoadState('networkidle');

    // Should be redirected away from borrower
    expect(page.url()).not.toContain('/borrower');
  });
});
