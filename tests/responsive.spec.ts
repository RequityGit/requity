import { test, expect } from '@playwright/test';
import { loginAsUser } from './helpers/auth';

/**
 * Responsive layout tests — run key pages at mobile, tablet,
 * and desktop viewports and verify no layout breaks.
 *
 * This spec is matched by the mobile-chrome, mobile-safari, and tablet
 * projects in playwright.config.ts which set the appropriate viewports.
 */

test.describe('Responsive — login page', () => {
  test('login page renders correctly at current viewport', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Email input should be visible and not overflow
    const emailInput = page.locator('input#email');
    await expect(emailInput).toBeVisible();

    // Submit button should be visible
    const submitButton = page.getByRole('button', { name: /send magic link/i });
    await expect(submitButton).toBeVisible();

    // Google button should be visible
    const googleButton = page.getByRole('button', { name: /continue with google/i });
    await expect(googleButton).toBeVisible();

    // No horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // 5px tolerance
  });
});

test.describe('Responsive — borrower pages', () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.BORROWER_EMAIL;
    if (!email) {
      test.skip();
      return;
    }
    await loginAsUser(page, email);
  });

  test('borrower dashboard has no horizontal overflow', async ({ page }) => {
    await page.goto('/borrower/dashboard');
    await page.waitForLoadState('networkidle');

    // No horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test('borrower dashboard main content is visible', async ({ page }) => {
    await page.goto('/borrower/dashboard');
    await page.waitForLoadState('networkidle');

    // Page should not be blank — check for main content area
    const main = page.locator('main');
    if (await main.count() > 0) {
      await expect(main).toBeVisible();
    }

    // On mobile, sidebar may be collapsed or hidden — that's OK
    // But the page content should still be accessible
    const viewport = page.viewportSize();
    if (viewport && viewport.width < 768) {
      // Mobile: sidebar should be hidden or collapsed
      const sidebar = page.locator('aside');
      const sidebarBox = await sidebar.boundingBox();
      // Sidebar either hidden or collapsed (width <= 64px)
      if (sidebarBox) {
        expect(sidebarBox.width).toBeLessThanOrEqual(80);
      }
    }
  });

  test('borrower draws page renders at current viewport', async ({ page }) => {
    await page.goto('/borrower/draws');
    await page.waitForLoadState('networkidle');

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test('borrower payments page renders at current viewport', async ({ page }) => {
    await page.goto('/borrower/payments');
    await page.waitForLoadState('networkidle');

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });
});

test.describe('Responsive — investor pages', () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.INVESTOR_EMAIL;
    if (!email) {
      test.skip();
      return;
    }
    await loginAsUser(page, email);
  });

  test('investor dashboard has no horizontal overflow', async ({ page }) => {
    await page.goto('/investor/dashboard');
    await page.waitForLoadState('networkidle');

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test('investor funds page renders at current viewport', async ({ page }) => {
    await page.goto('/investor/funds');
    await page.waitForLoadState('networkidle');

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test('investor documents page renders at current viewport', async ({ page }) => {
    await page.goto('/investor/documents');
    await page.waitForLoadState('networkidle');

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });
});
